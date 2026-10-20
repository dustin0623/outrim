import { beforeEach, describe, expect, it } from "vitest";
import { useAuthStore } from "./auth.store";
import { useItemsStore } from "./items.store";
import { useTroopsStore } from "./troops.store";
import { EMPTY_ITEMS } from "@/lib/game/items/catalog";

describe("troop recruitment", () => {
  beforeEach(() => {
    useAuthStore.setState({ player: { id: "captain" } } as never);
    useItemsStore.setState({ accounts: { captain: { ...EMPTY_ITEMS, titanium: 500, plasma: 250, rations: 250 } } });
    useTroopsStore.setState({ accounts: {} });
  });
  it("recruits instantly with zero RIM", () => {
    expect(useTroopsStore.getState().recruit("soldier", 2)).toBe(true);
    expect(useItemsStore.getState().accounts["captain"]).toMatchObject({ rim: 0, titanium: 440, plasma: 250, rations: 170 });
    expect(useTroopsStore.getState().accounts["captain"]?.soldier).toBe(2);
  });
  it("does not partially debit when short", () => {
    const before = useItemsStore.getState().accounts;
    expect(useTroopsStore.getState().recruit("aegis-dreadnought", 2)).toBe(false);
    expect(useItemsStore.getState().accounts).toEqual(before);
    expect(useTroopsStore.getState().accounts).toEqual({});
  });
  it("keeps troops owner-scoped and requires login", () => {
    useTroopsStore.getState().recruit("archer", 1);
    useAuthStore.setState({ player: { id: "other" } } as never);
    useItemsStore.setState((s) => ({ accounts: { ...s.accounts, other: { ...EMPTY_ITEMS, titanium: 100, plasma: 100, rations: 100 } } }));
    useTroopsStore.getState().recruit("cavalry", 1);
    expect(useTroopsStore.getState().accounts["captain"]?.archer).toBe(1);
    expect(useTroopsStore.getState().accounts["other"]?.cavalry).toBe(1);
    useAuthStore.setState({ player: null });
    expect(useTroopsStore.getState().recruit("soldier", 1)).toBe(false);
  });
});
