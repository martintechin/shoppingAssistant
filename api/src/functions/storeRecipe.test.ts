import { describe, it, expect, vi, beforeEach } from "vitest";
import { storeRecipe } from "./storeRecipe";
import { updateRecipe } from "./updateRecipe";
import { __get, __reset, __seed } from "../testUtils/mockTableClient.js";
import { createMockContext, createMockRequest } from "../testUtils/http.js";

vi.mock("../auth.js", () => ({
  verifyRequest: vi.fn(() =>
    Promise.resolve({ authenticated: true, deviceId: "test-device" })
  ),
}));

vi.mock("../tableClient.js", async () => await import("../testUtils/mockTableClient.js"));

describe("storeRecipe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __reset();
  });

  it("rejects an empty name", async () => {
    const req = createMockRequest({
      method: "POST",
      body: { name: "  ", ingredients: [{ foodItemId: "f1", quantity: 1 }] },
    });
    const result = await storeRecipe(req, createMockContext());
    expect(result.status).toBe(400);
  });

  it("rejects an empty ingredients array", async () => {
    const req = createMockRequest({
      method: "POST",
      body: { name: "Tacos", ingredients: [] },
    });
    const result = await storeRecipe(req, createMockContext());
    expect(result.status).toBe(400);
  });

  it("rejects an ingredient with quantity <= 0", async () => {
    const req = createMockRequest({
      method: "POST",
      body: { name: "Tacos", ingredients: [{ foodItemId: "f1", quantity: 0 }] },
    });
    const result = await storeRecipe(req, createMockContext());
    expect(result.status).toBe(400);
  });

  it("rejects an ingredient with missing foodItemId", async () => {
    const req = createMockRequest({
      method: "POST",
      body: { name: "Tacos", ingredients: [{ quantity: 2 }] },
    });
    const result = await storeRecipe(req, createMockContext());
    expect(result.status).toBe(400);
  });

  it("creates a recipe and stores ingredients as JSON string", async () => {
    const ingredients = [
      { foodItemId: "f1", quantity: 2 },
      { foodItemId: "f2", quantity: 0.5 },
    ];
    const req = createMockRequest({
      method: "POST",
      body: { name: " Tacos ", ingredients },
    });
    const result = await storeRecipe(req, createMockContext());
    expect(result.status).toBe(201);

    const body = result.jsonBody as any;
    expect(body.success).toBe(true);
    expect(body.recipe.name).toBe("Tacos");
    expect(body.recipe.ingredients).toEqual(ingredients);

    const stored = __get("Recipes", "recipe", body.recipe.id);
    expect(stored).toBeDefined();
    expect(stored?.name).toBe("Tacos");
    expect(JSON.parse(stored?.ingredients as string)).toEqual(ingredients);
  });
});

describe("updateRecipe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __reset();
    __seed("Recipes", [
      {
        partitionKey: "recipe",
        rowKey: "recipe-1",
        name: "Tacos",
        ingredients: JSON.stringify([{ foodItemId: "f1", quantity: 2 }]),
        createdAt: "2026-07-01T00:00:00.000Z",
      },
    ]);
  });

  it("returns 404 for an unknown recipe", async () => {
    const req = createMockRequest({
      method: "PUT",
      body: { id: "nope", name: "Pasta" },
    });
    const result = await updateRecipe(req, createMockContext());
    expect(result.status).toBe(404);
  });

  it("updates recipe name", async () => {
    const req = createMockRequest({
      method: "PUT",
      body: { id: "recipe-1", name: "Fish Tacos" },
    });
    const result = await updateRecipe(req, createMockContext());
    expect(result.status).toBe(200);
    expect((result.jsonBody as any).recipe.name).toBe("Fish Tacos");
    expect((result.jsonBody as any).recipe.ingredients).toEqual([
      { foodItemId: "f1", quantity: 2 },
    ]);
  });

  it("updates recipe ingredients", async () => {
    const newIngredients = [
      { foodItemId: "f1", quantity: 3 },
      { foodItemId: "f2", quantity: 1 },
    ];
    const req = createMockRequest({
      method: "PUT",
      body: { id: "recipe-1", ingredients: newIngredients },
    });
    const result = await updateRecipe(req, createMockContext());
    expect(result.status).toBe(200);
    expect((result.jsonBody as any).recipe.ingredients).toEqual(newIngredients);
  });

  it("rejects update with no fields", async () => {
    const req = createMockRequest({
      method: "PUT",
      body: { id: "recipe-1" },
    });
    const result = await updateRecipe(req, createMockContext());
    expect(result.status).toBe(400);
  });

  it("stamps lastAddedToList when markAddedToList is true", async () => {
    const before = Date.now();
    const req = createMockRequest({
      method: "PUT",
      body: { id: "recipe-1", markAddedToList: true },
    });
    const result = await updateRecipe(req, createMockContext());
    expect(result.status).toBe(200);

    const stamped = (result.jsonBody as any).recipe.lastAddedToList as string;
    expect(new Date(stamped).getTime()).toBeGreaterThanOrEqual(before);
    expect(__get("Recipes", "recipe", "recipe-1")?.lastAddedToList).toBe(stamped);
    // other fields untouched
    expect((result.jsonBody as any).recipe.name).toBe("Tacos");
  });

  it("leaves lastAddedToList alone when markAddedToList is false", async () => {
    const req = createMockRequest({
      method: "PUT",
      body: { id: "recipe-1", markAddedToList: false, name: "Fish Tacos" },
    });
    const result = await updateRecipe(req, createMockContext());
    expect(result.status).toBe(200);
    expect((result.jsonBody as any).recipe.lastAddedToList).toBeUndefined();
  });

  it("rejects a non-boolean markAddedToList", async () => {
    const req = createMockRequest({
      method: "PUT",
      body: { id: "recipe-1", markAddedToList: "yes" },
    });
    const result = await updateRecipe(req, createMockContext());
    expect(result.status).toBe(400);
  });
});
