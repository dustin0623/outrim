import type { ReactNode } from "react";
import { Box, Coins, Flame, Pickaxe, Radar, Shield, Sprout, Swords } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useStationStore } from "@/features/stores/station.store";
import { useOwnedItems } from "@/features/stores/items.store";
import { BUILDINGS, canAfford, effectAt, upgradeCost, type BuildingId } from "@/lib/game/station/buildings";
import { RESOURCE_KEYS, RESOURCE_LABEL } from "@/lib/game/station/economy";

const ICONS: Record<BuildingId, typeof Box> = { tribute: Coins, titanium: Pickaxe, plasma: Flame, rations: Sprout, vault: Box, attack: Swords, defense: Shield };

export function StationDialog({ trigger }: { trigger?: ReactNode }) {
  const { levels, upgrade } = useStationStore();
  const balance = useOwnedItems();
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? <Button className="mt-2 w-full text-xs"><Radar className="size-4" /> Manage station</Button>}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-3xl overflow-y-auto border-primary/30 bg-card/95 backdrop-blur">
        <DialogHeader>
          <DialogTitle className="uppercase">Station management</DialogTitle>
          <DialogDescription>
            {RESOURCE_KEYS.map((k) => `${balance[k].toLocaleString()} ${RESOURCE_LABEL[k]}`).join(" · ")} · upgrades apply instantly
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {BUILDINGS.map((b) => {
            const Icon = ICONS[b.id];
            const level = levels[b.id];
            const cost = upgradeCost(b.id, level);
            const ok = canAfford(balance, cost);
            return (
              <section key={b.id} className="flex flex-col border border-border bg-background/60 p-4">
                <div className="mb-2 flex items-center gap-3">
                  <Icon className="size-6 text-primary" />
                  <div className="min-w-0 flex-1"><h3 className="font-semibold">{b.name}</h3><p className="text-[10px] text-muted-foreground">{b.summary}</p></div>
                  <span className="font-mono text-xs text-primary">LV {level}</span>
                </div>
                <dl className="mb-3 space-y-1 text-xs">
                  <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Now</dt><dd className="text-right">{effectAt(b.id, level)}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Next</dt><dd className="text-right text-accent">{effectAt(b.id, level + 1)}</dd></div>
                </dl>
                <ul className="mb-2 grid grid-cols-2 gap-x-3 text-[10px]">
                  {RESOURCE_KEYS.map((k) => (
                    <li key={k} className={`flex justify-between ${balance[k] < cost[k] ? "text-destructive" : "text-muted-foreground"}`}><span>{RESOURCE_LABEL[k]}</span><span className="font-mono">{cost[k].toLocaleString()}</span></li>
                  ))}
                </ul>
                <Button size="sm" variant={ok ? "default" : "secondary"} disabled={!ok} className="mt-auto text-xs"
                  onClick={() => { if (upgrade(b.id)) toast.success(`${b.name} upgraded to level ${level + 1}`); }}>
                  {ok ? `Upgrade to LV ${level + 1}` : "Not enough resources"}
                </Button>
              </section>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
