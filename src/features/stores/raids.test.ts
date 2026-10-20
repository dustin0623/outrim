import { beforeEach, describe, expect, it } from "vitest";
import { useAuthStore } from "./auth.store";
import { useItemsStore } from "./items.store";
import { useRaidsStore } from "./raids.store";
import { EMPTY_ITEMS } from "@/lib/game/items/catalog";
import { RAID_FUEL } from "@/lib/game/raids/rules";

const owner = "captain";

function balances() {
  return useItemsStore.getState().accounts[owner];
}

describe("mock pvp raids", () => {
  beforeEach(() => {
    useAuthStore.setState({ player: { id: owner } } as never);
    useItemsStore.setState({ accounts: { [owner]: { ...EMPTY_ITEMS, plasma: RAID_FUEL * 2, "recon-drone": 1 } } });
    useRaidsStore.setState({ accounts: {} });
    expect(useRaidsStore.getState().initialize()).toBeUndefined();
  });

  it("creates owner-scoped sample targets once", () => {
    const targets = useRaidsStore.getState().accounts[owner]?.targets;
    expect(targets?.map((t) => t.id)).toEqual(["sample-scout", "sample-sentry", "sample-warlord"]);
    useRaidsStore.getState().initialize();
    expect(useRaidsStore.getState().accounts[owner]?.targets).toHaveLength(3);
  });

  it("scouting spends one recon drone and reports troop composition with expiry", () => {
    const account = useRaidsStore.getState().accounts[owner]!;
    expect(useRaidsStore.getState().scout("sample-scout")).toBe(true);
    expect(balances()["recon-drone"]).toBe(0);
    const report = useRaidsStore.getState().accounts[owner]!.intel["sample-scout"];
    expect(report.target.troops.soldier).toBe(2);
    expect(report.expiresAt).toBeGreaterThan(report.capturedAt);
    expect(report.target.troops).not.toBe(account.targets[0].troops);
  });

  it("scouting twice without a fresh drone is rejected", () => {
    const store = useRaidsStore.getState();
    expect(store.scout("sample-scout")).toBe(true);
    const after = balances()["recon-drone"];
    expect(store.scout("sample-scout")).toBe(false);
    expect(balances()["recon-drone"]).toBe(after);
  });

  it("raiding spends exactly the plasma fuel and clears the intel", () => {
    const store = useRaidsStore.getState();
    expect(store.raid("sample-scout")).not.toBeNull();
    expect(balances().plasma).toBe(RAID_FUEL);
    expect(useRaidsStore.getState().accounts[owner]!.intel["sample-scout"]).toBeUndefined();
    expect(useRaidsStore.getState().accounts[owner]!.logs).toHaveLength(1);
  });

  it("raiding without plasma fuel leaves balances untouched", () => {
    useItemsStore.setState((s) => ({ accounts: { ...s.accounts, [owner]: { ...EMPTY_ITEMS, plasma: 0 } } }));
    const before = useItemsStore.getState().accounts;
    expect(useRaidsStore.getState().raid("sample-scout")).toBeNull();
    expect(useItemsStore.getState().accounts).toEqual(before);
    expect(useRaidsStore.getState().accounts[owner]!.logs).toHaveLength(0);
  });

  it("keeps raid logs owner-scoped", () => {
    useRaidsStore.getState().raid("sample-scout");
    useAuthStore.setState({ player: { id: "other" } } as never);
    expect(useRaidsStore.getState().accounts["other"]).toBeUndefined();
  });
});
