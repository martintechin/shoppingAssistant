import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateListItem } from "./updateListItem";
import { __get, __reset, __seed } from "../testUtils/mockTableClient.js";
import { createMockContext, createMockRequest } from "../testUtils/http.js";

vi.mock("../auth.js", () => ({
  verifyRequest: vi.fn(() =>
    Promise.resolve({ authenticated: true, deviceId: "test-device" })
  ),
}));

vi.mock("../tableClient.js", async () => await import("../testUtils/mockTableClient.js"));

function seedRow(overrides: Record<string, any> = {}) {
  __seed("ShoppingList", [
    {
      partitionKey: "list",
      rowKey: "list-1",
      foodItemId: "food-1",
      name: "Mjölk",
      category: "Mejeri & Ägg",
      unit: "l",
      quantity: 1,
      checked: false,
      addedAt: "2026-07-20T10:00:00.000Z",
      ...overrides,
    },
  ]);
}

function seedFood(overrides: Record<string, any> = {}) {
  __seed("FoodItems", [
    {
      partitionKey: "item",
      rowKey: "food-1",
      name: "Mjölk",
      nameLower: "mjölk",
      category: "Mejeri & Ägg",
      unit: "l",
      ...overrides,
    },
  ]);
}

describe("updateListItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __reset();
  });

  it("returns 404 for an unknown list row", async () => {
    const req = createMockRequest({ method: "PUT", body: { id: "nope", checked: true } });
    const result = await updateListItem(req, createMockContext());
    expect(result.status).toBe(404);
  });

  it("rejects an out-of-range quantity", async () => {
    seedRow();
    const req = createMockRequest({ method: "PUT", body: { id: "list-1", quantity: 1000 } });
    const result = await updateListItem(req, createMockContext());
    expect(result.status).toBe(400);
  });

  it("checking sets lastBought and snapshots the previous value", async () => {
    seedRow();
    seedFood({ lastBought: "2026-07-01T00:00:00.000Z" });

    const req = createMockRequest({ method: "PUT", body: { id: "list-1", checked: true } });
    const result = await updateListItem(req, createMockContext());
    expect(result.status).toBe(200);

    const row = __get("ShoppingList", "list", "list-1");
    expect(row?.checked).toBe(true);
    expect(row?.checkedAt).toBeTruthy();
    expect(row?.prevLastBought).toBe("2026-07-01T00:00:00.000Z");

    const food = __get("FoodItems", "item", "food-1");
    expect(food?.lastBought).toBe(row?.checkedAt);
  });

  it("unchecking restores the previous lastBought", async () => {
    seedRow({
      checked: true,
      checkedAt: "2026-07-24T10:00:00.000Z",
      prevLastBought: "2026-07-01T00:00:00.000Z",
    });
    seedFood({ lastBought: "2026-07-24T10:00:00.000Z" });

    const req = createMockRequest({ method: "PUT", body: { id: "list-1", checked: false } });
    const result = await updateListItem(req, createMockContext());
    expect(result.status).toBe(200);

    const food = __get("FoodItems", "item", "food-1");
    expect(food?.lastBought).toBe("2026-07-01T00:00:00.000Z");

    const row = __get("ShoppingList", "list", "list-1");
    expect(row?.checked).toBe(false);
    expect(row?.checkedAt).toBe("");
  });

  it("re-checking with the same value has no lastBought side effects", async () => {
    seedRow({ checked: true, checkedAt: "2026-07-24T10:00:00.000Z" });
    seedFood({ lastBought: "2026-07-24T10:00:00.000Z" });

    const req = createMockRequest({ method: "PUT", body: { id: "list-1", checked: true } });
    const result = await updateListItem(req, createMockContext());
    expect(result.status).toBe(200);

    const food = __get("FoodItems", "item", "food-1");
    expect(food?.lastBought).toBe("2026-07-24T10:00:00.000Z");
  });

  it("checking survives the food item having been deleted", async () => {
    seedRow();
    // No food item seeded — it was deleted after the row was added.

    const req = createMockRequest({ method: "PUT", body: { id: "list-1", checked: true } });
    const result = await updateListItem(req, createMockContext());
    expect(result.status).toBe(200);
    expect(__get("ShoppingList", "list", "list-1")?.checked).toBe(true);
  });

  it("updates quantity", async () => {
    seedRow();
    const req = createMockRequest({ method: "PUT", body: { id: "list-1", quantity: 5 } });
    const result = await updateListItem(req, createMockContext());
    expect(result.status).toBe(200);
    expect((result.jsonBody as any).item.quantity).toBe(5);
  });
});
