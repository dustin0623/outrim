import { beforeEach, describe, expect, it } from "vitest";
import { useAuthStore } from "./auth.store";
import { useItemsStore } from "./items.store";
import { useEquipmentStore } from "./equipment.store";
import { useExpeditionsStore } from "./expeditions.store";
import { useStationStore } from "./station.store";
import { usePlayerStore } from "./player.store";
import { dailyBoard } from "@/lib/game/expeditions/rules";
import { STARTING_LEVELS } from "@/lib/game/station/buildings";
import { bossBoard } from "@/lib/game/expeditions/bosses";
const now = Date.parse("2026-10-20T04:00:00Z");
describe("expedition lifecycle", () => {
  beforeEach(() => { useAuthStore.setState({ player: { id: "explorer" } } as never); useItemsStore.setState({ accounts: {} }); useEquipmentStore.setState({ items: [], equipped: {} }); useExpeditionsStore.setState({ runs: [], starters: [] }); usePlayerStore.getState().reset(); useStationStore.setState({ levels: { ...STARTING_LEVELS } }); });
  it("grants one starter Mothership per owner, enough for T1 combat", () => { expect(useExpeditionsStore.getState().claimStarter()).toBe(true); expect(useExpeditionsStore.getState().claimStarter()).toBe(false); expect(useEquipmentStore.getState().items).toHaveLength(1); });
  it("rejects dispatch without a Mothership, without debiting items", () => { expect(useExpeditionsStore.getState().dispatch(dailyBoard(now)[0]?.id ?? "", now)).toBeNull(); expect(useItemsStore.getState().getQuantity("rim")).toBe(10); });
  it("charges Nanites only and snapshots base/equipment stats at dispatch", () => {
    useExpeditionsStore.getState().claimStarter(); useStationStore.setState({ levels: { ...STARTING_LEVELS, tribute: 100, attack: 50, defense: 50 } }); usePlayerStore.setState({ xp: 10000000 });
    useEquipmentStore.setState((s) => ({ items: s.items.map((i) => ({ ...i, rarity: "legendary", stats: { luck: 50, evasion: 50 } })) })); useItemsStore.getState().credit("nanites", 300);
    const mission = dailyBoard(now).find((m) => m.tier === 2); const id = useExpeditionsStore.getState().dispatch(mission?.id ?? "", now);
    expect(id).not.toBeNull(); expect(useItemsStore.getState().getQuantity("nanites")).toBe(285); expect(useItemsStore.getState().getQuantity("plasma")).toBe(250); expect(useItemsStore.getState().getQuantity("rim")).toBe(10);
  });
  it("runs countdown, speed-up and one-time collection with XP and resources", () => {
    useExpeditionsStore.getState().claimStarter(); useItemsStore.getState().credit("warp-drive", 3);
    const id = useExpeditionsStore.getState().dispatch(dailyBoard(now)[0]?.id ?? "", now); if (!id) throw new Error("Launch failed");
    expect(useExpeditionsStore.getState().claim(id, now)).toBeNull();
    expect(useExpeditionsStore.getState().dispatch(dailyBoard(now)[0]?.id ?? "", now)).toBeNull();
    for (let i = 0; i < 3; i++) expect(useExpeditionsStore.getState().speedUp(id, now)).toBe(true);
    expect(useItemsStore.getState().getQuantity("warp-drive")).toBe(0);
    const reward = useExpeditionsStore.getState().claim(id, now); expect(reward?.xp).toBe(150); expect(usePlayerStore.getState().xp).toBe(150); expect(useItemsStore.getState().getQuantity("titanium")).toBe(550); expect(useItemsStore.getState().getQuantity("plasma")).toBe(260); expect(useItemsStore.getState().getQuantity("rations")).toBe(280);
    expect(useExpeditionsStore.getState().claim(id, now)).toBeNull();
  });
  it("prevents another owner claiming or accelerating a run", () => {
    useExpeditionsStore.getState().claimStarter(); const id = useExpeditionsStore.getState().dispatch(dailyBoard(now)[0]?.id ?? "", now); if (!id) throw new Error("Launch failed"); useAuthStore.setState({ player: { id: "other" } } as never); expect(useExpeditionsStore.getState().claim(id, now + 3600000)).toBeNull(); expect(useExpeditionsStore.getState().speedUp(id, now)).toBe(false);
  });
  it("equips the new owner's starter instead of retaining someone else's ship", () => {
    useExpeditionsStore.getState().claimStarter(); useAuthStore.setState({ player: { id: "second-explorer" } } as never); useExpeditionsStore.getState().claimStarter();
    const state = useEquipmentStore.getState(); expect(state.items.find((i) => i.id === state.equipped.mothership)?.ownerId).toBe("second-explorer");
  });
  it("requires a Mothership for bosses and settles victory exactly once", () => {
    const mission = bossBoard(now)[0]; if (!mission) throw new Error("Missing boss");
    expect(useExpeditionsStore.getState().dispatch(mission.id, now)).toBeNull();
    useExpeditionsStore.getState().claimStarter();
    const id = useExpeditionsStore.getState().dispatch(mission.id, now); if (!id) throw new Error("Launch failed");
    useEquipmentStore.setState({ equipped: {} });
    const reward = useExpeditionsStore.getState().claim(id, now + 3600000);
    expect(reward?.xp).toBe(150); expect(reward?.items.titanium).toBe(50);
    expect(useExpeditionsStore.getState().runs.find((r) => r.id === id)?.battle?.won).toBe(true);
    expect(useExpeditionsStore.getState().claim(id, now + 3600000)).toBeNull();
    expect(useExpeditionsStore.getState().dispatch(mission.id, now + 3600000)).toBeNull();
  });
  it("guarantees resources and XP after retreat without shard draws", () => {
    useExpeditionsStore.getState().claimStarter(); const mission = bossBoard(now)[0];
    const id = useExpeditionsStore.getState().dispatch(mission?.id ?? "", now); if (!id) throw new Error("Launch failed");
    useExpeditionsStore.setState((s) => ({ runs: s.runs.map((r) => ({ ...r, snapshot: { ...r.snapshot, combat: { attack: 0, defense: 0, extraction: 0, luck: 0, evasion: 0, crit: 0 } } })) }));
    expect(useExpeditionsStore.getState().claim(id, now + 3600000)).toEqual({ items: { titanium: 50, plasma: 10, rations: 30 }, xp: 150, draws: 0 });
    expect(useExpeditionsStore.getState().runs[0]?.battle?.won).toBe(false);
  });
});