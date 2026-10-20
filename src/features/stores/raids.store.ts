import { create } from "zustand";
import { currentOwner, ownedItems, useItemsStore } from "./items.store";
import { useStationStore } from "./station.store";
import { useEquipmentStore } from "./equipment.store";
import { useTroopsStore } from "./troops.store";
import { EMPTY_TROOPS } from "@/lib/game/troops/rules";
import { resourceBalance, applyItemBatch } from "@/lib/game/items/catalog";
import { subResources, vaultCap } from "@/lib/game/station/economy";
import { freeVault, INTEL_DURATION, RAID_FUEL, raidStats, resolveRaid, type CombatStats, type RaidOutcome } from "@/lib/game/raids/rules";
import { sampleRaidTargets, type RaidTarget } from "@/lib/game/raids/targets";

export type IntelReport = { target: RaidTarget; stats: CombatStats; capturedAt: number; expiresAt: number };
export type RaidLog = RaidOutcome & { id: string; targetId: string; targetName: string; at: number; attack: number; defense: number; fuel: number };
export type RaidAccount = { targets: RaidTarget[]; intel: Record<string, IntelReport>; logs: RaidLog[] };
type RaidState = {
  accounts: Record<string, RaidAccount>;
  initialize: () => void;
  scout: (targetId: string, now?: number) => boolean;
  raid: (targetId: string, now?: number) => RaidLog | null;
};
export function currentRaidStats() {
  const owner = currentOwner();
  const gear = useEquipmentStore.getState();
  const equipped = gear.items.filter((i) => i.ownerId === owner && !i.marketPrice && gear.equipped[i.slot] === i.id);
  return raidStats(useStationStore.getState().levels, equipped, owner ? useTroopsStore.getState().accounts[owner] ?? EMPTY_TROOPS : EMPTY_TROOPS);
}
export function freshIntel(account: RaidAccount | undefined, targetId: string, now: number) {
  const report = account?.intel[targetId];
  return report && now < report.expiresAt ? report : undefined;
}
export const useRaidsStore = create<RaidState>((set, get) => ({
  accounts: {},
  initialize: () => {
    const owner = currentOwner();
    if (!owner || get().accounts[owner]) return;
    set((s) => ({ accounts: { ...s.accounts, [owner]: { targets: sampleRaidTargets(), intel: {}, logs: [] } } }));
  },
  scout: (targetId, now = Date.now()) => {
    const owner = currentOwner();
    const account = owner ? get().accounts[owner] : undefined;
    const target = account?.targets.find((t) => t.id === targetId);
    if (!owner || !account || !target || !Number.isFinite(now) || freshIntel(account, targetId, now)) return false;
    if (!useItemsStore.getState().debit("recon-drone", 1)) return false;
    const snapshot: RaidTarget = { ...target, troops: { ...target.troops }, exposed: { ...target.exposed } };
    const report: IntelReport = { target: snapshot, stats: raidStats(target.levels, target.equipment, target.troops), capturedAt: now, expiresAt: now + INTEL_DURATION };
    set((s) => ({ accounts: { ...s.accounts, [owner]: { ...account, intel: { ...account.intel, [targetId]: report } } } }));
    return true;
  },
  raid: (targetId, now = Date.now()) => {
    const owner = currentOwner();
    const account = owner ? get().accounts[owner] : undefined;
    const target = account?.targets.find((t) => t.id === targetId);
    if (!owner || !account || !target || !Number.isFinite(now)) return null;
    const items = useItemsStore.getState();
    const paid = applyItemBatch(ownedItems(items.accounts, owner), { plasma: RAID_FUEL }, -1);
    if (!paid) return null;
    const station = useStationStore.getState();
    const attacker = currentRaidStats();
    const defender = raidStats(target.levels, target.equipment, target.troops);
    const free = freeVault(vaultCap(station.levels), resourceBalance(paid), station.exposed());
    const outcome = resolveRaid(attacker, defender, target.exposed, free, Math.random);
    const next = applyItemBatch(paid, outcome.loot, 1);
    if (!next) return null;
    const log: RaidLog = { ...outcome, id: crypto.randomUUID(), targetId, targetName: target.name, at: now, attack: attacker.attack, defense: defender.defense, fuel: RAID_FUEL };
    const intel = { ...account.intel }; delete intel[targetId];
    // Synchronous mock settlement: validate payment and loot first; no asynchronous interleaving.
    useItemsStore.setState((s) => ({ accounts: { ...s.accounts, [owner]: next } }));
    set((s) => ({ accounts: { ...s.accounts, [owner]: { targets: account.targets.map((t) => t.id === targetId ? { ...t, exposed: subResources(t.exposed, outcome.loot) } : t), intel, logs: [...account.logs, log] } } }));
    return log;
  },
}));