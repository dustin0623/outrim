import { useState } from "react";
import { Minus, Plus, Rocket, Shield, Swords } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOwnedItems } from "@/features/stores/items.store";
import { useFleetShipsStore, useOwnedShips } from "@/features/stores/fleet-ships.store";
import { MAX_PURCHASE_QUANTITY } from "@/lib/game/items/catalog";
import { calculateShipBatchCost, SHIP_CATALOG, type ShipType } from "@/lib/game/ships/rules";
import { canAfford } from "@/lib/game/station/buildings";
import { RESOURCE_KEYS, RESOURCE_LABEL } from "@/lib/game/station/economy";

export function ShipCard({ type }: { type: ShipType }) {
  const ship = SHIP_CATALOG[type];
  const balance = useOwnedItems();
  const counts = useOwnedShips();
  const buyShips = useFleetShipsStore((s) => s.buyShips);
  const [raw, setRaw] = useState("1");
  const quantity = Number(raw);
  const cost = calculateShipBatchCost(type, quantity);
  const affordable = cost !== null && canAfford(balance, cost);
  const max = Math.max(0, Math.min(MAX_PURCHASE_QUANTITY, ...RESOURCE_KEYS.filter((k) => ship.cost[k] > 0).map((k) => Math.floor(balance[k] / ship.cost[k]))));
  const Icon = ship.stat === "attack" ? Swords : Shield;
  const step = (delta: number) => setRaw(String(Math.max(1, Math.min(MAX_PURCHASE_QUANTITY, (Number.isInteger(quantity) ? quantity : 1) + delta))));
  return (
    <article aria-label={ship.name} className="flex flex-col gap-3 border border-border bg-background/40 p-4">
      <div className="flex h-36 items-center justify-center border-b border-border"><img src={ship.image} alt={ship.name} loading="lazy" width={144} height={144} className="size-36 object-contain" /></div>
      <div className="flex items-start justify-between gap-2">
        <div><h3 className="font-semibold">{ship.name}</h3><p className="text-xs text-muted-foreground">Owned × {counts[type].toLocaleString()}</p></div>
        <Icon className="mt-1 size-5 shrink-0 text-primary" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-primary">+{ship.bonus} {ship.stat} / hull</span>
        <span className="font-mono text-muted-foreground">+{(counts[type] * ship.bonus).toLocaleString()} active</span>
      </div>
      <dl className="space-y-1 border-y border-border py-2 text-xs">
        {RESOURCE_KEYS.filter((k) => ship.cost[k] > 0).map((k) => {
          const total = cost?.[k] ?? 0;
          return <div key={k} className="flex justify-between gap-2"><dt className="text-muted-foreground">{RESOURCE_LABEL[k]}</dt><dd className={cost && balance[k] < total ? "font-mono text-destructive" : "font-mono"}>{cost ? total.toLocaleString() : "—"} <span className="text-muted-foreground">/ {balance[k].toLocaleString()}</span></dd></div>;
        })}
      </dl>
      <div className="flex items-center gap-1">
        <Button size="icon" variant="outline" aria-label={`Decrease ${ship.name} quantity`} disabled={quantity <= 1} onClick={() => step(-1)}><Minus className="size-3" /></Button>
        <Input type="number" aria-label={`${ship.name} quantity`} min={1} max={MAX_PURCHASE_QUANTITY} step={1} value={raw} onChange={(e) => setRaw(e.target.value)} className="min-w-0 flex-1 text-center" />
        <Button size="icon" variant="outline" aria-label={`Increase ${ship.name} quantity`} disabled={quantity >= MAX_PURCHASE_QUANTITY} onClick={() => step(1)}><Plus className="size-3" /></Button>
        <Button variant="ghost" size="sm" disabled={max < 1} onClick={() => setRaw(String(max))}>Max</Button>
      </div>
      <Button disabled={!affordable} onClick={() => { if (buyShips(type, quantity)) toast.success(`${quantity} ${ship.name}${quantity === 1 ? "" : "s"} added to your armada`); else toast.error("Ship order could not be completed"); }}><Rocket className="size-4" />{!cost ? "Invalid quantity" : affordable ? `Construct × ${quantity}` : "Not enough resources"}</Button>
    </article>
  );
}
