/** Pure rules for the six-slot fleet equipment system (TerraCore-style rolls). */
export const SLOTS = ["mothership", "commander", "attackers", "shield", "mining", "ecm"] as const;
export type SlotKey = (typeof SLOTS)[number];

export const STATS = ["extraction", "attack", "defense", "luck", "evasion", "crit"] as const;
export type StatKey = (typeof STATS)[number];
export type StatRoll = Partial<Record<StatKey, number>>;

export const RARITIES = ["common", "uncommon", "rare", "epic", "legendary"] as const;
export type Rarity = (typeof RARITIES)[number];

export const SLOT_META: Record<SlotKey, { label: string; primary: StatKey; summary: string }> = {
  mothership: { label: "Mothership", primary: "luck", summary: "Flagship carrier that houses the fleet and enables expeditions" },
  commander: { label: "Commander", primary: "crit", summary: "Fleet officer sharpening critical strikes" },
  attackers: { label: "Attack Wing", primary: "attack", summary: "Small strike ships launched from the Mothership" },
  shield: { label: "Shield Array", primary: "defense", summary: "Deflector grid protecting the fleet" },
  mining: { label: "Mining Rig", primary: "extraction", summary: "Extraction drones boosting Alloy output" },
  ecm: { label: "ECM Suite", primary: "evasion", summary: "Electronic countermeasures to dodge incoming fire" },
};

export const STAT_LABEL: Record<StatKey, string> = {
  extraction: "Extraction", attack: "Attack", defense: "Defense", luck: "Luck", evasion: "Evasion", crit: "Crit",
};

/** Crate odds (percent) and rarity index, ported from the reference Salvage Cache. */
export const RARITY_META: Record<Rarity, { label: string; odds: number; index: number }> = {
  common: { label: "Common", odds: 70, index: 1 },
  uncommon: { label: "Uncommon", odds: 20, index: 2 },
  rare: { label: "Rare", odds: 8, index: 3 },
  epic: { label: "Epic", odds: 1.8, index: 4 },
  legendary: { label: "Legendary", odds: 0.2, index: 6 },
};

export const MAX_ITEM_LEVEL = 10;
export const CRATE_COST_ALLOY = 250;
/** Combat stats are stored on a x10 scale, like damage/defense in the reference. */
export const SCALED_STATS: StatKey[] = ["attack", "defense"];
/** Reference dismantle weights: combat/2, luck x10, others x5. */
export const SALVAGE_WEIGHTS: Record<StatKey, number> = {
  attack: 0.5, defense: 0.5, extraction: 5, evasion: 5, crit: 5, luck: 10,
};
export const UPGRADE_RATE = 0.0498;
export const UPGRADE_MULTIPLIER = 1.05;

export interface Equipment {
  id: string;
  slot: SlotKey;
  rarity: Rarity;
  stats: StatRoll;
  level: number;
}

export type Rng = () => number;

/** Cumulative 100,000-unit ladder walk, like the reference chest. */
export function rollRarity(rng: Rng): Rarity {
  const roll = rng() * 100_000;
  let max = 0;
  for (const r of RARITIES) {
    max += RARITY_META[r].odds * 1_000;
    if (roll < max) return r;
  }
  return "legendary";
}

/** Epic rolls one 50/50 between index 4 and 5; it drives both stat count and strength. */
export function rollRarityIndex(rarity: Rarity, rng: Rng): number {
  if (rarity === "epic") return rng() < 0.5 ? 4 : 5;
  return RARITY_META[rarity].index;
}

/** Signature stat first, extra stats drawn from the rest; each value in [0.1·index, index]. */
export function rollItem(rng: Rng, id: string, slot?: SlotKey, rarity?: Rarity): Equipment {
  const r = rarity ?? rollRarity(rng);
  const s: SlotKey = slot ?? SLOTS[Math.floor(rng() * SLOTS.length)]!;
  const index = rollRarityIndex(r, rng);
  const count = Math.min(STATS.length, index);
  const primary = SLOT_META[s].primary;
  const pool = STATS.filter((k) => k !== primary);
  const keys: StatKey[] = [primary];
  while (keys.length < count && pool.length) keys.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]!);
  const floor = 0.1 * index;
  const stats: StatRoll = {};
  for (const k of keys) {
    const roll = rng() * (index - floor) + floor;
    stats[k] = Math.round((SCALED_STATS.includes(k) ? roll * 10 : roll) * 10) / 10;
  }
  return { id, slot: s, rarity: r, stats, level: 1 };
}

/** Stored stats already include upgrades (x1.05 compounding per level). */
export function effectiveStats(item: Equipment): StatRoll {
  return item.stats;
}

export function upgradedStats(stats: StatRoll): StatRoll {
  const out: StatRoll = {};
  for (const k of STATS) if (stats[k] !== undefined) out[k] = Math.round(stats[k]! * UPGRADE_MULTIPLIER * 10000) / 10000;
  return out;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Sparks returned when dismantling (reference dismantleValue). */
export function salvageValue(item: Equipment): number {
  return round2(STATS.reduce((t, k) => t + (item.stats[k] ?? 0) * SALVAGE_WEIGHTS[k], 0));
}

/** Sparks cost to forge the next level: value × 0.0498 × level. */
export function upgradeCostSparks(item: Equipment): number {
  return round2(salvageValue(item) * UPGRADE_RATE * item.level);
}

export function fleetTotals(items: Equipment[]): Record<StatKey, number> {
  const t = Object.fromEntries(STATS.map((k) => [k, 0])) as Record<StatKey, number>;
  for (const it of items) for (const [k, v] of Object.entries(it.stats)) t[k as StatKey] = round2(t[k as StatKey] + (v ?? 0));
  return t;
}
