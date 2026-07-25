import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { verifyRequest } from "../auth.js";
import { getTableClient } from "../tableClient.js";
import { FoodItem, FoodItemsResponse } from "../types/shared.js";

const tableName = "FoodItems";

function toFoodItem(entity: any): FoodItem {
  return {
    id: String(entity.rowKey),
    name: String(entity.name ?? ""),
    category: String(entity.category ?? ""),
    unit: String(entity.unit ?? "st"),
    lastBought: entity.lastBought ? String(entity.lastBought) : undefined,
    createdAt: String(entity.createdAt ?? ""),
  };
}

export async function getFoodItems(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = await verifyRequest(request, context);
  if (!auth.authenticated) {
    return { status: 401, jsonBody: { error: "Unauthorized" } };
  }

  context.log(`Http function processed request for url "${request.url}"`);

  try {
    const client = getTableClient(tableName);
    const items: FoodItem[] = [];

    try {
      for await (const entity of client.listEntities({
        queryOptions: { filter: "PartitionKey eq 'item'" },
      })) {
        items.push(toFoodItem(entity));
      }
    } catch (error: any) {
      // Table not created yet — treat as an empty database.
      if (error.statusCode !== 404) throw error;
    }

    items.sort((a, b) => a.name.localeCompare(b.name, "sv"));

    const body: FoodItemsResponse = { items };
    return {
      status: 200,
      headers: { "Cache-Control": "no-cache" },
      jsonBody: body,
    };
  } catch (error: any) {
    context.error("Error fetching food items:", error);
    return {
      status: 500,
      headers: { "Content-Type": "application/json" },
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("getFoodItems", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: getFoodItems,
});
