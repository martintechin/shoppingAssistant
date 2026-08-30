import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { verifyRequest } from "../auth.js";
import { ensureTableExists, generateRowKey, getTableClient } from "../tableClient.js";
import { QuickAddListItemRequest, QuickAddListItemResponse } from "../types/shared.js";
import { toListItem } from "./getList.js";

const tableName = "ShoppingList";

function validateQuickAddData(data: any): data is QuickAddListItemRequest {
  return (
    data &&
    typeof data.name === "string" &&
    data.name.trim().length > 0 &&
    (data.category === undefined || typeof data.category === "string") &&
    (data.unit === undefined || typeof data.unit === "string") &&
    (data.quantity === undefined ||
      (typeof data.quantity === "number" && data.quantity > 0 && data.quantity <= 999)) &&
    (data.note === undefined || typeof data.note === "string")
  );
}

export async function quickAddListItem(
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

    if (!validateQuickAddData(data)) {
      return {
        status: 400,
        jsonBody: {
          error: "Invalid request: 'name' is required; 'quantity' must be a number in (0, 999]",
        },
      };
    }

    const client = getTableClient(tableName);
    await ensureTableExists(client);

    const rowKey = generateRowKey();
    const addedAt = new Date().toISOString();
    const entity = {
      partitionKey: "list",
      rowKey,
      foodItemId: "",
      name: data.name.trim(),
      category: data.category || "",
      unit: data.unit || "",
      quantity: data.quantity ?? 1,
      checked: false,
      addedAt,
      note: data.note ?? "",
    };

    await client.createEntity(entity);

    const body: QuickAddListItemResponse = {
      success: true,
      item: toListItem(entity),
    };
    return { status: 201, jsonBody: body };
  } catch (error: any) {
    context.error("Error quick-adding list item:", error);
    return {
      status: 500,
      headers: { "Content-Type": "application/json" },
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("quickAddListItem", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: quickAddListItem,
});
