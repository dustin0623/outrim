import { RARITIES, RARITY_META, type Rarity, type Rng } from "@/lib/game/equipment/fleet";
import type { ItemId } from "./catalog";

export type CrateId = "equipment-crate" | "crate-uncommon" | "crate-rare" | "crate-epic" | "crate-legendary";
export const CRATE_IDS: CrateId[] = ["equipment-crate", "crate-uncommon", "crate-rare", "crate-epic", "crate-legendary"];
export const CRATE_RARITY: Record<CrateId, Rarity> = { "equipment-crate": "common", "crate-uncommon": "uncommon", "crate-rare": "rare", "crate-epic": "epic", "crate-legendary": "legendary" };
export const SHARDS_PER_CRATE = 100;
export function shardId(rarity: Rarity): ItemId { return `shard-${rarity}`; }
/** Preserve reference weights, conditioned on the crate's minimum rarity. */
export function crateOdds(id: CrateId): { rarity: Rarity; percent: number }[] {
  const allowed = RARITIES.slice(RARITIES.indexOf(CRATE_RARITY[id]));
  const total = allowed.reduce((n, r) => n + RARITY_META[r].odds, 0);
  return allowed.map((rarity) => ({ rarity, percent: RARITY_META[rarity].odds / total * 100 }));
}
export function rollCrateRarity(id: CrateId, rng: Rng): Rarity {
  let roll = rng() * 100;
  for (const { rarity, percent } of crateOdds(id)) { roll -= percent; if (roll < 0) return rarity; }
  return "legendary";
}