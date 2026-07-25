import { LOCALE } from "../config";

/** Whole days since the given ISO timestamp; Infinity for missing/invalid input. */
export function daysSince(iso: string | undefined): number {
  if (!iso) return Infinity;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return Infinity;
  return Math.floor((Date.now() - then) / 86_400_000);
}

/** "idag", "igår", "för 2 dagar sedan" … empty string for missing input. */
export function formatRelativeDays(iso: string | undefined): string {
  const days = daysSince(iso);
  if (!Number.isFinite(days)) return "";
  if (days <= 0) return "idag";
  if (days === 1) return "igår";
  return new Intl.RelativeTimeFormat(LOCALE, { numeric: "always" }).format(-days, "day");
}

export function formatDate(iso: string | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(LOCALE);
}
