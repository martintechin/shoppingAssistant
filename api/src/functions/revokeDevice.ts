import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { verifyRequest } from "../auth.js";
import { getTableClient } from "../tableClient.js";
import { RevokeDeviceResponse } from "../types/shared.js";

export async function revokeDevice(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = await verifyRequest(request, context);
  if (!auth.authenticated) {
    return { status: 401, jsonBody: { error: "Unauthorized" } };
  }

  try {
    const body = await request.text();
    let data: { deviceId?: string };
    try {
      data = JSON.parse(body);
    } catch {
      return { status: 400, jsonBody: { error: "Invalid JSON in request body" } };
    }

    if (!data.deviceId || typeof data.deviceId !== "string") {
      return { status: 400, jsonBody: { error: "Missing or invalid 'deviceId' field" } };
    }

    if (data.deviceId === auth.deviceId) {
      return { status: 400, jsonBody: { error: "Cannot revoke the current device" } };
    }

    const client = getTableClient("DeviceAuth");

    let device;
    try {
      device = await client.getEntity("device", data.deviceId);
    } catch (error: any) {
      if (error.statusCode === 404) {
        return { status: 404, jsonBody: { error: "Device not found" } };
      }
      throw error;
    }

    if (device.status !== "active") {
      return { status: 404, jsonBody: { error: "Device not found" } };
    }

    await client.updateEntity(
      {
        partitionKey: "device",
        rowKey: data.deviceId,
        status: "revoked",
      },
      "Merge"
    );

    context.log(`Device ${data.deviceId} revoked by ${auth.deviceId}`);

    const responseBody: RevokeDeviceResponse = { success: true };
    return { status: 200, jsonBody: responseBody };
  } catch (error: any) {
    context.error("Error revoking device:", error);
    return {
      status: 500,
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("revokeDevice", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: revokeDevice,
});
