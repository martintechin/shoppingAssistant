import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { verifyRequest } from "../auth.js";
import { getTableClient } from "../tableClient.js";

const tableName = "Recipes";

export async function deleteRecipe(
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
      await client.deleteEntity("recipe", id);
    } catch (error: any) {
      if (error.statusCode === 404) {
        return { status: 404, jsonBody: { error: "Recipe not found" } };
      }
      throw error;
    }

    return { status: 200, jsonBody: { success: true } };
  } catch (error: any) {
    context.error("Error deleting recipe:", error);
    return {
      status: 500,
      headers: { "Content-Type": "application/json" },
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("deleteRecipe", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  handler: deleteRecipe,
});
