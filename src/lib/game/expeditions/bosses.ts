import type { Rng, StatKey } from "@/lib/game/equipment/fleet";
import { utcDay, type Mission, type Tier } from "./rules";

export const BOSSES: { id: string; name: string; tier: Tier; hp: number; attack: number; defense: number; image: string }[] = [
  { id: "scrap-warden", name: "Scrap Warden", tier: 1, hp: 60, attack: 8, defense: 2, image: "/assets/world/mineral-planet.png" },
  { id: "relay-phantom", name: "Relay Phantom", tier: 2, hp: 300, attack: 40, defense: 10, image: "/assets/world/station.png" },
  { id: "iron-regent", name: "Iron Regent", tier: 3, hp: 650, attack: 85, defense: 25, image: "/assets/world/mineral-planet.png" },
  { id: "abyss-leviathan", name: "Abyss Leviathan", tier: 4, hp: 1400, attack: 170, defense: 50, image: "/assets/world/ocean-planet.png" },
  { id: "citadel-sovereign", name: "Citadel Sovereign", tier: 5, hp: 3500, attack: 425, defense: 125, image: "/assets/world/station.png" },
];
export function bossBoard(now: number): Mission[] {
  const day = utcDay(now);
  return BOSSES.map((boss) => ({ id: `${day}:boss:${boss.id}`, day, tier: boss.tier, type: "combat", bossId: boss.id }));
}
export const bossFor = (mission: Mission) => BOSSES.find((boss) => boss.id === mission.bossId);
export type BattleRound = { round: number; dealt: number; received: number; critical: boolean; dodged: boolean; playerHp: number; bossHp: number };
export type BattleReport = { won: boolean; playerMaxHp: number; bossMaxHp: number; rounds: BattleRound[] };
/** Bounded alpha simulation; troop totals and active buffs never enter this input. */
export function fightBoss(mission: Mission, stats: Record<StatKey, number>, rng: Rng): BattleReport | null {
  const boss = bossFor(mission);
  if (!boss) return null;
  const playerMaxHp = 100 + stats.defense * 5;
  let playerHp = playerMaxHp; let bossHp = boss.hp;
  const rounds: BattleRound[] = [];
  for (let round = 1; round <= 20 && playerHp > 0 && bossHp > 0; round++) {
    const critical = rng() < Math.min(0.5, stats.crit / 100);
    const dealt = Math.max(1, Math.round(stats.attack * (0.9 + rng() * 0.2) * (critical ? 1.5 : 1) - boss.defense));
    bossHp = Math.max(0, bossHp - dealt);
    const dodged = bossHp > 0 && rng() < Math.min(0.5, stats.evasion / 100);
    const received = bossHp <= 0 || dodged ? 0 : Math.max(1, Math.round(boss.attack * (0.9 + rng() * 0.2) - stats.defense * 0.4));
    playerHp = Math.max(0, playerHp - received);
    rounds.push({ round, dealt, received, critical, dodged, playerHp, bossHp });
  }
  return { won: bossHp === 0, playerMaxHp, bossMaxHp: boss.hp, rounds };
}