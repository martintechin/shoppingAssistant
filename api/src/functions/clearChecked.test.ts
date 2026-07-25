import { describe, it, expect, vi, beforeEach } from "vitest";
import { clearChecked } from "./clearChecked";
import { __all, __reset, __seed } from "../testUtils/mockTableClient.js";
import { createMockContext, createMockRequest } from "../testUtils/http.js";

vi.mock("../auth.js", () => ({
  verifyRequest: vi.fn(() =>
    Promise.resolve({ authenticated: true, deviceId: "test-device" })
  ),
}));

vi.mock("../tableClient.js", async () => await import("../testUtils/mockTableClient.js"));

function makeRow(index: number, checked: boolean) {
  return {
    partitionKey: "list",
    rowKey: `list-${index}`,
    foodItemId: `food-${index}`,
    name: `Vara ${index}`,
    category: "Skafferi",
    unit: "st",
    quantity: 1,
    checked,
    addedAt: "2026-07-20T10:00:00.000Z",
  };
}

describe("clearChecked", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __reset();
  });

  it("removes only checked rows and reports the count", async () => {
    __seed("ShoppingList", [makeRow(1, true), makeRow(2, false), makeRow(3, true)]);

    const result = await clearChecked(createMockRequest({ method: "POST" }), createMockContext());
    expect(result.status).toBe(200);
    expect((result.jsonBody as any).removedCount).toBe(2);

    const remaining = __all("ShoppingList");
    expect(remaining).toHaveLength(1);
    expect(remaining[0].rowKey).toBe("list-2");
  });

  it("handles more than 100 checked rows (transaction batching)", async () => {
    __seed(
      "ShoppingList",
      Array.from({ length: 150 }, (_, i) => makeRow(i, true))
    );

    const result = await clearChecked(createMockRequest({ method: "POST" }), createMockContext());
    expect(result.status).toBe(200);
    expect((result.jsonBody as any).removedCount).toBe(150);
    expect(__all("ShoppingList")).toHaveLength(0);
  });

  it("returns 0 for an empty list", async () => {
    const result = await clearChecked(createMockRequest({ method: "POST" }), createMockContext());
    expect(result.status).toBe(200);
    expect((result.jsonBody as any).removedCount).toBe(0);
  });
});
