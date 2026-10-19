import { describe, expect, it } from "vitest";
import { STARTING_LEVELS } from "./buildings";
import { exposedYield, storehouseCap } from "./economy";

const HOUR = 3_600_000;

describe("resource economy", () => {
  it("Extractor 1 produces 60 Alloy per hour", () => {
    expect(exposedYield(STARTING_LEVELS, 0, HOUR)).toBe(60);
  });
  it("produces nothing before an hour of elapsed fractions accumulate", () => {
    expect(exposedYield(STARTING_LEVELS, 0, HOUR / 2)).toBe(30);
  });
  it("Extractor 0 produces nothing", () => {
    expect(exposedYield({ ...STARTING_LEVELS, extractor: 0 }, 0, 100 * HOUR)).toBe(0);
  });
  it("Storehouse caps exposed Alloy at 1,000 × level", () => {
    expect(storehouseCap(STARTING_LEVELS)).toBe(1000);
    expect(exposedYield(STARTING_LEVELS, 0, 1000 * HOUR)).toBe(1000);
  });
});
