import { useEffect, useState, type ReactNode } from "react";
import { Check, Clock, Compass, Gift, Lock, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/features/stores/auth.store";
import { useOwnedItems } from "@/features/stores/items.store";
import { useEquipmentStore } from "@/features/stores/equipment.store";
import { useStationStore } from "@/features/stores/station.store";
import { usePlayerStore } from "@/features/stores/player.store";
import { useExpeditionsStore } from "@/features/stores/expeditions.store";
import { levelFromXp } from "@/lib/game/profile/level";
import { dailyBoard, expeditionStats, MISSION_META, missionOdds, requirementChecks, TIERS } from "@/lib/game/expeditions/rules";
import { ITEM_CATALOG } from "@/lib/game/items/catalog";
import { STATS, STAT_LABEL } from "@/lib/game/equipment/fleet";

function countdown(ms: number) { const seconds = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(seconds / 3600)}h ${Math.floor(seconds / 60) % 60}m ${seconds % 60}s`; }
export function ExpeditionsDialog({ trigger }: { trigger?: ReactNode }) {
  const [now, setNow] = useState(0);
  const [open, setOpen] = useState(false);
  useEffect(() => { if (!open) return; setNow(Date.now()); const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, [open]);
  const owner = useAuthStore((s) => s.player?.id);
  const balance = useOwnedItems(); const gear = useEquipmentStore(); const levels = useStationStore((s) => s.levels);
  const xp = usePlayerStore((s) => s.xp); const store = useExpeditionsStore();
  const equipment = gear.items.filter((i) => i.ownerId === owner && !i.marketPrice && gear.equipped[i.slot] === i.id);
  const stats = expeditionStats(levels, equipment); const runs = store.runs.filter((r) => r.owner === owner);
  const active = runs.find((r) => !r.claimed); const board = now ? dailyBoard(now) : [];
  const starterAvailable = owner && !store.starters.includes(owner);
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>{trigger ?? <Button variant="ghost" size="sm"><Compass className="size-4" />Explore</Button>}</DialogTrigger>
    <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-5xl overflow-y-auto border-primary/30 bg-card/95 backdrop-blur">
      <DialogHeader><DialogTitle>Expedition Command</DialogTitle><DialogDescription>Lv {levelFromXp(xp)} · {balance.nanites.toLocaleString()} Nanites · Daily board resets 00:00 UTC</DialogDescription></DialogHeader>
      {starterAvailable && <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3"><div><h2 className="text-sm font-semibold">Frontier starter grant</h2><p className="text-xs text-muted-foreground">Common Mothership · +2 Luck · one per operator</p></div><Button size="sm" onClick={() => store.claimStarter() && toast.success("Starter Mothership received")}><Gift className="size-4" />Claim Mothership</Button></div>}
      <section aria-label="Expedition stats" className="grid grid-cols-3 gap-2 border-b border-border pb-3 sm:grid-cols-6">{STATS.map((stat) => <div key={stat}><p className="text-[10px] uppercase text-muted-foreground">{STAT_LABEL[stat]}</p><b className="font-mono text-sm text-primary">{stats[stat]}</b></div>)}</section>
      <Tabs defaultValue="board"><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="board">Daily Missions</TabsTrigger><TabsTrigger value="log">Flight Log ({runs.length})</TabsTrigger></TabsList>
        <TabsContent value="board" className="space-y-4">
          {active && <section aria-label="Active expedition" className="border-b border-primary/30 py-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-semibold">{MISSION_META[active.mission.type].label} · T{active.mission.tier}</h2><p className="mt-1 font-mono text-primary">{now >= active.finishAt ? "Ready to collect" : countdown(active.finishAt - now)}</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={balance["warp-drive"] < 1 || now >= active.finishAt} onClick={() => store.speedUp(active.id) && toast.success("Travel accelerated")}><Zap className="size-4" />Speed up · {balance["warp-drive"]}</Button><Button size="sm" disabled={now < active.finishAt} onClick={() => { const reward = store.claim(active.id); if (reward) toast.success(`Expedition complete · +${reward.xp} XP · ${reward.draws} draws`); }}><Gift className="size-4" />Collect rewards</Button></div></div></section>}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{board.map((mission) => {
            const meta = MISSION_META[mission.type]; const tier = TIERS[mission.tier]; const checks = requirementChecks(mission, levelFromXp(xp), stats, equipment);
            const previous = runs.find((r) => r.mission.id === mission.id); const valid = checks.every((c) => c.ok);
            return <article key={mission.id} className="flex min-w-0 flex-col border border-border bg-background/40">
              <div className="relative flex h-28 items-center justify-center overflow-hidden bg-background/60"><img src={meta.image} alt={meta.destination} className="h-24 w-32 object-contain" /><span className="absolute left-3 top-3 font-mono text-xs text-primary">T{mission.tier}</span><span className="absolute bottom-2 right-3 text-[10px] uppercase text-muted-foreground">{meta.destination}</span></div>
              <div className="flex flex-1 flex-col gap-3 p-4"><div><h2 className="text-sm font-semibold">{meta.label}</h2><p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><Clock className="size-3" />{tier.hours}h · {tier.draws} base draws · {tier.xp.toLocaleString()} XP</p></div>
                <ul className="space-y-1 text-xs">{checks.map((c) => <li key={c.label} className={`flex items-center gap-2 ${c.ok ? "text-primary" : "text-muted-foreground"}`}>{c.ok ? <Check className="size-3 shrink-0" /> : <Lock className="size-3 shrink-0" />}<span className="capitalize">{c.label}</span></li>)}</ul>
                <p className="text-xs text-muted-foreground">{tier.resources[0]} Titanium · {tier.resources[1]} Plasma · {tier.resources[2]} Rations</p>
                <details className="text-[11px] text-muted-foreground"><summary className="cursor-pointer">Shard odds & draw bonuses</summary><div className="mt-2 space-y-1">{missionOdds(mission.tier).filter((o) => o.percent > 0).map((o) => <p key={o.rarity} className="flex justify-between capitalize"><span>{o.rarity}</span><span>{o.percent.toFixed(2)}%</span></p>)}<p>Draw roll: 0.5×–3× base. Rare+ {meta.slot}: +1 draw. Forge: +5% chance per level above 1.</p><p>Yield variance: 0.20×–1.80× per draw.</p></div></details>
                <Button className="mt-auto w-full text-xs" disabled={!valid || !!active || !!previous || balance.nanites < tier.fuel} onClick={() => store.dispatch(mission.id) ? toast.success("Expedition launched") : toast.error("Expedition requirements changed")}><Compass className="size-4" />{previous ? previous.claimed ? "Completed today" : "In flight" : `Launch · ${tier.fuel} Nanites`}</Button>
              </div>
            </article>;
          })}</div>
        </TabsContent>
        <TabsContent value="log"><div className="divide-y divide-border">{[...runs].reverse().map((run) => <article key={run.id} className="py-4"><div className="flex flex-wrap justify-between gap-2"><h2 className="text-sm font-semibold">{MISSION_META[run.mission.type].label} · T{run.mission.tier}</h2><span className="text-xs text-muted-foreground">{run.mission.day} · {run.claimed ? "Collected" : "In flight"}</span></div>{run.reward && <><p className="mt-2 flex items-center gap-1 text-xs text-primary"><Sparkles className="size-3" />+{run.reward.xp} XP · {run.reward.draws} draws</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">{Object.entries(run.reward.items).map(([id, count]) => <span key={id}>+{count} {ITEM_CATALOG[id as keyof typeof ITEM_CATALOG].name}</span>)}</div></>}</article>)}{!runs.length && <p className="py-10 text-center text-sm text-muted-foreground">No expeditions recorded.</p>}</div></TabsContent>
      </Tabs>
    </DialogContent>
  </Dialog>;
}