import { describe, expect, it } from "vitest";
import { BUILDINGS, STARTING_BALANCE, canAfford, upgradeCost } from "./buildings";

describe("station facilities", () => {
  it("has independent production facilities plus vault, attack, defense", () =>
    expect(BUILDINGS.map((b) => b.id)).toEqual(["tribute", "titanium", "plasma", "rations", "vault", "attack", "defense"]));
  it("RIM cost is max(1, level²)", () => {
    expect(upgradeCost("tribute", 0).rim).toBe(1);
    expect(upgradeCost("tribute", 1).rim).toBe(1);
    expect(upgradeCost("plasma", 4).rim).toBe(16);
  });
  it("level 1 is affordable with the starting balance", () => expect(canAfford(STARTING_BALANCE, upgradeCost("vault", 1))).toBe(true));
  it("blocks when RIM is short", () => expect(canAfford({ ...STARTING_BALANCE, rim: 0 }, upgradeCost("attack", 1))).toBe(false));
});
