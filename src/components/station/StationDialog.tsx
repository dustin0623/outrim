import { Box, Building2, Factory, Radar, Rocket, Shield, Swords, Warehouse } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useStationStore } from "@/features/stores/station.store";
import { BUILDINGS, MAX_LEVEL, effectAt, upgradeBlock, upgradeCost, type BuildingId } from "@/lib/game/station/buildings";

const ICONS: Record<BuildingId, typeof Box> = { hq: Building2, extractor: Factory, storehouse: Warehouse, barracks: Swords, dispatch: Rocket, defense: Shield };
const BLOCK_TEXT = { max: "Max level", hq: "Upgrade Command Rig first", alloy: "Not enough Alloy" } as const;

export function StationDialog() {
  const { levels, securedAlloy, upgrade } = useStationStore();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="mt-2 w-full text-xs"><Radar className="size-4" /> Manage station</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] max-w-3xl overflow-y-auto border-border bg-card">
        <DialogHeader>
          <DialogTitle className="uppercase">Station management</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Box className="size-4 text-primary" /> <b className="text-foreground">{securedAlloy.toLocaleString()}</b> secured Alloy available · upgrades apply instantly
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {BUILDINGS.map((b) => {
            const Icon = ICONS[b.id];
            const level = levels[b.id];
            const block = upgradeBlock(b.id, levels, securedAlloy);
            const cost = level < MAX_LEVEL ? upgradeCost(b.id, level + 1) : 0;
            return (
              <section key={b.id} className="flex flex-col border border-border bg-background/60 p-4">
                <div className="mb-2 flex items-center gap-3">
                  <Icon className="size-6 text-primary" />
                  <div className="min-w-0 flex-1"><h3 className="font-semibold">{b.name}</h3><p className="text-[10px] text-muted-foreground">{b.summary}</p></div>
                  <span className="font-mono text-xs text-primary">LV {level}/{MAX_LEVEL}</span>
                </div>
                <dl className="mb-3 space-y-1 text-xs">
                  <div className="flex justify-between"><dt className="text-muted-foreground">Now</dt><dd>{level === 0 ? "Not built" : effectAt(b.id, level)}</dd></div>
                  {level < MAX_LEVEL && <div className="flex justify-between"><dt className="text-muted-foreground">Next</dt><dd className="text-accent">{effectAt(b.id, level + 1)}</dd></div>}
                </dl>
                <Button
                  size="sm" variant={block ? "secondary" : "default"} disabled={!!block} className="mt-auto text-xs"
                  onClick={() => { if (upgrade(b.id)) toast.success(`${b.name} upgraded to level ${level + 1}`); }}
                >
                  {block ? BLOCK_TEXT[block] : <>{level === 0 ? "Build" : "Upgrade"} · <Box className="size-3" /> {cost.toLocaleString()}</>}
                </Button>
                {block === "alloy" && <p className="mt-1 text-center text-[10px] text-muted-foreground">Costs {cost.toLocaleString()} Alloy</p>}
              </section>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
