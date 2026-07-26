import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { verifyRequest } from "../auth.js";
import { escapeOData } from "../odata.js";
import { getTableClient } from "../tableClient.js";
import { FoodItem, UpdateFoodItemResponse } from "../types/shared.js";
import { APP_LOCALE } from "../locale.js";

const tableName = "FoodItems";

export async function updateFoodItem(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = await verifyRequest(request, context);
  if (!auth.authenticated) {
    return { status: 401, jsonBody: { error: "Unauthorized" } };
  }

  context.log(`Http function processed request for url "${request.url}"`);

  try {
    let data: any;
    try {
      data = JSON.parse(await request.text());
    } catch {
      return { status: 400, jsonBody: { error: "Invalid JSON in request body" } };
    }

    if (!data || typeof data.id !== "string" || data.id.length === 0) {
      return { status: 400, jsonBody: { error: "Missing or invalid 'id' field" } };
    }
    if (data.name === undefined && data.category === undefined && data.unit === undefined) {
      return {
        status: 400,
        jsonBody: { error: "At least one of 'name', 'category' or 'unit' must be provided" },
      };
    }
    if (
      data.name !== undefined &&
      (typeof data.name !== "string" ||
        data.name.trim().length === 0 ||
        data.name.trim().length > 100)
    ) {
      return { status: 400, jsonBody: { error: "Invalid 'name': must be 1-100 characters" } };
    }
    if (
      data.category !== undefined &&
      (typeof data.category !== "string" ||
        data.category.trim().length === 0 ||
        data.category.trim().length > 50)
    ) {
      return { status: 400, jsonBody: { error: "Invalid 'category': must be 1-50 characters" } };
    }
    if (
      data.unit !== undefined &&
      (typeof data.unit !== "string" || data.unit.length === 0 || data.unit.length > 10)
    ) {
      return {
        status: 400,
        jsonBody: { error: "Invalid 'unit': must be 1-10 characters" },
      };
    }

    const client = getTableClient(tableName);

    let existing: any;
    try {
      existing = await client.getEntity("item", data.id);
    } catch (error: any) {
      if (error.statusCode === 404) {
        return { status: 404, jsonBody: { error: "Food item not found" } };
      }
      throw error;
    }

    const update: Record<string, any> = {
      partitionKey: "item",
      rowKey: data.id,
    };

    if (data.name !== undefined) {
      const name = data.name.trim();
      const nameLower = name.toLocaleLowerCase(APP_LOCALE);

      // Renames must not collide with another existing item.
      if (nameLower !== String(existing.nameLower ?? "")) {
        for await (const entity of client.listEntities({
          queryOptions: {
            filter: `PartitionKey eq 'item' and nameLower eq '${escapeOData(nameLower)}'`,
          },
        })) {
          if (entity.rowKey !== data.id) {
            return {
              status: 409,
              jsonBody: { error: "En vara med det namnet finns redan", existingId: entity.rowKey },
            };
          }
        }
      }

      update.name = name;
      update.nameLower = nameLower;
    }
    if (data.category !== undefined) update.category = data.category.trim();
    if (data.unit !== undefined) update.unit = data.unit;

    await client.updateEntity(update as any, "Merge");

    const merged = { ...existing, ...update };
    const item: FoodItem = {
      id: data.id,
      name: String(merged.name ?? ""),
      category: String(merged.category ?? ""),
      unit: String(merged.unit ?? "st"),
      lastBought: merged.lastBought ? String(merged.lastBought) : undefined,
      createdAt: String(merged.createdAt ?? ""),
    };

    const body: UpdateFoodItemResponse = { success: true, item };
    return { status: 200, jsonBody: body };
  } catch (error: any) {
    context.error("Error updating food item:", error);
    return {
      status: 500,
      headers: { "Content-Type": "application/json" },
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("updateFoodItem", {
  methods: ["PUT"],
  authLevel: "anonymous",
  handler: updateFoodItem,
});
