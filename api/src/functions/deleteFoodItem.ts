import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { verifyRequest } from "../auth.js";
import { getTableClient } from "../tableClient.js";

const tableName = "FoodItems";
const storesTableName = "Stores";

export async function deleteFoodItem(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = await verifyRequest(request, context);
  if (!auth.authenticated) {
    return { status: 401, jsonBody: { error: "Unauthorized" } };
  }

  context.log(`Http function processed request for url "${request.url}"`);

  try {
    const id = request.query.get("id");
    if (!id) {
      return { status: 400, jsonBody: { error: "Missing 'id' query parameter" } };
    }

    const client = getTableClient(tableName);

    try {
      await client.deleteEntity("item", id);
    } catch (error: any) {
      if (error.statusCode === 404) {
        return { status: 404, jsonBody: { error: "Food item not found" } };
      }
      throw error;
    }

    // Strip the deleted item from every store's unavailable list so stores
    // don't accumulate dangling references. Shopping list rows are left
    // alone — they carry denormalized name/category/unit and still render.
    try {
      const storesClient = getTableClient(storesTableName);
      for await (const store of storesClient.listEntities({
        queryOptions: { filter: "PartitionKey eq 'store'" },
      })) {
        let unavailable: string[];
        try {
          unavailable = JSON.parse(String(store.unavailableItems ?? "[]"));
        } catch {
          continue;
        }
        if (Array.isArray(unavailable) && unavailable.includes(id)) {
          await storesClient.updateEntity(
            {
              partitionKey: "store",
              rowKey: String(store.rowKey),
              unavailableItems: JSON.stringify(unavailable.filter((itemId) => itemId !== id)),
            },
            "Merge"
          );
        }
      }
    } catch (error: any) {
      // Missing Stores table just means there is nothing to clean up.
      if (error.statusCode !== 404) {
        context.warn("Failed to clean up store references:", error.message);
      }
    }

    return { status: 200, jsonBody: { success: true } };
  } catch (error: any) {
    context.error("Error deleting food item:", error);
    return {
      status: 500,
      headers: { "Content-Type": "application/json" },
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("deleteFoodItem", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  handler: deleteFoodItem,
});
