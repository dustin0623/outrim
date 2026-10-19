import { describe, expect, it } from "vitest";
import { STARTING_LEVELS } from "./buildings";
import { exposedYield, vaultCap } from "./economy";

const HOUR = 3_600_000;

describe("resource economy", () => {
  it("Mining 1 produces 1 RIM, 40 Ti, 20 Plasma, 25 Food per hour", () => {
    expect(exposedYield(STARTING_LEVELS, 0, HOUR)).toEqual({ rim: 1, titanium: 40, plasma: 20, food: 25 });
  });
  it("Vault 1 caps at 10 RIM and 1,000 per resource", () => {
    expect(vaultCap(STARTING_LEVELS)).toEqual({ rim: 10, titanium: 1000, plasma: 1000, food: 1000 });
    expect(exposedYield(STARTING_LEVELS, 0, 1000 * HOUR).rim).toBe(10);
  });
});
