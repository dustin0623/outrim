import { create } from "zustand";
import { STARTING_ALLOY, STARTING_LEVELS, upgradeBlock, upgradeCost, type BuildingId, type BuildingLevels } from "@/lib/game/station/buildings";

type StationState = {
  securedAlloy: number;
  sparks: number;
  levels: BuildingLevels;
  /** Pays and upgrades instantly; returns false when the upgrade isn't allowed. */
  upgrade: (id: BuildingId) => boolean;
};

export const useStationStore = create<StationState>((set, get) => ({
  securedAlloy: STARTING_ALLOY,
  sparks: 0,
  levels: { ...STARTING_LEVELS },
  upgrade: (id) => {
    const { levels, securedAlloy } = get();
    if (upgradeBlock(id, levels, securedAlloy)) return false;
    const target = levels[id] + 1;
    set({ securedAlloy: securedAlloy - upgradeCost(id, target), levels: { ...levels, [id]: target } });
    return true;
  },
}));
