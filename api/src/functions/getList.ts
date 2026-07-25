import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { verifyRequest } from "../auth.js";
import { getTableClient } from "../tableClient.js";
import { ListItem, ListResponse } from "../types/shared.js";

const tableName = "ShoppingList";

export function toListItem(entity: any): ListItem {
  return {
    id: String(entity.rowKey),
    foodItemId: String(entity.foodItemId ?? ""),
    name: String(entity.name ?? ""),
    category: String(entity.category ?? ""),
    unit: String(entity.unit ?? "st"),
    quantity: Number(entity.quantity) || 1,
    checked: Boolean(entity.checked),
    addedAt: String(entity.addedAt ?? ""),
    checkedAt: entity.checkedAt ? String(entity.checkedAt) : undefined,
  };
}

export async function getList(
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
    const items: ListItem[] = [];

    try {
      for await (const entity of client.listEntities({
        queryOptions: { filter: "PartitionKey eq 'list'" },
      })) {
        items.push(toListItem(entity));
      }
    } catch (error: any) {
      if (error.statusCode !== 404) throw error;
    }

    items.sort((a, b) => a.addedAt.localeCompare(b.addedAt));

    const body: ListResponse = { items };
    return {
      status: 200,
      headers: { "Cache-Control": "no-cache" },
      jsonBody: body,
    };
  } catch (error: any) {
    context.error("Error fetching shopping list:", error);
    return {
      status: 500,
      headers: { "Content-Type": "application/json" },
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("getList", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: getList,
});
