import { create } from "zustand";
import { CRATE_COST_RIM, MAX_ITEM_LEVEL, rollItem, salvageValue, upgradeCostNanites, upgradedStats, type Equipment, type SlotKey } from "@/lib/game/equipment/fleet";
import { useStationStore } from "@/features/stores/station.store";
import { usePlayerStore } from "@/features/stores/player.store";
import { XP_PER_NANITE } from "@/lib/game/profile/level";

type EquipmentState = {
  items: Equipment[];
  equipped: Partial<Record<SlotKey, string>>;
  openCrate: () => Equipment | null;
  equip: (id: string) => void;
  unequip: (slot: SlotKey) => void;
  salvage: (id: string) => number;
  upgrade: (id: string) => boolean;
};

const newId = () => crypto.randomUUID();

export const useEquipmentStore = create<EquipmentState>((set, get) => ({
  items: [],
  equipped: {},
  openCrate: () => {
    const station = useStationStore.getState();
    if (station.balance.rim < CRATE_COST_RIM) return null;
    useStationStore.setState({ balance: { ...station.balance, rim: Math.round((station.balance.rim - CRATE_COST_RIM) * 100) / 100 } });
    const item = rollItem(Math.random, newId());
    set((s) => ({ items: [...s.items, item] }));
    usePlayerStore.getState().recordCrate();
    return item;
  },
  equip: (id) => {
    const item = get().items.find((i) => i.id === id);
    if (item) set((s) => ({ equipped: { ...s.equipped, [item.slot]: id } }));
  },
  unequip: (slot) => set((s) => { const e = { ...s.equipped }; delete e[slot]; return { equipped: e }; }),
  salvage: (id) => {
    const { items, equipped } = get();
    const item = items.find((i) => i.id === id);
    if (!item || equipped[item.slot] === id) return 0;
    const nanites = salvageValue(item);
    useStationStore.setState((s) => ({ nanites: Math.round((s.nanites + nanites) * 100) / 100 }));
    set({ items: items.filter((i) => i.id !== id) });
    usePlayerStore.getState().recordSalvage(nanites);
    return nanites;
  },
  upgrade: (id) => {
    const item = get().items.find((i) => i.id === id);
    if (!item || item.level >= MAX_ITEM_LEVEL) return false;
    const cost = upgradeCostNanites(item);
    const { nanites } = useStationStore.getState();
    if (nanites < cost) return false;
    useStationStore.setState({ nanites: Math.round((nanites - cost) * 100) / 100 });
    set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, level: i.level + 1, stats: upgradedStats(i.stats) } : i)) }));
    usePlayerStore.getState().addXp(Math.round(cost * XP_PER_NANITE));
    return true;
  },
}));
