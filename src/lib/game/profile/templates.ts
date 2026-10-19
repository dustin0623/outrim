/**
 * Cosmetic template catalog — ported from reference/features/types/game/templates.ts.
 *
 * Single source of truth for every cosmetic templateId. Ownership is derived at
 * read time from `playerLevel >= requiredLevel`; nothing is persisted as owned.
 *
 * templateId ranges: avatar 0–99, banner 100–199, background 200–299.
 * Index 0 of each range is the soulbound default granted free on register.
 * Each category unlocks one cosmetic every 4 levels; the 25th item in every
 * category unlocks at level 100 (the level cap).
 */

export type CosmeticKind = "avatar" | "banner" | "background";

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

type CosmeticSource = Omit<CosmeticTemplateEntry, "requiredLevel">;

const avatarSources: CosmeticSource[] = [
  { templateId: 0, kind: "avatar", name: "The Operator", image: "/assets/avatars/the-operator.webp", soulbound: true },
  { templateId: 1, kind: "avatar", name: "Belt Mechanic", image: "/assets/avatars/the-rig-runner.webp", soulbound: false },
  { templateId: 2, kind: "avatar", name: "Night Surveyor", image: "/assets/avatars/the-ghost.webp", soulbound: false },
  { templateId: 3, kind: "avatar", name: "Reactor Tender", image: "/assets/avatars/the-overclocker.webp", soulbound: false },
  { templateId: 4, kind: "avatar", name: "Signal Runner", image: "/assets/avatars/the-vault-keeper.webp", soulbound: false },
  { templateId: 5, kind: "avatar", name: "Breach Specialist", image: "/assets/avatars/the-exploit.webp", soulbound: false },
  { templateId: 6, kind: "avatar", name: "Scrap Broker", image: "/assets/avatars/the-node.webp", soulbound: false },
  { templateId: 7, kind: "avatar", name: "Station Architect", image: "/assets/avatars/the-miner-king.webp", soulbound: false },
  { templateId: 8, kind: "avatar", name: "Cryo Engineer", image: "/assets/avatars/the-phantom.webp", soulbound: false },
  { templateId: 9, kind: "avatar", name: "Drift Nomad", image: "/assets/avatars/the-architect.webp", soulbound: false },
  { templateId: 10, kind: "avatar", name: "Deep Prospector", image: "/assets/avatars/the-rogue-ai.webp", soulbound: false },
  { templateId: 11, kind: "avatar", name: "Hold Warden", image: "/assets/avatars/the-nomad.webp", soulbound: false },
  { templateId: 12, kind: "avatar", name: "Array Sentinel", image: "/assets/avatars/the-cryptobro.webp", soulbound: false },
  { templateId: 13, kind: "avatar", name: "Outpost Marshal", image: "/assets/avatars/the-scavenger.webp", soulbound: false },
  { templateId: 14, kind: "avatar", name: "Circuit Medic", image: "/assets/avatars/the-warlord.webp", soulbound: false },
  { templateId: 15, kind: "avatar", name: "Rim Scavenger", image: "/assets/avatars/the-shadow-broker.webp", soulbound: false },
  { templateId: 16, kind: "avatar", name: "Quiet Navigator", image: "/assets/avatars/the-zero-day.webp", soulbound: false },
  { templateId: 17, kind: "avatar", name: "Pressure Welder", image: "/assets/avatars/the-blockchain-monk.webp", soulbound: false },
  { templateId: 18, kind: "avatar", name: "Rig Foreman", image: "/assets/avatars/the-ice-queen.webp", soulbound: false },
  { templateId: 19, kind: "avatar", name: "Field Analyst", image: "/assets/avatars/the-payload.webp", soulbound: false },
  { templateId: 20, kind: "avatar", name: "Cargo Steward", image: "/assets/avatars/the-ferret.webp", soulbound: false },
  { templateId: 21, kind: "avatar", name: "Relay Keeper", image: "/assets/avatars/the-sentry.webp", soulbound: false },
  { templateId: 22, kind: "avatar", name: "Salvage Captain", image: "/assets/avatars/the-drain.webp", soulbound: false },
  { templateId: 23, kind: "avatar", name: "Frontier Veteran", image: "/assets/avatars/the-oracle.webp", soulbound: false },
  { templateId: 24, kind: "avatar", name: "Horizon Pioneer", image: "/assets/avatars/the-syndicate-boss.webp", soulbound: false },
];

