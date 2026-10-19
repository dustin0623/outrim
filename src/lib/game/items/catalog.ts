import { z } from "zod";
import type { Resources } from "@/lib/game/station/economy";

export const ITEM_IDS = ["rim", "nanites", "titanium", "plasma", "rations", "equipment-crate", "sabotage-device", "help-kit"] as const;
export const ItemIdSchema = z.enum(ITEM_IDS);
export type ItemId = z.infer<typeof ItemIdSchema>;
export type Quantities = Record<ItemId, number>;
export const ITEM_CATALOG: Record<ItemId, { name: string; type: "currency" | "resource" | "container" | "consumable"; precision: number }> = {
  rim: { name: "RIM", type: "currency", precision: 2 },
  nanites: { name: "Nanites", type: "currency", precision: 2 },
  titanium: { name: "Titanium", type: "resource", precision: 0 },
  plasma: { name: "Plasma", type: "resource", precision: 0 },
  rations: { name: "Rations", type: "resource", precision: 0 },
  "equipment-crate": { name: "Salvage Crate", type: "container", precision: 0 },
  "sabotage-device": { name: "Disruptor", type: "consumable", precision: 0 },
  "help-kit": { name: "Repair Kit", type: "consumable", precision: 0 },
};
/** Supply Depot stock: RIM unit prices, 1–25 units per purchase. */
export const MAX_PURCHASE_QUANTITY = 25;
export type ShopItemId = "equipment-crate" | "sabotage-device" | "help-kit";
export const SHOP_PRICES_RIM: Record<ShopItemId, number> = { "equipment-crate": 5, "sabotage-device": 1, "help-kit": 1 };
export const SHOP_DESCRIPTIONS: Record<ShopItemId, string> = {
  "equipment-crate": "Rolls one random fleet module. Open it from Inventory.",
  "sabotage-device": "Attempt to disrupt a rival's Tribute, Attack or Defense. Consumed on every valid attempt.",
  "help-kit": "Attempt to reduce active disruption on another operator. Never boosts above normal stats.",
};
export const EMPTY_ITEMS: Quantities = { rim: 0, nanites: 0, titanium: 0, plasma: 0, rations: 0, "equipment-crate": 0, "sabotage-device": 0, "help-kit": 0 };
export const INITIAL_ITEMS: Quantities = { ...EMPTY_ITEMS, rim: 10, titanium: 500, plasma: 250, rations: 250 };
export function resourceBalance(q: Quantities): Resources {
  return { rim: q.rim, titanium: q.titanium, plasma: q.plasma, rations: q.rations };
}
/** Validate the entire batch before changing any quantity; no partial payments. */
export function applyItemBatch(current: Quantities, batch: Partial<Quantities>, direction: 1 | -1): Quantities | null {
  const next = { ...current };
  for (const [rawId, amount] of Object.entries(batch)) {
    const parsed = ItemIdSchema.safeParse(rawId);
    if (!parsed.success || typeof amount !== "number" || !Number.isFinite(amount) || amount < 0) return null;
    const id = parsed.data;
    const scale = 10 ** ITEM_CATALOG[id].precision;
    if (Math.abs(amount * scale - Math.round(amount * scale)) > 0.000001) return null;
    const result = Math.round((next[id] + amount * direction) * scale);
    if (!Number.isSafeInteger(result) || result < 0) return null;
    next[id] = result / scale;
  }
  return next;
}