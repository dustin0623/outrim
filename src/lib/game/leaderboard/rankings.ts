import { levelFromXp } from "@/lib/game/profile/level";

export const RANKING_WEIGHTS = { renown: 30, production: 30, progression: 40 } as const;
export const RANKING_PAGE_SIZE = 25;
export const RANKING_LIMIT = 100;
export type RankingInput = {
  id: string;
  username: string;
  avatar: number;
  xp: number;
  renown: number;
  /** Actual RIM Tribute Office output per hour, not an item balance. */
  production: number;
};
export type RankingEntry = RankingInput & {
  rank: number;
  level: number;
  score: number;
  points: Record<keyof typeof RANKING_WEIGHTS, number>;
};

/** Reference normalization occurs across every operator before the top-100 cut. */
export function rankOperators(inputs: RankingInput[]): RankingEntry[] {
  const seen = new Set<string>();
  for (const input of inputs) {
    if (!input.id || !input.username || seen.has(input.id) || [input.renown, input.production, input.xp].some((v) => !Number.isFinite(v) || v < 0)) {
      throw new Error("Invalid ranking input");
    }
    seen.add(input.id);
  }
  const leaders = inputs.reduce((top, p) => ({
    renown: Math.max(top.renown, p.renown),
    production: Math.max(top.production, p.production),
    progression: Math.max(top.progression, p.xp),
  }), { renown: 0, production: 0, progression: 0 });
  const pointsFor = (value: number, key: keyof typeof RANKING_WEIGHTS) => leaders[key] > 0 ? value / leaders[key] * RANKING_WEIGHTS[key] : 0;
  const rows = inputs.map((p) => {
    const points = { renown: pointsFor(p.renown, "renown"), production: pointsFor(p.production, "production"), progression: pointsFor(p.xp, "progression") };
    return { ...p, level: levelFromXp(p.xp), rank: 0, points, score: points.renown + points.production + points.progression };
  });
  rows.sort((a, b) => b.score - a.score || (a.username < b.username ? -1 : a.username > b.username ? 1 : 0) || a.id.localeCompare(b.id));
  rows.forEach((row, index) => {
    const previous = rows[index - 1];
    row.rank = previous && previous.score === row.score ? previous.rank : index + 1;
  });
  return rows;
}

export function rankingPage(rows: RankingEntry[], requestedPage: number, selfId: string) {
  const displayed = Math.min(RANKING_LIMIT, rows.length);
  const pageCount = Math.max(1, Math.ceil(displayed / RANKING_PAGE_SIZE));
  const page = Math.min(pageCount, Math.max(1, Math.floor(requestedPage) || 1));
  return {
    page, pageCount, total: rows.length, displayed,
    entries: rows.slice((page - 1) * RANKING_PAGE_SIZE, Math.min(page * RANKING_PAGE_SIZE, displayed)),
    self: rows.find((row) => row.id === selfId) ?? null,
  };
}