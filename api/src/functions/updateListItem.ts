import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { verifyRequest } from "../auth.js";
import { getTableClient } from "../tableClient.js";
import { UpdateListItemResponse } from "../types/shared.js";
import { toListItem } from "./getList.js";

const tableName = "ShoppingList";
const foodTableName = "FoodItems";

export async function updateListItem(
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
    if (data.quantity === undefined && data.checked === undefined) {
      return {
        status: 400,
        jsonBody: { error: "At least one of 'quantity' or 'checked' must be provided" },
      };
    }
    if (
      data.quantity !== undefined &&
      (typeof data.quantity !== "number" || data.quantity <= 0 || data.quantity > 999)
    ) {
      return {
        status: 400,
        jsonBody: { error: "Invalid 'quantity': must be a number in (0, 999]" },
      };
    }
    if (data.checked !== undefined && typeof data.checked !== "boolean") {
      return { status: 400, jsonBody: { error: "Invalid 'checked': must be a boolean" } };
    }

    const client = getTableClient(tableName);

    let existing: any;
    try {
      existing = await client.getEntity("list", data.id);
    } catch (error: any) {
      if (error.statusCode === 404) {
        return { status: 404, jsonBody: { error: "List item not found" } };
      }
      throw error;
    }

    const update: Record<string, any> = {
      partitionKey: "list",
      rowKey: data.id,
    };

    if (data.quantity !== undefined) update.quantity = data.quantity;

    // Ticking an item off means it was bought: stamp lastBought on the food
    // item, but snapshot the previous value on the list row first so an
    // accidental tap can be undone without corrupting purchase history.
    // Table Storage Merge can't delete properties, so "" is the unset sentinel.
    const wasChecked = Boolean(existing.checked);
    if (data.checked !== undefined && data.checked !== wasChecked) {
      const foodClient = getTableClient(foodTableName);
      const foodItemId = String(existing.foodItemId ?? "");

      if (data.checked) {
        const now = new Date().toISOString();
        let prevLastBought = "";
        try {
          const foodItem = await foodClient.getEntity("item", foodItemId);
          prevLastBought = foodItem.lastBought ? String(foodItem.lastBought) : "";
          await foodClient.updateEntity(
            { partitionKey: "item", rowKey: foodItemId, lastBought: now },
            "Merge"
          );
        } catch (error: any) {
          // The food item may have been deleted since the row was added.
          if (error.statusCode !== 404) throw error;
        }
        update.checked = true;
        update.checkedAt = now;
        update.prevLastBought = prevLastBought;
      } else {
        try {
          await foodClient.updateEntity(
            {
              partitionKey: "item",
              rowKey: foodItemId,
              lastBought: existing.prevLastBought ? String(existing.prevLastBought) : "",
            },
            "Merge"
          );
        } catch (error: any) {
          if (error.statusCode !== 404) throw error;
        }
        update.checked = false;
        update.checkedAt = "";
        update.prevLastBought = "";
      }
    }

    await client.updateEntity(update as any, "Merge");

    const body: UpdateListItemResponse = {
      success: true,
      item: toListItem({ ...existing, ...update }),
    };
    return { status: 200, jsonBody: body };
  } catch (error: any) {
    context.error("Error updating list item:", error);
    return {
      status: 500,
      headers: { "Content-Type": "application/json" },
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("updateListItem", {
  methods: ["PUT"],
  authLevel: "anonymous",
  handler: updateListItem,
});
