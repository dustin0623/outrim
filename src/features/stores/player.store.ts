import { create } from "zustand";
import { XP_PER_HAUL, XP_PER_NANITE, XP_PER_RIM } from "@/lib/game/profile/level";
import { DEFAULT_PLAYER_COSMETICS, getCosmeticByKind, isCosmeticUnlocked, type CosmeticKind } from "@/lib/game/profile/templates";

export type CareerMilestones = {
  /** Station facility upgrades paid for. */
  stationUpgrades: number;
  /** Salvage crates opened. */
  cratesOpened: number;
  /** Equipment modules dismantled for Nanites. */
  gearSalvaged: number;
  /** Secure hauls of tribute & resources banked. */
  totalHauls: number;
};

type PlayerState = {
  /** Cumulative XP ever earned; level is derived via levelFromXp. */
  xp: number;
  /** Equipped cosmetic template IDs. */
  avatar: number;
  banner: number;
  background: number;
  joinedAt: number;
  milestones: CareerMilestones;
  addXp: (amount: number) => void;
  recordStationUpgrade: (rimCost: number) => void;
  recordCrate: () => void;
  recordSalvage: (nanites: number) => void;
  recordHaul: () => void;
  equipCosmetic: (kind: CosmeticKind, templateId: number, playerLevel: number) => boolean;
  reset: () => void;
};

const initialMilestones = (): CareerMilestones => ({
  stationUpgrades: 0,
  cratesOpened: 0,
  gearSalvaged: 0,
  totalHauls: 0,
});

export const usePlayerStore = create<PlayerState>((set) => ({
  xp: 0,
  avatar: DEFAULT_PLAYER_COSMETICS.avatar,
  banner: DEFAULT_PLAYER_COSMETICS.banner,
  background: DEFAULT_PLAYER_COSMETICS.background,
  joinedAt: Date.now(),
  milestones: initialMilestones(),
  addXp: (amount) => {
    if (amount <= 0) return;
    set((s) => ({ xp: s.xp + amount }));
  },
  recordStationUpgrade: (rimCost) =>
    set((s) => ({ xp: s.xp + Math.round(rimCost * XP_PER_RIM), milestones: { ...s.milestones, stationUpgrades: s.milestones.stationUpgrades + 1 } })),
  recordCrate: () => set((s) => ({ milestones: { ...s.milestones, cratesOpened: s.milestones.cratesOpened + 1 } })),
  recordSalvage: (nanites) =>
    set((s) => ({ xp: s.xp + Math.round(nanites * XP_PER_NANITE), milestones: { ...s.milestones, gearSalvaged: s.milestones.gearSalvaged + 1 } })),
  recordHaul: () => set((s) => ({ xp: s.xp + XP_PER_HAUL, milestones: { ...s.milestones, totalHauls: s.milestones.totalHauls + 1 } })),
  equipCosmetic: (kind, templateId, playerLevel) => {
    if (!getCosmeticByKind(kind, templateId) || !isCosmeticUnlocked(playerLevel, templateId)) return false;
    set({ [kind]: templateId } as Partial<PlayerState>);
    return true;
  },
  reset: () =>
    set({
      xp: 0,
      avatar: DEFAULT_PLAYER_COSMETICS.avatar,
      banner: DEFAULT_PLAYER_COSMETICS.banner,
      background: DEFAULT_PLAYER_COSMETICS.background,
      joinedAt: Date.now(),
      milestones: initialMilestones(),
    }),
}));
