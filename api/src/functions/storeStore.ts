import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { verifyRequest } from "../auth.js";
import { ensureTableExists, generateRowKey, getTableClient } from "../tableClient.js";
import { Store, StoreStoreRequest, StoreStoreResponse } from "../types/shared.js";

const tableName = "Stores";

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((entry) => typeof entry === "string" && entry.trim().length > 0)
  );
}

// categoryOrder is deliberately NOT validated against the CATEGORIES config:
// the config may gain categories later and old clients/stores must keep working.
function validateStoreData(data: any): data is StoreStoreRequest {
  return (
    data &&
    typeof data.name === "string" &&
    data.name.trim().length > 0 &&
    data.name.trim().length <= 100 &&
    isStringArray(data.categoryOrder) &&
    data.categoryOrder.length > 0 &&
    (data.unavailableItems === undefined || isStringArray(data.unavailableItems))
  );
}

export async function storeStore(
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

    if (!validateStoreData(data)) {
      return {
        status: 400,
        jsonBody: {
          error:
            "Invalid store: 'name' (1-100 chars) and non-empty 'categoryOrder' (string array) are required; 'unavailableItems' must be a string array",
        },
      };
    }

    const client = getTableClient(tableName);
    await ensureTableExists(client);

    const rowKey = generateRowKey();
    const createdAt = new Date().toISOString();
    const unavailableItems = data.unavailableItems ?? [];

    await client.createEntity({
      partitionKey: "store",
      rowKey,
      name: data.name.trim(),
      categoryOrder: JSON.stringify(data.categoryOrder),
      unavailableItems: JSON.stringify(unavailableItems),
      createdAt,
    });

    const store: Store = {
      id: rowKey,
      name: data.name.trim(),
      categoryOrder: data.categoryOrder,
      unavailableItems,
      createdAt,
    };

    const body: StoreStoreResponse = { success: true, store };
    return { status: 201, jsonBody: body };
  } catch (error: any) {
    context.error("Error storing store:", error);
    return {
      status: 500,
      headers: { "Content-Type": "application/json" },
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("storeStore", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: storeStore,
});
