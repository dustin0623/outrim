import { beforeEach, describe, expect, it } from "vitest";
import { useAuthStore } from "./auth.store";
import { useItemsStore } from "./items.store";

describe("Supply Depot purchases", () => {
  beforeEach(() => {
    useAuthStore.setState({ player: { id: "shop-tester" } } as never);
    useItemsStore.setState({ accounts: {} });
  });
  it("charges 1 RIM per Disruptor and grants the stack", () => {
    expect(useItemsStore.getState().buyStock("sabotage-device", 3)).toBe(true);
    expect(useItemsStore.getState().getQuantity("sabotage-device")).toBe(3);
    expect(useItemsStore.getState().getQuantity("rim")).toBe(7);
  });
  it("charges 5 RIM per Salvage Crate", () => {
    expect(useItemsStore.getState().buyStock("equipment-crate", 2)).toBe(true);
    expect(useItemsStore.getState().getQuantity("rim")).toBe(0);
  });
  it("rejects more than 25 units or unaffordable orders without changes", () => {
    expect(useItemsStore.getState().buyStock("help-kit", 26)).toBe(false);
    expect(useItemsStore.getState().buyStock("help-kit", 11)).toBe(false);
    expect(useItemsStore.getState().getQuantity("rim")).toBe(10);
    expect(useItemsStore.getState().getQuantity("help-kit")).toBe(0);
  });
});
