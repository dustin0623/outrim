import { beforeEach, describe, expect, it } from "vitest";
import { useAuthStore } from "./auth.store";
import { useItemsStore } from "./items.store";
import { useFleetShipsStore } from "./fleet-ships.store";
import { EMPTY_ITEMS } from "@/lib/game/items/catalog";

describe("ship purchases", () => {
  beforeEach(() => {
    useAuthStore.setState({ player: { id: "captain" } } as never);
    useItemsStore.setState({ accounts: { captain: { ...EMPTY_ITEMS, titanium: 500, plasma: 250, rations: 250 } } });
    useFleetShipsStore.setState({ accounts: {} });
  });
  it("buys attack ships even with zero RIM", () => {
    expect(useFleetShipsStore.getState().buyShips("vanguard-striker", 2)).toBe(true);
    expect(useItemsStore.getState().accounts.captain).toMatchObject({ rim: 0, nanites: 0, titanium: 260, plasma: 130, rations: 250 });
    expect(useFleetShipsStore.getState().accounts.captain?.["vanguard-striker"]).toBe(2);
  });
  it("buys defense ships using only Titanium and Rations", () => {
    expect(useFleetShipsStore.getState().buyShips("bulwark-frigate", 2)).toBe(true);
    expect(useItemsStore.getState().accounts.captain).toMatchObject({ rim: 0, titanium: 220, plasma: 250, rations: 150 });
    expect(useFleetShipsStore.getState().accounts.captain?.["bulwark-frigate"]).toBe(2);
  });
  it("does not partially debit when a required resource is short", () => {
    useItemsStore.setState({ accounts: { captain: { ...EMPTY_ITEMS, titanium: 500, plasma: 59 } } });
    const before = useItemsStore.getState().accounts;
    expect(useFleetShipsStore.getState().buyShips("vanguard-striker", 1)).toBe(false);
    expect(useItemsStore.getState().accounts).toEqual(before);
    expect(useFleetShipsStore.getState().accounts).toEqual({});
  });
  it("rejects invalid quantities without payment", () => {
    const before = useItemsStore.getState().accounts;
    for (const qty of [0, 26, 1.5]) expect(useFleetShipsStore.getState().buyShips("vanguard-striker", qty)).toBe(false);
    expect(useItemsStore.getState().accounts).toEqual(before);
  });
  it("keeps hulls and payments owner-scoped", () => {
    useFleetShipsStore.getState().buyShips("vanguard-striker", 1);
    useAuthStore.setState({ player: { id: "other" } } as never);
    useFleetShipsStore.getState().buyShips("bulwark-frigate", 1);
    expect(useFleetShipsStore.getState().accounts.captain).toEqual({ "vanguard-striker": 1, "bulwark-frigate": 0 });
    expect(useFleetShipsStore.getState().accounts.other).toEqual({ "vanguard-striker": 0, "bulwark-frigate": 1 });
    useAuthStore.setState({ player: null });
    expect(useFleetShipsStore.getState().buyShips("vanguard-striker", 1)).toBe(false);
  });
});