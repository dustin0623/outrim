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

/** Number of stats rolled and the value multiplier per rarity. */
export const RARITY_META: Record<Rarity, { label: string; stats: number; mult: number; weight: number }> = {
  common: { label: "Common", stats: 1, mult: 1, weight: 60 },
  uncommon: { label: "Uncommon", stats: 2, mult: 1.5, weight: 25 },
  rare: { label: "Rare", stats: 3, mult: 2.25, weight: 10 },
  epic: { label: "Epic", stats: 4, mult: 3.5, weight: 4 },
  legendary: { label: "Legendary", stats: 5, mult: 5, weight: 1 },
};

export const MAX_ITEM_LEVEL = 10;
export const CRATE_COST_ALLOY = 250;

export interface Equipment {
  id: string;
  slot: SlotKey;
  rarity: Rarity;
  stats: StatRoll;
  level: number;
}

export type Rng = () => number;

export function rollRarity(rng: Rng): Rarity {
  const total = RARITIES.reduce((n, r) => n + RARITY_META[r].weight, 0);
  let pick = rng() * total;
  for (const r of RARITIES) {
    pick -= RARITY_META[r].weight;
    if (pick < 0) return r;
  }
  return "common";
}

/** Primary stat is always rolled; extra stats are drawn from the rest. Values 5–10 × rarity mult. */
export function rollItem(rng: Rng, id: string, slot?: SlotKey, rarity?: Rarity): Equipment {
  const s = slot ?? SLOTS[Math.floor(rng() * SLOTS.length)];
  const r = rarity ?? rollRarity(rng);
  const primary = SLOT_META[s].primary;
  const pool = STATS.filter((k) => k !== primary);
  const keys: StatKey[] = [primary];
  while (keys.length < RARITY_META[r].stats) keys.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  const stats: StatRoll = {};
  for (const k of keys) stats[k] = Math.round((5 + rng() * 5) * RARITY_META[r].mult);
  return { id, slot: s, rarity: r, stats, level: 1 };
}

/** Each level above 1 adds 10% to every stat. */
export function effectiveStats(item: Equipment): StatRoll {
  const f = 1 + 0.1 * (item.level - 1);
  const out: StatRoll = {};
  for (const k of STATS) if (item.stats[k]) out[k] = Math.round(item.stats[k]! * f);
  return out;
}

export function statSum(item: Equipment): number {
  return Object.values(effectiveStats(item)).reduce((a, b) => a + (b ?? 0), 0);
}

/** Sparks returned when dismantling. */
export function salvageValue(item: Equipment): number {
  return statSum(item);
}

/** Sparks cost to go from current level to the next. */
export function upgradeCostSparks(item: Equipment): number {
  return Math.round(statSum(item) * 0.5 * item.level);
}

export function fleetTotals(items: Equipment[]): Record<StatKey, number> {
  const t = Object.fromEntries(STATS.map((k) => [k, 0])) as Record<StatKey, number>;
  for (const it of items) for (const [k, v] of Object.entries(effectiveStats(it))) t[k as StatKey] += v ?? 0;
  return t;
}
