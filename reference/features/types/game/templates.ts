import type { Rarity, SlotKey } from "@/features/types/game/types";

// ─────────────────────────────────────────────────────────────────────────
// Single source of truth for every templateId in the game.
//
// This replaces the `templates` MongoDB collection entirely — there is no
// DB round-trip for template metadata anymore. Cosmetics (avatar/banner/
// background) are never persisted as owned rows anywhere; "ownership" is
// derived at read time from `player.level >= requiredLevel`. Gear (item)
// templates describe the slot+rarity combinations that live as real rows
// in the `equipments` collection.
//
// No `mintCount` / `maxSupply` / `mintNumber` fields exist here — there is
// no per-template edition tracking anymore.
// ─────────────────────────────────────────────────────────────────────────

export type CosmeticKind = "avatar" | "banner" | "background";
export type TemplateKind = CosmeticKind | "item";

export interface CosmeticTemplateEntry {
  templateId: number;
  kind: CosmeticKind;
  name: string;
  image: string;
  /** True only for the free starter template of each kind (0 / 100 / 200). */
  soulbound: boolean;
  /** Player level required to unlock/equip this cosmetic. */
  requiredLevel: number;
}

export interface ItemTemplateEntry {
  templateId: number;
  kind: "item";
  name: string;
  image: string;
  slot: SlotKey;
  rarity: Rarity;
}

export type TemplateEntry = CosmeticTemplateEntry | ItemTemplateEntry;

// ─── Cosmetic source data (before requiredLevel is computed) ──────────────
// templateId ranges: avatar 0–99, banner 100–199, background 200–299.
// Index 0 of each range is the soulbound default granted free on register.

type CosmeticSource = Omit<CosmeticTemplateEntry, "requiredLevel">;

const avatarSources: CosmeticSource[] = [
  {
    templateId: 0,
    kind: "avatar",
    name: "The Operator",
    image: "/assets/avatars/the-operator.webp",
    soulbound: true,
  },
  {
    templateId: 1,
    kind: "avatar",
    name: "Belt Mechanic",
    image: "/assets/avatars/the-rig-runner.webp",
    soulbound: false,
  },
  {
    templateId: 2,
    kind: "avatar",
    name: "Night Surveyor",
    image: "/assets/avatars/the-ghost.webp",
    soulbound: false,
  },
  {
    templateId: 3,
    kind: "avatar",
    name: "Reactor Tender",
    image: "/assets/avatars/the-overclocker.webp",
    soulbound: false,
  },
  {
    templateId: 4,
    kind: "avatar",
    name: "Signal Runner",
    image: "/assets/avatars/the-vault-keeper.webp",
    soulbound: false,
  },
  {
    templateId: 5,
    kind: "avatar",
    name: "Breach Specialist",
    image: "/assets/avatars/the-exploit.webp",
    soulbound: false,
  },
  {
    templateId: 6,
    kind: "avatar",
    name: "Scrap Broker",
    image: "/assets/avatars/the-node.webp",
    soulbound: false,
  },
  {
    templateId: 7,
    kind: "avatar",
    name: "Station Architect",
    image: "/assets/avatars/the-miner-king.webp",
    soulbound: false,
  },
  {
    templateId: 8,
    kind: "avatar",
    name: "Cryo Engineer",
    image: "/assets/avatars/the-phantom.webp",
    soulbound: false,
  },
  {
    templateId: 9,
    kind: "avatar",
    name: "Drift Nomad",
    image: "/assets/avatars/the-architect.webp",
    soulbound: false,
  },
  {
    templateId: 10,
    kind: "avatar",
    name: "Deep Prospector",
    image: "/assets/avatars/the-rogue-ai.webp",
    soulbound: false,
  },
  {
    templateId: 11,
    kind: "avatar",
    name: "Hold Warden",
    image: "/assets/avatars/the-nomad.webp",
    soulbound: false,
  },
  {
    templateId: 12,
    kind: "avatar",
    name: "Array Sentinel",
    image: "/assets/avatars/the-cryptobro.webp",
    soulbound: false,
  },
  {
    templateId: 13,
    kind: "avatar",
    name: "Outpost Marshal",
    image: "/assets/avatars/the-scavenger.webp",
    soulbound: false,
  },
  {
    templateId: 14,
    kind: "avatar",
    name: "Circuit Medic",
    image: "/assets/avatars/the-warlord.webp",
    soulbound: false,
  },
  {
    templateId: 15,
    kind: "avatar",
    name: "Rim Scavenger",
    image: "/assets/avatars/the-shadow-broker.webp",
    soulbound: false,
  },
  {
    templateId: 16,
    kind: "avatar",
    name: "Quiet Navigator",
    image: "/assets/avatars/the-zero-day.webp",
    soulbound: false,
  },
  {
    templateId: 17,
    kind: "avatar",
    name: "Pressure Welder",
    image: "/assets/avatars/the-blockchain-monk.webp",
    soulbound: false,
  },
  {
    templateId: 18,
    kind: "avatar",
    name: "Rig Foreman",
    image: "/assets/avatars/the-ice-queen.webp",
    soulbound: false,
  },
  {
    templateId: 19,
    kind: "avatar",
    name: "Field Analyst",
    image: "/assets/avatars/the-payload.webp",
    soulbound: false,
  },
  {
    templateId: 20,
    kind: "avatar",
    name: "Cargo Steward",
    image: "/assets/avatars/the-ferret.webp",
    soulbound: false,
  },
  {
    templateId: 21,
    kind: "avatar",
    name: "Relay Keeper",
    image: "/assets/avatars/the-sentry.webp",
    soulbound: false,
  },
  {
    templateId: 22,
    kind: "avatar",
    name: "Salvage Captain",
    image: "/assets/avatars/the-drain.webp",
    soulbound: false,
  },
  {
    templateId: 23,
    kind: "avatar",
    name: "Frontier Veteran",
    image: "/assets/avatars/the-oracle.webp",
    soulbound: false,
  },
  {
    templateId: 24,
    kind: "avatar",
    name: "Horizon Pioneer",
    image: "/assets/avatars/the-syndicate-boss.webp",
    soulbound: false,
  },
];

