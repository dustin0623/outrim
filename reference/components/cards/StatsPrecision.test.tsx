import { describe, expect, it, vi } from "vitest";
import type { ReactElement, ReactNode } from "react";

vi.mock("framer-motion", () => ({ motion: { div: "div" } }));
vi.mock("@/components/ui/button", () => ({ Button: "button" }));
vi.mock("@/hooks/useNow", () => ({ useNow: () => 0 }));
vi.mock("@/hooks/useGameActionFlow", () => ({
  useGameActionFlow: () => ({
    lifecycle: "idle",
    busy: false,
    unavailable: false,
    run: vi.fn(),
    reset: vi.fn(),
  }),
}));
vi.mock("@/features/stores/authStore", () => ({
  useAuthStore: (select: (state: unknown) => unknown) =>
    select({ username: "alice" }),
}));
vi.mock("@/features/stores/playerStore", () => ({
  usePlayerStore: (select: (state: unknown) => unknown) =>
    select({ xp: 0, lastSinkAt: 0, sparks: 2.123456 }),
}));
vi.mock("@/hooks/useGameStats", () => ({
  useGameStats: () => ({
    wallet: 5,
    vault: 0.163249,
    capacity: 2,
    fillPercent: 8.16,
    perSecond: 2 / 86400,
    secondsToFull: 100,
    vaultStaked: 1,
    notoriety: 0,
    decay: 1,
    claims: { current: 3, max: 5, msUntilNext: 1000 },
    base: {
      hashRate: 1,
      hackPower: 10,
      security: 10,
      luck: 0.025,
      firewall: 1.025,
      exploit: 1,
    },
    gear: {
      hashRate: 0.254,
      hackPower: 0.567,
      security: 0.1,
      luck: 0,
      firewall: 0,
      exploit: 0,
    },
    total: {
      hashRate: 1.254,
      hackPower: 10.567,
      security: 10.1,
      luck: 0.025,
      firewall: 1.025,
      exploit: 1,
    },
    levels: { hashRate: 1, hackPower: 1, security: 1 },
  }),
}));

import { VaultCard } from "./VaultCard";
import { AnimatedNumber } from "@/components/game/AnimatedNumber";
import { DashboardPage } from "@/components/pages/DashboardPage";
import { ActiveEffectsSection } from "@/components/game/ActiveEffectsSection";
import { RaidTable } from "@/components/tables/RaidTable";
import { UpgradeTableModal } from "./StatUpgradeCard";
import { upgradeCost } from "@/features/types/game/stats";
import { STAT_META } from "@/lib/config/constants/game";

type Node = ReactElement<Record<string, unknown> & { children?: ReactNode }>;
const nodes = (node: ReactNode): Node[] =>
  Array.isArray(node)
    ? node.flatMap(nodes)
    : node && typeof node === "object" && "props" in node
      ? [node as Node, ...nodes((node as Node).props.children)]
      : [];
const text = (node: ReactNode): string =>
  Array.isArray(node)
    ? node.map(text).join("")
    : node && typeof node === "object" && "props" in node
      ? text((node as Node).props.children)
      : typeof node === "string" || typeof node === "number"
        ? String(node)
        : "";

describe("stat and exposed hold presentation", () => {
  it("places authoritative effects immediately after permanent stats and before raids", () => {
    const tree = DashboardPage();
    expect(text(tree)).toContain("Secured Alloy (HASH)");
    expect(text(tree)).toContain("2.1235");
    const children = (tree.props.children as ReactNode[]).filter(Boolean);
    const permanent = children.findIndex((child) =>
      text(child).includes("Permanent stats"),
    );
    const effects = children.findIndex(
      (child) =>
        typeof child === "object" &&
        child &&
        "type" in child &&
        child.type === ActiveEffectsSection,
    );
    const raids = children.findIndex(
      (child) =>
        typeof child === "object" &&
        child &&
        "type" in child &&
        child.type === RaidTable,
    );
    expect(permanent).toBeGreaterThan(-1);
    expect(effects).toBe(permanent + 1);
    expect(raids).toBeGreaterThan(effects);
  });
  it("shows capacity and fractional permanent stats with up to four decimals while levels stay integers", () => {
    const tree = DashboardPage();
    const cards = nodes(tree);
    expect(
      cards.find((node) => node.props.title === "Exposed Hold size")?.props
        .value,
    ).toBe("2");
    expect(
      cards.find((node) => node.props.title === "Renown")?.props.value,
    ).toBe("0");
    const hash = cards.find(
      (node) => node.props.title === STAT_META.hashRate.label,
    )!;
    const luck = cards.find(
      (node) => node.props.title === STAT_META.luck.label,
    )!;
    expect(luck.props.value).toBe("0.025%");
    expect(text(luck.props.meta as ReactNode)).toContain("Stake +0.025%");
    expect(text(tree)).not.toContain("25% base Fortune");
    expect(hash.props.value).toBe("1.254");
    expect(text(hash.props.meta as ReactNode)).toContain(
      "Lv 1 · Base 1 · Modules +0.254",
    );
    expect(text(hash.props.meta as ReactNode)).toContain(
      "0.00002 Alloy (HASH)/sec · 2 exposed hold capacity",
    );
    expect(
      cards.find((node) => node.props.title === STAT_META.hackPower.label)
        ?.props.value,
    ).toBe("10.567");
  });
  it("shows reference-table charges using the current level", () => {
    const tree = UpgradeTableModal({
      title: "Extraction",
      currentLevel: 1,
      rowCount: 3,
      computeCost: upgradeCost,
      formatValue: String,
    });
    expect(text(tree)).toContain("Lv 2 (cost: 1)");
    expect(text(tree)).toContain("Lv 3 (cost: 4)");
  });
  it("matches the animated exposed hold and secure haul label at four decimals without changing the submitted action", () => {
    const onClaim = vi.fn();
    const tree = VaultCard({
      vault: 0.163249,
      capacity: 2,
      fillPercent: 8.16,
      perSecond: 2 / 86400,
      secondsToFull: 100,
      onClaim,
      charges: 3,
      maxCharges: 5,
    });
    const number = nodes(tree).find((node) => node.type === AnimatedNumber)!;
    expect(
      (number.props.format as (value: number) => string)(
        number.props.value as number,
      ),
    ).toBe("0.1632");
    expect(text(tree)).toContain("of 2 capacity");
    expect(text(tree)).toContain("0.00002 Alloy (HASH) / sec");
    const claim = nodes(tree).find((node) => node.type === "button")!;
    expect(text(claim)).toContain("Secure Haul 0.1632 Alloy (HASH)");
    expect(claim.props.disabled).toBeFalsy();
    (claim.props.onClick as () => void)();
    expect(onClaim).toHaveBeenCalledExactlyOnceWith();
  });
  it("retains fractional decay percentages in the mining notice", () => {
    const tree = VaultCard({
      vault: 0.1,
      capacity: 1,
      fillPercent: 10,
      perSecond: 0.000001,
      secondsToFull: 100,
      onClaim: vi.fn(),
      decay: 0.123456,
      charges: 3,
      maxCharges: 5,
    });
    expect(text(tree)).toContain("Rate reduced to 12.3456%");
  });
});
