import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { verifyRequest } from "../auth.js";
import { getTableClient } from "../tableClient.js";
import { Recipe, UpdateRecipeResponse } from "../types/shared.js";
import { toRecipe } from "./getRecipes.js";

const tableName = "Recipes";

export async function updateRecipe(
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
      data.ingredients === undefined &&
      data.markAddedToList === undefined
    ) {
      return {
        status: 400,
        jsonBody: {
          error:
            "At least one of 'name', 'ingredients' or 'markAddedToList' must be provided",
        },
      };
    }
    if (data.markAddedToList !== undefined && typeof data.markAddedToList !== "boolean") {
      return { status: 400, jsonBody: { error: "Invalid 'markAddedToList': must be a boolean" } };
    }
    if (
      data.name !== undefined &&
      (typeof data.name !== "string" ||
        data.name.trim().length === 0 ||
        data.name.trim().length > 100)
    ) {
      return { status: 400, jsonBody: { error: "Invalid 'name': must be 1-100 characters" } };
    }
    if (data.ingredients !== undefined) {
      if (
        !Array.isArray(data.ingredients) ||
        data.ingredients.length === 0 ||
        !data.ingredients.every(
          (i: any) =>
            i &&
            typeof i.foodItemId === "string" &&
            i.foodItemId.length > 0 &&
            typeof i.quantity === "number" &&
            i.quantity > 0 &&
            i.quantity <= 999
        )
      ) {
        return {
          status: 400,
          jsonBody: {
            error:
              "Invalid 'ingredients': must be a non-empty array with valid foodItemId and quantity (1-999)",
          },
        };
      }
    }

    const client = getTableClient(tableName);

    let existing: any;
    try {
      existing = await client.getEntity("recipe", data.id);
    } catch (error: any) {
      if (error.statusCode === 404) {
        return { status: 404, jsonBody: { error: "Recipe not found" } };
      }
      throw error;
    }

    const update: Record<string, any> = {
      partitionKey: "recipe",
      rowKey: data.id,
    };
    if (data.name !== undefined) update.name = data.name.trim();
    if (data.ingredients !== undefined) update.ingredients = JSON.stringify(data.ingredients);
    // Stamped server-side so the "shopped for" date can't drift with device clocks
    if (data.markAddedToList === true) update.lastAddedToList = new Date().toISOString();

    await client.updateEntity(update as any, "Merge");

    const recipe: Recipe = toRecipe({ ...existing, ...update });

    const body: UpdateRecipeResponse = { success: true, recipe };
    return { status: 200, jsonBody: body };
  } catch (error: any) {
    context.error("Error updating recipe:", error);
    return {
      status: 500,
      headers: { "Content-Type": "application/json" },
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("updateRecipe", {
  methods: ["PUT"],
  authLevel: "anonymous",
  handler: updateRecipe,
});