const bannerSources: CosmeticSource[] = [
  {
    templateId: 100,
    kind: "banner",
    name: "First Shift",
    image: "/assets/banners/the-data-mine.webp",
    soulbound: true,
  },
  {
    templateId: 101,
    kind: "banner",
    name: "The Extraction Line",
    image: "/assets/banners/hash-canyon.webp",
    soulbound: false,
  },
  {
    templateId: 102,
    kind: "banner",
    name: "Outpost Afterlight",
    image: "/assets/banners/the-vault-district.webp",
    soulbound: false,
  },
  {
    templateId: 103,
    kind: "banner",
    name: "Blue Signal",
    image: "/assets/banners/exploit-city.webp",
    soulbound: false,
  },
  {
    templateId: 104,
    kind: "banner",
    name: "Reactor Hall",
    image: "/assets/banners/the-rig-farm.webp",
    soulbound: false,
  },
  {
    templateId: 105,
    kind: "banner",
    name: "The Supply Dock",
    image: "/assets/banners/genesis-block.webp",
    soulbound: false,
  },
  {
    templateId: 106,
    kind: "banner",
    name: "Belt Crossing",
    image: "/assets/banners/circuit-wasteland.webp",
    soulbound: false,
  },
  {
    templateId: 107,
    kind: "banner",
    name: "Quiet Orbit",
    image: "/assets/banners/the-network.webp",
    soulbound: false,
  },
  {
    templateId: 108,
    kind: "banner",
    name: "Thermal Dawn",
    image: "/assets/banners/raid-night.webp",
    soulbound: false,
  },
  {
    templateId: 109,
    kind: "banner",
    name: "Relay Ridge",
    image: "/assets/banners/the-overclocked-sky.webp",
    soulbound: false,
  },
  {
    templateId: 110,
    kind: "banner",
    name: "Survey Camp",
    image: "/assets/banners/deep-protocol.webp",
    soulbound: false,
  },
  {
    templateId: 111,
    kind: "banner",
    name: "The Hold Gate",
    image: "/assets/banners/hash-horizon.webp",
    soulbound: false,
  },
  {
    templateId: 112,
    kind: "banner",
    name: "Working Frontier",
    image: "/assets/banners/the-dark-pool.webp",
    soulbound: false,
  },
  {
    templateId: 113,
    kind: "banner",
    name: "Iron Shelter",
    image: "/assets/banners/firewall-fortress.webp",
    soulbound: false,
  },
  {
    templateId: 114,
    kind: "banner",
    name: "The Repair Bay",
    image: "/assets/banners/the-syndicate-lounge.webp",
    soulbound: false,
  },
  {
    templateId: 115,
    kind: "banner",
    name: "Foundry District",
    image: "/assets/banners/zero-day-dawn.webp",
    soulbound: false,
  },
  {
    templateId: 116,
    kind: "banner",
    name: "Cold Light",
    image: "/assets/banners/block-storm.webp",
    soulbound: false,
  },
  {
    templateId: 117,
    kind: "banner",
    name: "Derelict Span",
    image: "/assets/banners/cold-storage.webp",
    soulbound: false,
  },
  {
    templateId: 118,
    kind: "banner",
    name: "Operator Row",
    image: "/assets/banners/notoriety-row.webp",
    soulbound: false,
  },
  {
    templateId: 119,
    kind: "banner",
    name: "Impact Basin",
    image: "/assets/banners/the-patch.webp",
    soulbound: false,
  },
  {
    templateId: 120,
    kind: "banner",
    name: "Midnight Convoy",
    image: "/assets/banners/liquidation-event.webp",
    soulbound: false,
  },
  {
    templateId: 121,
    kind: "banner",
    name: "The Exchange",
    image: "/assets/banners/genesis-crater.webp",
    soulbound: false,
  },
  {
    templateId: 122,
    kind: "banner",
    name: "Last Worklight",
    image: "/assets/banners/the-leaderboard-tower.webp",
    soulbound: false,
  },
  {
    templateId: 123,
    kind: "banner",
    name: "Deep Array",
    image: "/assets/banners/protocol-graveyard.webp",
    soulbound: false,
  },
  {
    templateId: 124,
    kind: "banner",
    name: "Beyond Supply",
    image: "/assets/banners/the-final-hash.webp",
    soulbound: false,
  },
];

