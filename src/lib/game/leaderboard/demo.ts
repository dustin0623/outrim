import type { RankingInput } from "./rankings";

/** Preview-only opponents; never presented as real registered accounts. */
export const DEMO_OPERATORS: RankingInput[] = Array.from({ length: 32 }, (_, index) => ({
  id: `ranking-demo-${index + 1}`,
  username: ["Voidwarden", "Aurora", "Ironclad", "Driftwalker", "Nova", "Relay", "Starforge", "Corsair"][index % 8] + `-${String(index + 1).padStart(2, "0")}`,
  avatar: index % 25,
  xp: (32 - index) ** 2 * 700,
  renown: 0,
  production: Math.max(1, 12 - Math.floor(index / 3)),
}));