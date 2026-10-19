import { HOME, hexToPixel, pixelToHex, siteAt, inBounds, type Hex } from "./hex";

export const SECTOR_SIZE = 112;
export const ISO_Y = 0.62;
export type SpaceObject = { kind: "station" | "planet"; name: string; variant: "own" | "rival" | "ocean" | "mineral"; resource: string | null };

export function sectorToPixel(hex: Hex) {
  const p = hexToPixel(hex, SECTOR_SIZE);
  return { x: p.x, y: p.y * ISO_Y };
}

export function pixelToSector(x: number, y: number) {
  return pixelToHex(x, y / ISO_Y, SECTOR_SIZE);
}

const NEARBY_WORLDS = [
  { q: HOME.q + 2, r: HOME.r - 2, name: "Nereid", variant: "ocean" as const },
  { q: HOME.q - 2, r: HOME.r - 1, name: "Ferrum", variant: "mineral" as const },
  { q: HOME.q + 1, r: HOME.r + 2, name: "Kepler", variant: "mineral" as const },
  { q: HOME.q - 3, r: HOME.r + 3, name: "Pelagos", variant: "ocean" as const },
];

/** Display-only world objects. No production, balances or gathering rewards are simulated. */
export function spaceObjectAt(hex: Hex): SpaceObject | null {
  if (!inBounds(hex)) return null;
  const site = siteAt(hex.q, hex.r);
  if (site) return { kind: "station", name: site.kind === "own" ? "Your Station" : site.name, variant: site.kind, resource: null };
  const nearby = NEARBY_WORLDS.find((p) => p.q === hex.q && p.r === hex.r);
  const hash = (Math.imul(hex.q, 73856093) ^ Math.imul(hex.r, 19349663)) >>> 0;
  if (!nearby && hash % 19 !== 0) return null;
  const variant = nearby?.variant ?? (hash % 2 === 0 ? "ocean" : "mineral");
  return { kind: "planet", name: nearby?.name ?? `${variant === "ocean" ? "Nereid" : "Ferrum"} ${hex.q}-${hex.r}`, variant, resource: "Boss encounter" };
}