import { create } from "zustand";
import { useAuthStore } from "./auth.store";
import { currentOwner, useItemsStore } from "./items.store";
import { calculateTroopBatchCost, EMPTY_TROOPS, type TroopCounts, type TroopType } from "@/lib/game/troops/rules";

type TroopsState = { accounts: Record<string, TroopCounts>; recruit: (type: TroopType, quantity: number) => boolean };

export function useOwnedTroops() {
  const owner = useAuthStore((s) => s.player?.id);
  return useTroopsStore((s) => (owner ? s.accounts[owner] ?? EMPTY_TROOPS : EMPTY_TROOPS));
}

/** Session-only troop roster (ground units + ships); instant recruitment paid from the items store. */
export const useTroopsStore = create<TroopsState>((set, get) => ({
  accounts: {},
  recruit: (type, quantity) => {
    const owner = currentOwner();
    const cost = calculateTroopBatchCost(type, quantity);
    if (!owner || !cost) return false;
    const counts = get().accounts[owner] ?? EMPTY_TROOPS;
    const next = counts[type] + quantity;
    if (!Number.isSafeInteger(next) || !useItemsStore.getState().debitBatch(cost)) return false;
    set((s) => ({ accounts: { ...s.accounts, [owner]: { ...counts, [type]: next } } }));
    return true;
  },
}));
