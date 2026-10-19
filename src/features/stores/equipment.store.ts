import { create } from "zustand";
import { CRATE_COST_ALLOY, MAX_ITEM_LEVEL, rollItem, salvageValue, upgradeCostSparks, type Equipment, type SlotKey } from "@/lib/game/equipment/fleet";
import { useStationStore } from "@/features/stores/station.store";

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
    if (station.securedAlloy < CRATE_COST_ALLOY) return null;
    useStationStore.setState({ securedAlloy: station.securedAlloy - CRATE_COST_ALLOY });
    const item = rollItem(Math.random, newId());
    set((s) => ({ items: [...s.items, item] }));
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
    const sparks = salvageValue(item);
    useStationStore.setState((s) => ({ sparks: s.sparks + sparks }));
    set({ items: items.filter((i) => i.id !== id) });
    return sparks;
  },
  upgrade: (id) => {
    const item = get().items.find((i) => i.id === id);
    if (!item || item.level >= MAX_ITEM_LEVEL) return false;
    const cost = upgradeCostSparks(item);
    const { sparks } = useStationStore.getState();
    if (sparks < cost) return false;
    useStationStore.setState({ sparks: sparks - cost });
    set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, level: i.level + 1 } : i)) }));
    return true;
  },
}));
