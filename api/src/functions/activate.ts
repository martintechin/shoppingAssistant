import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { TableClient } from "@azure/data-tables";
import { createDeviceToken } from "../auth.js";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || "";
const tableName = "DeviceAuth";

let tableClient: TableClient;

function getTableClient(): TableClient {
  if (!tableClient) {
    tableClient = TableClient.fromConnectionString(connectionString, tableName);
  }
  return tableClient;
}

// Fixed-window IP rate limiting for the anonymous activation endpoint to slow
// down brute-forcing of activation codes. State is stored in the DeviceAuth
// table under partition "ratelimit" (no extra infrastructure required).
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 10;

function getClientIp(request: HttpRequest): string {
  // NOTE: X-Forwarded-For is client-controllable, so this limiter is
  // defense-in-depth, not a hard guarantee — a caller can spoof the header for
  // fresh buckets. The real protection against code guessing is the ~2^60
  // activation-code entropy; this just slows naive brute force.
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // First hop is the original client.
    const first = forwarded.split(",")[0].trim();
    const ip = stripPort(first);
    if (ip) return ip;
  }
  return "unknown";
}

// Extract the bare IP from a "host[:port]" token, correctly handling IPv6.
// IPv4 "1.2.3.4:5678" -> "1.2.3.4"; bracketed "[::1]:5678" -> "::1"; a bare
// IPv6 like "2001:db8::1" is returned unchanged (never split on its colons).
function stripPort(token: string): string {
  if (token.startsWith("[")) {
    const end = token.indexOf("]");
    return end > 0 ? token.slice(1, end) : token;
  }
  // More than one colon => bare IPv6 (no port to strip).
  if (token.indexOf(":") !== token.lastIndexOf(":")) return token;
  // Exactly one colon => IPv4:port.
  const colon = token.indexOf(":");
  return colon > 0 ? token.slice(0, colon) : token;
}

/**
 * Returns the number of seconds to wait if the caller is rate limited, or null
 * if the request may proceed. Fails open (returns null) on any storage error so
 * a transient issue never locks out legitimate activations.
 */
async function checkRateLimit(
  client: TableClient,
  ip: string,
  context: InvocationContext
): Promise<number | null> {
  // Table keys cannot contain certain characters; sanitize the IP defensively.
  const rowKey = ip.replace(/[^a-zA-Z0-9._-]/g, "_") || "unknown";
  const now = Date.now();

  try {
    let count = 0;
    let windowStart = now;
    try {
      const entity = await client.getEntity("ratelimit", rowKey);
      const storedStart = Number(entity.windowStart) || 0;
      if (now - storedStart < RATE_LIMIT_WINDOW_MS) {
        count = Number(entity.count) || 0;
        windowStart = storedStart;
      }
    } catch (error: any) {
      if (error.statusCode !== 404) throw error;
    }

    if (count >= RATE_LIMIT_MAX_ATTEMPTS) {
      const retryAfter = Math.ceil((windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000);
      return Math.max(retryAfter, 1);
    }

    await client.upsertEntity(
      {
        partitionKey: "ratelimit",
        rowKey,
        count: count + 1,
        windowStart,
      },
      "Replace"
    );
    return null;
  } catch (error: any) {
    context.warn("Rate limit check failed, allowing request:", error.message);
    return null;
  }
}

export async function activate(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log(`Http function processed request for url "${request.url}"`);

  try {
    const body = await request.text();
    let data: { code: string; name?: string };

    try {
      data = JSON.parse(body);
    } catch {
      return {
        status: 400,
        jsonBody: { error: "Invalid JSON in request body" },
      };
    }

    if (!data.code || typeof data.code !== "string") {
      return {
        status: 400,
        jsonBody: { error: "Missing or invalid 'code' field" },
      };
    }

    const code = data.code.trim().toUpperCase();
    const client = getTableClient();

    const retryAfter = await checkRateLimit(client, getClientIp(request), context);
    if (retryAfter !== null) {
      context.warn("Activation rate limit exceeded");
      return {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
        },
        jsonBody: { error: "Too many attempts. Please try again later." },
      };
    }

    let codeEntity;
    try {
      codeEntity = await client.getEntity("code", code);
    } catch (error: any) {
      if (error.statusCode === 404) {
        return {
          status: 401,
          jsonBody: { error: "Invalid activation code" },
        };
      }
      throw error;
    }

    if (codeEntity.status !== "active") {
      return {
        status: 401,
        jsonBody: { error: "Activation code has already been used" },
      };
    }

    const deviceId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    await client.updateEntity(
      {
        partitionKey: "code",
        rowKey: code,
        status: "used",
        deviceId,
        usedAt: now,
      },
      "Merge"
    );

    await client.createEntity({
      partitionKey: "device",
      rowKey: deviceId,
      activationCode: code,
      activatedAt: now,
      status: "active",
      name: data.name?.trim() || "",
    });

    const { token, expiresAt } = await createDeviceToken(deviceId);

    context.log(`Device activated: ${deviceId}`);

    return {
      status: 200,
      headers: { "Content-Type": "application/json" },
      jsonBody: { token, deviceId, expiresAt },
    };
  } catch (error: any) {
    context.error("Error activating device:", error);

    return {
      status: 500,
      headers: { "Content-Type": "application/json" },
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http("activate", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: activate,
});
