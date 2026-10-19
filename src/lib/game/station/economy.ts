/** Pure resource economy: Mining produces unsecured output over time, capped by the Vault; Secure Haul banks it. */
import type { BuildingLevels } from "./buildings";

export type ResourceKey = "rim" | "titanium" | "plasma" | "food";
export type Resources = Record<ResourceKey, number>;
export const RESOURCE_KEYS: ResourceKey[] = ["rim", "titanium", "plasma", "food"];
export const RESOURCE_LABEL: Record<ResourceKey, string> = { rim: "RIM", titanium: "Titanium", plasma: "Plasma", food: "Food" };

/** Output per hour per Mining level. */
export const MINING_RATE: Resources = { rim: 1, titanium: 40, plasma: 20, food: 25 };
/** Unsecured capacity per Vault level. */
export const VAULT_CAP: Resources = { rim: 10, titanium: 1000, plasma: 1000, food: 1000 };

const map = (f: (k: ResourceKey) => number): Resources =>
  Object.fromEntries(RESOURCE_KEYS.map((k) => [k, f(k)])) as Resources;

export function vaultCap(levels: BuildingLevels): Resources {
  return map((k) => VAULT_CAP[k] * levels.vault);
}

/** Unsecured output since `lastCollectedAt`. RIM keeps 2 decimals; resources are whole. */
export function exposedYield(levels: BuildingLevels, lastCollectedAt: number, now: number): Resources {
  const hours = Math.max(0, (now - lastCollectedAt) / 3_600_000);
  const cap = vaultCap(levels);
  return map((k) => {
    const raw = hours * levels.mining * MINING_RATE[k];
    const v = k === "rim" ? Math.floor(raw * 100) / 100 : Math.floor(raw);
    return Math.min(v, cap[k]);
  });
}

export const hasAny = (r: Resources) => RESOURCE_KEYS.some((k) => r[k] > 0);
export const addResources = (a: Resources, b: Resources) => map((k) => Math.round((a[k] + b[k]) * 100) / 100);
export const subResources = (a: Resources, b: Resources) => map((k) => Math.round((a[k] - b[k]) * 100) / 100);