const backgroundSources: CosmeticSource[] = [
  {
    templateId: 200,
    kind: "background",
    name: "The Extraction Pit",
    image: "/assets/backgrounds/the-deep-mine.webp",
    soulbound: true,
  },
  {
    templateId: 201,
    kind: "background",
    name: "Asteroid Foundry",
    image: "/assets/backgrounds/circuit-horizon.webp",
    soulbound: false,
  },
  {
    templateId: 202,
    kind: "background",
    name: "Relay Station",
    image: "/assets/backgrounds/server-cathedral.webp",
    soulbound: false,
  },
  {
    templateId: 203,
    kind: "background",
    name: "The Quiet Belt",
    image: "/assets/backgrounds/the-void-network.webp",
    soulbound: false,
  },
  {
    templateId: 204,
    kind: "background",
    name: "Cold Storage",
    image: "/assets/backgrounds/hash-storm.webp",
    soulbound: false,
  },
  {
    templateId: 205,
    kind: "background",
    name: "The Workyard",
    image: "/assets/backgrounds/the-cold-vault.webp",
    soulbound: false,
  },
  {
    templateId: 206,
    kind: "background",
    name: "Reactor Deck",
    image: "/assets/backgrounds/protocol-rain.webp",
    soulbound: false,
  },
  {
    templateId: 207,
    kind: "background",
    name: "Rim Observatory",
    image: "/assets/backgrounds/genesis-crater.webp",
    soulbound: false,
  },
  {
    templateId: 208,
    kind: "background",
    name: "The Rig Room",
    image: "/assets/backgrounds/the-rig-room.webp",
    soulbound: false,
  },
  {
    templateId: 209,
    kind: "background",
    name: "Outpost Walkway",
    image: "/assets/backgrounds/exploit-horizon.webp",
    soulbound: false,
  },
  {
    templateId: 210,
    kind: "background",
    name: "Orbital Debris",
    image: "/assets/backgrounds/deep-protocol-sea.webp",
    soulbound: false,
  },
  {
    templateId: 211,
    kind: "background",
    name: "Thermal Fields",
    image: "/assets/backgrounds/firewall-dusk.webp",
    soulbound: false,
  },
  {
    templateId: 212,
    kind: "background",
    name: "Signal Canyon",
    image: "/assets/backgrounds/binary-forest.webp",
    soulbound: false,
  },
  {
    templateId: 213,
    kind: "background",
    name: "The Exposed Hold",
    image: "/assets/backgrounds/the-mempool.webp",
    soulbound: false,
  },
  {
    templateId: 214,
    kind: "background",
    name: "Salvage Berth",
    image: "/assets/backgrounds/overclocked-night.webp",
    soulbound: false,
  },
  {
    templateId: 215,
    kind: "background",
    name: "Buried Installation",
    image: "/assets/backgrounds/notoriety-alley.webp",
    soulbound: false,
  },
  {
    templateId: 216,
    kind: "background",
    name: "Blue Dust",
    image: "/assets/backgrounds/block-graveyard.webp",
    soulbound: false,
  },
  {
    templateId: 217,
    kind: "background",
    name: "Steel Horizon",
    image: "/assets/backgrounds/cold-storage-facility.webp",
    soulbound: false,
  },
  {
    templateId: 218,
    kind: "background",
    name: "The Repair Hangar",
    image: "/assets/backgrounds/the-hash-abyss.webp",
    soulbound: false,
  },
  {
    templateId: 219,
    kind: "background",
    name: "Deep Core",
    image: "/assets/backgrounds/syndicate-tower.webp",
    soulbound: false,
  },
  {
    templateId: 220,
    kind: "background",
    name: "Distant Supply",
    image: "/assets/backgrounds/liquidity-pool.webp",
    soulbound: false,
  },
  {
    templateId: 221,
    kind: "background",
    name: "Abandoned Colony",
    image: "/assets/backgrounds/zero-day-sky.webp",
    soulbound: false,
  },
  {
    templateId: 222,
    kind: "background",
    name: "Midnight Gantry",
    image: "/assets/backgrounds/the-dark-pool-exchange.webp",
    soulbound: false,
  },
  {
    templateId: 223,
    kind: "background",
    name: "Frontier Shelter",
    image: "/assets/backgrounds/proof-of-work.webp",
    soulbound: false,
  },
  {
    templateId: 224,
    kind: "background",
    name: "The Outer Rim",
    image: "/assets/backgrounds/the-final-block.webp",
    soulbound: false,
  },
];

