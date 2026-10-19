import { create } from "zustand";
import { STARTING_BALANCE, STARTING_LEVELS, canAfford, upgradeCost, type BuildingId, type BuildingLevels } from "@/lib/game/station/buildings";
import { addResources, exposedYield, hasAny, subResources, type Resources } from "@/lib/game/station/economy";

type StationState = {
  /** Secured RIM token + Titanium, Plasma, Rations. */
  balance: Resources;
  /** Salvage currency; only spent on equipment upgrades. */
  nanites: number;
  levels: BuildingLevels;
  lastCollectedAt: number;
  exposed: () => Resources;
  /** Banks all unsecured output; returns what was hauled or null. */
  secureHaul: () => Resources | null;
  /** Pays and upgrades instantly; false when unaffordable. */
  upgrade: (id: BuildingId) => boolean;
};

export const useStationStore = create<StationState>((set, get) => ({
  balance: { ...STARTING_BALANCE },
  nanites: 0,
  levels: { ...STARTING_LEVELS },
  lastCollectedAt: Date.now(),
  exposed: () => exposedYield(get().levels, get().lastCollectedAt, Date.now()),
  secureHaul: () => {
    const amount = get().exposed();
    if (!hasAny(amount)) return null;
    set((s) => ({ balance: addResources(s.balance, amount), lastCollectedAt: Date.now() }));
    return amount;
  },
  upgrade: (id) => {
    const { levels, balance } = get();
    const cost = upgradeCost(id, levels[id]);
    if (!canAfford(balance, cost)) return false;
    set({ balance: subResources(balance, cost), levels: { ...levels, [id]: levels[id] + 1 } });
    return true;
  },
}));
