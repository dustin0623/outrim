import { describe, expect, it } from "vitest";
import { STARTING_LEVELS } from "./buildings";
import { exposedYield, vaultCap } from "./economy";

const HOUR = 3_600_000;

describe("resource economy", () => {
  it("level-1 facilities produce 1 RIM, 60 Ti, 30 Plasma, 45 Rations per hour", () => {
    expect(exposedYield(STARTING_LEVELS, 0, HOUR)).toEqual({ rim: 1, titanium: 60, plasma: 30, rations: 45 });
  });
  it("each facility only drives its own resource", () => {
    expect(exposedYield({ ...STARTING_LEVELS, plasma: 3 }, 0, HOUR)).toEqual({ rim: 1, titanium: 60, plasma: 90, rations: 45 });
  });
  it("Vault 1 caps at 10 RIM and 1,500 per resource", () => {
    expect(vaultCap(STARTING_LEVELS)).toEqual({ rim: 10, titanium: 1500, plasma: 1500, rations: 1500 });
    expect(exposedYield(STARTING_LEVELS, 0, 1000 * HOUR).rim).toBe(10);
  });
});
