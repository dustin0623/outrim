import { z } from "zod";
import { SOCIAL_ECONOMY } from "@/lib/config/constants/economy";

export const CONSUMABLE_IDS = ["sabotage-device", "help-kit"] as const;

export type ConsumableId = (typeof CONSUMABLE_IDS)[number];

export const STAT_EFFECT_TARGETS = [
  "hashRate",
  "hackPower",
  "security",
] as const;

export type StatEffectTarget = (typeof STAT_EFFECT_TARGETS)[number];

/** Server-roll social requests: unknown strength/authority fields are stripped. */
export const socialActionInput = z.object({
  target: z.string().trim().min(1),
  itemId: z.enum(CONSUMABLE_IDS),
  stat: z.enum(STAT_EFFECT_TARGETS),
});
export type SocialActionInput = z.infer<typeof socialActionInput>;

/** Upper bound on units per purchase request, enforced server-side. */
export const MAX_PURCHASE_QUANTITY = 25;

export type ConsumableKind = "sabotage" | "help";

/** Fixed HIVE price of one consumable. Never changes with emission or player data. */
export const CONSUMABLE_HIVE_PRICE = 0.1;

export interface ConsumableDefinition {
  id: ConsumableId;
  name: string;
  kind: ConsumableKind;
  description: string;
  /** Starting point for the dynamic price. The live price is computed server-side. */
  basePrice: number;
}

/**
 * Catalog of purchasable consumables. Owned quantities live in inventory stacks,
 * so adding a supported item never adds a player persistence field.
 */
export const CONSUMABLES: Record<ConsumableId, ConsumableDefinition> = {
  "sabotage-device": {
    id: "sabotage-device",
    name: "Disruptor",
    kind: "sabotage",
    description:
      "Attempt to disrupt another operator’s Extraction, Breach or Armor. A valid attempt consumes one Disruptor, including a failed roll.",
    basePrice: SOCIAL_ECONOMY.consumablePricing.sabotageBasePrice,
  },
  "help-kit": {
    id: "help-kit",
    name: "Repair Kit",
    kind: "help",
    description:
      "Attempt to reduce active disruption on an operator’s Extraction, Breach or Armor. A valid attempt consumes one Repair Kit; this does not add a buff above normal stats.",
    basePrice: SOCIAL_ECONOMY.consumablePricing.helpBasePrice,
  },
};

/** Owned quantities keyed by consumable id. Missing keys mean zero. */
export type ConsumableInventory = Record<string, number>;

export const isConsumableId = (value: unknown): value is ConsumableId =>
  typeof value === "string" &&
  (CONSUMABLE_IDS as readonly string[]).includes(value);

export const consumableQuantity = (
  inventory: Partial<ConsumableInventory> | undefined,
  id: ConsumableId,
): number => inventory?.[id] ?? 0;
