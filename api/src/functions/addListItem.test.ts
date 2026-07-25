import { describe, it, expect, vi, beforeEach } from "vitest";
import { addListItem } from "./addListItem";
import { verifyRequest } from "../auth.js";
import { __all, __reset, __seed } from "../testUtils/mockTableClient.js";
import { createMockContext, createMockRequest } from "../testUtils/http.js";

vi.mock("../auth.js", () => ({
  verifyRequest: vi.fn(() =>
    Promise.resolve({ authenticated: true, deviceId: "test-device" })
  ),
}));

vi.mock("../tableClient.js", async () => await import("../testUtils/mockTableClient.js"));

const milk = {
  partitionKey: "item",
  rowKey: "food-1",
  name: "Mjölk",
  nameLower: "mjölk",
  category: "Mejeri & Ägg",
  unit: "l",
};

describe("addListItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __reset();
    __seed("FoodItems", [milk]);
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(verifyRequest).mockResolvedValueOnce({ authenticated: false });
    const req = createMockRequest({ method: "POST", body: { foodItemId: "food-1" } });
    const result = await addListItem(req, createMockContext());
    expect(result.status).toBe(401);
  });

  it("returns 404 for an unknown food item", async () => {
    const req = createMockRequest({ method: "POST", body: { foodItemId: "nope" } });
    const result = await addListItem(req, createMockContext());
    expect(result.status).toBe(404);
  });

  it("rejects an invalid quantity", async () => {
    const req = createMockRequest({
      method: "POST",
      body: { foodItemId: "food-1", quantity: 0 },
    });
    const result = await addListItem(req, createMockContext());
    expect(result.status).toBe(400);
  });

  it("creates a row with fields denormalized from the food database", async () => {
    const req = createMockRequest({ method: "POST", body: { foodItemId: "food-1" } });
    const result = await addListItem(req, createMockContext());
    expect(result.status).toBe(201);

    const body = result.jsonBody as any;
    expect(body.merged).toBe(false);
    expect(body.item.name).toBe("Mjölk");
    expect(body.item.category).toBe("Mejeri & Ägg");
    expect(body.item.unit).toBe("l");
    expect(body.item.quantity).toBe(1);
    expect(body.item.checked).toBe(false);
  });

  it("merges into an existing unchecked row by bumping quantity", async () => {
    __seed("ShoppingList", [
      {
        partitionKey: "list",
        rowKey: "list-1",
        foodItemId: "food-1",
        name: "Mjölk",
        category: "Mejeri & Ägg",
        unit: "l",
        quantity: 2,
        checked: false,
        addedAt: "2026-07-20T10:00:00.000Z",
      },
    ]);

    const req = createMockRequest({
      method: "POST",
      body: { foodItemId: "food-1", quantity: 1 },
    });
    const result = await addListItem(req, createMockContext());
    expect(result.status).toBe(200);

    const body = result.jsonBody as any;
    expect(body.merged).toBe(true);
    expect(body.item.id).toBe("list-1");
    expect(body.item.quantity).toBe(3);
    expect(__all("ShoppingList")).toHaveLength(1);
  });

  it("does not merge into a checked row", async () => {
    __seed("ShoppingList", [
      {
        partitionKey: "list",
        rowKey: "list-1",
        foodItemId: "food-1",
        name: "Mjölk",
        category: "Mejeri & Ägg",
        unit: "l",
        quantity: 1,
        checked: true,
        addedAt: "2026-07-20T10:00:00.000Z",
      },
    ]);

    const req = createMockRequest({ method: "POST", body: { foodItemId: "food-1" } });
    const result = await addListItem(req, createMockContext());
    expect(result.status).toBe(201);
    expect((result.jsonBody as any).merged).toBe(false);
    expect(__all("ShoppingList")).toHaveLength(2);
  });
});
