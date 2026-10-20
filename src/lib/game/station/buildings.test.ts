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
  it("Tribute Office charges only RIM", () => expect(upgradeCost("tribute", 2)).toEqual({ rim: 4, titanium: 0, plasma: 0, rations: 0 }));
  it("Titanium Extractor charges only RIM and Titanium", () => expect(upgradeCost("titanium", 2)).toEqual({ rim: 4, titanium: 400, plasma: 0, rations: 0 }));
  it("Plasma Condenser charges only RIM and Plasma", () => expect(upgradeCost("plasma", 2)).toEqual({ rim: 4, titanium: 0, plasma: 400, rations: 0 }));
  it("Vault/Attack/Defense charge 100 x level² of every resource", () => expect(upgradeCost("defense", 2)).toEqual({ rim: 4, titanium: 400, plasma: 400, rations: 400 }));
  it("Ration Synthesizer charges only RIM and Rations", () => expect(upgradeCost("rations", 2)).toEqual({ rim: 4, titanium: 0, plasma: 0, rations: 400 }));
});
