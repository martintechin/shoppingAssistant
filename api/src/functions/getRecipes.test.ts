import { describe, it, expect, vi, beforeEach } from "vitest";
import { getRecipes } from "./getRecipes";
import { __reset, __seed } from "../testUtils/mockTableClient.js";
import { createMockContext, createMockRequest } from "../testUtils/http.js";

vi.mock("../auth.js", () => ({
  verifyRequest: vi.fn(() =>
    Promise.resolve({ authenticated: true, deviceId: "test-device" })
  ),
}));

vi.mock("../tableClient.js", async () => await import("../testUtils/mockTableClient.js"));

describe("getRecipes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __reset();
  });

  it("returns an empty array when no recipes exist", async () => {
    const req = createMockRequest({ method: "GET" });
    const result = await getRecipes(req, createMockContext());
    expect(result.status).toBe(200);
    expect((result.jsonBody as any).recipes).toEqual([]);
  });

  it("returns recipes with parsed ingredients", async () => {
    __seed("Recipes", [
      {
        partitionKey: "recipe",
        rowKey: "r1",
        name: "Pasta Carbonara",
        ingredients: JSON.stringify([
          { foodItemId: "f1", quantity: 500 },
          { foodItemId: "f2", quantity: 4 },
        ]),
        createdAt: "2026-07-01T00:00:00.000Z",
      },
      {
        partitionKey: "recipe",
        rowKey: "r2",
        name: "Ärtsoppa",
        ingredients: JSON.stringify([{ foodItemId: "f3", quantity: 1 }]),
        createdAt: "2026-07-02T00:00:00.000Z",
      },
    ]);

    const req = createMockRequest({ method: "GET" });
    const result = await getRecipes(req, createMockContext());
    expect(result.status).toBe(200);

    const body = result.jsonBody as any;
    expect(body.recipes).toHaveLength(2);
    expect(body.recipes[0].name).toBe("Pasta Carbonara");
    expect(body.recipes[0].ingredients).toEqual([
      { foodItemId: "f1", quantity: 500 },
      { foodItemId: "f2", quantity: 4 },
    ]);
    expect(body.recipes[1].name).toBe("Ärtsoppa");
  });
});
