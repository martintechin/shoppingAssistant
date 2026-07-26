import { HttpRequest, InvocationContext } from "@azure/functions";
import { TableClient } from "@azure/data-tables";
import { jwtVerify, SignJWT } from "jose";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || "";
const tableName = "DeviceAuth";

// Bind tokens to this app so a token minted by a sibling app that shares the
// same JWT_SECRET and DeviceAuth layout cannot be replayed here. Verification
// requires both claims to match.
const JWT_ISSUER = "shoppingassistant";
const JWT_AUDIENCE = "shoppingassistant";

let tableClient: TableClient;

function getTableClient(): TableClient {
  if (!tableClient) {
    tableClient = TableClient.fromConnectionString(connectionString, tableName);
  }
  return tableClient;
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is not set");
  return new TextEncoder().encode(secret);
}

export interface AuthResult {
  authenticated: boolean;
  deviceId?: string;
}

export async function verifyRequest(
  request: HttpRequest,
  context: InvocationContext
): Promise<AuthResult> {
  const token = request.headers.get("x-auth-token");
  if (!token) {
    return { authenticated: false };
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: ["HS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    const deviceId = payload.deviceId as string;
    if (!deviceId) {
      return { authenticated: false };
    }

    const client = getTableClient();
    const device = await client.getEntity("device", deviceId);

    if (device.status !== "active") {
      context.warn(`Device ${deviceId} is revoked`);
      return { authenticated: false };
    }

    return { authenticated: true, deviceId };
  } catch (error: any) {
    if (error.code === "ERR_JWT_EXPIRED") {
      context.warn("JWT expired");
    } else if (error.statusCode === 404) {
      context.warn("Device not found in DeviceAuth table");
    } else {
      context.warn("Auth verification failed:", error.message);
    }
    return { authenticated: false };
  }
}

export async function createDeviceToken(deviceId: string): Promise<{
  token: string;
  expiresAt: string;
}> {
  const secret = getJwtSecret();
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const token = await new SignJWT({ deviceId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secret);

  return { token, expiresAt: expiresAt.toISOString() };
}
