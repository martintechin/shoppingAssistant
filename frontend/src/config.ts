import { CATEGORIES } from "./types/shared";

export const LOCALE = "sv-SE";

/** Items bought within this many days trigger the duplicate-purchase warning. */
export const RECENTLY_BOUGHT_DAYS = 4;

export const REFRESH_INTERVAL = parseInt(
  import.meta.env.VITE_REFRESH_INTERVAL || "60000",
  10
);

const CATEGORY_COLORS: Record<string, string> = {
  "Frukt & Grönt": "#388e3c",
  "Bröd & Bageri": "#8d6e63",
  "Mejeri & Ägg": "#1976d2",
  "Kött & Fågel": "#d32f2f",
  "Fisk & Skaldjur": "#0288d1",
  Skafferi: "#f57c00",
  Fryst: "#00acc1",
  Dryck: "#7b1fa2",
  "Godis & Snacks": "#e91e63",
  Hushåll: "#5d4037",
  Hygien: "#00897b",
  Övrigt: "#616161",
};

const DYNAMIC_PALETTE = [
  "#ef6c00", "#5e35b1", "#c62828", "#00838f",
  "#2e7d32", "#ad1457", "#4527a0", "#00695c",
  "#bf360c", "#1565c0", "#827717", "#6a1b9a",
];

let dynamicIndex = 0;
const assignedColors: Record<string, string> = {};

export function getCategoryColor(category: string): string {
  if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
  if (!assignedColors[category]) {
    assignedColors[category] = DYNAMIC_PALETTE[dynamicIndex % DYNAMIC_PALETTE.length];
    dynamicIndex++;
  }
  return assignedColors[category];
}

/** Quantity stepper increments per unit — stepping 100 g beats tapping +1 g. */
const UNIT_STEPS: Record<string, number> = {
  st: 1,
  förp: 1,
  kg: 0.5,
  l: 0.5,
  dl: 1,
  g: 100,
};

export function getUnitStep(unit: string): number {
  return UNIT_STEPS[unit] ?? 1;
}

/** Default quantity when adding an item with a given unit. */
export function getDefaultQuantity(unit: string): number {
  return getUnitStep(unit);
}

export function getAllCategories(foodItemCategories: string[]): string[] {
  const seen = new Set<string>(CATEGORIES);
  const extra: string[] = [];
  for (const cat of foodItemCategories) {
    if (cat && !seen.has(cat)) {
      seen.add(cat);
      extra.push(cat);
    }
  }
  return [...CATEGORIES, ...extra];
}

export { CATEGORIES };
