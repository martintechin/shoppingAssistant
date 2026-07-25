import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { verifyRequest } from "../auth.js";
import { escapeOData } from "../odata.js";
import { ensureTableExists, generateRowKey, getTableClient } from "../tableClient.js";
import { AddListItemRequest, AddListItemResponse } from "../types/shared.js";
import { toListItem } from "./getList.js";

const tableName = "ShoppingList";
const foodTableName = "FoodItems";

function validateAddData(data: any): data is AddListItemRequest {
  return (
    data &&
    typeof data.foodItemId === "string" &&
    data.foodItemId.length > 0 &&
    (data.quantity === undefined ||
      (typeof data.quantity === "number" && data.quantity > 0 && data.quantity <= 999)) &&
    (data.note === undefined || typeof data.note === "string")
  );
}

export async function addListItem(
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

    if (!validateAddData(data)) {
      return {
        status: 400,
        jsonBody: {
          error: "Invalid request: 'foodItemId' is required; 'quantity' must be a number in (0, 999]",
        },
      };
    }

    // Denormalize name/category/unit server-side so the client can never send
    // copies that drift from the food database.
    const foodClient = getTableClient(foodTableName);
    let foodItem: any;
    try {
      foodItem = await foodClient.getEntity("item", data.foodItemId);
    } catch (error: any) {
      if (error.statusCode === 404) {
        return { status: 404, jsonBody: { error: "Food item not found" } };
      }
      throw error;
    }

    const client = getTableClient(tableName);
    await ensureTableExists(client);

    // Adding an item that is already on the list (unchecked) bumps its
    // quantity instead of creating a duplicate row, so concurrent adds from
    // two devices converge.
    for await (const entity of client.listEntities({
      queryOptions: {
        filter: `PartitionKey eq 'list' and foodItemId eq '${escapeOData(data.foodItemId)}' and checked eq false`,
      },
    })) {
      const newQuantity = (Number(entity.quantity) || 1) + (data.quantity ?? 1);
      const mergeUpdate = {
        partitionKey: "list",
        rowKey: String(entity.rowKey),
        quantity: newQuantity,
        ...(data.note !== undefined ? { note: data.note } : {}),
      };
      await client.updateEntity(mergeUpdate, "Merge");

      const body: AddListItemResponse = {
        success: true,
        item: toListItem({ ...entity, ...mergeUpdate }),
        merged: true,
      };
      return { status: 200, jsonBody: body };
    }

    const rowKey = generateRowKey();
    const addedAt = new Date().toISOString();
    const entity = {
      partitionKey: "list",
      rowKey,
      foodItemId: data.foodItemId,
      name: String(foodItem.name ?? ""),
      category: String(foodItem.category ?? ""),
      unit: String(foodItem.unit ?? "st"),
      quantity: data.quantity ?? 1,
      checked: false,
      addedAt,
      note: data.note ?? "",
    };

    await client.createEntity(entity);

    const body: AddListItemResponse = {
      success: true,
      item: toListItem(entity),
      merged: false,
    };
    return { status: 201, jsonBody: body };
  } catch (error: any) {
    context.error("Error adding list item:", error);
    return {
      status: 500,
      headers: { "Content-Type": "application/json" },
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("addListItem", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: addListItem,
});
