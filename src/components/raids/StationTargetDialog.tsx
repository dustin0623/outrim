import { useEffect, useState } from "react";
import { MapPin, ScanEye, Swords } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuthStore } from "@/features/stores/auth.store";
import { useOwnedItems } from "@/features/stores/items.store";
import { currentRaidStats, freshIntel, useRaidsStore } from "@/features/stores/raids.store";
import { RAID_FUEL, raidChance, raidStats } from "@/lib/game/raids/rules";
import { RESOURCE_KEYS, RESOURCE_LABEL } from "@/lib/game/station/economy";
import { TROOP_CATALOG, TROOP_TYPES } from "@/lib/game/troops/rules";
import { HOME, hexDistance, type Hex } from "@/lib/game/world/hex";

type Props = { targetId: string | null; stationName: string; hex: Hex | null; onClose: () => void; onOpenMail: () => void };

/** Opens when a rival station is clicked on the sector map. */
export function StationTargetDialog({ targetId, stationName, hex, onClose, onOpenMail }: Props) {
  const owner = useAuthStore((s) => s.player?.id);
  const balance = useOwnedItems();
  const store = useRaidsStore();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { if (owner) store.initialize(); }, [owner, store]);
  useEffect(() => { if (!targetId) return; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [targetId]);
  const account = owner ? store.accounts[owner] : undefined;
  const target = account?.targets.find((t) => t.id === targetId);
  const intel = target ? freshIntel(account, target.id, now) : undefined;
  const mine = currentRaidStats();
  const odds = target ? raidChance(mine.attack, raidStats(target.levels, target.equipment, target.troops).defense) : 0;
  const drones = balance["recon-drone"];

  return <Dialog open={!!targetId} onOpenChange={(o) => !o && onClose()}>
    <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-md overflow-y-auto border-primary/30 bg-card/95 backdrop-blur">
      {target ? <>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <img src={target.avatar} alt="" width={64} height={64} className="size-16 shrink-0 border border-border object-cover" />
            <div className="min-w-0">
              <DialogTitle>{target.name}</DialogTitle>
              <DialogDescription>Lv {target.level} · {stationName}</DialogDescription>
              {hex && <p className="mt-1 flex items-center gap-1 font-mono text-[10px] text-muted-foreground"><MapPin className="size-3" />{hex.q}:{hex.r} · {hexDistance(HOME, hex)} sectors away</p>}
            </div>
          </div>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="border border-border bg-background/60 p-2"><p className="text-[10px] uppercase text-muted-foreground">Your attack</p><b className="font-mono text-primary">{mine.attack}</b></div>
          <div className="border border-border bg-background/60 p-2"><p className="text-[10px] uppercase text-muted-foreground">Their defense</p><b className="font-mono text-primary">{intel ? intel.stats.defense : "???"}</b></div>
        </div>
        <div className="space-y-1 border border-border bg-background/60 p-2 text-xs">
          <p className="mb-1 text-[10px] uppercase text-muted-foreground">Exposed stores</p>
          {RESOURCE_KEYS.map((k) => <div key={k} className="flex justify-between"><span className="text-muted-foreground">{RESOURCE_LABEL[k]}</span><span className="font-mono">{target.exposed[k].toLocaleString()}</span></div>)}
        </div>
        {intel ? <div className="border border-primary/30 bg-background/60 p-2 text-xs">
          <p className="flex items-center gap-1 font-semibold text-primary"><ScanEye className="size-3" />Intel · {Math.max(0, Math.ceil((intel.expiresAt - now) / 60000))}m left · {odds}% odds</p>
          <p className="mt-1 text-muted-foreground">{TROOP_TYPES.filter((t) => intel.target.troops[t] > 0).map((t) => `${intel.target.troops[t]} ${TROOP_CATALOG[t].name}`).join(", ") || "No troops detected"}</p>
        </div> : <p className="text-xs text-muted-foreground">Scout with a Recon Drone to reveal their garrison and true defense.</p>}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" disabled={!!intel || drones < 1} onClick={() => store.scout(target.id) ? toast.success("Scout report sent to your mail", { action: { label: "Open", onClick: onOpenMail } }) : toast.error("You need a Recon Drone from the Shop")}>
            <ScanEye className="size-4" />Scout · {drones}
          </Button>
          <Button disabled={balance.plasma < RAID_FUEL} onClick={() => { const log = store.raid(target.id); if (!log) return toast.error(`Raid needs ${RAID_FUEL} Plasma`); toast[log.success ? "success" : "error"](log.success ? "Raid won · report in your mail" : "Raid failed · report in your mail", { action: { label: "Open", onClick: onOpenMail } }); }}>
            <Swords className="size-4" />Raid · {RAID_FUEL} Plasma
          </Button>
        </div>
      </> : <DialogHeader><DialogTitle>{stationName}</DialogTitle><DialogDescription>Station signal lost.</DialogDescription></DialogHeader>}
    </DialogContent>
  </Dialog>;
}
