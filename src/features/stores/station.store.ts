import { create } from "zustand";
import { STARTING_LEVELS, upgradeCost, type BuildingId, type BuildingLevels } from "@/lib/game/station/buildings";
import { exposedYield, hasAny, type Resources } from "@/lib/game/station/economy";
import { useItemsStore } from "@/features/stores/items.store";
import { usePlayerStore } from "@/features/stores/player.store";

type StationState = {
  levels: BuildingLevels;
  lastCollectedAt: number;
  exposed: () => Resources;
  /** Banks all unsecured output; returns what was hauled or null. */
  secureHaul: () => Resources | null;
  /** Pays and upgrades instantly; false when unaffordable. */
  upgrade: (id: BuildingId) => boolean;
};

export const useStationStore = create<StationState>((set, get) => ({
  levels: { ...STARTING_LEVELS },
  lastCollectedAt: Date.now(),
  exposed: () => exposedYield(get().levels, get().lastCollectedAt, Date.now()),
  secureHaul: () => {
    const amount = get().exposed();
    if (!hasAny(amount)) return null;
    if (!useItemsStore.getState().creditBatch(amount)) return null;
    set({ lastCollectedAt: Date.now() });
    usePlayerStore.getState().recordHaul();
    return amount;
  },
  upgrade: (id) => {
    const { levels } = get();
    const cost = upgradeCost(id, levels[id]);
    if (!useItemsStore.getState().debitBatch(cost)) return false;
    set({ levels: { ...levels, [id]: levels[id] + 1 } });
    usePlayerStore.getState().recordStationUpgrade(cost.rim);
    return true;
  },
}));
