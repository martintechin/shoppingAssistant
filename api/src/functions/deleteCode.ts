import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { verifyRequest } from "../auth.js";
import { getTableClient } from "../tableClient.js";
import { DeleteCodeResponse } from "../types/shared.js";

export async function deleteCode(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = await verifyRequest(request, context);
  if (!auth.authenticated) {
    return { status: 401, jsonBody: { error: "Unauthorized" } };
  }

  try {
    const body = await request.text();
    let data: { code?: string };
    try {
      data = JSON.parse(body);
    } catch {
      return { status: 400, jsonBody: { error: "Invalid JSON in request body" } };
    }

    if (!data.code || typeof data.code !== "string") {
      return { status: 400, jsonBody: { error: "Missing or invalid 'code' field" } };
    }

    const client = getTableClient("DeviceAuth");

    let entity;
    try {
      entity = await client.getEntity("code", data.code);
    } catch (error: any) {
      if (error.statusCode === 404) {
        return { status: 404, jsonBody: { error: "Code not found" } };
      }
      throw error;
    }

    if (entity.status !== "active") {
      return { status: 400, jsonBody: { error: "Code has already been used" } };
    }

    await client.deleteEntity("code", data.code);

    context.log(`Activation code deleted by device ${auth.deviceId}`);

    const responseBody: DeleteCodeResponse = { success: true };
    return { status: 200, jsonBody: responseBody };
  } catch (error: any) {
    context.error("Error deleting code:", error);
    return {
      status: 500,
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("deleteCode", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: deleteCode,
});
