import { describe, expect, it } from "vitest";
import { acceleratedFinish, dailyBoard, expeditionStats, requirementChecks, rewardFor, TIERS, type Mission } from "./rules";
import { STARTING_LEVELS } from "@/lib/game/station/buildings";
import { type Equipment } from "@/lib/game/equipment/fleet";
const mothership: Equipment = { id: "m", slot: "mothership", rarity: "common", level: 1, stats: { luck: 2 } };
const mission: Mission = { id: "mission", day: "2026-10-20", tier: 1, type: "defense" };
describe("expedition rules", () => {
  it("requires an equipped Mothership for every tier", () => {
    for (const tier of [1, 2, 3, 4, 5] as const) expect(requirementChecks({ ...mission, tier }, 100, { attack: 999, defense: 999, extraction: 999, luck: 999, evasion: 999, crit: 999 }, [])[0]?.ok).toBe(false);
  });
  it("uses only base facilities and supplied equipped gear", () => {
    expect(expeditionStats(STARTING_LEVELS, [mothership])).toEqual({ attack: 10, defense: 10, extraction: 1, luck: 2, evasion: 0, crit: 0 });
  });
  it("keeps the approved tier level, duration, draws, XP and fuel values", () => {
    expect(Object.values(TIERS).map((t) => [t.level, t.hours, t.draws, t.xp, t.fuel])).toEqual([[1, 1, 2, 150, 0], [10, 4, 3, 450, 15], [25, 12, 4, 1200, 40], [50, 24, 6, 2500, 100], [100, 48, 10, 6000, 250]]);
  });
  it("requires high stat for damage and item-only low stat for luck", () => {
    const stats = { attack: 9, defense: 10, extraction: 1, luck: 2, evasion: 0, crit: 0 };
    expect(requirementChecks({ ...mission, type: "combat" }, 1, stats, [mothership])[2]?.ok).toBe(false);
    expect(requirementChecks({ ...mission, type: "combat" }, 1, { ...stats, attack: 10 }, [mothership]).every((c) => c.ok)).toBe(true);
  });
  it("guarantees all three resources and XP for every tier", () => {
    for (const tier of [1, 2, 3, 4, 5] as const) { const reward = rewardFor({ ...mission, tier }, { primary: 10, secondary: 2 }, () => 0); expect([reward.items.titanium, reward.items.plasma, reward.items.rations]).toEqual(TIERS[tier].resources); expect(reward.xp).toBe(TIERS[tier].xp); expect(reward.draws).toBeGreaterThan(0); }
  });
  it("gives Rare+ equipment one guaranteed draw and level 21 another", () => {
    const base = rewardFor(mission, { primary: 10, secondary: 0 }, () => 0.5).draws;
    expect(rewardFor(mission, { primary: 10, secondary: 0, item: { ...mothership, rarity: "rare" } }, () => 0.5).draws).toBe(base + 1);
    expect(rewardFor(mission, { primary: 10, secondary: 0, item: { ...mothership, rarity: "legendary", level: 21 } }, () => 0.5).draws).toBe(base + 2);
  });
  it("never awards Epic or Legendary shards on T1", () => { const reward = rewardFor(mission, { primary: 10, secondary: 2 }, () => 0.999); expect(reward.items["shard-epic"]).toBeUndefined(); expect(reward.items["shard-legendary"]).toBeUndefined(); expect(reward.items["shard-rare"]).toBeGreaterThan(0); });
  it("refreshes a six-mission shared board at midnight UTC", () => {
    const board = dailyBoard(Date.parse("2026-10-20T01:00:00Z")); expect(board).toHaveLength(6); expect(dailyBoard(Date.parse("2026-10-20T23:59:59Z"))).toEqual(board); expect(dailyBoard(Date.parse("2026-10-21T00:00:00Z"))).not.toEqual(board);
  });
  it("halves remaining travel, or finishes trips within 15 minutes", () => { expect(acceleratedFinish(0, 3600000)).toBe(1800000); expect(acceleratedFinish(1000, 901000)).toBe(1000); });
});