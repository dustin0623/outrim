import { beforeEach, describe, expect, it } from "vitest";
import { useAuthStore } from "./auth.store";
import { useItemsStore } from "./items.store";
import { useEquipmentStore } from "./equipment.store";
import { CRATE_IDS, CRATE_RARITY, shardId } from "@/lib/game/items/chests";
describe("shard forging", () => {
  beforeEach(() => { useAuthStore.setState({ player: { id: "crafter" } } as never); useItemsStore.setState({ accounts: {} }); useEquipmentStore.setState({ items: [], equipped: {} }); });
  it("consumes exactly 100 matching item shards for one crate of every rarity", () => {
    for (const id of CRATE_IDS) { const shard = shardId(CRATE_RARITY[id]); useItemsStore.getState().credit(shard, 100); expect(useItemsStore.getState().craftCrate(id)).toBe(true); expect(useItemsStore.getState().getQuantity(shard)).toBe(0); expect(useItemsStore.getState().getQuantity(id)).toBe(1); }
  });
  it("does not accept 99 shards or consume a different rarity", () => { useItemsStore.getState().credit("shard-rare", 99); useItemsStore.getState().credit("shard-common", 100); expect(useItemsStore.getState().craftCrate("crate-rare")).toBe(false); expect(useItemsStore.getState().getQuantity("shard-rare")).toBe(99); expect(useItemsStore.getState().getQuantity("shard-common")).toBe(100); });
  it("opens a Legendary crate into Legendary equipment exactly once", () => { useItemsStore.getState().credit("crate-legendary", 1); expect(useEquipmentStore.getState().openCrate("crate-legendary")?.rarity).toBe("legendary"); expect(useEquipmentStore.getState().openCrate("crate-legendary")).toBeNull(); });
});