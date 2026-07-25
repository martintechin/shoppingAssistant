import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { verifyRequest } from "../auth.js";
import { getTableClient } from "../tableClient.js";
import { ClearCheckedResponse } from "../types/shared.js";

const tableName = "ShoppingList";

export async function clearChecked(
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
    const rowKeys: string[] = [];

    try {
      for await (const entity of client.listEntities({
        queryOptions: { filter: "PartitionKey eq 'list' and checked eq true" },
      })) {
        rowKeys.push(String(entity.rowKey));
      }
    } catch (error: any) {
      if (error.statusCode !== 404) throw error;
    }

    // All rows share the "list" partition, so batched transactions apply
    // (max 100 operations per transaction).
    for (let i = 0; i < rowKeys.length; i += 100) {
      const chunk = rowKeys.slice(i, i + 100);
      await client.submitTransaction(
        chunk.map((rowKey) => ["delete", { partitionKey: "list", rowKey }])
      );
    }

    // lastBought was already stamped when each item was checked off.
    const body: ClearCheckedResponse = { success: true, removedCount: rowKeys.length };
    return { status: 200, jsonBody: body };
  } catch (error: any) {
    context.error("Error clearing checked items:", error);
    return {
      status: 500,
      headers: { "Content-Type": "application/json" },
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("clearChecked", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: clearChecked,
});
