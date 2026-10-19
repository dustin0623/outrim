import { create } from "zustand";
import { CRATE_COST_RIM, MAX_ITEM_LEVEL, rollItem, salvageValue, upgradeCostNanites, upgradedStats, type Equipment, type SlotKey } from "@/lib/game/equipment/fleet";
import { currentOwner, useItemsStore } from "@/features/stores/items.store";
import { usePlayerStore } from "@/features/stores/player.store";
import { XP_PER_NANITE } from "@/lib/game/profile/level";

export type OwnedEquipment = Equipment & { ownerId: string; sellerName?: string | undefined; marketPrice?: number | undefined; listedAt?: number | undefined };

type EquipmentState = {
  items: OwnedEquipment[];
  equipped: Partial<Record<SlotKey, string>>;
  buyCrates: (quantity: number) => boolean;
  list: (id: string, price: number, sellerName: string) => boolean;
  cancel: (id: string) => boolean;
  purchase: (id: string, expectedPrice: number) => boolean;
  openCrate: () => OwnedEquipment | null;
  equip: (id: string) => void;
  unequip: (slot: SlotKey) => void;
  salvage: (id: string) => number;
  upgrade: (id: string) => boolean;
};

const newId = () => crypto.randomUUID();

export const useEquipmentStore = create<EquipmentState>((set, get) => ({
  items: [],
  equipped: {},
  buyCrates: (quantity) => {
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 25) return false;
    const stock = useItemsStore.getState();
    return stock.buyContainers(quantity, CRATE_COST_RIM);
  },
  list: (id, price, sellerName) => {
    const item = get().items.find((i) => i.id === id);
    if (!item || item.ownerId !== currentOwner() || item.marketPrice || get().equipped[item.slot] === id || !Number.isFinite(price) || price <= 0 || !Number.isSafeInteger(Math.round(price * 100)) || Math.abs(price * 100 - Math.round(price * 100)) > 0.000001) return false;
    set((s) => ({ items: s.items.map((i) => i.id === id ? { ...i, marketPrice: price, listedAt: Date.now(), sellerName } : i) }));
    return true;
  },
  cancel: (id) => {
    const item = get().items.find((i) => i.id === id);
    if (!item || item.ownerId !== currentOwner() || !item.marketPrice) return false;
    set((s) => ({ items: s.items.map((i) => i.id === id ? { ...i, marketPrice: undefined, listedAt: undefined } : i) }));
    return true;
  },
  purchase: (id, expectedPrice) => {
    const buyer = currentOwner();
    const item = get().items.find((i) => i.id === id);
    if (!buyer || !item?.marketPrice || item.marketPrice !== expectedPrice || item.ownerId === buyer) return false;
    if (!useItemsStore.getState().transferRim(buyer, item.ownerId, item.marketPrice)) return false;
    set((s) => ({ items: s.items.map((i) => i.id === id ? { ...i, ownerId: buyer, marketPrice: undefined, listedAt: undefined, sellerName: undefined } : i) }));
    return true;
  },
  openCrate: () => {
    const ownerId = currentOwner();
    if (!ownerId || !useItemsStore.getState().debit("equipment-crate", 1)) return null;
    const item: OwnedEquipment = { ...rollItem(Math.random, newId()), ownerId };
    set((s) => ({ items: [...s.items, item] }));
    usePlayerStore.getState().recordCrate();
    return item;
  },
  equip: (id) => {
    const item = get().items.find((i) => i.id === id);
    if (item && item.ownerId === currentOwner() && !item.marketPrice) set((s) => ({ equipped: { ...s.equipped, [item.slot]: id } }));
  },
  unequip: (slot) => set((s) => {
    const item = s.items.find((i) => i.id === s.equipped[slot]);
    if (!item || item.ownerId !== currentOwner()) return s;
    const e = { ...s.equipped }; delete e[slot]; return { equipped: e };
  }),
  salvage: (id) => {
    const { items, equipped } = get();
    const item = items.find((i) => i.id === id);
    if (!item || item.ownerId !== currentOwner() || item.marketPrice || equipped[item.slot] === id) return 0;
    const nanites = salvageValue(item);
    if (!useItemsStore.getState().credit("nanites", nanites)) return 0;
    set({ items: items.filter((i) => i.id !== id) });
    usePlayerStore.getState().recordSalvage(nanites);
    return nanites;
  },
  upgrade: (id) => {
    const item = get().items.find((i) => i.id === id);
    if (!item || item.ownerId !== currentOwner() || item.marketPrice || item.level >= MAX_ITEM_LEVEL) return false;
    const cost = upgradeCostNanites(item);
    if (!useItemsStore.getState().debit("nanites", cost)) return false;
    set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, level: i.level + 1, stats: upgradedStats(i.stats) } : i)) }));
    usePlayerStore.getState().addXp(Math.round(cost * XP_PER_NANITE));
    return true;
  },
}));