const bannerSources: CosmeticSource[] = [
  { templateId: 100, kind: "banner", name: "First Shift", image: "/assets/banners/the-data-mine.webp", soulbound: true },
  { templateId: 101, kind: "banner", name: "The Extraction Line", image: "/assets/banners/hash-canyon.webp", soulbound: false },
  { templateId: 102, kind: "banner", name: "Outpost Afterlight", image: "/assets/banners/the-vault-district.webp", soulbound: false },
  { templateId: 103, kind: "banner", name: "Blue Signal", image: "/assets/banners/exploit-city.webp", soulbound: false },
  { templateId: 104, kind: "banner", name: "Reactor Hall", image: "/assets/banners/the-rig-farm.webp", soulbound: false },
  { templateId: 105, kind: "banner", name: "The Supply Dock", image: "/assets/banners/genesis-block.webp", soulbound: false },
  { templateId: 106, kind: "banner", name: "Belt Crossing", image: "/assets/banners/circuit-wasteland.webp", soulbound: false },
  { templateId: 107, kind: "banner", name: "Quiet Orbit", image: "/assets/banners/the-network.webp", soulbound: false },
  { templateId: 108, kind: "banner", name: "Thermal Dawn", image: "/assets/banners/raid-night.webp", soulbound: false },
  { templateId: 109, kind: "banner", name: "Relay Ridge", image: "/assets/banners/the-overclocked-sky.webp", soulbound: false },
  { templateId: 110, kind: "banner", name: "Survey Camp", image: "/assets/banners/deep-protocol.webp", soulbound: false },
  { templateId: 111, kind: "banner", name: "The Hold Gate", image: "/assets/banners/hash-horizon.webp", soulbound: false },
  { templateId: 112, kind: "banner", name: "Working Frontier", image: "/assets/banners/the-dark-pool.webp", soulbound: false },
  { templateId: 113, kind: "banner", name: "Iron Shelter", image: "/assets/banners/firewall-fortress.webp", soulbound: false },
  { templateId: 114, kind: "banner", name: "The Repair Bay", image: "/assets/banners/the-syndicate-lounge.webp", soulbound: false },
  { templateId: 115, kind: "banner", name: "Foundry District", image: "/assets/banners/zero-day-dawn.webp", soulbound: false },
  { templateId: 116, kind: "banner", name: "Cold Light", image: "/assets/banners/block-storm.webp", soulbound: false },
  { templateId: 117, kind: "banner", name: "Derelict Span", image: "/assets/banners/cold-storage.webp", soulbound: false },
  { templateId: 118, kind: "banner", name: "Operator Row", image: "/assets/banners/notoriety-row.webp", soulbound: false },
  { templateId: 119, kind: "banner", name: "Impact Basin", image: "/assets/banners/the-patch.webp", soulbound: false },
  { templateId: 120, kind: "banner", name: "Midnight Convoy", image: "/assets/banners/liquidation-event.webp", soulbound: false },
  { templateId: 121, kind: "banner", name: "The Exchange", image: "/assets/banners/genesis-crater.webp", soulbound: false },
  { templateId: 122, kind: "banner", name: "Last Worklight", image: "/assets/banners/the-leaderboard-tower.webp", soulbound: false },
  { templateId: 123, kind: "banner", name: "Deep Array", image: "/assets/banners/protocol-graveyard.webp", soulbound: false },
  { templateId: 124, kind: "banner", name: "Beyond Supply", image: "/assets/banners/the-final-hash.webp", soulbound: false },
];

