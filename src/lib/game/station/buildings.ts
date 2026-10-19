/** Pure station building rules (GDD §5), with instant upgrades instead of a construction queue. */
export type BuildingId = "hq" | "extractor" | "storehouse" | "barracks" | "dispatch" | "defense";
export type BuildingLevels = Record<BuildingId, number>;

export const MAX_LEVEL = 10;

export const BUILDINGS: { id: BuildingId; name: string; costFactor: number; summary: string }[] = [
  { id: "hq", name: "Command Rig", costFactor: 120, summary: "Sets the highest level every other module can reach" },
  { id: "extractor", name: "Extractor", costFactor: 80, summary: "Produces Alloy over time" },
  { id: "storehouse", name: "Storehouse", costFactor: 60, summary: "Holds exposed Alloy before it is secured" },
  { id: "barracks", name: "Barracks", costFactor: 100, summary: "Trains units faster at higher levels" },
  { id: "dispatch", name: "Dispatch Bay", costFactor: 90, summary: "Allows more expeditions at once" },
  { id: "defense", name: "Defense Array", costFactor: 110, summary: "Adds defense strength to your station" },
];

export const STARTING_LEVELS: BuildingLevels = { hq: 1, extractor: 1, storehouse: 1, barracks: 1, dispatch: 1, defense: 0 };
export const STARTING_ALLOY = 500;

export function upgradeCost(id: BuildingId, targetLevel: number): number {
  const def = BUILDINGS.find((b) => b.id === id)!;
  return def.costFactor * targetLevel * targetLevel;
}

export function effectAt(id: BuildingId, level: number): string {
  switch (id) {
    case "hq": return `Modules up to level ${level}`;
    case "extractor": return `${60 * level} Alloy / hour`;
    case "storehouse": return `${(1000 * level).toLocaleString()} Alloy capacity`;
    case "barracks": return level === 0 ? "Training offline" : `-${Math.min(45, 5 * (level - 1))}% training time`;
    case "dispatch": return `${Math.min(5, level)} expedition${Math.min(5, level) === 1 ? "" : "s"} at once`;
    case "defense": return `+${20 * level} defense`;
  }
}

export type UpgradeBlock = "max" | "hq" | "alloy" | null;

export function upgradeBlock(id: BuildingId, levels: BuildingLevels, alloy: number): UpgradeBlock {
  const target = levels[id] + 1;
  if (target > MAX_LEVEL) return "max";
  if (id !== "hq" && target > levels.hq) return "hq";
  if (alloy < upgradeCost(id, target)) return "alloy";
  return null;
}
