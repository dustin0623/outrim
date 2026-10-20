import { useEffect, useState, type ReactNode } from "react";
import { Crosshair, Radar, ScanEye, Swords } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/features/stores/auth.store";
import { useOwnedItems } from "@/features/stores/items.store";
import { useEquipmentStore } from "@/features/stores/equipment.store";
import { useStationStore } from "@/features/stores/station.store";
import { useTroopsStore } from "@/features/stores/troops.store";
import { useRaidsStore, type RaidLog } from "@/features/stores/raids.store";
import { currentRaidStats, freshIntel } from "@/features/stores/raids.store";
import { INTEL_DURATION, RAID_FUEL, raidChance, raidStats } from "@/lib/game/raids/rules";
import { RESOURCE_LABEL, RESOURCE_KEYS } from "@/lib/game/station/economy";
import { EMPTY_TROOPS, TROOP_CATALOG, TROOP_TYPES, type TroopCounts } from "@/lib/game/troops/rules";
import { ITEM_CATALOG } from "@/lib/game/items/catalog";
import { levelFromXp } from "@/lib/game/profile/level";
import { usePlayerStore } from "@/features/stores/player.store";

function troopRoster(troops: TroopCounts) {
  return TROOP_TYPES.filter((t) => troops[t] > 0).map((t) => `${troops[t]} ${TROOP_CATALOG[t].name}`);
}

function RaidResult({ log }: { log: RaidLog }) {
  return <div className="border border-border bg-background/60 p-2 text-xs">
    <p className={log.success ? "font-semibold text-primary" : "font-semibold text-destructive"}>
      {log.success ? (log.critical ? "Critical breach" : "Victory") : log.reason === "outmatched" ? "Outmatched" : "Repelled"} · {log.chance}% odds
    </p>
    {log.success && <p className="mt-1 text-muted-foreground">{Math.round(log.exposure * 100)}% of exposed stores plundered{log.critical ? " (critical ×2)" : ""}</p>}
    {log.success && <p className="mt-1 flex flex-wrap gap-x-3">{RESOURCE_KEYS.map((k) => <span key={k}>+{log.loot[k]} {RESOURCE_LABEL[k]}</span>)}</p>}
    <p className="mt-1 font-mono text-[10px] text-muted-foreground">Your attack {log.attack} · Their defense {log.defense} · {log.fuel} Plasma fuel</p>
  </div>;
}