// Each category unlocks one cosmetic every 4 levels; the 25th item in every
// category unlocks at level 100, so all current cosmetics are reachable by
// the level cap. The soulbound default (index 0) is granted for free on
// register regardless of this computed value.
function withRequiredLevels(
  sources: CosmeticSource[],
): CosmeticTemplateEntry[] {
  return sources.map((source, index) => ({
    ...source,
    requiredLevel: Math.min((index + 1) * 4, 100),
  }));
}

const avatarEntries = withRequiredLevels(avatarSources);
const bannerEntries = withRequiredLevels(bannerSources);
const backgroundEntries = withRequiredLevels(backgroundSources);

// ─── Gear (item) source data ───────────────────────────────────────────────
// templateId ranges, slot-keyed: asicMiner 1000s, motherboard 2000s,
// powerSupply 3000s, coolingSystem 4000s, networkModule 5000s,
// firmwareChip 6000s. Within each range: x000=common … x004=legendary.

const itemEntries: ItemTemplateEntry[] = [
  {
    templateId: 1000,
    kind: "item",
    name: "Salvaged Extraction Head",
    slot: "asicMiner",
    rarity: "common",
    image: "/assets/items/asic-miner-common.webp",
  },
  {
    templateId: 1001,
    kind: "item",
    name: "Refitted Extraction Head",
    slot: "asicMiner",
    rarity: "uncommon",
    image: "/assets/items/asic-miner-uncommon.webp",
  },
  {
    templateId: 1002,
    kind: "item",
    name: "Surveyor Extraction Head",
    slot: "asicMiner",
    rarity: "rare",
    image: "/assets/items/asic-miner-rare.webp",
  },
  {
    templateId: 1003,
    kind: "item",
    name: "Vanguard Extraction Head",
    slot: "asicMiner",
    rarity: "epic",
    image: "/assets/items/asic-miner-epic.webp",
  },
  {
    templateId: 1004,
    kind: "item",
    name: "Horizon Extraction Head",
    slot: "asicMiner",
    rarity: "legendary",
    image: "/assets/items/asic-miner-legendary.webp",
  },

  {
    templateId: 2000,
    kind: "item",
    name: "Salvaged Control Core",
    slot: "motherboard",
    rarity: "common",
    image: "/assets/items/motherboard-common.webp",
  },
  {
    templateId: 2001,
    kind: "item",
    name: "Refitted Control Core",
    slot: "motherboard",
    rarity: "uncommon",
    image: "/assets/items/motherboard-uncommon.webp",
  },
  {
    templateId: 2002,
    kind: "item",
    name: "Surveyor Control Core",
    slot: "motherboard",
    rarity: "rare",
    image: "/assets/items/motherboard-rare.webp",
  },
  {
    templateId: 2003,
    kind: "item",
    name: "Vanguard Control Core",
    slot: "motherboard",
    rarity: "epic",
    image: "/assets/items/motherboard-epic.webp",
  },
  {
    templateId: 2004,
    kind: "item",
    name: "Horizon Control Core",
    slot: "motherboard",
    rarity: "legendary",
    image: "/assets/items/motherboard-legendary.webp",
  },

  {
    templateId: 3000,
    kind: "item",
    name: "Salvaged Reactor",
    slot: "powerSupply",
    rarity: "common",
    image: "/assets/items/power-supply-common.webp",
  },
  {
    templateId: 3001,
    kind: "item",
    name: "Refitted Reactor",
    slot: "powerSupply",
    rarity: "uncommon",
    image: "/assets/items/power-supply-uncommon.webp",
  },
  {
    templateId: 3002,
    kind: "item",
    name: "Surveyor Reactor",
    slot: "powerSupply",
    rarity: "rare",
    image: "/assets/items/power-supply-rare.webp",
  },
  {
    templateId: 3003,
    kind: "item",
    name: "Vanguard Reactor",
    slot: "powerSupply",
    rarity: "epic",
    image: "/assets/items/power-supply-epic.webp",
  },
  {
    templateId: 3004,
    kind: "item",
    name: "Horizon Reactor",
    slot: "powerSupply",
    rarity: "legendary",
    image: "/assets/items/power-supply-legendary.webp",
  },

  {
    templateId: 4000,
    kind: "item",
    name: "Salvaged Thermal Array",
    slot: "coolingSystem",
    rarity: "common",
    image: "/assets/items/cooling-system-common.webp",
  },
  {
    templateId: 4001,
    kind: "item",
    name: "Refitted Thermal Array",
    slot: "coolingSystem",
    rarity: "uncommon",
    image: "/assets/items/cooling-system-uncommon.webp",
  },
  {
    templateId: 4002,
    kind: "item",
    name: "Surveyor Thermal Array",
    slot: "coolingSystem",
    rarity: "rare",
    image: "/assets/items/cooling-system-rare.webp",
  },
  {
    templateId: 4003,
    kind: "item",
    name: "Vanguard Thermal Array",
    slot: "coolingSystem",
    rarity: "epic",
    image: "/assets/items/cooling-system-epic.webp",
  },
  {
    templateId: 4004,
    kind: "item",
    name: "Horizon Thermal Array",
    slot: "coolingSystem",
    rarity: "legendary",
    image: "/assets/items/cooling-system-legendary.webp",
  },

  {
    templateId: 5000,
    kind: "item",
    name: "Salvaged Signal Array",
    slot: "networkModule",
    rarity: "common",
    image: "/assets/items/network-module-common.webp",
  },
  {
    templateId: 5001,
    kind: "item",
    name: "Refitted Signal Array",
    slot: "networkModule",
    rarity: "uncommon",
    image: "/assets/items/network-module-uncommon.webp",
  },
  {
    templateId: 5002,
    kind: "item",
    name: "Surveyor Signal Array",
    slot: "networkModule",
    rarity: "rare",
    image: "/assets/items/network-module-rare.webp",
  },
  {
    templateId: 5003,
    kind: "item",
    name: "Vanguard Signal Array",
    slot: "networkModule",
    rarity: "epic",
    image: "/assets/items/network-module-epic.webp",
  },
  {
    templateId: 5004,
    kind: "item",
    name: "Horizon Signal Array",
    slot: "networkModule",
    rarity: "legendary",
    image: "/assets/items/network-module-legendary.webp",
  },

  {
    templateId: 6000,
    kind: "item",
    name: "Salvaged Logic Module",
    slot: "firmwareChip",
    rarity: "common",
    image: "/assets/items/firmware-chip-common.webp",
  },
  {
    templateId: 6001,
    kind: "item",
    name: "Refitted Logic Module",
    slot: "firmwareChip",
    rarity: "uncommon",
    image: "/assets/items/firmware-chip-uncommon.webp",
  },
  {
    templateId: 6002,
    kind: "item",
    name: "Surveyor Logic Module",
    slot: "firmwareChip",
    rarity: "rare",
    image: "/assets/items/firmware-chip-rare.webp",
  },
  {
    templateId: 6003,
    kind: "item",
    name: "Vanguard Logic Module",
    slot: "firmwareChip",
    rarity: "epic",
    image: "/assets/items/firmware-chip-epic.webp",
  },
  {
    templateId: 6004,
    kind: "item",
    name: "Horizon Logic Module",
    slot: "firmwareChip",
    rarity: "legendary",
    image: "/assets/items/firmware-chip-legendary.webp",
  },
];

