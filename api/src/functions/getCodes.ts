import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { verifyRequest } from "../auth.js";
import { getTableClient } from "../tableClient.js";
import { ActivationCode, CodesResponse } from "../types/shared.js";

export async function getCodes(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = await verifyRequest(request, context);
  if (!auth.authenticated) {
    return { status: 401, jsonBody: { error: "Unauthorized" } };
  }

  try {
    const client = getTableClient("DeviceAuth");
    const codes: ActivationCode[] = [];

    for await (const entity of client.listEntities({
      queryOptions: { filter: "PartitionKey eq 'code'" },
    })) {
      if (entity.status === "active") {
        codes.push({
          code: String(entity.rowKey),
          createdAt: entity.timestamp ? String(entity.timestamp) : undefined,
        });
      }
    }

    const body: CodesResponse = { codes };
    return {
      status: 200,
      headers: { "Cache-Control": "no-cache" },
      jsonBody: body,
    };
  } catch (error: any) {
    context.error("Error fetching codes:", error);
    return {
      status: 500,
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("getCodes", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: getCodes,
});
