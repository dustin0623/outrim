/** Pure station facility rules: independent production lines plus Vault/Attack/Defense, instant upgrades on payment. */
import { RESOURCE_KEYS, type Resources } from "./economy";

export type BuildingId = "tribute" | "titanium" | "plasma" | "rations" | "vault" | "attack" | "defense";
export type BuildingLevels = Record<BuildingId, number>;

/** Per-level resource weight for each facility; RIM always costs max(1, level²). */
export const BUILDINGS: { id: BuildingId; name: string; summary: string; weights: Omit<Resources, "rim"> }[] = [
  { id: "tribute", name: "Tribute Office", summary: "Collects RIM sector tax from colonies under your protection", weights: { titanium: 0, plasma: 0, rations: 0 } },
  { id: "titanium", name: "Titanium Extractor", summary: "Siphons Titanium from nearby asteroids", weights: { titanium: 20, plasma: 0, rations: 0 } },
  { id: "plasma", name: "Plasma Condenser", summary: "Harvests Plasma fuel for warp travel", weights: { titanium: 0, plasma: 10, rations: 0 } },
  { id: "rations", name: "Ration Synthesizer", summary: "Grows Rations to feed crews and future troops", weights: { titanium: 0, plasma: 0, rations: 10 } },
  { id: "vault", name: "Vault", summary: "Raises how much uncollected output the station can hold", weights: { titanium: 50, plasma: 10, rations: 10 } },
  { id: "attack", name: "Attack Array", summary: "Raises raid and boss damage", weights: { titanium: 20, plasma: 40, rations: 20 } },
  { id: "defense", name: "Defense Grid", summary: "Protects your station from raids", weights: { titanium: 40, plasma: 10, rations: 30 } },
];

export const STARTING_LEVELS: BuildingLevels = { tribute: 1, titanium: 1, plasma: 1, rations: 1, vault: 1, attack: 1, defense: 1 };
export const STARTING_BALANCE: Resources = { rim: 10, titanium: 500, plasma: 250, rations: 250 };

/** Cost to go from `currentLevel` to the next level. */
export function upgradeCost(id: BuildingId, currentLevel: number): Resources {
  const building = BUILDINGS.find((b) => b.id === id);
  if (!building) throw new Error(`Unknown building: ${id}`);
  const w = building.weights;
  const sq = Math.max(1, currentLevel * currentLevel);
  return { rim: sq, titanium: w.titanium * sq, plasma: w.plasma * sq, rations: w.rations * sq };
}

export function canAfford(balance: Resources, cost: Resources): boolean {
  return RESOURCE_KEYS.every((k) => balance[k] >= cost[k]);
}

export function effectAt(id: BuildingId, level: number): string {
  switch (id) {
    case "tribute": return `${level} RIM / h`;
    case "titanium": return `${40 * level} Titanium / h`;
    case "plasma": return `${20 * level} Plasma / h`;
    case "rations": return `${25 * level} Rations / h`;
    case "vault": return `${10 * level} RIM · ${(1000 * level).toLocaleString()} each resource`;
    case "attack": return `+${10 * level} attack`;
    case "defense": return `+${10 * level} defense`;
  }
}
