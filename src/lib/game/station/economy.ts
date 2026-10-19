/** Pure resource economy: each production facility fills its own resource over time, capped by the Vault; collecting banks it. */
import type { BuildingLevels } from "./buildings";

export type ResourceKey = "rim" | "titanium" | "plasma" | "rations";
export type Resources = Record<ResourceKey, number>;
export const RESOURCE_KEYS: ResourceKey[] = ["rim", "titanium", "plasma", "rations"];
export const RESOURCE_LABEL: Record<ResourceKey, string> = { rim: "RIM", titanium: "Titanium", plasma: "Plasma", rations: "Rations" };

/** Which facility produces each resource. */
export const PRODUCER: Record<ResourceKey, "tribute" | "titanium" | "plasma" | "rations"> = {
  rim: "tribute", titanium: "titanium", plasma: "plasma", rations: "rations",
};
/** Output per hour per producing-facility level. */
export const PRODUCTION_RATE: Resources = { rim: 1, titanium: 40, plasma: 20, rations: 25 };
/** Unsecured capacity per Vault level. */
export const VAULT_CAP: Resources = { rim: 10, titanium: 1000, plasma: 1000, rations: 1000 };

const map = (f: (k: ResourceKey) => number): Resources =>
  Object.fromEntries(RESOURCE_KEYS.map((k) => [k, f(k)])) as Resources;

export function vaultCap(levels: BuildingLevels): Resources {
  return map((k) => VAULT_CAP[k] * levels.vault);
}

export function hourlyRate(levels: BuildingLevels): Resources {
  return map((k) => PRODUCTION_RATE[k] * levels[PRODUCER[k]]);
}

/** Unsecured output since `lastCollectedAt`. RIM keeps 2 decimals; resources are whole. */
export function exposedYield(levels: BuildingLevels, lastCollectedAt: number, now: number): Resources {
  const hours = Math.max(0, (now - lastCollectedAt) / 3_600_000);
  const cap = vaultCap(levels);
  const rate = hourlyRate(levels);
  return map((k) => {
    const raw = hours * rate[k];
    const v = k === "rim" ? Math.floor(raw * 100) / 100 : Math.floor(raw);
    return Math.min(v, cap[k]);
  });
}

export const hasAny = (r: Resources) => RESOURCE_KEYS.some((k) => r[k] > 0);
export const addResources = (a: Resources, b: Resources) => map((k) => Math.round((a[k] + b[k]) * 100) / 100);
export const subResources = (a: Resources, b: Resources) => map((k) => Math.round((a[k] - b[k]) * 100) / 100);
