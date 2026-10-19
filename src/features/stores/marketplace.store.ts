import { create } from "zustand";
import { useEquipmentStore } from "./equipment.store";
/** View preferences only. Listing/ownership changes stay in the equipment store. */
export const useMarketplaceStore = create<{ tab: string; setTab: (tab: string) => void }>((set) => ({ tab: "browse", setTab: (tab) => set({ tab }) }));
export function initializeDemoMarket() {
  if (!import.meta.env.DEV) return;
  const state = useEquipmentStore.getState();
  if (state.items.some((i) => i.id.startsWith("demo-market-"))) return;
  useEquipmentStore.setState({ items: [...state.items,
    { id: "demo-market-carrier", ownerId: "demo-trader", sellerName: "Demo · Starfarer", slot: "mothership", rarity: "uncommon", level: 1, stats: { luck: 1.2, extraction: 0.8 }, marketPrice: 2, listedAt: 1 },
    { id: "demo-market-shield", ownerId: "demo-trader", sellerName: "Demo · Starfarer", slot: "shield", rarity: "rare", level: 1, stats: { defense: 18, luck: 0.8, evasion: 1.4 }, marketPrice: 3, listedAt: 2 },
  ] });
}