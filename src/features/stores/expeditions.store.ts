import { create } from "zustand";
import { currentOwner, useItemsStore } from "./items.store";
import { useEquipmentStore } from "./equipment.store";
import { useStationStore } from "./station.store";
import { usePlayerStore } from "./player.store";
import { levelFromXp } from "@/lib/game/profile/level";
import { acceleratedFinish, dailyBoard, expeditionStats, MISSION_META, requirementChecks, rewardFor, TIERS, type ExpeditionReward, type ExpeditionSnapshot, type Mission } from "@/lib/game/expeditions/rules";
export type ExpeditionRun = { id: string; owner: string; mission: Mission; startedAt: number; finishAt: number; snapshot: ExpeditionSnapshot; seed: number; claimed: boolean; reward?: ExpeditionReward | undefined };
type ExpeditionState = {
  runs: ExpeditionRun[]; starters: string[];
  claimStarter: () => boolean;
  dispatch: (id: string, now?: number) => string | null;
  speedUp: (id: string, now?: number) => boolean;
  claim: (id: string, now?: number) => ExpeditionReward | null;
};
export function equippedForOwner() {
  const state = useEquipmentStore.getState();
  return state.items.filter((i) => i.ownerId === currentOwner() && !i.marketPrice && state.equipped[i.slot] === i.id);
}
function seededRng(seed: number) { let state = seed; return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; }; }
export const useExpeditionsStore = create<ExpeditionState>((set, get) => ({
  runs: [], starters: [],
  claimStarter: () => {
    const owner = currentOwner(); if (!owner || get().starters.includes(owner)) return false;
    const id = crypto.randomUUID();
    useEquipmentStore.setState((s) => ({ items: [...s.items, { id, ownerId: owner, slot: "mothership", rarity: "common", level: 1, stats: { luck: 2 } }], equipped: { ...s.equipped, mothership: s.items.some((i) => i.id === s.equipped.mothership && i.ownerId === owner && !i.marketPrice) ? (s.equipped.mothership ?? id) : id } }));
    set((s) => ({ starters: [...s.starters, owner] })); return true;
  },
  dispatch: (id, now = Date.now()) => {
    const owner = currentOwner(); const mission = dailyBoard(now).find((m) => m.id === id);
    if (!owner || !mission) return null;
    if (get().runs.some((r) => r.owner === owner && (r.mission.id === id || !r.claimed))) return null;
    const equipment = equippedForOwner(); const stats = expeditionStats(useStationStore.getState().levels, equipment);
    if (!requirementChecks(mission, levelFromXp(usePlayerStore.getState().xp), stats, equipment).every((c) => c.ok)) return null;
    if (!useItemsStore.getState().debit("nanites", TIERS[mission.tier].fuel)) return null;
    const meta = MISSION_META[mission.type]; const runId = crypto.randomUUID();
    const designated = equipment.find((i) => i.slot === meta.slot);
    const seed = crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;
    const run: ExpeditionRun = { id: runId, owner, mission, startedAt: now, finishAt: now + TIERS[mission.tier].hours * 3600000, snapshot: { primary: stats[meta.primary], secondary: stats[meta.secondary], item: designated ? structuredClone(designated) : undefined }, seed, claimed: false };
    set((s) => ({ runs: [...s.runs, run] })); return runId;
  },
  speedUp: (id, now = Date.now()) => {
    const run = get().runs.find((r) => r.id === id && r.owner === currentOwner());
    if (!run || run.claimed || run.finishAt <= now || !useItemsStore.getState().debit("warp-drive", 1)) return false;
    set((s) => ({ runs: s.runs.map((r) => r.id === id ? { ...r, finishAt: acceleratedFinish(now, r.finishAt) } : r) })); return true;
  },
  claim: (id, now = Date.now()) => {
    const run = get().runs.find((r) => r.id === id && r.owner === currentOwner());
    if (!run || run.claimed || now < run.finishAt) return null;
    const reward = rewardFor(run.mission, run.snapshot, seededRng(run.seed));
    if (!useItemsStore.getState().creditBatch(reward.items)) return null;
    usePlayerStore.getState().addXp(reward.xp);
    set((s) => ({ runs: s.runs.map((r) => r.id === id ? { ...r, claimed: true, reward } : r) })); return reward;
  },
}));