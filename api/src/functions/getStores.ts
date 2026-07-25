import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { verifyRequest } from "../auth.js";
import { getTableClient } from "../tableClient.js";
import { Store, StoresResponse } from "../types/shared.js";

const tableName = "Stores";

function parseJsonArray(value: unknown): string[] {
  try {
    const parsed = JSON.parse(String(value ?? "[]"));
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function toStore(entity: any): Store {
  return {
    id: String(entity.rowKey),
    name: String(entity.name ?? ""),
    categoryOrder: parseJsonArray(entity.categoryOrder),
    unavailableItems: parseJsonArray(entity.unavailableItems),
    createdAt: String(entity.createdAt ?? ""),
  };
}

export async function getStores(
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
    const stores: Store[] = [];

    try {
      for await (const entity of client.listEntities({
        queryOptions: { filter: "PartitionKey eq 'store'" },
      })) {
        stores.push(toStore(entity));
      }
    } catch (error: any) {
      if (error.statusCode !== 404) throw error;
    }

    stores.sort((a, b) => a.name.localeCompare(b.name, "sv"));

    const body: StoresResponse = { stores };
    return {
      status: 200,
      headers: { "Cache-Control": "no-cache" },
      jsonBody: body,
    };
  } catch (error: any) {
    context.error("Error fetching stores:", error);
    return {
      status: 500,
      headers: { "Content-Type": "application/json" },
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("getStores", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: getStores,
});
