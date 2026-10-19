import { describe, expect, it } from "vitest";
import { RARITIES, RARITY_META, SLOTS, rollItem, rollRarity, salvageValue, upgradeCostSparks, upgradedStats } from "./fleet";

const fixed = (v: number) => () => v;

describe("fleet equipment (reference formulas)", () => {
  it("has six slots", () => expect(SLOTS).toHaveLength(6));

  it("crate odds total 100% at 70/20/8/1.8/0.2", () => {
    expect(RARITIES.map((r) => RARITY_META[r].odds)).toEqual([70, 20, 8, 1.8, 0.2]);
    expect(rollRarity(fixed(0.69))).toBe("common");
    expect(rollRarity(fixed(0.7))).toBe("uncommon");
    expect(rollRarity(fixed(0.979))).toBe("rare");
    expect(rollRarity(fixed(0.9979))).toBe("epic");
    expect(rollRarity(fixed(0.9981))).toBe("legendary");
  });

  it("stat count equals rarity index and includes the slot's primary", () => {
    expect(Object.keys(rollItem(fixed(0.3), "a", "mining", "common").stats)).toEqual(["extraction"]);
    expect(Object.keys(rollItem(Math.random, "b", "shield", "legendary").stats)).toHaveLength(6);
  });

  it("values roll in [0.1·index, index], combat stats x10", () => {
    expect(rollItem(fixed(0), "a", "mining", "common").stats.extraction).toBe(0.1);
    expect(rollItem(fixed(0), "a", "attackers", "common").stats.attack).toBe(1);
  });

  it("salvage, forge cost and x1.05 upgrade match reference", () => {
    const item = { id: "x", slot: "mothership" as const, rarity: "common" as const, stats: { luck: 1, attack: 10 }, level: 2 };
    expect(salvageValue(item)).toBe(15);
    expect(upgradeCostSparks(item)).toBe(1.49);
    expect(upgradedStats(item.stats)).toEqual({ luck: 1.05, attack: 10.5 });
  });
});
