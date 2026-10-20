/** Pure axial hex-world math and deterministic terrain (GAME_DESIGN §3). */
export const WORLD_SIZE = 250;
export type Terrain = "plain" | "rock" | "scrap" | "ridge";
export type Hex = { q: number; r: number };

export const NEIGHBORS: Hex[] = [
  { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
  { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 },
];

export const MOVE_COST: Record<Terrain, number | null> = { plain: 1, rock: 2, scrap: 1, ridge: null };

export const inBounds = ({ q, r }: Hex) => q >= 0 && r >= 0 && q < WORLD_SIZE && r < WORLD_SIZE;

export function hexDistance(a: Hex, b: Hex) {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

export const sectorOf = ({ q, r }: Hex) => ({ sq: Math.floor(q / 16), sr: Math.floor(r / 16) });

/** Deterministic 32-bit hash → [0,1). */
function hash(seed: number, q: number, r: number) {
  let h = (seed ^ Math.imul(q, 374761393) ^ Math.imul(r, 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Value noise with 2 octaves so terrain forms clusters, not static. */
function noise(seed: number, q: number, r: number) {
  const s = (scale: number, o: number) => {
    const x = q / scale, y = r / scale;
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const fx = x - x0, fy = y - y0;
    const a = hash(seed + o, x0, y0), b = hash(seed + o, x0 + 1, y0);
    const c = hash(seed + o, x0, y0 + 1), d = hash(seed + o, x0 + 1, y0 + 1);
    const top = a + (b - a) * fx, bot = c + (d - c) * fx;
    return top + (bot - top) * fy;
  };
  return s(6, 0) * 0.65 + s(2.5, 101) * 0.35;
}

export function terrainAt(q: number, r: number, seed = 1): Terrain {
  const n = noise(seed, q, r);
  const rnd = hash(seed + 7, q, r);
  if (n > 0.72 && rnd < 0.55) return "ridge";
  if (n > 0.58) return "rock";
  if (rnd < 0.1) return "scrap";
  return "plain";
}

/** Pointy-top axial → pixel center. */
export function hexToPixel({ q, r }: Hex, size: number) {
  return { x: size * Math.sqrt(3) * (q + r / 2), y: size * 1.5 * r };
}

export function pixelToHex(x: number, y: number, size: number): Hex {
  const fq = ((Math.sqrt(3) / 3) * x - y / 3) / size;
  const fr = ((2 / 3) * y) / size;
  const fs = -fq - fr;
  let q = Math.round(fq), r = Math.round(fr);
  const s = Math.round(fs);
  const dq = Math.abs(q - fq), dr = Math.abs(r - fr), ds = Math.abs(s - fs);
  if (dq > dr && dq > ds) q = -r - s;
  else if (dr > ds) r = -q - s;
  return { q, r };
}

export type Site = { q: number; r: number; kind: "own" | "rival"; name: string; targetId?: string };

/** Prototype markers until world joining is persisted. Rival sites link to raid targets. */
export const HOME: Hex = { q: 125, r: 140 };
export const PROTOTYPE_SITES: Site[] = [
  { ...HOME, kind: "own", name: "Your Command Rig" },
  { q: 131, r: 135, kind: "rival", name: "Rust Ward", targetId: "sample-scout" },
  { q: 118, r: 146, kind: "rival", name: "Cobalt Spire", targetId: "sample-sentry" },
  { q: 134, r: 143, kind: "rival", name: "Vanta Yard", targetId: "sample-warlord" },
];

export function siteAt(q: number, r: number) {
  return PROTOTYPE_SITES.find((s) => s.q === q && s.r === r) ?? null;
}

/** Bases always sit on plains. */
export function tileTerrain(q: number, r: number): Terrain {
  return siteAt(q, r) ? "plain" : terrainAt(q, r);
}