// ─── Combined catalog ───────────────────────────────────────────────────────

const allEntries: TemplateEntry[] = [
  ...avatarEntries,
  ...bannerEntries,
  ...backgroundEntries,
  ...itemEntries,
];

export const TEMPLATES: ReadonlyMap<number, TemplateEntry> = new Map(
  allEntries.map((entry) => [entry.templateId, entry]),
);

export const DEFAULT_AVATAR_TEMPLATE_ID = 0;
export const DEFAULT_BANNER_TEMPLATE_ID = 100;
export const DEFAULT_BACKGROUND_TEMPLATE_ID = 200;

// ─── Lookup helpers ─────────────────────────────────────────────────────────

export function getTemplate(templateId: number): TemplateEntry | undefined {
  return TEMPLATES.get(templateId);
}

export function getTemplatesByKind(kind: CosmeticKind): CosmeticTemplateEntry[];
export function getTemplatesByKind(kind: "item"): ItemTemplateEntry[];
export function getTemplatesByKind(kind: TemplateKind): TemplateEntry[] {
  return allEntries.filter((entry) => entry.kind === kind);
}

export function getItemTemplateBySlotRarity(
  slot: SlotKey,
  rarity: Rarity,
): ItemTemplateEntry {
  const entry = itemEntries.find((e) => e.slot === slot && e.rarity === rarity);
  if (!entry)
    throw new Error(
      `No item template found for slot="${slot}" rarity="${rarity}"`,
    );
  return entry;
}

