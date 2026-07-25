import { describe, it, expect } from "vitest";
import { CATEGORIES, ListItem } from "../types/shared";
import { categoryComparator, groupByCategory, sortByStoreOrder } from "./sorting";

function makeItem(name: string, category: string): ListItem {
  return {
    id: name,
    foodItemId: `food-${name}`,
    name,
    category,
    unit: "st",
    quantity: 1,
    checked: false,
    addedAt: "2026-07-20T10:00:00.000Z",
  };
}

describe("sortByStoreOrder", () => {
  it("sorts items along the store's category order", () => {
    const items = [
      makeItem("Mjölk", "Mejeri & Ägg"),
      makeItem("Bananer", "Frukt & Grönt"),
      makeItem("Kaffe", "Skafferi"),
    ];
    const sorted = sortByStoreOrder(items, ["Skafferi", "Mejeri & Ägg", "Frukt & Grönt"]);
    expect(sorted.map((i) => i.name)).toEqual(["Kaffe", "Mjölk", "Bananer"]);
  });

  it("appends categories missing from the store order, in config order", () => {
    const items = [
      makeItem("Tandkräm", "Hygien"),
      makeItem("Mjölk", "Mejeri & Ägg"),
      makeItem("Glass", "Fryst"),
    ];
    // Store only knows about Mejeri & Ägg — Fryst comes before Hygien in config.
    const sorted = sortByStoreOrder(items, ["Mejeri & Ägg"]);
    expect(sorted.map((i) => i.name)).toEqual(["Mjölk", "Glass", "Tandkräm"]);
  });

  it("puts entirely unknown categories last", () => {
    const items = [makeItem("Mystisk vara", "Okänd kategori"), makeItem("Mjölk", "Mejeri & Ägg")];
    const sorted = sortByStoreOrder(items, ["Mejeri & Ägg"]);
    expect(sorted.map((i) => i.name)).toEqual(["Mjölk", "Mystisk vara"]);
  });

  it("sorts alphabetically within a category with Swedish collation", () => {
    const items = [
      makeItem("Äpplen", "Frukt & Grönt"),
      makeItem("Bananer", "Frukt & Grönt"),
      makeItem("Avokado", "Frukt & Grönt"),
    ];
    const sorted = sortByStoreOrder(items, []);
    expect(sorted.map((i) => i.name)).toEqual(["Avokado", "Bananer", "Äpplen"]);
  });
});

describe("categoryComparator", () => {
  it("falls back to full config order for an empty store order", () => {
    const cmp = categoryComparator([]);
    expect(cmp(CATEGORIES[0], CATEGORIES[1])).toBeLessThan(0);
  });
});

describe("groupByCategory", () => {
  it("groups consecutive items of the same category", () => {
    const sorted = sortByStoreOrder(
      [
        makeItem("Mjölk", "Mejeri & Ägg"),
        makeItem("Smör", "Mejeri & Ägg"),
        makeItem("Bananer", "Frukt & Grönt"),
      ],
      []
    );
    const groups = groupByCategory(sorted);
    expect(groups.map(([category, items]) => [category, items.length])).toEqual([
      ["Frukt & Grönt", 1],
      ["Mejeri & Ägg", 2],
    ]);
  });
});
