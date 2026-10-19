import { settleTick } from "@/features/events/backend/tick-player/action";
import { playerRepository } from "@/lib/modules/players/server.repository";
import { equipmentRepository } from "@/lib/modules/equipments/server.repository";
import { logRepository } from "@/lib/modules/logs/server.repository";
// template/features/events/backend/equipment/upgrade.ts
import { z } from "zod";

import { salvageValue, itemUpgradeCost } from "@/features/types/game/items";
import { XP_PER_SPARK } from "@/features/types/game/level";
import type { StatRoll } from "@/features/types/game/types";

export const upgradeItemInput = z.object({ itemId: z.string().min(1) });

export type UpgradeItemInput = z.infer<typeof upgradeItemInput>;

export type UpgradeItemResult = { ok: boolean; cost?: number; error?: string };

export async function upgradeEquipment(
  wallet: string,
  id: string,
): Promise<UpgradeItemResult> {
  const item = await equipmentRepository.findById(id);
  if (
    !item ||
    item.owner !== wallet ||
    item.purchaseReserved ||
    item.market?.isMarket ||
    item.salvaged
  )
    return { ok: false, error: "Item not found" };
  await settleTick(wallet);
  const cost = itemUpgradeCost({
    stats: item.stats as StatRoll,
    level: item.level,
  });
  const { ok } = await playerRepository.debitSparks(wallet, cost);
  if (!ok) return { ok: false, error: "Not enough SPARKS" };

  const previousSpark = salvageValue({
    stats: item.stats as StatRoll,
    level: item.level,
  });

  const result = await equipmentRepository.upgrade(id, wallet);
  if (!result.ok) return result;

  // Award XP for the SPARK value the upgrade added to the item — the gap
  // between its salvage value before and after the stat bump — not the
  // SPARKS spent on the upgrade itself.
  const currentSpark = salvageValue({
    stats: result.item!.stats as StatRoll,
    level: result.item!.level,
  });
  const xpGain = Math.round(
    Math.max(0, currentSpark - previousSpark) * XP_PER_SPARK,
  );
  if (xpGain > 0) {
    await playerRepository.addXp(wallet, xpGain);
  }

  await logRepository.create({
    type: "upgrade",
    wallet,
    amount: -cost,
    data: { itemId: id, name: item.name, from: item.level, to: item.level + 1 },
  });

  return { ok: true, cost };
}
