import { describe, expect, it } from "vitest";
import { STARTING_LEVELS } from "./buildings";
import { exposedYield, vaultCap } from "./economy";

const HOUR = 3_600_000;

describe("resource economy", () => {
  it("level-1 facilities produce 1 RIM, 100 Ti, 100 Plasma, 100 Rations per hour", () => {
    expect(exposedYield(STARTING_LEVELS, 0, HOUR)).toEqual({ rim: 1, titanium: 100, plasma: 100, rations: 100 });
  });
  it("each facility only drives its own resource", () => {
    expect(exposedYield({ ...STARTING_LEVELS, plasma: 3 }, 0, HOUR)).toEqual({ rim: 1, titanium: 100, plasma: 300, rations: 100 });
  });
  it("Vault 1 caps at 10 RIM and 1,000 per resource", () => {
    expect(vaultCap(STARTING_LEVELS)).toEqual({ rim: 10, titanium: 1000, plasma: 1000, rations: 1000 });
    expect(exposedYield(STARTING_LEVELS, 0, 1000 * HOUR).rim).toBe(10);
  });
});
