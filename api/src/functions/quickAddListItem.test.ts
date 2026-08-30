import { describe, it, expect, vi, beforeEach } from "vitest";
import { quickAddListItem } from "./quickAddListItem";
import { verifyRequest } from "../auth.js";
import { __all, __reset } from "../testUtils/mockTableClient.js";
import { createMockContext, createMockRequest } from "../testUtils/http.js";

vi.mock("../auth.js", () => ({
  verifyRequest: vi.fn(() =>
    Promise.resolve({ authenticated: true, deviceId: "test-device" })
  ),
}));

vi.mock("../tableClient.js", async () => await import("../testUtils/mockTableClient.js"));

describe("quickAddListItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __reset();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(verifyRequest).mockResolvedValueOnce({ authenticated: false });
    const req = createMockRequest({ method: "POST", body: { name: "Bananas" } });
    const result = await quickAddListItem(req, createMockContext());
    expect(result.status).toBe(401);
  });

  it("returns 400 for missing name", async () => {
    const req = createMockRequest({ method: "POST", body: {} });
    const result = await quickAddListItem(req, createMockContext());
    expect(result.status).toBe(400);
  });

  it("returns 400 for empty name", async () => {
    const req = createMockRequest({ method: "POST", body: { name: "  " } });
    const result = await quickAddListItem(req, createMockContext());
    expect(result.status).toBe(400);
  });

  it("creates a list row with empty foodItemId", async () => {
    const req = createMockRequest({ method: "POST", body: { name: "Bananas" } });
    const result = await quickAddListItem(req, createMockContext());
    expect(result.status).toBe(201);

    const body = result.jsonBody as any;
    expect(body.success).toBe(true);
    expect(body.item.name).toBe("Bananas");
    expect(body.item.foodItemId).toBe("");
    expect(body.item.category).toBe("");
    expect(body.item.quantity).toBe(1);
    expect(body.item.checked).toBe(false);
    expect(__all("ShoppingList")).toHaveLength(1);
  });

  it("accepts optional category and unit", async () => {
    const req = createMockRequest({
      method: "POST",
      body: { name: "Apples", category: "Fruit", unit: "kg", quantity: 2 },
    });
    const result = await quickAddListItem(req, createMockContext());
    expect(result.status).toBe(201);

    const body = result.jsonBody as any;
    expect(body.item.category).toBe("Fruit");
    expect(body.item.unit).toBe("kg");
    expect(body.item.quantity).toBe(2);
  });

  it("rejects invalid quantity", async () => {
    const req = createMockRequest({
      method: "POST",
      body: { name: "Bananas", quantity: 0 },
    });
    const result = await quickAddListItem(req, createMockContext());
    expect(result.status).toBe(400);
  });
});
