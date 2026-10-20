import { hexToPixel, pixelToHex, siteAt, inBounds, type Hex } from "./hex";
import { worldAt } from "./generation";

export const SECTOR_SIZE = 112;
export const ISO_Y = 0.62;
export type SpaceObject = {
  kind: "station" | "planet";
  name: string;
  subtitle: string;
  variant: "own" | "rival" | "ocean" | "mineral";
  targetId?: string;
  missionId?: string;
};

export function sectorToPixel(hex: Hex) {
  const p = hexToPixel(hex, SECTOR_SIZE);
  return { x: p.x, y: p.y * ISO_Y };
}

export function pixelToSector(x: number, y: number) {
  return pixelToHex(x, y / ISO_Y, SECTOR_SIZE);
}

/** Map objects: player stations (raid targets) and today's generated expedition worlds. */
export function spaceObjectAt(hex: Hex, now = Date.now()): SpaceObject | null {
  if (!inBounds(hex)) return null;
  const site = siteAt(hex.q, hex.r);
  if (site) return site.kind === "own"
    ? { kind: "station", name: "Your Station", subtitle: "HOME SECTOR", variant: "own" }
    : { kind: "station", name: site.name, subtitle: "RIVAL STATION", variant: "rival", ...(site.targetId ? { targetId: site.targetId } : {}) };
  const world = worldAt(hex, now);
  if (!world) return null;
  return { kind: "planet", name: world.name, subtitle: world.boss ? `BOSS · T${world.mission.tier}` : `T${world.mission.tier} WORLD`, variant: world.variant, missionId: world.missionId };
}
