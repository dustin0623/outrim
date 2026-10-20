import { describe, expect, it } from "vitest";
import { rankOperators, rankingPage, type RankingInput } from "./rankings";

const operator = (id: string, values: Partial<RankingInput> = {}): RankingInput => ({ id, username: id, avatar: 0, xp: 0, renown: 0, production: 0, ...values });

describe("reference-style rankings", () => {
  it("normalizes Renown 30, production 30 and XP 40 against category leaders", () => {
    const rows = rankOperators([operator("leader", { renown: 10, production: 8, xp: 1000 }), operator("half", { renown: 5, production: 4, xp: 500 })]);
    expect(rows[0]?.points).toEqual({ renown: 30, production: 30, progression: 40 });
    expect(rows[0]?.score).toBe(100);
    expect(rows[1]?.score).toBe(50);
  });
  it("awards zero for a zero-leader category rather than redistributing its weight", () => {
    expect(rankOperators([operator("a", { production: 1, xp: 1000 })])[0]?.score).toBe(70);
    expect(rankOperators([operator("a")])[0]?.score).toBe(0);
  });
  it("uses competition ranks and alphabetical tie order", () => {
    const rows = rankOperators([operator("b", { xp: 1000 }), operator("a", { xp: 1000 }), operator("c", { xp: 500 })]);
    expect(rows.map((r) => [r.id, r.rank])).toEqual([["a", 1], ["b", 1], ["c", 3]]);
  });
  it("shows 100 operators in pages of 25 and retains a self rank outside the cutoff", () => {
    const rows = rankOperators(Array.from({ length: 110 }, (_, i) => operator(`p${i}`, { xp: 110 - i })));
    const page = rankingPage(rows, 9, "p109");
    expect(page.page).toBe(4);
    expect(page.pageCount).toBe(4);
    expect(page.entries).toHaveLength(25);
    expect(page.entries[24]?.rank).toBe(100);
    expect(page.self?.rank).toBe(110);
    expect(page.total).toBe(110);
  });
  it("derives progression level with the reference XP formula", () => {
    expect(rankOperators([operator("a", { xp: 9000 })])[0]?.level).toBe(4);
  });
  it("uses production input rather than currency inventory quantities", () => {
    const rows = rankOperators([operator("upgraded", { production: 2 }), operator("starter", { production: 1 })]);
    expect(rows.map((r) => r.score)).toEqual([30, 15]);
  });
  it("rejects nonfinite, negative and duplicate inputs", () => {
    expect(() => rankOperators([operator("a", { production: NaN })])).toThrow();
    expect(() => rankOperators([operator("a", { xp: -1 })])).toThrow();
    expect(() => rankOperators([operator("a"), operator("a")])).toThrow();
  });
  it("handles empty rankings", () => {
    expect(rankingPage(rankOperators([]), 1, "absent")).toMatchObject({ entries: [], self: null, pageCount: 1, total: 0 });
  });
});