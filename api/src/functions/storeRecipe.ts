import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { verifyRequest } from "../auth.js";
import { ensureTableExists, generateRowKey, getTableClient } from "../tableClient.js";
import { Recipe, StoreRecipeRequest, StoreRecipeResponse } from "../types/shared.js";

const tableName = "Recipes";

function validateRecipeData(data: any): data is StoreRecipeRequest {
  return (
    data &&
    typeof data.name === "string" &&
    data.name.trim().length > 0 &&
    data.name.trim().length <= 100 &&
    Array.isArray(data.ingredients) &&
    data.ingredients.length > 0 &&
    data.ingredients.every(
      (i: any) =>
        i &&
        typeof i.foodItemId === "string" &&
        i.foodItemId.length > 0 &&
        typeof i.quantity === "number" &&
        i.quantity > 0 &&
        i.quantity <= 999
    )
  );
}

export async function storeRecipe(
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

    if (!validateRecipeData(data)) {
      return {
        status: 400,
        jsonBody: {
          error:
            "Invalid recipe: 'name' (1-100 chars) and non-empty 'ingredients' array required. Each ingredient needs 'foodItemId' (string) and 'quantity' (number 1-999)",
        },
      };
    }

    const client = getTableClient(tableName);
    await ensureTableExists(client);

    const rowKey = generateRowKey();
    const createdAt = new Date().toISOString();
    const ingredients = data.ingredients.map((i: any) => ({
      foodItemId: i.foodItemId,
      quantity: i.quantity,
    }));

    await client.createEntity({
      partitionKey: "recipe",
      rowKey,
      name: data.name.trim(),
      ingredients: JSON.stringify(ingredients),
      createdAt,
    });

    const recipe: Recipe = {
      id: rowKey,
      name: data.name.trim(),
      ingredients,
      createdAt,
    };

    const body: StoreRecipeResponse = { success: true, recipe };
    return { status: 201, jsonBody: body };
  } catch (error: any) {
    context.error("Error storing recipe:", error);
    return {
      status: 500,
      headers: { "Content-Type": "application/json" },
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("storeRecipe", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: storeRecipe,
});
