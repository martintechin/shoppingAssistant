import { CATEGORIES, ListItem } from "../types/shared";

/**
 * Comparator over category labels for a given store walking order. Categories
 * missing from the store's order (e.g. added to the config after the store was
 * created) are appended in config order; entirely unknown labels go last.
 */
export function categoryComparator(order: string[]): (a: string, b: string) => number {
  const merged = [
    ...order,
    ...CATEGORIES.filter((category) => !order.includes(category)),
  ];
  const index = new Map(merged.map((category, i) => [category, i]));
  return (a, b) => {
    const indexA = index.get(a);
    const indexB = index.get(b);
    if (indexA !== undefined && indexB !== undefined) return indexA - indexB;
    if (indexA !== undefined) return -1;
    if (indexB !== undefined) return 1;
    return a.localeCompare(b, "sv");
  };
}

/** Sort list items along the store's route; alphabetical within a category. */
export function sortByStoreOrder(items: ListItem[], categoryOrder: string[]): ListItem[] {
  const compareCategories = categoryComparator(categoryOrder);
  return [...items].sort(
    (a, b) =>
      compareCategories(a.category, b.category) || a.name.localeCompare(b.name, "sv")
  );
}

/** Group already-sorted items into [category, items[]] runs for rendering. */
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
