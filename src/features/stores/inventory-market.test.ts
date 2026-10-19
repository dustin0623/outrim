import { beforeEach, describe, expect, it } from "vitest";
import { useAuthStore } from "./auth.store";
import { useItemsStore } from "./items.store";
import { useEquipmentStore, type OwnedEquipment } from "./equipment.store";
import { useStationStore } from "./station.store";
import { INITIAL_ITEMS } from "@/lib/game/items/catalog";
import type { Player } from "@/features/types/auth.types";
const seller = "00000000-0000-4000-8000-000000000001";
const buyer = "00000000-0000-4000-8000-000000000002";
function signIn(id: string) {
  const player: Player = { id, username: "operator", displayName: "Operator", walletAddress: null, email: null, isEmailVerified: false, avatarUrl: null, lastLoginAt: null, createdAt: "2026-10-19", updatedAt: "2026-10-19" };
  useAuthStore.getState().setPlayer(player);
}
const gear: OwnedEquipment = { id: "gear-1", ownerId: seller, slot: "shield", rarity: "common", stats: { defense: 10 }, level: 1 };
beforeEach(() => {
  signIn(seller);
  useItemsStore.setState({ accounts: {} });
  useEquipmentStore.setState({ items: [{ ...gear }], equipped: {} });
});
describe("inventory and marketplace", () => {
  it("opening consumes an owned crate, not RIM", () => {
    expect(useEquipmentStore.getState().openCrate()).toBeNull();
    expect(useEquipmentStore.getState().buyCrates(1)).toBe(true);
    expect(useItemsStore.getState().getQuantity("rim")).toBe(5);
    expect(useEquipmentStore.getState().openCrate()?.ownerId).toBe(seller);
    expect(useItemsStore.getState().getQuantity("equipment-crate")).toBe(0);
    expect(useItemsStore.getState().getQuantity("rim")).toBe(5);
  });
  it("uses only Nanites for equipment upgrades and credits salvage to Nanites", () => {
    expect(useEquipmentStore.getState().upgrade(gear.id)).toBe(false);
    useItemsStore.getState().credit("nanites", 1);
    expect(useEquipmentStore.getState().upgrade(gear.id)).toBe(true);
    expect(useItemsStore.getState().getQuantity("rim")).toBe(10);
    expect(useItemsStore.getState().getQuantity("nanites")).toBe(0.75);
    expect(useEquipmentStore.getState().salvage(gear.id)).toBe(5.25);
    expect(useItemsStore.getState().getQuantity("nanites")).toBe(6);
  });
  it("locks listed equipment against equip, upgrade and salvage", () => {
    expect(useEquipmentStore.getState().list(gear.id, 2, "Seller")).toBe(true);
    useEquipmentStore.getState().equip(gear.id);
    expect(useEquipmentStore.getState().equipped.shield).toBeUndefined();
    expect(useEquipmentStore.getState().salvage(gear.id)).toBe(0);
    expect(useEquipmentStore.getState().upgrade(gear.id)).toBe(false);
    expect(useEquipmentStore.getState().cancel(gear.id)).toBe(true);
    useEquipmentStore.getState().equip(gear.id);
    expect(useEquipmentStore.getState().list(gear.id, 2, "Seller")).toBe(false);
  });
  it("transfers the exact RIM asking price and gear ownership once", () => {
    useEquipmentStore.getState().list(gear.id, 2.5, "Seller");
    expect(useEquipmentStore.getState().purchase(gear.id, 2.5)).toBe(false);
    signIn(buyer);
    expect(useEquipmentStore.getState().cancel(gear.id)).toBe(false);
    expect(useEquipmentStore.getState().purchase(gear.id, 2)).toBe(false);
    expect(useEquipmentStore.getState().purchase(gear.id, 2.5)).toBe(true);
    expect(useItemsStore.getState().getQuantity("rim", buyer)).toBe(7.5);
    expect(useItemsStore.getState().getQuantity("rim", seller)).toBe(12.5);
    expect(useEquipmentStore.getState().items[0]).toMatchObject({ ownerId: buyer, marketPrice: undefined });
    expect(useEquipmentStore.getState().purchase(gear.id, 2.5)).toBe(false);
  });
  it("rejects invalid prices and insufficient funds without changing ownership", () => {
    for (const p of [0, -1, 0.001, NaN, Infinity]) expect(useEquipmentStore.getState().list(gear.id, p, "Seller")).toBe(false);
    useEquipmentStore.getState().list(gear.id, 11, "Seller");
    signIn(buyer);
    expect(useEquipmentStore.getState().purchase(gear.id, 11)).toBe(false);
    expect(useEquipmentStore.getState().items[0].ownerId).toBe(seller);
    expect(useItemsStore.getState().getQuantity("rim")).toBe(10);
  });
  it("keeps station spendable balances only in items", () => {
    expect(useStationStore.getState()).not.toHaveProperty("balance");
    expect(useStationStore.getState()).not.toHaveProperty("nanites");
    useStationStore.setState({ levels: { tribute: 1, titanium: 1, plasma: 1, rations: 1, vault: 1, attack: 1, defense: 1 }, lastCollectedAt: Date.now() - 3_600_000 });
    expect(useStationStore.getState().secureHaul()).toMatchObject({ rim: 1, titanium: 40, plasma: 20, rations: 25 });
    expect(useItemsStore.getState().getQuantity("rim")).toBe(11);
    expect(useStationStore.getState().upgrade("tribute")).toBe(true);
    expect(useItemsStore.getState().getQuantity("titanium")).toBe(INITIAL_ITEMS.titanium);
  });
});