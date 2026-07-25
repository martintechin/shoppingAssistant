import { describe, it, expect, vi, beforeEach } from "vitest";
import { storeStore } from "./storeStore";
import { updateStore } from "./updateStore";
import { __get, __reset, __seed } from "../testUtils/mockTableClient.js";
import { createMockContext, createMockRequest } from "../testUtils/http.js";

vi.mock("../auth.js", () => ({
  verifyRequest: vi.fn(() =>
    Promise.resolve({ authenticated: true, deviceId: "test-device" })
  ),
}));

vi.mock("../tableClient.js", async () => await import("../testUtils/mockTableClient.js"));

describe("storeStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __reset();
  });

  it("rejects an empty categoryOrder", async () => {
    const req = createMockRequest({
      method: "POST",
      body: { name: "ICA Maxi", categoryOrder: [] },
    });
    const result = await storeStore(req, createMockContext());
    expect(result.status).toBe(400);
  });

  it("rejects a categoryOrder containing empty strings", async () => {
    const req = createMockRequest({
      method: "POST",
      body: { name: "ICA Maxi", categoryOrder: ["Mejeri & Ägg", ""] },
    });
    const result = await storeStore(req, createMockContext());
    expect(result.status).toBe(400);
  });

  it("creates a store with JSON-stringified arrays", async () => {
    const req = createMockRequest({
      method: "POST",
      body: {
        name: "ICA Maxi",
        categoryOrder: ["Frukt & Grönt", "Mejeri & Ägg"],
        unavailableItems: ["food-1"],
      },
    });
    const result = await storeStore(req, createMockContext());
    expect(result.status).toBe(201);

    const body = result.jsonBody as any;
    expect(body.store.categoryOrder).toEqual(["Frukt & Grönt", "Mejeri & Ägg"]);

    const stored = __get("Stores", "store", body.store.id);
    expect(stored?.categoryOrder).toBe('["Frukt & Grönt","Mejeri & Ägg"]');
    expect(stored?.unavailableItems).toBe('["food-1"]');
  });
});

describe("updateStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __reset();
    __seed("Stores", [
      {
        partitionKey: "store",
        rowKey: "store-1",
        name: "ICA Maxi",
        categoryOrder: '["Frukt & Grönt","Mejeri & Ägg"]',
        unavailableItems: '["food-1"]',
        createdAt: "2026-07-01T00:00:00.000Z",
      },
    ]);
  });

  it("returns 404 for an unknown store", async () => {
    const req = createMockRequest({
      method: "PUT",
      body: { id: "nope", name: "Willys" },
    });
    const result = await updateStore(req, createMockContext());
    expect(result.status).toBe(404);
  });

  it("allows clearing unavailableItems with an empty array", async () => {
    const req = createMockRequest({
      method: "PUT",
      body: { id: "store-1", unavailableItems: [] },
    });
    const result = await updateStore(req, createMockContext());
    expect(result.status).toBe(200);
    expect(__get("Stores", "store", "store-1")?.unavailableItems).toBe("[]");
  });

  it("rejects unavailableItems containing empty strings", async () => {
    const req = createMockRequest({
      method: "PUT",
      body: { id: "store-1", unavailableItems: ["food-1", ""] },
    });
    const result = await updateStore(req, createMockContext());
    expect(result.status).toBe(400);
  });

  it("updates the category order and parses it back in the response", async () => {
    const req = createMockRequest({
      method: "PUT",
      body: { id: "store-1", categoryOrder: ["Mejeri & Ägg", "Frukt & Grönt"] },
    });
    const result = await updateStore(req, createMockContext());
    expect(result.status).toBe(200);
    expect((result.jsonBody as any).store.categoryOrder).toEqual([
      "Mejeri & Ägg",
      "Frukt & Grönt",
    ]);
  });
});
