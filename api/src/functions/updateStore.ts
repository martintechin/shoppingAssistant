import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { verifyRequest } from "../auth.js";
import { getTableClient } from "../tableClient.js";
import { Store, UpdateStoreResponse } from "../types/shared.js";
import { toStore } from "./getStores.js";

const tableName = "Stores";

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((entry) => typeof entry === "string" && entry.trim().length > 0)
  );
}

export async function updateStore(
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
    if (
      data.name === undefined &&
      data.categoryOrder === undefined &&
      data.unavailableItems === undefined
    ) {
      return {
        status: 400,
        jsonBody: {
          error: "At least one of 'name', 'categoryOrder' or 'unavailableItems' must be provided",
        },
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
      data.categoryOrder !== undefined &&
      (!isStringArray(data.categoryOrder) || data.categoryOrder.length === 0)
    ) {
      return {
        status: 400,
        jsonBody: { error: "Invalid 'categoryOrder': must be a non-empty string array" },
      };
    }
    // An empty array is valid here (clearing the list).
    if (data.unavailableItems !== undefined && !isStringArray(data.unavailableItems)) {
      return {
        status: 400,
        jsonBody: { error: "Invalid 'unavailableItems': must be a string array" },
      };
    }

    const client = getTableClient(tableName);

    let existing: any;
    try {
      existing = await client.getEntity("store", data.id);
    } catch (error: any) {
      if (error.statusCode === 404) {
        return { status: 404, jsonBody: { error: "Store not found" } };
      }
      throw error;
    }

    const update: Record<string, any> = {
      partitionKey: "store",
      rowKey: data.id,
    };
    if (data.name !== undefined) update.name = data.name.trim();
    if (data.categoryOrder !== undefined) update.categoryOrder = JSON.stringify(data.categoryOrder);
    if (data.unavailableItems !== undefined)
      update.unavailableItems = JSON.stringify(data.unavailableItems);

    await client.updateEntity(update as any, "Merge");

    const store: Store = toStore({ ...existing, ...update });

    const body: UpdateStoreResponse = { success: true, store };
    return { status: 200, jsonBody: body };
  } catch (error: any) {
    context.error("Error updating store:", error);
    return {
      status: 500,
      headers: { "Content-Type": "application/json" },
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("updateStore", {
  methods: ["PUT"],
  authLevel: "anonymous",
  handler: updateStore,
});
