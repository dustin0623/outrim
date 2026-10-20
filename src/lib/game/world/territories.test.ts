import { describe, expect, it } from "vitest";
import { TERRITORIES, territoryAt, territoryTiles } from "./territories";
import { HOME, PROTOTYPE_SITES } from "./hex";
import { generateWorlds } from "./generation";

describe("territories", () => {
  it("outposts occupy 7 tiles and the Federation Station 19", () => {
    for (const t of TERRITORIES) expect(territoryTiles(t)).toHaveLength(t.kind === "outpost" ? 7 : 19);
    expect(TERRITORIES.filter((t) => t.kind === "outpost")).toHaveLength(4);
  });
  it("Federation Station sits at the world center", () => {
    expect(territoryAt({ q: 125, r: 125 })?.id).toBe("federation");
  });
  it("stations and worlds never overlap territories", () => {
    for (const s of [HOME, ...PROTOTYPE_SITES]) expect(territoryAt(s)).toBeNull();
    for (const w of generateWorlds(Date.UTC(2026, 9, 20))) expect(territoryAt(w)).toBeNull();
  });
});
