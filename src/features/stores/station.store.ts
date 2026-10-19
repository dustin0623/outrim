import { create } from "zustand";
import { STARTING_ALLOY, STARTING_LEVELS, upgradeBlock, upgradeCost, type BuildingId, type BuildingLevels } from "@/lib/game/station/buildings";
import { exposedYield } from "@/lib/game/station/economy";

type StationState = {
  securedAlloy: number;
  sparks: number;
  levels: BuildingLevels;
  /** Timestamp of the last haul; exposed Alloy accrues from here. */
  lastCollectedAt: number;
  /** Exposed (unsecured) Alloy waiting in the Storehouse right now. */
  exposed: () => number;
  /** Moves all exposed Alloy into the secured vault; returns the amount hauled. */
  secureHaul: () => number;
  /** Pays and upgrades instantly; returns false when the upgrade isn't allowed. */
  upgrade: (id: BuildingId) => boolean;
};

export const useStationStore = create<StationState>((set, get) => ({
  securedAlloy: STARTING_ALLOY,
  sparks: 0,
  levels: { ...STARTING_LEVELS },
  lastCollectedAt: Date.now(),
  exposed: () => exposedYield(get().levels, get().lastCollectedAt, Date.now()),
  secureHaul: () => {
    const amount = get().exposed();
    if (amount <= 0) return 0;
    set((s) => ({ securedAlloy: s.securedAlloy + amount, lastCollectedAt: Date.now() }));
    return amount;
  },
  upgrade: (id) => {
    const { levels, securedAlloy } = get();
    if (upgradeBlock(id, levels, securedAlloy)) return false;
    const target = levels[id] + 1;
    set({ securedAlloy: securedAlloy - upgradeCost(id, target), levels: { ...levels, [id]: target } });
    return true;
  },
}));
