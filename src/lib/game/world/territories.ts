import { hexDistance, type Hex } from "./hex";

/** Guild-war territories: four 7-tile outposts (radius 1) and one 19-tile Federation Station (radius 2). */
export type TerritoryId = "alpha" | "beta" | "gamma" | "delta" | "federation";
export type Territory = Hex & { id: TerritoryId; name: string; radius: 1 | 2; kind: "outpost" | "federation"; perk: string };

export const TERRITORIES: Territory[] = [
  { id: "alpha", name: "Outpost Alpha", q: 65, r: 65, radius: 1, kind: "outpost", perk: "+15% Titanium extraction" },
  { id: "beta", name: "Outpost Beta", q: 185, r: 65, radius: 1, kind: "outpost", perk: "+15% Plasma extraction" },
  { id: "gamma", name: "Outpost Gamma", q: 65, r: 185, radius: 1, kind: "outpost", perk: "+15% Rations synthesis" },
  { id: "delta", name: "Outpost Delta", q: 185, r: 185, radius: 1, kind: "outpost", perk: "+10% fleet defense" },
  { id: "federation", name: "Federation Station", q: 125, r: 125, radius: 2, kind: "federation", perk: "+20% all resources, +15% fleet attack" },
];

/** Number of tiles in a hex cluster of the given radius: 1 + 3r(r+1). */
export const clusterSize = (radius: number) => 1 + 3 * radius * (radius + 1);

export function territoryTiles(t: Territory): Hex[] {
  const out: Hex[] = [];
  for (let dq = -t.radius; dq <= t.radius; dq++)
    for (let dr = Math.max(-t.radius, -dq - t.radius); dr <= Math.min(t.radius, -dq + t.radius); dr++)
      out.push({ q: t.q + dq, r: t.r + dr });
  return out;
}

export function territoryAt(hex: Hex): Territory | null {
  return TERRITORIES.find((t) => hexDistance(t, hex) <= t.radius) ?? null;
}
