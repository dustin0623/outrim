import { create } from "zustand";
import { useAuthStore } from "./auth.store";
import { applyItemBatch, EMPTY_ITEMS, INITIAL_ITEMS, MAX_PURCHASE_QUANTITY, SHOP_PRICES_RIM, type ItemId, type Quantities, type ShopItemId } from "@/lib/game/items/catalog";
import { CRATE_RARITY, SHARDS_PER_CRATE, shardId, type CrateId } from "@/lib/game/items/chests";
export const currentOwner = () => useAuthStore.getState().player?.id ?? null;
type ItemsState = {
  accounts: Record<string, Quantities>;
  getQuantity: (id: ItemId, owner?: string) => number;
  credit: (id: ItemId, amount: number) => boolean;
  debit: (id: ItemId, amount: number) => boolean;
  creditBatch: (batch: Partial<Quantities>) => boolean;
  debitBatch: (batch: Partial<Quantities>) => boolean;
  buyContainers: (quantity: number, unitPrice: number) => boolean;
  /** Pay RIM at the catalog price and receive stock in one all-or-nothing change. */
  buyStock: (id: ShopItemId, quantity: number) => boolean;
  craftCrate: (id: CrateId) => boolean;
  transferRim: (buyer: string, seller: string, amount: number) => boolean;
};
export function ownedItems(accounts: Record<string, Quantities>, owner: string | null): Quantities {
  return owner ? accounts[owner] ?? INITIAL_ITEMS : EMPTY_ITEMS;
}
export function useOwnedItems() {
  const owner = useAuthStore((s) => s.player?.id ?? null);
  return useItemsStore((s) => ownedItems(s.accounts, owner));
}
export const useItemsStore = create<ItemsState>((set, get) => {
  const change = (batch: Partial<Quantities>, direction: 1 | -1) => {
    const owner = currentOwner();
    if (!owner) return false;
    const next = applyItemBatch(ownedItems(get().accounts, owner), batch, direction);
    if (!next) return false;
    set((s) => ({ accounts: { ...s.accounts, [owner]: next } }));
    return true;
  };
  const buy = (id: ItemId, quantity: number, unitPrice: number) => {
    const owner = currentOwner();
    if (!owner || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > MAX_PURCHASE_QUANTITY || !Number.isFinite(unitPrice) || unitPrice <= 0) return false;
    const paid = applyItemBatch(ownedItems(get().accounts, owner), { rim: unitPrice * quantity }, -1);
    const next = paid && applyItemBatch(paid, { [id]: quantity }, 1);
    if (!next) return false;
    set((s) => ({ accounts: { ...s.accounts, [owner]: next } }));
    return true;
  };
  return {
    accounts: {},
    getQuantity: (id, owner) => ownedItems(get().accounts, owner ?? currentOwner())[id],
    credit: (id, amount) => change({ [id]: amount }, 1),
    debit: (id, amount) => change({ [id]: amount }, -1),
    creditBatch: (batch) => change(batch, 1),
    debitBatch: (batch) => change(batch, -1),
    buyContainers: (quantity, unitPrice) => buy("equipment-crate", quantity, unitPrice),
    buyStock: (id, quantity) => buy(id, quantity, SHOP_PRICES_RIM[id]),
    craftCrate: (id) => {
      const owner = currentOwner();
      if (!owner || !Object.hasOwn(CRATE_RARITY, id)) return false;
      const paid = applyItemBatch(ownedItems(get().accounts, owner), { [shardId(CRATE_RARITY[id])]: SHARDS_PER_CRATE }, -1);
      const next = paid && applyItemBatch(paid, { [id]: 1 }, 1);
      if (!next) return false;
      set((s) => ({ accounts: { ...s.accounts, [owner]: next } }));
      return true;
    },
    transferRim: (buyer, seller, amount) => {
      if (buyer === seller || amount <= 0) return false;
      const b = applyItemBatch(ownedItems(get().accounts, buyer), { rim: amount }, -1);
      const s = applyItemBatch(ownedItems(get().accounts, seller), { rim: amount }, 1);
      if (!b || !s) return false;
      set((state) => ({ accounts: { ...state.accounts, [buyer]: b, [seller]: s } }));
      return true;
    },
  };
});