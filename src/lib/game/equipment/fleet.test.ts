import { describe, expect, it } from "vitest";
import { SLOTS, effectiveStats, fleetTotals, rollItem, salvageValue, upgradeCostSparks } from "./fleet";

const fixed = (v: number) => () => v;

describe("fleet equipment", () => {
  it("has six slots", () => expect(SLOTS).toHaveLength(6));

  it("rolls stat count by rarity and always includes the primary", () => {
    expect(Object.keys(rollItem(fixed(0.3), "a", "mining", "common").stats)).toEqual(["extraction"]);
    expect(Object.keys(rollItem(Math.random, "b", "shield", "legendary").stats)).toHaveLength(5);
  });

  it("common stat value is 5-10", () => {
    expect(rollItem(fixed(0), "a", "attackers", "common").stats.attack).toBe(5);
  });

  it("each level adds 10% to stats", () => {
    const item = { id: "x", slot: "attackers" as const, rarity: "common" as const, stats: { attack: 10 }, level: 3 };
    expect(effectiveStats(item).attack).toBe(12);
    expect(salvageValue(item)).toBe(12);
    expect(upgradeCostSparks(item)).toBe(18);
    expect(fleetTotals([item]).attack).toBe(12);
  });
});
