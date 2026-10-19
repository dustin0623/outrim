/** Pure resource economy rules (GDD §4): Extractor produces Exposed Alloy over time; Secure Haul moves it into the spendable Secured vault. */
import type { BuildingLevels } from "./buildings";

export const EXTRACTOR_RATE_PER_LEVEL = 60; // Alloy per hour
export const STOREHOUSE_CAP_PER_LEVEL = 1000; // Exposed Alloy capacity

/** Exposed Alloy produced since `lastCollectedAt`, capped by the Storehouse. */
export function exposedYield(levels: BuildingLevels, lastCollectedAt: number, now: number): number {
  if (levels.extractor <= 0) return 0;
  const hours = Math.max(0, (now - lastCollectedAt) / 3_600_000);
  const produced = Math.floor(hours * levels.extractor * EXTRACTOR_RATE_PER_LEVEL);
  return Math.min(produced, levels.storehouse * STOREHOUSE_CAP_PER_LEVEL);
}

/** Storehouse capacity for the current Storehouse level. */
export function storehouseCap(levels: BuildingLevels): number {
  return levels.storehouse * STOREHOUSE_CAP_PER_LEVEL;
}
