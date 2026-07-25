import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { daysSince, formatRelativeDays, formatDate } from "./dates";

describe("dates", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-25T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts whole days since a timestamp", () => {
    expect(daysSince("2026-07-25T08:00:00.000Z")).toBe(0);
    expect(daysSince("2026-07-24T12:00:00.000Z")).toBe(1);
    expect(daysSince("2026-07-23T11:00:00.000Z")).toBe(2);
  });

  it("returns Infinity for missing or invalid input", () => {
    expect(daysSince(undefined)).toBe(Infinity);
    expect(daysSince("not-a-date")).toBe(Infinity);
  });

  it("formats relative days in Swedish", () => {
    expect(formatRelativeDays("2026-07-25T08:00:00.000Z")).toBe("idag");
    expect(formatRelativeDays("2026-07-24T12:00:00.000Z")).toBe("igår");
    expect(formatRelativeDays("2026-07-23T11:00:00.000Z")).toBe("för 2 dagar sedan");
    expect(formatRelativeDays(undefined)).toBe("");
  });

  it("formats absolute dates with the Swedish locale", () => {
    expect(formatDate("2026-07-01T10:00:00.000Z")).toBe("2026-07-01");
    expect(formatDate(undefined)).toBe("");
  });
});
