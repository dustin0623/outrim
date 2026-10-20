import { fleetTotals, type Equipment, type Rng } from "@/lib/game/equipment/fleet";
import { calculateTroopTotals, type TroopCounts } from "@/lib/game/troops/rules";
import { RESOURCE_KEYS, type Resources } from "@/lib/game/station/economy";
import type { BuildingLevels } from "@/lib/game/station/buildings";

export const RAID_FUEL = 10;
export const INTEL_DURATION = 3_600_000;
export const ZERO_LOOT: Resources = { rim: 0, titanium: 0, plasma: 0, rations: 0 };
export type CombatStats = { attack: number; defense: number; crit: number };
export function raidStats(levels: BuildingLevels, equipment: Equipment[], troops?: TroopCounts): CombatStats {
  const gear = fleetTotals(equipment);
  const units = troops ? calculateTroopTotals(troops) : { attack: 0, defense: 0 };
  return { attack: levels.attack * 10 + gear.attack + units.attack, defense: levels.defense * 10 + gear.defense + units.defense, crit: gear.crit };
}
export function raidChance(attack: number, defense: number): number {
  if (!Number.isFinite(attack) || !Number.isFinite(defense) || attack <= defense) return 0;
  return Math.min(100, Math.max(10, 50 + (attack - defense) * 2));
}
export function freeVault(capacity: Resources, secured: Resources, exposed: Resources): Resources {
  return Object.fromEntries(RESOURCE_KEYS.map((k) => [k, Math.max(0, capacity[k] - secured[k] - exposed[k])])) as Resources;
}
export type RaidOutcome = { success: boolean; reason: "victory" | "repelled" | "outmatched"; chance: number; exposure: number; critical: boolean; loot: Resources };
/** Stats gate eligibility; three rolls decide success, exposure and critical breach. No troop casualties. */
export function resolveRaid(attacker: CombatStats, defender: CombatStats, exposed: Resources, free: Resources, rng: Rng): RaidOutcome {
  const chance = raidChance(attacker.attack, defender.defense);
  const successRoll = rng();
  const baseExposure = 0.15 + Math.min(1, Math.max(0, rng())) * 0.15;
  const criticalRoll = rng();
  if (chance === 0 || successRoll >= chance / 100) return { success: false, reason: chance === 0 ? "outmatched" : "repelled", chance, exposure: 0, critical: false, loot: { ...ZERO_LOOT } };
  const critical = criticalRoll < Math.min(100, Math.max(0, attacker.crit)) / 100;
  const exposure = Math.min(0.45, baseExposure * (critical ? 2 : 1));
  const loot = Object.fromEntries(RESOURCE_KEYS.map((k) => {
    const scale = k === "rim" ? 100 : 1;
    return [k, Math.floor(Math.max(0, Math.min(exposed[k] * exposure, free[k])) * scale + 1e-8) / scale];
  })) as Resources;
  return { success: true, reason: "victory", chance, exposure, critical, loot };
}