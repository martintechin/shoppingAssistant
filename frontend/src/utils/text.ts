import { LOCALE, SORT_LOCALE } from "../i18n";

export function normalize(value: string): string {
  return value.trim().toLocaleLowerCase(LOCALE);
}

export function matchRank(name: string, query: string): number {
  const normalizedName = normalize(name);
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return -1;
  if (normalizedName.startsWith(normalizedQuery)) return 0;
  if (normalizedName.includes(normalizedQuery)) return 1;
  return -1;
}

export function filterAndRank<T>(
  items: T[],
  query: string,
  getName: (item: T) => string,
  limit = 8
): T[] {
  return items
    .map((item) => ({ item, rank: matchRank(getName(item), query) }))
    .filter((entry) => entry.rank >= 0)
    .sort(
      (a, b) =>
        a.rank - b.rank || getName(a.item).localeCompare(getName(b.item), SORT_LOCALE)
    )
    .slice(0, limit)
    .map((entry) => entry.item);
}
