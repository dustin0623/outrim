import { describe, expect, it } from "vitest";
import { equipmentDisplayName, randomItemName } from "./item-names";
import {
  SLOT_META,
  STAT_META,
  GAME_RESOURCE_LABEL,
} from "@/lib/config/constants/game";
import { getTemplatesByKind, getItemTemplateBySlotRarity } from "./templates";

describe("Outrim presentation preserves game identities", () => {
  it("aliases known names while keeping deterministic minted names intact", () => {
    expect(randomItemName("asicMiner", "abc")).toBe("Quantum Miner");
    expect(equipmentDisplayName("Quantum Miner")).toBe(
      "Horizon Extraction Head",
    );
    expect(equipmentDisplayName("USB ASIC Miner")).toBe(
      "Salvaged Extraction Head",
    );
    expect(equipmentDisplayName("Scrapyard ASIC")).toBe(
      "Salvaged Extraction Head",
    );
  });

  it("preserves unknown recorded names without guessing or prototype lookup", () => {
    for (const name of ["Uncatalogued module 91", "", "toString", "__proto__"])
      expect(equipmentDisplayName(name)).toBe(name);
  });

  it("changes labels without changing stat or slot keys", () => {
    expect(GAME_RESOURCE_LABEL).toBe("Alloy (HASH)");
    expect(STAT_META.hashRate.label).toBe("Extraction");
    expect(STAT_META.hackPower.label).toBe("Breach");
    expect(SLOT_META.asicMiner.label).toBe("Extraction Head");
    expect(SLOT_META.firmwareChip.label).toBe("Logic Module");
    expect(
      getItemTemplateBySlotRarity("asicMiner", "legendary").templateId,
    ).toBe(1004);
  });

  it("retains all cosmetic identities, default ownership and unlock levels", () => {
    for (const [kind, offset] of [
      ["avatar", 0],
      ["banner", 100],
      ["background", 200],
    ] as const) {
      const entries = getTemplatesByKind(kind);
      expect(entries).toHaveLength(25);
      expect(entries.map((entry) => entry.templateId)).toEqual(
        Array.from({ length: 25 }, (_, index) => offset + index),
      );
      entries.forEach((entry, index) => {
        expect(entry.requiredLevel).toBe(Math.min((index + 1) * 4, 100));
        expect(entry.soulbound).toBe(index === 0);
      });
    }
  });
});
