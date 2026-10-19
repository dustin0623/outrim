import { describe, expect, it } from "vitest";
import { HOME } from "./hex";
import { pixelToSector, sectorToPixel, spaceObjectAt } from "./space";

describe("space world", () => {
  it("places the player's station in their home sector", () => {
    expect(spaceObjectAt(HOME)).toMatchObject({ kind: "station", variant: "own", resource: null });
  });
  it("uses planets as gathering destinations", () => {
    expect(spaceObjectAt({ q: 127, r: 123 })).toMatchObject({ kind: "planet", variant: "ocean", resource: "Boss encounter" });
    expect(spaceObjectAt({ q: 123, r: 124 })).toMatchObject({ kind: "planet", variant: "mineral", resource: "Boss encounter" });
  });
  it("round-trips isometric hex picking throughout the bounded map", () => {
    for (const h of [HOME, { q: 0, r: 0 }, { q: 249, r: 249 }]) {
      const p = sectorToPixel(h);
      expect(pixelToSector(p.x, p.y)).toEqual(h);
    }
  });
  it("does not place objects outside the world", () => {
    expect(spaceObjectAt({ q: 250, r: 125 })).toBeNull();
  });
});