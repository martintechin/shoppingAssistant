import { describe, it, expect } from "vitest";
import { CATEGORIES } from "../i18n";
import { ListItem, Recipe } from "../types/shared";
import {
  categoryComparator,
  groupByCategory,
  sortByStoreOrder,
  sortRecipes,
} from "./sorting";

function makeItem(name: string, category: string): ListItem {
  return {
    id: name,
    foodItemId: `food-${name}`,
    name,
    category,
    unit: "pcs",
    quantity: 1,
    checked: false,
    addedAt: "2026-07-20T10:00:00.000Z",
  };
}

describe("sortByStoreOrder", () => {
  it("sorts items along the store's category order", () => {
    const items = [
      makeItem("Milk", "Dairy & Eggs"),
      makeItem("Bananas", "Fruits & Vegetables"),
      makeItem("Coffee", "Pantry"),
    ];
    const sorted = sortByStoreOrder(items, ["Pantry", "Dairy & Eggs", "Fruits & Vegetables"]);
    expect(sorted.map((i) => i.name)).toEqual(["Coffee", "Milk", "Bananas"]);
  });

  it("appends categories missing from the store order, in config order", () => {
    const items = [
      makeItem("Toothpaste", "Hygiene"),
      makeItem("Milk", "Dairy & Eggs"),
      makeItem("Ice cream", "Frozen"),
    ];
    const sorted = sortByStoreOrder(items, ["Dairy & Eggs"]);
    expect(sorted.map((i) => i.name)).toEqual(["Milk", "Ice cream", "Toothpaste"]);
  });

  it("puts entirely unknown categories last", () => {
    const items = [makeItem("Mystery item", "Unknown category"), makeItem("Milk", "Dairy & Eggs")];
    const sorted = sortByStoreOrder(items, ["Dairy & Eggs"]);
    expect(sorted.map((i) => i.name)).toEqual(["Milk", "Mystery item"]);
  });

  it("sorts alphabetically within a category", () => {
    const items = [
      makeItem("Cucumber", "Fruits & Vegetables"),
      makeItem("Bananas", "Fruits & Vegetables"),
      makeItem("Avocado", "Fruits & Vegetables"),
    ];
    const sorted = sortByStoreOrder(items, []);
    expect(sorted.map((i) => i.name)).toEqual(["Avocado", "Bananas", "Cucumber"]);
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
        makeItem("Milk", "Dairy & Eggs"),
        makeItem("Butter", "Dairy & Eggs"),
        makeItem("Bananas", "Fruits & Vegetables"),
      ],
      []
    );
    const groups = groupByCategory(sorted);
    expect(groups.map(([category, items]) => [category, items.length])).toEqual([
      ["Fruits & Vegetables", 1],
      ["Dairy & Eggs", 2],
    ]);
  });
});

describe("sortRecipes", () => {
  function makeRecipe(name: string, lastAddedToList?: string): Recipe {
    return {
      id: name,
      name,
      ingredients: [{ foodItemId: "f1", quantity: 1 }],
      createdAt: "2026-07-01T00:00:00.000Z",
      ...(lastAddedToList ? { lastAddedToList } : {}),
    };
  }

  const recipes = [
    makeRecipe("Tacos", "2026-07-20T10:00:00.000Z"),
    makeRecipe("Pancakes"),
    makeRecipe("Lasagna", "2026-07-28T10:00:00.000Z"),
    makeRecipe("Curry"),
  ];

  it("sorts alphabetically", () => {
    expect(sortRecipes(recipes, "alpha").map((r) => r.name)).toEqual([
      "Curry",
      "Lasagna",
      "Pancakes",
      "Tacos",
    ]);
  });

  it("sorts most recently added first, never-added last and alphabetical", () => {
    expect(sortRecipes(recipes, "recent").map((r) => r.name)).toEqual([
      "Lasagna",
      "Tacos",
      "Curry",
      "Pancakes",
    ]);
  });

  it("does not mutate the input array", () => {
    const input = [...recipes];
    sortRecipes(input, "recent");
    expect(input.map((r) => r.name)).toEqual(recipes.map((r) => r.name));
  });
});
