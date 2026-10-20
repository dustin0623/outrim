import { z } from "zod";
import { MAX_PURCHASE_QUANTITY } from "@/lib/game/items/catalog";
import type { Resources } from "@/lib/game/station/economy";
import { fleetTotals, type Equipment } from "@/lib/game/equipment/fleet";

export const SHIP_TYPES = ["vanguard-striker", "bulwark-frigate"] as const;
export const ShipTypeSchema = z.enum(SHIP_TYPES);
export type ShipType = z.infer<typeof ShipTypeSchema>;
export type ShipCounts = Record<ShipType, number>;
export const EMPTY_SHIPS: ShipCounts = { "vanguard-striker": 0, "bulwark-frigate": 0 };
export const ShipOrderSchema = z.object({ type: ShipTypeSchema, quantity: z.number().int().min(1).max(MAX_PURCHASE_QUANTITY) });
export const SHIP_CATALOG: Record<ShipType, { name: string; stat: "attack" | "defense"; bonus: number; cost: Resources; image: string }> = {
  "vanguard-striker": { name: "Vanguard Striker", stat: "attack", bonus: 15, cost: { rim: 0, titanium: 120, plasma: 60, rations: 0 }, image: "/assets/ships/vanguard-striker.png" },
  "bulwark-frigate": { name: "Bulwark Frigate", stat: "defense", bonus: 15, cost: { rim: 0, titanium: 140, plasma: 0, rations: 50 }, image: "/assets/ships/bulwark-frigate.png" },
};

export function calculateShipBatchCost(type: ShipType, quantity: number): Resources | null {
  const order = ShipOrderSchema.safeParse({ type, quantity });
  if (!order.success) return null;
  const cost = SHIP_CATALOG[order.data.type].cost;
  return { rim: 0, titanium: cost.titanium * quantity, plasma: cost.plasma * quantity, rations: cost.rations * quantity };
}

export function calculateShipTotals(counts: ShipCounts) {
  return { attack: counts["vanguard-striker"] * SHIP_CATALOG["vanguard-striker"].bonus, defense: counts["bulwark-frigate"] * SHIP_CATALOG["bulwark-frigate"].bonus };
}

export function combinedFleetTotals(equipment: Equipment[], counts: ShipCounts) {
  const hardware = fleetTotals(equipment);
  const ships = calculateShipTotals(counts);
  return { ...hardware, attack: hardware.attack + ships.attack, defense: hardware.defense + ships.defense };
}