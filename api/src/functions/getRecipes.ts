import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { verifyRequest } from "../auth.js";
import { getTableClient } from "../tableClient.js";
import { Recipe, RecipeIngredient, RecipesResponse } from "../types/shared.js";

const tableName = "Recipes";

function parseIngredients(value: unknown): RecipeIngredient[] {
  try {
    const parsed = JSON.parse(String(value ?? "[]"));
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i: any) => typeof i.foodItemId === "string" && typeof i.quantity === "number"
    );
  } catch {
    return [];
  }
}

export function toRecipe(entity: any): Recipe {
  // Merge can't delete properties, so "" is the unset sentinel for lastAddedToList
  const lastAddedToList = String(entity.lastAddedToList ?? "");
  return {
    id: String(entity.rowKey),
    name: String(entity.name ?? ""),
    ingredients: parseIngredients(entity.ingredients),
    createdAt: String(entity.createdAt ?? ""),
    ...(lastAddedToList ? { lastAddedToList } : {}),
  };
}

export async function getRecipes(
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
    const recipes: Recipe[] = [];

    try {
      for await (const entity of client.listEntities({
        queryOptions: { filter: "PartitionKey eq 'recipe'" },
      })) {
        recipes.push(toRecipe(entity));
      }
    } catch (error: any) {
      if (error.statusCode !== 404) throw error;
    }

    recipes.sort((a, b) => a.name.localeCompare(b.name, "sv"));

    const body: RecipesResponse = { recipes };
    return {
      status: 200,
      headers: { "Cache-Control": "no-cache" },
      jsonBody: body,
    };
  } catch (error: any) {
    context.error("Error fetching recipes:", error);
    return {
      status: 500,
      headers: { "Content-Type": "application/json" },
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("getRecipes", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: getRecipes,
});
