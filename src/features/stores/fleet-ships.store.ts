import { create } from "zustand";
import { useAuthStore } from "./auth.store";
import { currentOwner, useItemsStore } from "./items.store";
import { calculateShipBatchCost, EMPTY_SHIPS, type ShipCounts, type ShipType } from "@/lib/game/ships/rules";

type FleetShipsState = {
  accounts: Record<string, ShipCounts>;
  buyShips: (type: ShipType, quantity: number) => boolean;
};

export function useOwnedShips() {
  const owner = useAuthStore((s) => s.player?.id);
  return useFleetShipsStore((s) => owner ? s.accounts[owner] ?? EMPTY_SHIPS : EMPTY_SHIPS);
}

/** Session-only ship roster, separate from items and unique equipment. */
export const useFleetShipsStore = create<FleetShipsState>((set, get) => ({
  accounts: {},
  buyShips: (type, quantity) => {
    const owner = currentOwner();
    const cost = calculateShipBatchCost(type, quantity);
    if (!owner || !cost) return false;
    const counts = get().accounts[owner] ?? EMPTY_SHIPS;
    const nextQuantity = counts[type] + quantity;
    if (!Number.isSafeInteger(nextQuantity)) return false;
    if (!useItemsStore.getState().debitBatch(cost)) return false;
    set((s) => ({ accounts: { ...s.accounts, [owner]: { ...counts, [type]: nextQuantity } } }));
    return true;
  },
}));