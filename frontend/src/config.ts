import { CATEGORIES, CATEGORY_COLORS, UNIT_STEPS } from "./i18n";

export const RECENTLY_BOUGHT_DAYS = 4;

export const REFRESH_INTERVAL = parseInt(
  import.meta.env.VITE_REFRESH_INTERVAL || "60000",
  10
);

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

export function getUnitStep(unit: string): number {
  return UNIT_STEPS[unit] ?? 1;
}

const FRACTIONAL_SEQUENCE = [0.25, 0.5, 1];

export function stepQuantity(unit: string, quantity: number, direction: "up" | "down"): number {
  const base = UNIT_STEPS[unit] ?? 1;
  if (base !== 1) {
    const next = direction === "up" ? quantity + base : quantity - base;
    return Math.round(next * 100) / 100;
  }
  if (direction === "up") {
    if (quantity < 1) {
      const next = FRACTIONAL_SEQUENCE.find((v) => v > quantity);
      return next ?? quantity + 1;
    }
    return quantity + 1;
  }
  if (quantity > 1) return quantity - 1;
  for (let i = FRACTIONAL_SEQUENCE.length - 1; i >= 0; i--) {
    if (FRACTIONAL_SEQUENCE[i] < quantity) return FRACTIONAL_SEQUENCE[i];
  }
  return quantity;
}

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
