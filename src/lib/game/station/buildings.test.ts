import { describe, expect, it } from "vitest";
import { BUILDINGS, STARTING_BALANCE, canAfford, upgradeCost } from "./buildings";

describe("station upgrades", () => {
  it("has exactly four upgradable stats", () => expect(BUILDINGS.map((b) => b.id)).toEqual(["vault", "mining", "attack", "defense"]));
  it("RIM cost is max(1, level²)", () => {
    expect(upgradeCost("mining", 0).rim).toBe(1);
    expect(upgradeCost("mining", 1).rim).toBe(1);
    expect(upgradeCost("mining", 4).rim).toBe(16);
  });
  it("level 1 is affordable with the starting balance", () => expect(canAfford(STARTING_BALANCE, upgradeCost("vault", 1))).toBe(true));
  it("blocks when RIM is short", () => expect(canAfford({ ...STARTING_BALANCE, rim: 0 }, upgradeCost("attack", 1))).toBe(false));
});
