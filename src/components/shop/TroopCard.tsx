import { useState } from "react";
import { Crosshair, Minus, Plus, Rocket, Shield, Swords, Users, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOwnedItems } from "@/features/stores/items.store";
import { useOwnedTroops, useTroopsStore } from "@/features/stores/troops.store";
import { MAX_PURCHASE_QUANTITY } from "@/lib/game/items/catalog";
import { calculateTroopBatchCost, TROOP_CATALOG, type TroopType } from "@/lib/game/troops/rules";
import { canAfford } from "@/lib/game/station/buildings";
import { RESOURCE_KEYS, RESOURCE_LABEL } from "@/lib/game/station/economy";

const ICON: Partial<Record<TroopType, typeof Users>> = { soldier: Shield, archer: Crosshair, cavalry: Zap, "aegis-dreadnought": Rocket };

export function TroopCard({ type }: { type: TroopType }) {
  const unit = TROOP_CATALOG[type];
  const balance = useOwnedItems();
  const counts = useOwnedTroops();
  const recruit = useTroopsStore((s) => s.recruit);
  const [raw, setRaw] = useState("1");
  const quantity = Number(raw);
  const cost = calculateTroopBatchCost(type, quantity);
  const affordable = cost !== null && canAfford(balance, cost);
  const max = Math.max(0, Math.min(MAX_PURCHASE_QUANTITY, ...RESOURCE_KEYS.filter((k) => unit.cost[k] > 0).map((k) => Math.floor(balance[k] / unit.cost[k]))));
  const Icon = ICON[type] ?? Swords;
  const step = (d: number) => setRaw(String(Math.max(1, Math.min(MAX_PURCHASE_QUANTITY, (Number.isInteger(quantity) ? quantity : 1) + d))));
  const verb = unit.category === "ship" ? "Construct" : "Recruit";
  return (
    <article aria-label={unit.name} className="flex flex-col gap-3 border border-border bg-background/40 p-4">
      <div className="flex h-28 items-center justify-center border-b border-border">
        {unit.image ? <img src={unit.image} alt={unit.name} loading="lazy" width={112} height={112} className="size-28 object-contain" /> : <Icon className="size-14 text-primary" />}
      </div>
      <div><h3 className="font-semibold">{unit.name}</h3><p className="text-xs text-muted-foreground">{unit.role} · Owned × {counts[type].toLocaleString()}</p></div>
      <div className="flex justify-between text-xs"><span className="text-primary">+{unit.attack} ATK · +{unit.defense} DEF</span><span className="text-muted-foreground">Instant</span></div>
      <dl className="space-y-1 border-y border-border py-2 text-xs">
        {RESOURCE_KEYS.filter((k) => unit.cost[k] > 0).map((k) => (
          <div key={k} className="flex justify-between gap-2"><dt className="text-muted-foreground">{RESOURCE_LABEL[k]}</dt><dd className={cost && balance[k] < cost[k] ? "font-mono text-destructive" : "font-mono"}>{cost ? cost[k].toLocaleString() : "—"} <span className="text-muted-foreground">/ {balance[k].toLocaleString()}</span></dd></div>
        ))}
      </dl>
      <div className="flex items-center gap-1">
        <Button size="icon" variant="outline" aria-label={`Decrease ${unit.name} quantity`} disabled={quantity <= 1} onClick={() => step(-1)}><Minus className="size-3" /></Button>
        <Input type="number" aria-label={`${unit.name} quantity`} min={1} max={MAX_PURCHASE_QUANTITY} value={raw} onChange={(e) => setRaw(e.target.value)} className="min-w-0 flex-1 text-center" />
        <Button size="icon" variant="outline" aria-label={`Increase ${unit.name} quantity`} disabled={quantity >= MAX_PURCHASE_QUANTITY} onClick={() => step(1)}><Plus className="size-3" /></Button>
        <Button variant="ghost" size="sm" disabled={max < 1} onClick={() => setRaw(String(max))}>Max</Button>
      </div>
      <Button disabled={!affordable} onClick={() => (recruit(type, quantity) ? toast.success(`${quantity} ${unit.name} joined your forces`) : toast.error("Order could not be completed"))}>
        {!cost ? "Invalid quantity" : affordable ? `${verb} × ${quantity}` : "Not enough resources"}
      </Button>
    </article>
  );
}