function getCosmeticByTemplateId(
  kind: CosmeticKind,
  templateId: number,
): CosmeticTemplateEntry | undefined {
  const entry = getTemplate(templateId);
  return entry && entry.kind === kind ? entry : undefined;
}

export function getAvatarByTemplateId(
  templateId: number,
): CosmeticTemplateEntry | undefined {
  return getCosmeticByTemplateId("avatar", templateId);
}

export function getBannerByTemplateId(
  templateId: number,
): CosmeticTemplateEntry | undefined {
  return getCosmeticByTemplateId("banner", templateId);
}

export function getBackgroundByTemplateId(
  templateId: number,
): CosmeticTemplateEntry | undefined {
  return getCosmeticByTemplateId("background", templateId);
}

// ─── Cosmetic unlock helpers ────────────────────────────────────────────────
// Cosmetics have no DB presence at all — "unlocked" is just a pure
// comparison against the player's current level. No ownership row, no
// mint/purchase step, no async call.

/** True if `templateId` is soulbound, or the player's level meets its requiredLevel. */
export function isCosmeticUnlocked(
  playerLevel: number,
  templateId: number,
): boolean {
  const entry = getTemplate(templateId);
  if (!entry || entry.kind === "item") return false;
  return entry.soulbound || playerLevel >= entry.requiredLevel;
}

// ─── Sanity checks (run once at module load) ───────────────────────────────

function validateCatalog(): void {
  if (allEntries.length !== TEMPLATES.size) {
    throw new Error("Duplicate templateId detected in the template catalog");
  }
  for (const entry of allEntries) {
    if (entry.kind !== "item") {
      if (
        !Number.isInteger(entry.requiredLevel) ||
        entry.requiredLevel < 1 ||
        entry.requiredLevel > 100
      ) {
        throw new Error(
          `Invalid requiredLevel for template ${entry.templateId}`,
        );
      }
    }
  }
}

validateCatalog();
