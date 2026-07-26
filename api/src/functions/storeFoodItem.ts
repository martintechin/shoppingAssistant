import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { verifyRequest } from "../auth.js";
import { escapeOData } from "../odata.js";
import { ensureTableExists, generateRowKey, getTableClient } from "../tableClient.js";
import { FoodItem, StoreFoodItemRequest, StoreFoodItemResponse } from "../types/shared.js";
import { APP_LOCALE } from "../locale.js";

const tableName = "FoodItems";

function validateFoodItemData(data: any): data is StoreFoodItemRequest {
  return (
    data &&
    typeof data.name === "string" &&
    data.name.trim().length > 0 &&
    data.name.trim().length <= 100 &&
    typeof data.category === "string" &&
    data.category.trim().length > 0 &&
    data.category.trim().length <= 50 &&
    typeof data.unit === "string" &&
    data.unit.length > 0 &&
    data.unit.length <= 10
  );
}

export async function storeFoodItem(
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

    if (!validateFoodItemData(data)) {
      return {
        status: 400,
        jsonBody: {
          error: "Invalid food item: 'name' (1-100 chars), 'category' (1-50 chars) and 'unit' (1-10 chars) are required",
        },
      };
    }

    const name = data.name.trim();
    const nameLower = name.toLocaleLowerCase(APP_LOCALE);
    const client = getTableClient(tableName);
    await ensureTableExists(client);

    // Duplicate check so the same item can't be created twice; the client can
    // add the existing item to the list instead using existingId.
    for await (const entity of client.listEntities({
      queryOptions: {
        filter: `PartitionKey eq 'item' and nameLower eq '${escapeOData(nameLower)}'`,
      },
    })) {
      return {
        status: 409,
        jsonBody: { error: "En vara med det namnet finns redan", existingId: entity.rowKey },
      };
    }

    const rowKey = generateRowKey();
    const createdAt = new Date().toISOString();

    await client.createEntity({
      partitionKey: "item",
      rowKey,
      name,
      nameLower,
      category: data.category.trim(),
      unit: data.unit,
      createdAt,
    });

    const item: FoodItem = {
      id: rowKey,
      name,
      category: data.category.trim(),
      unit: data.unit,
      createdAt,
    };

    const body: StoreFoodItemResponse = { success: true, item };
    return { status: 201, jsonBody: body };
  } catch (error: any) {
    context.error("Error storing food item:", error);
    return {
      status: 500,
      headers: { "Content-Type": "application/json" },
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("storeFoodItem", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: storeFoodItem,
});
