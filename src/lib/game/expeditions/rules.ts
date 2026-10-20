import { fleetTotals, RARITIES, type Equipment, type Rarity, type Rng, type SlotKey, type StatKey } from "@/lib/game/equipment/fleet";
import { shardId } from "@/lib/game/items/chests";
import type { Quantities } from "@/lib/game/items/catalog";
import type { BuildingLevels } from "@/lib/game/station/buildings";

export type Tier = 1 | 2 | 3 | 4 | 5;
export type MissionType = "salvage" | "stealth" | "defense" | "fortune" | "combat";
export const TIERS: Record<Tier, { level: number; high: number; low: number; hours: number; draws: number; xp: number; fuel: number; resources: [number, number, number]; shardYield: number; weights: number[] }> = {
  1: { level: 1, high: 10, low: 2, hours: 1, draws: 2, xp: 150, fuel: 0, resources: [50, 10, 30], shardYield: 10, weights: [47, 49, 4, 0, 0] },
  2: { level: 10, high: 50, low: 5, hours: 4, draws: 3, xp: 450, fuel: 15, resources: [120, 25, 70], shardYield: 8, weights: [41, 44, 12, 2, 1] },
  3: { level: 25, high: 100, low: 12, hours: 12, draws: 4, xp: 1200, fuel: 40, resources: [280, 60, 160], shardYield: 6, weights: [36, 38, 15, 7, 5] },
  4: { level: 50, high: 200, low: 20, hours: 24, draws: 6, xp: 2500, fuel: 100, resources: [600, 130, 350], shardYield: 4, weights: [30, 32, 18, 10, 10] },
  5: { level: 100, high: 500, low: 40, hours: 48, draws: 10, xp: 6000, fuel: 250, resources: [1400, 300, 800], shardYield: 2, weights: [26, 28, 19, 12, 16] },
};
export const MISSION_META: Record<MissionType, { label: string; primary: StatKey; secondary: StatKey; slot: SlotKey; destination: string; image: string }> = {
  salvage: { label: "Wreckage Recovery", primary: "extraction", secondary: "luck", slot: "mining", destination: "Derelict field", image: "/assets/world/mineral-planet.png" },
  stealth: { label: "Silent Ledger", primary: "evasion", secondary: "luck", slot: "ecm", destination: "Abandoned relay", image: "/assets/world/station.png" },
  defense: { label: "Frontier Lockdown", primary: "defense", secondary: "evasion", slot: "mothership", destination: "Colony perimeter", image: "/assets/world/station.png" },
  fortune: { label: "Fortune Anomaly", primary: "luck", secondary: "evasion", slot: "mothership", destination: "Deep-space anomaly", image: "/assets/world/ocean-planet.png" },
  combat: { label: "Citadel Raid", primary: "attack", secondary: "luck", slot: "attackers", destination: "Hostile citadel", image: "/assets/world/mineral-planet.png" },
};
export type Mission = { id: string; day: string; tier: Tier; type: MissionType };
export const utcDay = (now: number) => new Date(now).toISOString().slice(0, 10);
/** Shared deterministic board; no player or client randomness in mission generation. */
export function dailyBoard(now: number): Mission[] {
  const day = utcDay(now);
  const offset = Math.floor(now / 86400000) % 4;
  const rotation: MissionType[] = ["salvage", "stealth", "fortune", "defense"];
  const missions: Mission[] = [{ id: `${day}:1:combat`, day, tier: 1, type: "combat" }];
  for (const tier of [2, 3, 4, 5] as const) {
    const type = rotation[(offset + tier - 2) % rotation.length] ?? "salvage";
    missions.push({ id: `${day}:${tier}:${type}`, day, tier, type });
  }
  missions.push({ id: `${day}:1:salvage`, day, tier: 1, type: "salvage" });
  return missions;
}
/** Never accept combined troop totals or temporary buffs here. */
export function expeditionStats(levels: BuildingLevels, equipment: Equipment[]): Record<StatKey, number> {
  const stats = fleetTotals(equipment);
  return { ...stats, attack: stats.attack + levels.attack * 10, defense: stats.defense + levels.defense * 10, extraction: stats.extraction + levels.tribute };
}
export function requiredStat(tier: Tier, stat: StatKey): number { return stat === "luck" || stat === "evasion" || stat === "crit" ? TIERS[tier].low : TIERS[tier].high; }
export function requirementChecks(mission: Mission, level: number, stats: Record<StatKey, number>, equipment: Equipment[]) {
  const config = TIERS[mission.tier]; const meta = MISSION_META[mission.type];
  const requiredRarity: Rarity | null = mission.tier === 3 ? "uncommon" : mission.tier === 4 ? "rare" : mission.tier === 5 ? "epic" : null;
  const designated = equipment.find((i) => i.slot === meta.slot);
  return [
    { label: "Mothership equipped", ok: equipment.some((i) => i.slot === "mothership") },
    { label: `Operator level ${config.level}`, ok: level >= config.level },
    { label: `${meta.primary} ${requiredStat(mission.tier, meta.primary)}+`, ok: stats[meta.primary] >= requiredStat(mission.tier, meta.primary) },
    { label: `${meta.secondary} ${requiredStat(mission.tier, meta.secondary)}+`, ok: stats[meta.secondary] >= requiredStat(mission.tier, meta.secondary) },
    ...(requiredRarity ? [{ label: `${requiredRarity}+ ${meta.slot}`, ok: Boolean(designated && RARITIES.indexOf(designated.rarity) >= RARITIES.indexOf(requiredRarity)) }] : []),
  ];
}
export type ExpeditionSnapshot = { primary: number; secondary: number; item?: Equipment | undefined };
export type ExpeditionReward = { items: Partial<Quantities>; xp: number; draws: number };
export function missionOdds(tier: Tier) { const weights = TIERS[tier].weights; const total = weights.reduce((a, b) => a + b, 0); return RARITIES.map((rarity, index) => ({ rarity, percent: (weights[index] ?? 0) / total * 100 })); }
export function rewardFor(mission: Mission, snapshot: ExpeditionSnapshot, rng: Rng): ExpeditionReward {
  const config = TIERS[mission.tier]; const meta = MISSION_META[mission.type];
  const bonus = Math.min(0.75, Math.max(0, snapshot.primary / requiredStat(mission.tier, meta.primary) - 1) * 0.25);
  const score = Math.min(100, rng() * 100 * (1 + bonus) + Math.min(10, snapshot.secondary * 0.1));
  let draws = Math.max(1, Math.round(config.draws * (0.5 + score / 100 * 2.5)));
  if (snapshot.item && RARITIES.indexOf(snapshot.item.rarity) >= 2) draws++;
  if (snapshot.item && rng() < Math.min(1, (snapshot.item.level - 1) * 0.05)) draws++;
  const [titanium, plasma, rations] = config.resources;
  const items: Partial<Quantities> = { titanium, plasma, rations };
  for (let i = 0; i < draws; i++) {
    let roll = rng() * 100; let rarity: Rarity = "common";
    for (const entry of missionOdds(mission.tier)) { roll -= entry.percent; if (roll < 0) { rarity = entry.rarity; break; } }
    const id = shardId(rarity);
    items[id] = (items[id] ?? 0) + Math.max(1, Math.round(config.shardYield * (0.2 + rng() * 1.6)));
  }
  // Small tactical supply chance; never changes eligibility or stat rolls.
  if (rng() < Math.min(0.25, 0.05 + snapshot.secondary * 0.002)) items[rng() < 0.5 ? "recon-drone" : "warp-drive"] = 1;
  return { items, xp: config.xp, draws };
}
export function acceleratedFinish(now: number, finishAt: number) { const remaining = Math.max(0, finishAt - now); return remaining <= 900000 ? now : now + remaining / 2; }