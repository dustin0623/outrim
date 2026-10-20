import { z } from "zod";
import { MAX_PURCHASE_QUANTITY } from "@/lib/game/items/catalog";
import type { Resources } from "@/lib/game/station/economy";
import { fleetTotals, type Equipment } from "@/lib/game/equipment/fleet";

/** Stackable military units (future `troops` table: owner + troop_type + quantity). Recruitment is instant, resources only. */
export const TROOP_TYPES = ["soldier", "archer", "cavalry", "vanguard-striker", "bulwark-frigate", "aegis-dreadnought"] as const;
export const TroopTypeSchema = z.enum(TROOP_TYPES);
export type TroopType = z.infer<typeof TroopTypeSchema>;
export type TroopCategory = "ground" | "ship";
export type TroopCounts = Record<TroopType, number>;
export const EMPTY_TROOPS: TroopCounts = Object.fromEntries(TROOP_TYPES.map((t) => [t, 0])) as TroopCounts;
export const TroopOrderSchema = z.object({ type: TroopTypeSchema, quantity: z.number().int().min(1).max(MAX_PURCHASE_QUANTITY) });

export type TroopDef = { name: string; category: TroopCategory; role: string; attack: number; defense: number; cost: Resources; image?: string };
const c = (titanium: number, plasma: number, rations: number): Resources => ({ rim: 0, titanium, plasma, rations });
export const TROOP_CATALOG: Record<TroopType, TroopDef> = {
  soldier: { name: "Void Marine", category: "ground", role: "Armored infantry", attack: 3, defense: 5, cost: c(30, 0, 40) },
  archer: { name: "Rail Sniper", category: "ground", role: "Long-range marksman", attack: 6, defense: 2, cost: c(20, 15, 30) },
  cavalry: { name: "Hover Lancer", category: "ground", role: "Fast assault mech", attack: 9, defense: 6, cost: c(60, 20, 60) },
  "vanguard-striker": { name: "Vanguard Striker", category: "ship", role: "Attack craft", attack: 25, defense: 5, cost: c(180, 90, 0), image: "/assets/ships/vanguard-striker.png" },
  "bulwark-frigate": { name: "Bulwark Frigate", category: "ship", role: "Escort shield", attack: 5, defense: 25, cost: c(200, 0, 80), image: "/assets/ships/bulwark-frigate.png" },
  "aegis-dreadnought": { name: "Aegis Dreadnought", category: "ship", role: "Capital warship", attack: 40, defense: 40, cost: c(450, 220, 160) },
};
export const troopsIn = (category: TroopCategory) => TROOP_TYPES.filter((t) => TROOP_CATALOG[t].category === category);

/** One shared roster limit, not a separate allowance for each unit or category. */
export const troopCapacity = (level: number) => 50 + Math.min(100, Math.max(1, Math.floor(Number.isFinite(level) ? level : 1))) * 25;
export const troopCount = (counts: TroopCounts) => TROOP_TYPES.reduce((total, type) => total + counts[type], 0);
export const canRecruitTroops = (counts: TroopCounts, quantity: number, level: number) => Number.isSafeInteger(quantity) && quantity > 0 && troopCount(counts) + quantity <= troopCapacity(level);

export function calculateTroopBatchCost(type: TroopType, quantity: number): Resources | null {
  const order = TroopOrderSchema.safeParse({ type, quantity });
  if (!order.success) return null;
  const cost = TROOP_CATALOG[order.data.type].cost;
  return c(cost.titanium * quantity, cost.plasma * quantity, cost.rations * quantity);
}

export function calculateTroopTotals(counts: TroopCounts) {
  return TROOP_TYPES.reduce((t, k) => ({ attack: t.attack + counts[k] * TROOP_CATALOG[k].attack, defense: t.defense + counts[k] * TROOP_CATALOG[k].defense }), { attack: 0, defense: 0 });
}

export function combinedFleetTotals(equipment: Equipment[], counts: TroopCounts) {
  const hardware = fleetTotals(equipment);
  const troops = calculateTroopTotals(counts);
  return { ...hardware, attack: hardware.attack + troops.attack, defense: hardware.defense + troops.defense };
}
