import type { Equipment } from "@/lib/game/equipment/fleet";
import { STARTING_LEVELS, type BuildingLevels } from "@/lib/game/station/buildings";
import type { Resources } from "@/lib/game/station/economy";
import { EMPTY_TROOPS, type TroopCounts } from "@/lib/game/troops/rules";

export type RaidTarget = { id: string; name: string; level: number; avatar: string; levels: BuildingLevels; equipment: Equipment[]; troops: TroopCounts; exposed: Resources };
/** Isolated mock opponents: finite uncollected output, never real player accounts. */
export function sampleRaidTargets(): RaidTarget[] {
  return [
    { id: "sample-scout", name: "The Scavenger", level: 1, avatar: "/assets/avatars/the-scavenger.webp", levels: { ...STARTING_LEVELS }, equipment: [], troops: { ...EMPTY_TROOPS, soldier: 2 }, exposed: { rim: 6, titanium: 420, plasma: 160, rations: 240 } },
    { id: "sample-sentry", name: "The Sentry", level: 4, avatar: "/assets/avatars/the-sentry.webp", levels: { ...STARTING_LEVELS, attack: 2, defense: 3, vault: 2 }, equipment: [{ id: "sentry-shield", slot: "shield", rarity: "uncommon", level: 1, stats: { defense: 12 } }], troops: { ...EMPTY_TROOPS, soldier: 8, archer: 4, "bulwark-frigate": 2 }, exposed: { rim: 12, titanium: 900, plasma: 350, rations: 480 } },
    { id: "sample-warlord", name: "The Warlord", level: 10, avatar: "/assets/avatars/the-warlord.webp", levels: { ...STARTING_LEVELS, attack: 5, defense: 4, vault: 3 }, equipment: [{ id: "warlord-wing", slot: "attackers", rarity: "rare", level: 2, stats: { attack: 25, defense: 5, crit: 3 } }, { id: "warlord-shield", slot: "shield", rarity: "rare", level: 2, stats: { defense: 24 } }], troops: { ...EMPTY_TROOPS, soldier: 12, archer: 8, cavalry: 5, "vanguard-striker": 3, "bulwark-frigate": 3, "aegis-dreadnought": 1 }, exposed: { rim: 20, titanium: 1600, plasma: 700, rations: 900 } },
  ];
}