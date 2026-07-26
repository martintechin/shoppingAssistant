import { describe, it, expect, beforeAll } from "vitest";
import { jwtVerify, SignJWT } from "jose";
import { createDeviceToken } from "./auth";

const JWT_ISSUER = "shoppingassistant";
const JWT_AUDIENCE = "shoppingassistant";

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-for-auth-round-trip";
});

function secretBytes() {
  return new TextEncoder().encode(process.env.JWT_SECRET!);
}

describe("createDeviceToken / JWT claims", () => {
  it("mints a token carrying the app issuer and audience", async () => {
    const { token } = await createDeviceToken("device-123");
    const { payload } = await jwtVerify(token, secretBytes(), {
      algorithms: ["HS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    expect(payload.deviceId).toBe("device-123");
    expect(payload.iss).toBe(JWT_ISSUER);
    expect(payload.aud).toBe(JWT_AUDIENCE);
  });

  it("returns a one-year expiry", async () => {
    const { expiresAt } = await createDeviceToken("device-123");
    const ms = new Date(expiresAt).getTime() - Date.now();
    // ~365 days, allowing a wide margin for leap years / clock skew.
    expect(ms).toBeGreaterThan(360 * 24 * 60 * 60 * 1000);
    expect(ms).toBeLessThan(370 * 24 * 60 * 60 * 1000);
  });

  it("rejects a token signed for a different audience (cross-app confusion)", async () => {
    const foreign = await new SignJWT({ deviceId: "device-123" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer("familycalendar")
      .setAudience("familycalendar")
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(secretBytes());

    await expect(
      jwtVerify(foreign, secretBytes(), {
        algorithms: ["HS256"],
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      })
    ).rejects.toThrow();
  });
});
