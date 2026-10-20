import { describe, expect, it } from "vitest";
import { calculateShipBatchCost, calculateShipTotals, combinedFleetTotals } from "./rules";

describe("ship rules", () => {
  it("charges 120 Titanium and 60 Plasma per Striker without RIM", () => expect(calculateShipBatchCost("vanguard-striker", 3)).toEqual({ rim: 0, titanium: 360, plasma: 180, rations: 0 }));
  it("charges 140 Titanium and 50 Rations per Frigate without RIM", () => expect(calculateShipBatchCost("bulwark-frigate", 2)).toEqual({ rim: 0, titanium: 280, plasma: 0, rations: 100 }));
  it("adds 15 attack per Striker", () => expect(calculateShipTotals({ "vanguard-striker": 3, "bulwark-frigate": 0 }).attack).toBe(45));
  it("adds 15 defense per Frigate", () => expect(calculateShipTotals({ "vanguard-striker": 0, "bulwark-frigate": 2 }).defense).toBe(30));
  it("accepts at most 25 whole ships per order", () => {
    expect(calculateShipBatchCost("vanguard-striker", 25)?.titanium).toBe(3000);
    for (const quantity of [0, -1, 26, 1.5, NaN, Infinity]) expect(calculateShipBatchCost("vanguard-striker", quantity)).toBeNull();
  });
  it("adds ships to hardware without altering other stats", () => {
    const result = combinedFleetTotals([{ id: "test", slot: "attackers", rarity: "common", level: 1, stats: { attack: 12, luck: 1 } }], { "vanguard-striker": 2, "bulwark-frigate": 1 });
    expect(result).toMatchObject({ attack: 42, defense: 15, luck: 1 });
  });
});