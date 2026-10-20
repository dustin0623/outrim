import { describe, expect, it } from "vitest";
import { calculateTroopBatchCost, calculateTroopTotals, combinedFleetTotals, EMPTY_TROOPS, TROOP_CATALOG, TROOP_TYPES, troopsIn } from "./rules";

describe("troop rules", () => {
  it("has three ground units and three ships", () => {
    expect(troopsIn("ground")).toEqual(["soldier", "archer", "cavalry"]);
    expect(troopsIn("ship")).toHaveLength(3);
  });
  it("never charges RIM", () => { for (const t of TROOP_TYPES) expect(TROOP_CATALOG[t].cost.rim).toBe(0); });
  it("multiplies Soldier cost by quantity", () => expect(calculateTroopBatchCost("soldier", 3)).toEqual({ rim: 0, titanium: 90, plasma: 0, rations: 120 }));
  it("rejects invalid quantities", () => { for (const q of [0, -1, 26, 1.5, NaN]) expect(calculateTroopBatchCost("archer", q)).toBeNull(); });
  it("sums attack and defense across units", () => expect(calculateTroopTotals({ ...EMPTY_TROOPS, soldier: 2, "vanguard-striker": 1 })).toEqual({ attack: 31, defense: 15 }));
  it("adds troops to hardware stats", () => {
    const r = combinedFleetTotals([{ id: "x", slot: "attackers", rarity: "common", level: 1, stats: { attack: 12, luck: 1 } }], { ...EMPTY_TROOPS, cavalry: 1 });
    expect(r).toMatchObject({ attack: 21, defense: 6, luck: 1 });
  });
});