export function RaidsDialog({ trigger }: { trigger?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("targets");
  const owner = useAuthStore((s) => s.player?.id);
  const balance = useOwnedItems();
  const level = levelFromXp(usePlayerStore((s) => s.xp));
  const store = useRaidsStore();
  useEffect(() => { if (open && owner) store.initialize(); }, [open, owner, store]);
  useEffect(() => { if (!open) return; const timer = setInterval(() => useRaidsStore.setState({}), 1000); return () => clearInterval(timer); }, [open]);
  const account = owner ? store.accounts[owner] : undefined;
  const mine = currentRaidStats();
  const drones = balance["recon-drone"];
  const now = Date.now();
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>{trigger ?? <Button variant="ghost" size="sm"><Swords className="size-4" />Raids</Button>}</DialogTrigger>
    <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-5xl overflow-y-auto border-primary/30 bg-card/95 backdrop-blur">
      <DialogHeader><DialogTitle>Raid Console</DialogTitle><DialogDescription>Lv {level} · {drones} Recon Drones · {balance.plasma.toLocaleString()} Plasma fuel</DialogDescription></DialogHeader>
      <section aria-label="Your raid stats" className="grid grid-cols-3 gap-2 border-b border-border pb-3">
        <div><p className="text-[10px] uppercase text-muted-foreground">Attack</p><b className="font-mono text-sm text-primary">{mine.attack}</b></div>
        <div><p className="text-[10px] uppercase text-muted-foreground">Defense</p><b className="font-mono text-sm text-primary">{mine.defense}</b></div>
        <div><p className="text-[10px] uppercase text-muted-foreground">Crit</p><b className="font-mono text-sm text-primary">{mine.crit}%</b></div>
      </section>
      <Tabs value={view} onValueChange={setView}>
        <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="targets">Targets</TabsTrigger><TabsTrigger value="log">Battle Log ({account?.logs.length ?? 0})</TabsTrigger></TabsList>
        <TabsContent value={view === "log" ? "log" : "targets"} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{(account?.targets ?? []).map((target) => {
            const intel = freshIntel(account, target.id, now);
            const defense = raidStats(target.levels, target.equipment, target.troops).defense;
            const visibleDefense = intel ? intel.stats.defense : null;
            const chance = raidChance(mine.attack, defense);
            return <article key={target.id} className="flex min-w-0 flex-col border border-border bg-background/40">
              <div className="relative flex h-28 items-center justify-center overflow-hidden bg-background/60">
                <img src={target.avatar} alt={target.name} className="h-24 w-24 rounded object-cover" />
                <span className="absolute left-3 top-3 font-mono text-xs text-primary">Lv {target.level}</span>
                {target.sabotageActive && <span className="absolute right-3 top-3 text-[10px] uppercase text-accent">Sabotaged</span>}
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div><h2 className="text-sm font-semibold">{target.name}</h2>
                  <p className="text-xs text-muted-foreground">Defense {visibleDefense ?? "???"} · Exposed stores below</p></div>
                <div className="space-y-1 text-xs">
                  {RESOURCE_KEYS.map((k) => <div key={k} className="flex justify-between"><span className="text-muted-foreground">{RESOURCE_LABEL[k]}</span><span className="font-mono">{target.exposed[k].toLocaleString()}</span></div>)}
                </div>
                {intel ? <div className="border border-primary/30 bg-background/60 p-2 text-xs">
                  <p className="flex items-center gap-1 font-semibold text-primary"><ScanEye className="size-3" />Intel report · {Math.max(0, Math.ceil((intel.expiresAt - now) / 60000))}m left</p>
                  <p className="mt-1 text-muted-foreground">{troopRoster(intel.target.troops).join(", ") || "No troops detected"}</p>
                  <p className="mt-1 font-mono">Attack {intel.stats.attack} · Defense {intel.stats.defense} · Crit {intel.stats.crit}%</p>
                </div> : <p className="text-xs text-muted-foreground">Launch a Recon Drone to reveal troops and true totals ({INTEL_DURATION / 60000}min window).</p>}
                {chance > 0 && !intel && <p className="text-xs text-accent">Estimated odds (scout for exact): ~{chance}%</p>}
                <div className="mt-auto flex flex-col gap-2">
                  <Button size="sm" variant="outline" disabled={!intel && drones < 1} onClick={() => { store.scout(target.id) ? toast.success("Recon report captured") : toast.error(`No Recon Drone · buy one in the Shop (${ITEM_CATALOG["recon-drone"].name})`); }}>
                    <ScanEye className="size-4" />{intel ? "Refresh intel" : "Scout · 1 Drone"}
                  </Button>
                  <Button size="sm" disabled={balance.plasma < RAID_FUEL} onClick={() => { const log = store.raid(target.id); if (log) { toast[log.success ? "success" : "error"](log.success ? `Plundered ${log.loot.titanium} Titanium, ${log.loot.plasma} Plasma, ${log.loot.rations} Rations` : "Raid repelled"); setView("log"); } else toast.error(`Raid needs ${RAID_FUEL} Plasma fuel`); }}>
                    <Swords className="size-4" />Raid · {RAID_FUEL} Plasma
                  </Button>
                </div>
              </div>
            </article>;
          })}</div>
          {!account && <p className="py-10 text-center text-sm text-muted-foreground">Sign in to view raid targets.</p>}
        </TabsContent>
        <TabsContent value="log"><div className="divide-y divide-border">{[...(account?.logs ?? [])].reverse().map((log) => <article key={log.id} className="py-4">
          <div className="flex flex-wrap justify-between gap-2"><h2 className="text-sm font-semibold"><Crosshair className="mr-1 inline size-3 text-primary" />{log.targetName}</h2><span className="text-xs text-muted-foreground">{new Date(log.at).toLocaleTimeString()}</span></div>
          <div className="mt-2"><RaidResult log={log} /></div>
        </article>)}{!account?.logs.length && <p className="py-10 text-center text-sm text-muted-foreground"><Radar className="mx-auto mb-2 size-6 text-muted-foreground" />No raids recorded. Scout a target, then launch with Plasma fuel.</p>}</div></TabsContent>
      </Tabs>
    </DialogContent>
  </Dialog>;
}
