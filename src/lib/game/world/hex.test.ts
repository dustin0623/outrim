import { describe, it, expect } from "vitest";
import { hexDistance, hexToPixel, pixelToHex, terrainAt, inBounds, WORLD_SIZE } from "./hex";

describe("hex world", () => {
  it("uses the axial distance formula", () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 3, r: -1 })).toBe(3);
    expect(hexDistance({ q: 2, r: 2 }, { q: 0, r: 5 })).toBe(3);
  });
  it("has a 250x250 bounded world", () => {
    expect(WORLD_SIZE * WORLD_SIZE).toBe(62500);
    expect(inBounds({ q: 249, r: 249 })).toBe(true);
    expect(inBounds({ q: 250, r: 0 })).toBe(false);
  });
  it("round-trips pixel conversion", () => {
    const p = hexToPixel({ q: 40, r: 17 }, 30);
    expect(pixelToHex(p.x, p.y, 30)).toEqual({ q: 40, r: 17 });
  });
  it("generates deterministic terrain", () => {
    expect(terrainAt(10, 20, 3)).toBe(terrainAt(10, 20, 3));
  });
});
