import { describe, it, expect, vi, beforeEach } from "vitest";
import { storeFoodItem } from "./storeFoodItem";
import { verifyRequest } from "../auth.js";
import { __get, __reset, __seed } from "../testUtils/mockTableClient.js";
import { createMockContext, createMockRequest } from "../testUtils/http.js";

vi.mock("../auth.js", () => ({
  verifyRequest: vi.fn(() =>
    Promise.resolve({ authenticated: true, deviceId: "test-device" })
  ),
}));

vi.mock("../tableClient.js", async () => await import("../testUtils/mockTableClient.js"));

describe("storeFoodItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __reset();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(verifyRequest).mockResolvedValueOnce({ authenticated: false });
    const req = createMockRequest({
      method: "POST",
      body: { name: "Mjölk", category: "Mejeri & Ägg", unit: "l" },
    });
    const result = await storeFoodItem(req, createMockContext());
    expect(result.status).toBe(401);
  });

  it("rejects an unknown unit", async () => {
    const req = createMockRequest({
      method: "POST",
      body: { name: "Mjölk", category: "Mejeri & Ägg", unit: "hg" },
    });
    const result = await storeFoodItem(req, createMockContext());
    expect(result.status).toBe(400);
  });

  it("rejects a missing name", async () => {
    const req = createMockRequest({
      method: "POST",
      body: { category: "Mejeri & Ägg", unit: "l" },
    });
    const result = await storeFoodItem(req, createMockContext());
    expect(result.status).toBe(400);
  });

  it("creates an item with a lowercase search name", async () => {
    const req = createMockRequest({
      method: "POST",
      body: { name: "  Mjölk ", category: "Mejeri & Ägg", unit: "l" },
    });
    const result = await storeFoodItem(req, createMockContext());
    expect(result.status).toBe(201);

    const body = result.jsonBody as any;
    expect(body.success).toBe(true);
    expect(body.item.name).toBe("Mjölk");
    expect(body.item.id).toBeTruthy();

    const stored = __get("FoodItems", "item", body.item.id);
    expect(stored?.nameLower).toBe("mjölk");
    expect(stored?.category).toBe("Mejeri & Ägg");
    expect(stored?.unit).toBe("l");
  });

  it("returns 409 with existingId for a duplicate name (case-insensitive)", async () => {
    __seed("FoodItems", [
      {
        partitionKey: "item",
        rowKey: "existing-1",
        name: "Mjölk",
        nameLower: "mjölk",
        category: "Mejeri & Ägg",
        unit: "l",
      },
    ]);
    const req = createMockRequest({
      method: "POST",
      body: { name: "MJÖLK", category: "Mejeri & Ägg", unit: "l" },
    });
    const result = await storeFoodItem(req, createMockContext());
    expect(result.status).toBe(409);
    expect((result.jsonBody as any).existingId).toBe("existing-1");
  });
});
