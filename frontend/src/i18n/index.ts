import en from "./en";
import sv from "./sv";

export interface Language {
  locale: string;
  sortLocale: string;
  categories: string[];
  units: string[];
  unitSteps: Record<string, number>;
  categoryColors: Record<string, string>;
  ui: Record<string, string>;
}

const LANGUAGES: Record<string, Language> = { en, sv };

const lang: Language = LANGUAGES[import.meta.env.VITE_LANGUAGE || "en"] ?? en;

export const LOCALE = lang.locale;
export const SORT_LOCALE = lang.sortLocale;
export const CATEGORIES = lang.categories;
export const UNITS = lang.units;
export const UNIT_STEPS = lang.unitSteps;
export const CATEGORY_COLORS = lang.categoryColors;

export function t(key: string, params?: Record<string, string | number>): string {
  let str = lang.ui[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(`{${k}}`, String(v));
    }
  }
  return str;
}
