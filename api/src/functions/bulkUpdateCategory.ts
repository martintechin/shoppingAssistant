import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { verifyRequest } from "../auth.js";
import { getTableClient } from "../tableClient.js";
import { BulkUpdateCategoryResponse } from "../types/shared.js";

const tableName = "FoodItems";

export async function bulkUpdateCategory(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = await verifyRequest(request, context);
  if (!auth.authenticated) {
    return { status: 401, jsonBody: { error: "Unauthorized" } };
  }

  try {
    let data: any;
    try {
      data = JSON.parse(await request.text());
    } catch {
      return { status: 400, jsonBody: { error: "Invalid JSON in request body" } };
    }

    if (
      !data ||
      !Array.isArray(data.foodItemIds) ||
      data.foodItemIds.length === 0 ||
      !data.foodItemIds.every((id: any) => typeof id === "string" && id.length > 0)
    ) {
      return {
        status: 400,
        jsonBody: { error: "Invalid 'foodItemIds': must be a non-empty array of strings" },
      };
    }
    if (
      typeof data.category !== "string" ||
      data.category.trim().length === 0 ||
      data.category.trim().length > 50
    ) {
      return {
        status: 400,
        jsonBody: { error: "Invalid 'category': must be 1-50 characters" },
      };
    }

    const category = data.category.trim();
    const client = getTableClient(tableName);
    let updatedCount = 0;

    for (const id of data.foodItemIds) {
      try {
        await client.updateEntity(
          { partitionKey: "item", rowKey: id, category },
          "Merge"
        );
        updatedCount++;
      } catch (error: any) {
        if (error.statusCode !== 404) throw error;
      }
    }

    const body: BulkUpdateCategoryResponse = { success: true, updatedCount };
    return { status: 200, jsonBody: body };
  } catch (error: any) {
    context.error("Error bulk updating category:", error);
    return {
      status: 500,
      headers: { "Content-Type": "application/json" },
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("bulkUpdateCategory", {
  methods: ["PUT"],
  authLevel: "anonymous",
  handler: bulkUpdateCategory,
});
