/** Pure station upgrade rules: four core stats (TerraCore / reference parity), instant upgrades on payment. */
import { RESOURCE_KEYS, type Resources } from "./economy";

export type BuildingId = "vault" | "mining" | "attack" | "defense";
export type BuildingLevels = Record<BuildingId, number>;

/** Per-level resource weight for each module; RIM always costs max(1, level²). */
export const BUILDINGS: { id: BuildingId; name: string; summary: string; weights: Omit<Resources, "rim"> }[] = [
  { id: "vault", name: "Vault", summary: "Raises how much unsecured output the station can hold", weights: { titanium: 50, plasma: 10, food: 10 } },
  { id: "mining", name: "Mining", summary: "Produces RIM, Titanium, Plasma and Food over time", weights: { titanium: 30, plasma: 30, food: 10 } },
  { id: "attack", name: "Attack", summary: "Raises raid and boss damage", weights: { titanium: 20, plasma: 40, food: 20 } },
  { id: "defense", name: "Defense", summary: "Protects your station from raids", weights: { titanium: 40, plasma: 10, food: 30 } },
];

export const STARTING_LEVELS: BuildingLevels = { vault: 1, mining: 1, attack: 1, defense: 1 };
export const STARTING_BALANCE: Resources = { rim: 10, titanium: 500, plasma: 250, food: 250 };

/** Cost to go from `currentLevel` to the next level. */
export function upgradeCost(id: BuildingId, currentLevel: number): Resources {
  const w = BUILDINGS.find((b) => b.id === id)!.weights;
  const sq = Math.max(1, currentLevel * currentLevel);
  return { rim: sq, titanium: w.titanium * sq, plasma: w.plasma * sq, food: w.food * sq };
}

export function canAfford(balance: Resources, cost: Resources): boolean {
  return RESOURCE_KEYS.every((k) => balance[k] >= cost[k]);
}

export function effectAt(id: BuildingId, level: number): string {
  switch (id) {
    case "vault": return `${10 * level} RIM · ${(1000 * level).toLocaleString()} each resource`;
    case "mining": return `${level} RIM · ${40 * level} Ti · ${20 * level} Plasma · ${25 * level} Food / h`;
    case "attack": return `+${10 * level} attack`;
    case "defense": return `+${10 * level} defense`;
  }
}
