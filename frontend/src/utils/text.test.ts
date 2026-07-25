import { describe, it, expect } from "vitest";
import { filterAndRank, matchRank, normalize } from "./text";

describe("normalize", () => {
  it("lowercases with Swedish locale and trims", () => {
    expect(normalize("  MJÖLK ")).toBe("mjölk");
    expect(normalize("ÄPPLEN")).toBe("äpplen");
  });
});

describe("matchRank", () => {
  it("ranks prefix matches highest", () => {
    expect(matchRank("Mjölk", "mjö")).toBe(0);
  });

  it("ranks substring matches second", () => {
    expect(matchRank("Havremjölk", "mjölk")).toBe(1);
  });

  it("returns -1 for no match and for empty queries", () => {
    expect(matchRank("Mjölk", "ost")).toBe(-1);
    expect(matchRank("Mjölk", "  ")).toBe(-1);
  });
});

describe("filterAndRank", () => {
  const items = [
    { name: "Havremjölk" },
    { name: "Mjölk" },
    { name: "Mellanmjölk" },
    { name: "Smör" },
  ];

  it("puts prefix matches before substring matches", () => {
    const result = filterAndRank(items, "mjöl", (i) => i.name);
    expect(result.map((i) => i.name)).toEqual(["Mjölk", "Havremjölk", "Mellanmjölk"]);
  });

  it("is case-insensitive for Swedish characters", () => {
    const result = filterAndRank(items, "MJÖLK", (i) => i.name);
    expect(result.map((i) => i.name)).toContain("Mjölk");
  });

  it("caps the number of results", () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ name: `Mjölk ${i}` }));
    expect(filterAndRank(many, "mjölk", (i) => i.name, 8)).toHaveLength(8);
  });
});
