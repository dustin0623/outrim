import { describe, expect, it } from "vitest";
import { bossBoard, fightBoss } from "./bosses";
const mission = bossBoard(Date.parse("2026-10-20T04:00Z"))[0];
const stats = { attack: 10, defense: 10, extraction: 1, luck: 2, evasion: 0, crit: 0 };
describe("boss encounters", () => {
  it("provides one daily destination for each of the five tiers", () => {
    expect(bossBoard(0).map((m) => m.tier)).toEqual([1, 2, 3, 4, 5]);
    expect(bossBoard(0)[0]?.id).not.toBe(bossBoard(86400000)[0]?.id);
  });
  it("lets starter combat stats defeat the first boss in bounded combat", () => {
    if (!mission) throw new Error("Missing boss");
    const report = fightBoss(mission, stats, () => 0.5);
    expect(report?.won).toBe(true); expect(report?.rounds).toHaveLength(8);
    expect(report?.rounds.at(-1)?.bossHp).toBe(0);
  });
  it("reports retreat rather than an endless battle for insufficient damage", () => {
    if (!mission) throw new Error("Missing boss");
    const report = fightBoss(mission, { ...stats, attack: 0, defense: 0 }, () => 0.5);
    expect(report?.won).toBe(false); expect(report?.rounds.length).toBeLessThanOrEqual(20);
  });
});