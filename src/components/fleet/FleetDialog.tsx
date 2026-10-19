import { Crown, Flame, Gem, Hammer, Pickaxe, Radio, Rocket, Shield, Ship, Swords } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useEquipmentStore } from "@/features/stores/equipment.store";
import { useStationStore } from "@/features/stores/station.store";
import {
  CRATE_COST_ALLOY, MAX_ITEM_LEVEL, RARITY_META, SLOTS, SLOT_META, STATS, STAT_LABEL,
  effectiveStats, fleetTotals, salvageValue, upgradeCostSparks, type Equipment, type Rarity, type SlotKey,
} from "@/lib/game/equipment/fleet";
import { cn } from "@/lib/utils";

const ICONS: Record<SlotKey, typeof Ship> = { mothership: Ship, commander: Crown, attackers: Swords, shield: Shield, mining: Pickaxe, ecm: Radio };
const RARITY_CLASS: Record<Rarity, string> = {
  common: "text-muted-foreground border-border",
  uncommon: "text-primary border-primary/50",
  rare: "text-accent border-accent/50",
  epic: "text-secondary-foreground border-secondary",
  legendary: "text-destructive border-destructive/60",
};

function name(item: Equipment) {
  return `${RARITY_META[item.rarity].label} ${SLOT_META[item.slot].label}`;
}

function StatList({ item }: { item: Equipment }) {
  return (
    <ul className="mt-2 grid grid-cols-2 gap-1 text-[11px]">
      {Object.entries(effectiveStats(item)).map(([k, v]) => (
        <li key={k} className="flex justify-between bg-background/60 px-2 py-0.5"><span className="text-muted-foreground">{STAT_LABEL[k as keyof typeof STAT_LABEL]}</span><b>+{v}</b></li>
      ))}
    </ul>
  );
}

export function FleetDialog() {
  const { items, equipped, openCrate, equip, unequip, salvage, upgrade } = useEquipmentStore();
  const alloy = useStationStore((s) => s.securedAlloy);
  const sparks = useStationStore((s) => s.sparks);
  const equippedItems = SLOTS.map((s) => items.find((i) => i.id === equipped[s])).filter(Boolean) as Equipment[];
  const totals = fleetTotals(equippedItems);
  const hold = items.filter((i) => equipped[i.slot] !== i.id);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" className="mt-2 w-full text-xs"><Rocket className="size-4" /> Fleet & equipment</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] max-w-4xl overflow-y-auto border-border bg-card">
        <DialogHeader>
          <DialogTitle className="uppercase">Fleet command</DialogTitle>
          <DialogDescription>{alloy.toLocaleString()} Alloy · {sparks.toLocaleString()} Sparks</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 border border-border bg-background/60 p-3 text-xs sm:grid-cols-6">
          {STATS.map((k) => <div key={k}><div className="text-[9px] uppercase text-muted-foreground">{STAT_LABEL[k]}</div><b className="text-primary">{totals[k]}</b></div>)}
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {SLOTS.map((slot) => {
            const Icon = ICONS[slot];
            const item = items.find((i) => i.id === equipped[slot]);
            return (
              <section key={slot} className={cn("border p-3", item ? RARITY_CLASS[item.rarity] : "border-dashed border-border")}>
                <div className="flex items-center gap-2">
                  <Icon className="size-5" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] uppercase text-muted-foreground">{SLOT_META[slot].label}</div>
                    <div className="truncate text-sm font-semibold text-foreground">{item ? `${name(item)} · LV ${item.level}` : "Empty slot"}</div>
                  </div>
                </div>
                {item ? <><StatList item={item} /><Button size="sm" variant="outline" className="mt-2 w-full text-xs" onClick={() => unequip(slot)}>Unequip</Button></>
                  : <p className="mt-2 text-[10px] text-muted-foreground">{SLOT_META[slot].summary}</p>}
              </section>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <h3 className="text-sm font-semibold uppercase">Hangar ({hold.length})</h3>
          <Button size="sm" disabled={alloy < CRATE_COST_ALLOY} onClick={() => {
            const it = openCrate();
            if (it) toast.success(`Salvage crate: ${name(it)}`);
          }}><Gem className="size-4" /> Open crate · {CRATE_COST_ALLOY} Alloy</Button>
        </div>
        {hold.length === 0 ? <p className="text-xs text-muted-foreground">No spare modules. Open a salvage crate to roll new equipment.</p> : (
          <div className="grid gap-2 sm:grid-cols-3">
            {hold.map((item) => {
              const cost = upgradeCostSparks(item);
              return (
                <article key={item.id} className={cn("border bg-background/40 p-3", RARITY_CLASS[item.rarity])}>
                  <div className="text-sm font-semibold">{name(item)} <span className="font-mono text-[10px]">LV {item.level}</span></div>
                  <StatList item={item} />
                  <div className="mt-2 flex gap-1">
                    <Button size="sm" className="flex-1 text-xs" onClick={() => equip(item.id)}>Equip</Button>
                    <Button size="sm" variant="outline" title={`Upgrade · ${cost} Sparks`} disabled={item.level >= MAX_ITEM_LEVEL || sparks < cost} onClick={() => upgrade(item.id) && toast.success(`Upgraded to LV ${item.level + 1}`)}><Hammer className="size-4" />{cost}</Button>
                    <Button size="sm" variant="outline" title={`Dismantle for ${salvageValue(item)} Sparks`} onClick={() => toast.success(`+${salvage(item.id)} Sparks`)}><Flame className="size-4" /></Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
