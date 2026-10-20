import { describe, expect, it } from "vitest";
import { HOME, PROTOTYPE_SITES } from "./hex";
import { pixelToSector, sectorToPixel, spaceObjectAt } from "./space";
import { generateWorlds } from "./generation";
import { dailyBoard } from "@/lib/game/expeditions/rules";
import { bossBoard } from "@/lib/game/expeditions/bosses";

const NOW = Date.UTC(2026, 9, 20, 8);

describe("space world", () => {
  it("places the player's station in their home sector", () => {
    expect(spaceObjectAt(HOME, NOW)).toMatchObject({ kind: "station", variant: "own" });
  });
  it("links every rival station to a raid target", () => {
    for (const s of PROTOTYPE_SITES.filter((s) => s.kind === "rival")) expect(spaceObjectAt(s, NOW)?.targetId).toBeTruthy();
  });
  it("generates one world per mission on today's boards, each on its own sector", () => {
    const worlds = generateWorlds(NOW);
    expect(worlds).toHaveLength(dailyBoard(NOW).length + bossBoard(NOW).length);
    expect(new Set(worlds.map((w) => `${w.q},${w.r}`)).size).toBe(worlds.length);
    for (const w of worlds) expect(spaceObjectAt(w, NOW)).toMatchObject({ kind: "planet", missionId: w.missionId });
  });
  it("is deterministic per day", () => {
    expect(generateWorlds(NOW)).toEqual(generateWorlds(NOW + 3600000));
  });
  it("round-trips isometric hex picking throughout the bounded map", () => {
    for (const h of [HOME, { q: 0, r: 0 }, { q: 249, r: 249 }]) {
      const p = sectorToPixel(h);
      expect(pixelToSector(p.x, p.y)).toEqual(h);
    }
  });
  it("does not place objects outside the world", () => {
    expect(spaceObjectAt({ q: 250, r: 125 }, NOW)).toBeNull();
  });
});