const backgroundSources: CosmeticSource[] = [
  { templateId: 200, kind: "background", name: "The Extraction Pit", image: "/assets/backgrounds/the-deep-mine.webp", soulbound: true },
  { templateId: 201, kind: "background", name: "Asteroid Foundry", image: "/assets/backgrounds/circuit-horizon.webp", soulbound: false },
  { templateId: 202, kind: "background", name: "Relay Station", image: "/assets/backgrounds/server-cathedral.webp", soulbound: false },
  { templateId: 203, kind: "background", name: "The Quiet Belt", image: "/assets/backgrounds/the-void-network.webp", soulbound: false },
  { templateId: 204, kind: "background", name: "Cold Storage", image: "/assets/backgrounds/hash-storm.webp", soulbound: false },
  { templateId: 205, kind: "background", name: "The Workyard", image: "/assets/backgrounds/the-cold-vault.webp", soulbound: false },
  { templateId: 206, kind: "background", name: "Reactor Deck", image: "/assets/backgrounds/protocol-rain.webp", soulbound: false },
  { templateId: 207, kind: "background", name: "Rim Observatory", image: "/assets/backgrounds/genesis-crater.webp", soulbound: false },
  { templateId: 208, kind: "background", name: "The Rig Room", image: "/assets/backgrounds/the-rig-room.webp", soulbound: false },
  { templateId: 209, kind: "background", name: "Outpost Walkway", image: "/assets/backgrounds/exploit-horizon.webp", soulbound: false },
  { templateId: 210, kind: "background", name: "Orbital Debris", image: "/assets/backgrounds/deep-protocol-sea.webp", soulbound: false },
  { templateId: 211, kind: "background", name: "Thermal Fields", image: "/assets/backgrounds/firewall-dusk.webp", soulbound: false },
  { templateId: 212, kind: "background", name: "Signal Canyon", image: "/assets/backgrounds/binary-forest.webp", soulbound: false },
  { templateId: 213, kind: "background", name: "The Exposed Hold", image: "/assets/backgrounds/the-mempool.webp", soulbound: false },
  { templateId: 214, kind: "background", name: "Salvage Berth", image: "/assets/backgrounds/overclocked-night.webp", soulbound: false },
  { templateId: 215, kind: "background", name: "Buried Installation", image: "/assets/backgrounds/notoriety-alley.webp", soulbound: false },
  { templateId: 216, kind: "background", name: "Blue Dust", image: "/assets/backgrounds/block-graveyard.webp", soulbound: false },
  { templateId: 217, kind: "background", name: "Steel Horizon", image: "/assets/backgrounds/cold-storage-facility.webp", soulbound: false },
  { templateId: 218, kind: "background", name: "The Repair Hangar", image: "/assets/backgrounds/the-hash-abyss.webp", soulbound: false },
  { templateId: 219, kind: "background", name: "Deep Core", image: "/assets/backgrounds/syndicate-tower.webp", soulbound: false },
  { templateId: 220, kind: "background", name: "Distant Supply", image: "/assets/backgrounds/liquidity-pool.webp", soulbound: false },
  { templateId: 221, kind: "background", name: "Abandoned Colony", image: "/assets/backgrounds/zero-day-sky.webp", soulbound: false },
  { templateId: 222, kind: "background", name: "Midnight Gantry", image: "/assets/backgrounds/the-dark-pool-exchange.webp", soulbound: false },
  { templateId: 223, kind: "background", name: "Frontier Shelter", image: "/assets/backgrounds/proof-of-work.webp", soulbound: false },
  { templateId: 224, kind: "background", name: "The Outer Rim", image: "/assets/backgrounds/the-final-block.webp", soulbound: false },
];

/** Each category unlocks one cosmetic every 4 levels; index 0 is soulbound. */
function withRequiredLevels(sources: CosmeticSource[]): CosmeticTemplateEntry[] {
  return sources.map((source, index) => ({
    ...source,
    requiredLevel: Math.min((index + 1) * 4, 100),
  }));
}

export const COSMETIC_TEMPLATES: CosmeticTemplateEntry[] = [
  ...withRequiredLevels(avatarSources),
  ...withRequiredLevels(bannerSources),
  ...withRequiredLevels(backgroundSources),
];

/** Default soulbound template IDs assigned at player registration. */
export const DEFAULT_PLAYER_COSMETICS = { avatar: 0, banner: 100, background: 200 } as const;

export function cosmeticTemplatesOfKind(kind: CosmeticKind): CosmeticTemplateEntry[] {
  return COSMETIC_TEMPLATES.filter((t) => t.kind === kind);
}

export function getCosmetic(templateId: number): CosmeticTemplateEntry | undefined {
  return COSMETIC_TEMPLATES.find((t) => t.templateId === templateId);
}

export function getCosmeticByKind(kind: CosmeticKind, templateId: number): CosmeticTemplateEntry | undefined {
  const entry = getCosmetic(templateId);
  return entry?.kind === kind ? entry : undefined;
}

export function isCosmeticUnlocked(playerLevel: number, templateId: number): boolean {
  const entry = getCosmetic(templateId);
  if (!entry) return false;
  return entry.soulbound || playerLevel >= entry.requiredLevel;
}
