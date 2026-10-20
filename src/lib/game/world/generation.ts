import { HOME, PROTOTYPE_SITES, inBounds, pixelToHex, type Hex } from "./hex";
import { dailyBoard, MISSION_META, utcDay, type Mission } from "@/lib/game/expeditions/rules";
import { bossBoard, bossFor } from "@/lib/game/expeditions/bosses";

export type WorldSite = Hex & { missionId: string; mission: Mission; name: string; variant: "ocean" | "mineral"; boss: boolean };

function hash(seed: string, n: number) {
  let h = 2166136261 ^ n;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  h = Math.imul(h ^ (h >>> 15), 2246822507);
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
}
const key = (h: Hex) => `${h.q},${h.r}`;

/**
 * Deterministic daily world layout: every mission on today's expedition and boss boards
 * becomes a world on the sector map. Higher tiers sit farther from home; bosses beyond them.
 */
export function generateWorlds(now: number): WorldSite[] {
  const day = utcDay(now);
  const taken = new Set(PROTOTYPE_SITES.map(key));
  const missions = [...dailyBoard(now), ...bossBoard(now)];
  return missions.map((mission, i) => {
    const radius = (mission.bossId ? 3 : 1) + mission.tier + Math.floor(hash(day, i + 50) * 2);
    let angle = hash(day, i) * Math.PI * 2;
    let hex: Hex = HOME;
    for (let attempt = 0; attempt < 24; attempt++) {
      const offset = pixelToHex(Math.cos(angle) * radius * Math.sqrt(3), Math.sin(angle) * radius * 1.5, 1);
      hex = { q: HOME.q + offset.q, r: HOME.r + offset.r };
      if (inBounds(hex) && !taken.has(key(hex))) break;
      angle += 0.45;
    }
    taken.add(key(hex));
    const boss = bossFor(mission);
    const meta = MISSION_META[mission.type];
    const variant = meta.image.includes("ocean") || hash(day, i + 99) > 0.5 ? "ocean" : "mineral";
    return { ...hex, missionId: mission.id, mission, name: boss?.name ?? meta.destination, variant, boss: !!boss };
  });
}

let cache: { day: string; byKey: Map<string, WorldSite> } | null = null;
export function worldAt(hex: Hex, now = Date.now()): WorldSite | null {
  const day = utcDay(now);
  if (cache?.day !== day) cache = { day, byKey: new Map(generateWorlds(now).map((w) => [key(w), w])) };
  return cache.byKey.get(key(hex)) ?? null;
}
