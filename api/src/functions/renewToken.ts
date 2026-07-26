import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { verifyRequest, createDeviceToken } from "../auth.js";
import { RenewTokenResponse } from "../types/shared.js";

export async function renewToken(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = await verifyRequest(request, context);
  if (!auth.authenticated) {
    return { status: 401, jsonBody: { error: "Unauthorized" } };
  }

  try {
    const { token, expiresAt } = await createDeviceToken(auth.deviceId!);

    context.log(`Token renewed for device ${auth.deviceId}`);

    const body: RenewTokenResponse = { token, expiresAt };
    return { status: 200, jsonBody: body };
  } catch (error: any) {
    context.error("Error renewing token:", error);
    return {
      status: 500,
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("renewToken", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: renewToken,
});
