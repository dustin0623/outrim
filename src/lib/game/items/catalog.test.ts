import { describe, expect, it } from "vitest";
import { applyItemBatch, INITIAL_ITEMS, ITEM_CATALOG } from "./catalog";
describe("item quantities", () => {
  it("classifies RIM and Nanites as currencies", () => {
    expect(ITEM_CATALOG.rim.type).toBe("currency");
    expect(ITEM_CATALOG.nanites.type).toBe("currency");
  });
  it("classifies Titanium, Plasma and Rations as resources", () => {
    expect([ITEM_CATALOG.titanium.type, ITEM_CATALOG.plasma.type, ITEM_CATALOG.rations.type]).toEqual(["resource", "resource", "resource"]);
  });
  it("rejects an unaffordable whole batch without deducting RIM", () => {
    expect(applyItemBatch(INITIAL_ITEMS, { rim: 1, titanium: 501 }, -1)).toBeNull();
    expect(INITIAL_ITEMS.rim).toBe(10);
  });
  it("supports decimal currency but only whole resources and containers", () => {
    expect(applyItemBatch(INITIAL_ITEMS, { rim: 0.15 }, -1)?.rim).toBe(9.85);
    expect(applyItemBatch(INITIAL_ITEMS, { titanium: 0.1 }, 1)).toBeNull();
    expect(applyItemBatch(INITIAL_ITEMS, { "equipment-crate": 0.5 }, 1)).toBeNull();
  });
  it("rejects negative, infinite and unsafe amounts", () => {
    for (const rim of [-1, NaN, Infinity, Number.MAX_SAFE_INTEGER]) expect(applyItemBatch(INITIAL_ITEMS, { rim }, 1)).toBeNull();
  });
});