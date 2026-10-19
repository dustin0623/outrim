import { describe, expect, it } from "vitest";
import { STARTING_LEVELS, upgradeBlock, upgradeCost } from "./buildings";

describe("station upgrades", () => {
  it("Extractor 1→2 costs 320 Alloy", () => expect(upgradeCost("extractor", 2)).toBe(320));
  it("modules cannot exceed the Command Rig level", () => expect(upgradeBlock("extractor", STARTING_LEVELS, 10000)).toBe("hq"));
  it("Defense Array 0→1 is allowed at Command Rig 1", () => expect(upgradeBlock("defense", STARTING_LEVELS, 500)).toBeNull());
  it("blocks when Alloy is short", () => expect(upgradeBlock("hq", STARTING_LEVELS, 479)).toBe("alloy"));
  it("stops at level 10", () => expect(upgradeBlock("hq", { ...STARTING_LEVELS, hq: 10 }, 1e9)).toBe("max"));
});
