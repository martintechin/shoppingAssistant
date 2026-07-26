import { LOCALE, t } from "../i18n";

export function daysSince(iso: string | undefined): number {
  if (!iso) return Infinity;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return Infinity;
  return Math.floor((Date.now() - then) / 86_400_000);
}

export function formatRelativeDays(iso: string | undefined): string {
  const days = daysSince(iso);
  if (!Number.isFinite(days)) return "";
  if (days <= 0) return t("date.today");
  if (days === 1) return t("date.yesterday");
  return new Intl.RelativeTimeFormat(LOCALE, { numeric: "always" }).format(-days, "day");
}

export function formatDate(iso: string | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(LOCALE);
}
