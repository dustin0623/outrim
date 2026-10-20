import { describe, expect, it } from "vitest";
import { CRATE_IDS, CRATE_RARITY, crateOdds, rollCrateRarity } from "./chests";
import { RARITIES } from "@/lib/game/equipment/fleet";
describe("five crate rarities", () => {
  it("never rolls below a crate's minimum rarity", () => { for (const id of CRATE_IDS) for (const random of [0, 0.3, 0.7, 0.999]) expect(RARITIES.indexOf(rollCrateRarity(id, () => random))).toBeGreaterThanOrEqual(RARITIES.indexOf(CRATE_RARITY[id])); });
  it("preserves Common crate odds and normalizes each higher pool", () => { expect(crateOdds("equipment-crate").map((o) => o.percent)).toEqual([70, 20, 8, 1.7999999999999998, 0.2]); for (const id of CRATE_IDS) expect(crateOdds(id).reduce((n, o) => n + o.percent, 0)).toBeCloseTo(100); });
});