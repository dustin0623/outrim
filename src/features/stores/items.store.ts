import { create } from "zustand";
import { useAuthStore } from "./auth.store";
import { applyItemBatch, EMPTY_ITEMS, INITIAL_ITEMS, type ItemId, type Quantities } from "@/lib/game/items/catalog";
export const currentOwner = () => useAuthStore.getState().player?.id ?? null;
type ItemsState = {
  accounts: Record<string, Quantities>;
  getQuantity: (id: ItemId, owner?: string) => number;
  credit: (id: ItemId, amount: number) => boolean;
  debit: (id: ItemId, amount: number) => boolean;
  creditBatch: (batch: Partial<Quantities>) => boolean;
  debitBatch: (batch: Partial<Quantities>) => boolean;
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
  return {
    accounts: {},
    getQuantity: (id, owner) => ownedItems(get().accounts, owner ?? currentOwner())[id],
    credit: (id, amount) => change({ [id]: amount }, 1),
    debit: (id, amount) => change({ [id]: amount }, -1),
    creditBatch: (batch) => change(batch, 1),
    debitBatch: (batch) => change(batch, -1),
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