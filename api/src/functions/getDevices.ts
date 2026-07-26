import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { verifyRequest } from "../auth.js";
import { getTableClient } from "../tableClient.js";
import { Device, DevicesResponse } from "../types/shared.js";

function toDevice(entity: any): Device {
  return {
    id: String(entity.rowKey),
    name: String(entity.name ?? ""),
    activatedAt: String(entity.activatedAt ?? ""),
    lastUsedAt: entity.lastUsedAt ? String(entity.lastUsedAt) : undefined,
    status: String(entity.status) as "active" | "revoked",
  };
}

export async function getDevices(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = await verifyRequest(request, context);
  if (!auth.authenticated) {
    return { status: 401, jsonBody: { error: "Unauthorized" } };
  }

  try {
    const client = getTableClient("DeviceAuth");
    const devices: Device[] = [];

    for await (const entity of client.listEntities({
      queryOptions: { filter: "PartitionKey eq 'device'" },
    })) {
      if (entity.status === "active") {
        devices.push(toDevice(entity));
      }
    }

    devices.sort(
      (a, b) =>
        new Date(b.activatedAt).getTime() - new Date(a.activatedAt).getTime()
    );

    const body: DevicesResponse = { devices };
    return {
      status: 200,
      headers: { "Cache-Control": "no-cache" },
      jsonBody: body,
    };
  } catch (error: any) {
    context.error("Error fetching devices:", error);
    return {
      status: 500,
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("getDevices", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: getDevices,
});
