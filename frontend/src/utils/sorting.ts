import { ListItem, Recipe } from "../types/shared";
import { CATEGORIES, SORT_LOCALE } from "../i18n";

export function categoryComparator(
  order: string[],
  allCategories: string[] = CATEGORIES
): (a: string, b: string) => number {
  const merged = [
    ...order,
    ...allCategories.filter((category) => !order.includes(category)),
  ];
  const index = new Map(merged.map((category, i) => [category, i]));
  return (a, b) => {
    const indexA = index.get(a);
    const indexB = index.get(b);
    if (indexA !== undefined && indexB !== undefined) return indexA - indexB;
    if (indexA !== undefined) return -1;
    if (indexB !== undefined) return 1;
    return a.localeCompare(b, SORT_LOCALE);
  };
}

export function sortByStoreOrder(items: ListItem[], categoryOrder: string[]): ListItem[] {
  const compareCategories = categoryComparator(categoryOrder);
  return [...items].sort(
    (a, b) =>
      compareCategories(a.category, b.category) || a.name.localeCompare(b.name, SORT_LOCALE)
  );
}

export type RecipeSortMode = "alpha" | "recent";

/**
 * "alpha" sorts by name; "recent" puts the most recently shopped-for recipes
 * first and parks the never-shopped ones at the bottom, alphabetically.
 */
export function sortRecipes(recipes: Recipe[], mode: RecipeSortMode): Recipe[] {
  const byName = (a: Recipe, b: Recipe) => a.name.localeCompare(b.name, SORT_LOCALE);
  if (mode === "alpha") return [...recipes].sort(byName);
  return [...recipes].sort((a, b) => {
    const addedA = a.lastAddedToList ?? "";
    const addedB = b.lastAddedToList ?? "";
    if (addedA && addedB) return addedB.localeCompare(addedA) || byName(a, b);
    if (addedA) return -1;
    if (addedB) return 1;
    return byName(a, b);
  });
}

export function groupByCategory(items: ListItem[]): Array<[string, ListItem[]]> {
  const groups: Array<[string, ListItem[]]> = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last[0] === item.category) {
      last[1].push(item);
    } else {
      groups.push([item.category, [item]]);
    }
  }
  return groups;
}
