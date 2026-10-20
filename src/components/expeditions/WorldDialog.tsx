import { useEffect, useState } from "react";
import { Check, Clock, Compass, Gift, Lock, MapPin, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuthStore } from "@/features/stores/auth.store";
import { useOwnedItems } from "@/features/stores/items.store";
import { useEquipmentStore } from "@/features/stores/equipment.store";
import { useStationStore } from "@/features/stores/station.store";
import { usePlayerStore } from "@/features/stores/player.store";
import { useExpeditionsStore } from "@/features/stores/expeditions.store";
import { levelFromXp } from "@/lib/game/profile/level";
import { dailyBoard, expeditionStats, MISSION_META, missionOdds, requirementChecks, TIERS } from "@/lib/game/expeditions/rules";
import { bossBoard, bossFor } from "@/lib/game/expeditions/bosses";
import { HOME, hexDistance, type Hex } from "@/lib/game/world/hex";

const countdown = (ms: number) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 3600)}h ${Math.floor(s / 60) % 60}m ${s % 60}s`; };
type Props = { missionId: string | null; hex: Hex | null; onClose: () => void; onOpenMail: () => void };

/** Opens when an expedition world is clicked on the sector map. */
export function WorldDialog({ missionId, hex, onClose, onOpenMail }: Props) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { if (!missionId) return; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [missionId]);
  const owner = useAuthStore((s) => s.player?.id);
  const balance = useOwnedItems(); const gear = useEquipmentStore(); const levels = useStationStore((s) => s.levels);
  const xp = usePlayerStore((s) => s.xp); const store = useExpeditionsStore();
  const mission = missionId ? [...dailyBoard(now), ...bossBoard(now)].find((m) => m.id === missionId) : undefined;
  const equipment = gear.items.filter((i) => i.ownerId === owner && !i.marketPrice && gear.equipped[i.slot] === i.id);
  const stats = expeditionStats(levels, equipment);
  const runs = store.runs.filter((r) => r.owner === owner);
  const active = runs.find((r) => !r.claimed);
  const starter = owner && !store.starters.includes(owner);

  return <Dialog open={!!missionId} onOpenChange={(o) => !o && onClose()}>
    <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-md overflow-y-auto border-primary/30 bg-card/95 backdrop-blur">
      {mission ? (() => {
        const meta = MISSION_META[mission.type]; const boss = bossFor(mission); const tier = TIERS[mission.tier];
        const checks = requirementChecks(mission, levelFromXp(xp), stats, equipment);
        const previous = runs.find((r) => r.mission.id === mission.id);
        const here = active?.mission.id === mission.id ? active : undefined;
        return <>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <img src={boss?.image ?? meta.image} alt="" width={64} height={64} className="size-16 shrink-0 object-contain" />
              <div className="min-w-0">
                <DialogTitle>{boss?.name ?? meta.destination}</DialogTitle>
                <DialogDescription>{boss ? "Boss encounter" : meta.label} · Tier {mission.tier}</DialogDescription>
                {hex && <p className="mt-1 flex items-center gap-1 font-mono text-[10px] text-muted-foreground"><MapPin className="size-3" />{hex.q}:{hex.r} · {hexDistance(HOME, hex)} sectors away</p>}
              </div>
            </div>
          </DialogHeader>
          {starter && <Button variant="outline" size="sm" onClick={() => store.claimStarter() && toast.success("Starter Mothership received")}><Gift className="size-4" />Claim free starter Mothership</Button>}
          <p className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="size-3" />{tier.hours}h flight · {tier.draws} base draws · {tier.xp.toLocaleString()} XP</p>
          {boss && <p className="text-xs text-muted-foreground">Hull {boss.hp} · Attack {boss.attack} · Defense {boss.defense}</p>}
          <ul className="space-y-1 border border-border bg-background/60 p-2 text-xs">{checks.map((c) => <li key={c.label} className={`flex items-center gap-2 ${c.ok ? "text-primary" : "text-muted-foreground"}`}>{c.ok ? <Check className="size-3 shrink-0" /> : <Lock className="size-3 shrink-0" />}<span className="capitalize">{c.label}</span></li>)}</ul>
          <p className="text-xs text-muted-foreground">Always recovers {tier.resources[0]} Titanium · {tier.resources[1]} Plasma · {tier.resources[2]} Rations</p>
          <details className="text-[11px] text-muted-foreground"><summary className="cursor-pointer">Shard odds</summary><div className="mt-2 space-y-1">{missionOdds(mission.tier).filter((o) => o.percent > 0).map((o) => <p key={o.rarity} className="flex justify-between capitalize"><span>{o.rarity}</span><span>{o.percent.toFixed(2)}%</span></p>)}</div></details>
          {here ? <div className="space-y-2 border border-primary/30 p-2">
            <p className="font-mono text-sm text-primary">{now >= here.finishAt ? "Ready to collect" : countdown(here.finishAt - now)}</p>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" disabled={balance["warp-drive"] < 1 || now >= here.finishAt} onClick={() => store.speedUp(here.id) && toast.success("Travel accelerated")}><Zap className="size-4" />Speed up · {balance["warp-drive"]}</Button>
              <Button size="sm" disabled={now < here.finishAt} onClick={() => store.claim(here.id) && toast.success("Rewards collected · report in your mail", { action: { label: "Open", onClick: onOpenMail } })}><Gift className="size-4" />Collect</Button>
            </div>
          </div> : <Button disabled={!checks.every((c) => c.ok) || !!active || !!previous || balance.nanites < tier.fuel} onClick={() => store.dispatch(mission.id) ? toast.success("Expedition launched") : toast.error("Requirements not met")}>
            <Compass className="size-4" />{previous ? "Completed today" : active ? "Another expedition in flight" : `Launch · ${tier.fuel} Nanites`}
          </Button>}
        </>;
      })() : <DialogHeader><DialogTitle>Uncharted world</DialogTitle><DialogDescription>This world has drifted off today's charts.</DialogDescription></DialogHeader>}
    </DialogContent>
  </Dialog>;
}
