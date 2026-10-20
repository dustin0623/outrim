import { describe, expect, it } from "vitest";
import { freeVault, raidChance, RAID_FUEL, raidStats, resolveRaid, ZERO_LOOT } from "./rules";
import { STARTING_LEVELS } from "@/lib/game/station/buildings";
import type { Rng } from "@/lib/game/equipment/fleet";

const stub = (values: number[]): Rng => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe("raid odds", () => {
  it("is zero when attack does not beat defense", () => {
    expect(raidChance(10, 10)).toBe(0);
    expect(raidChance(5, 10)).toBe(0);
  });
  it("scales with the attack lead and clamps to 10-100", () => {
    expect(raidChance(60, 50)).toBe(70);
    expect(raidChance(100, 10)).toBe(100);
    expect(raidChance(60, 59)).toBe(52);
  });
  it("uses 10 plasma fuel per raid", () => {
    expect(RAID_FUEL).toBe(10);
  });
});

describe("free vault space", () => {
  it("subtracts secured and exposed from capacity, never below zero", () => {
    const free = freeVault({ rim: 10, titanium: 1000, plasma: 1000, rations: 1000 }, { rim: 4, titanium: 100, plasma: 100, rations: 100 }, { rim: 6, titanium: 950, plasma: 950, rations: 950 });
    expect(free).toEqual({ rim: 0, titanium: 50, plasma: 50, rations: 50 });
  });
});

describe("raid resolution", () => {
  const attacker = { attack: 60, defense: 40, crit: 50 };
  const defender = { attack: 20, defense: 50, crit: 0 };
  const exposed = { rim: 5, titanium: 1000, plasma: 500, rations: 500 };
  const free = { rim: 10, titanium: 1000, plasma: 1000, rations: 1000 };

  it("repels when the success roll misses the odds", () => {
    const outcome = resolveRaid(attacker, defender, exposed, free, stub([0.9, 0, 0]));
    expect(outcome).toMatchObject({ success: false, reason: "repelled", loot: ZERO_LOOT });
  });
  it("is outmatched when attack cannot beat defense", () => {
    const outcome = resolveRaid({ ...attacker, attack: 10 }, defender, exposed, free, stub([0, 0, 0]));
    expect(outcome).toMatchObject({ success: false, reason: "outmatched" });
  });
  it("plunders a 15-30% cut of exposed stores within free vault space on victory", () => {
    // exposure roll 0.5 -> base exposure 0.225, critical roll 0.9 -> no crit.
    const outcome = resolveRaid(attacker, defender, exposed, free, stub([0.5, 0.5, 0.9]));
    expect(outcome.success).toBe(true);
    expect(outcome.exposure).toBeCloseTo(0.225, 5);
    expect(outcome.loot.titanium).toBeCloseTo(1000 * 0.225, 5);
    expect(outcome.loot.plasma).toBeCloseTo(500 * 0.225, 5);
    expect(outcome.loot.rim).toBeCloseTo(5 * 0.225, 2);
  });
  it("doubles exposure on a critical breach", () => {
    const outcome = resolveRaid(attacker, defender, exposed, free, stub([0.5, 0.5, 0.4]));
    expect(outcome.critical).toBe(true);
    expect(outcome.exposure).toBeCloseTo(0.45, 5);
  });
  it("caps plunder at free vault space, not the target's stores", () => {
    const tight = { rim: 10, titanium: 50, plasma: 50, rations: 50 };
    const outcome = resolveRaid(attacker, defender, exposed, tight, stub([0.5, 0.5, 0.9]));
    expect(outcome.loot.titanium).toBeLessThanOrEqual(50);
    expect(outcome.loot.plasma).toBeLessThanOrEqual(50);
  });
  it("keeps starting-station targets hittable with mid-game stats", () => {
    // starting levels attack 1 * 10 vs defense 1 * 10 -> outmatched without gear.
    expect(raidStats(STARTING_LEVELS, []).attack).toBe(10);
    expect(raidStats(STARTING_LEVELS, []).defense).toBe(10);
  });
});
