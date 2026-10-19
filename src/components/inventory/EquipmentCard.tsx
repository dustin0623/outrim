import { useState } from "react";
import { Flame, Hammer, Ship, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEquipmentStore, type OwnedEquipment } from "@/features/stores/equipment.store";
import { useOwnedItems } from "@/features/stores/items.store";
import { useAuthStore } from "@/features/stores/auth.store";
import { MAX_ITEM_LEVEL, RARITY_META, SLOT_META, STAT_LABEL, salvageValue, upgradeCostNanites } from "@/lib/game/equipment/fleet";

export function equipmentName(item: OwnedEquipment) { return `${RARITY_META[item.rarity].label} ${SLOT_META[item.slot].label}`; }
export function EquipmentCard({ item, market = false }: { item: OwnedEquipment; market?: boolean }) {
  const [price, setPrice] = useState("1");
  const [selling, setSelling] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const player = useAuthStore((s) => s.player);
  const { equipped, equip, unequip, upgrade, salvage, list, cancel, purchase } = useEquipmentStore();
  const { rim, nanites } = useOwnedItems();
  const mine = item.ownerId === player?.id;
  const worn = mine && equipped[item.slot] === item.id;
  const listed = Boolean(item.marketPrice);
  const cost = upgradeCostNanites(item);
  return <article className="flex min-w-0 flex-col border border-border bg-background/40 p-4">
    <div className="mb-3 flex items-center gap-3"><Ship className="size-8 shrink-0 text-primary" /><div className="min-w-0"><p className="text-[10px] uppercase text-accent">{RARITY_META[item.rarity].label} · LV {item.level}</p><h3 className="text-sm font-semibold">{SLOT_META[item.slot].label}</h3></div></div>
    {(worn || listed) && <p className="mb-2 text-[10px] font-semibold uppercase text-primary">{listed ? "Listed for sale" : "Equipped"}</p>}
    <dl className="mb-4 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">{Object.entries(item.stats).map(([key, value]) => <div key={key} className="flex justify-between gap-1"><dt className="text-muted-foreground">{STAT_LABEL[key as keyof typeof STAT_LABEL]}</dt><dd className="font-mono">+{Number(value).toFixed(2)}</dd></div>)}</dl>
    {market || listed ? <div className="mt-auto space-y-2 border-t border-border pt-3"><p className="flex justify-between text-xs"><span className="truncate text-muted-foreground">{item.sellerName ?? "Operator"}</span><b>{item.marketPrice} RIM</b></p>
      {mine ? <Button variant="outline" size="sm" className="w-full" onClick={() => cancel(item.id) && toast.success("Listing cancelled")}>Cancel listing</Button> : <Button size="sm" className="w-full" disabled={!item.marketPrice || rim < item.marketPrice} onClick={() => setConfirm(true)}>{item.marketPrice && rim < item.marketPrice ? "Not enough RIM" : "Purchase"}</Button>}
      {confirm && <div className="space-y-2 border-t border-border pt-2"><p className="text-xs">Buy for {item.marketPrice} RIM?</p><div className="flex gap-2"><Button size="sm" onClick={() => { const ok = item.marketPrice !== undefined && purchase(item.id, item.marketPrice); toast[ok ? "success" : "error"](ok ? "Equipment added to inventory" : "Listing unavailable or balance changed"); setConfirm(false); }}>Confirm purchase</Button><Button size="sm" variant="ghost" onClick={() => setConfirm(false)}>Back</Button></div></div>}
    </div> : <div className="mt-auto space-y-2">
      <div className="flex gap-2"><Button size="sm" className="flex-1" variant={worn ? "secondary" : "default"} onClick={() => worn ? unequip(item.slot) : equip(item.id)}>{worn ? "Unequip" : "Equip"}</Button><Button size="sm" variant="outline" title={`Upgrade for ${cost} Nanites`} disabled={nanites < cost || item.level >= MAX_ITEM_LEVEL} onClick={() => upgrade(item.id) && toast.success("Equipment upgraded")}><Hammer className="size-4" />{cost}</Button></div>
      <div className="flex gap-2"><Button size="sm" variant="outline" className="flex-1 text-xs" disabled={worn} onClick={() => { setConfirm(false); setSelling(!selling); }}><Tag className="size-3" />Sell</Button><Button size="sm" variant="outline" className="flex-1 text-xs" disabled={worn} onClick={() => { setSelling(false); setConfirm(!confirm); }}><Flame className="size-3" />Salvage</Button></div>
      {selling && <form className="space-y-2 border-t border-border pt-2" onSubmit={(e) => { e.preventDefault(); const ok = list(item.id, Number(price), player?.displayName ?? "Operator"); toast[ok ? "success" : "error"](ok ? "Equipment listed" : "Enter a positive RIM price with up to two decimals"); if (ok) setSelling(false); }}><Label htmlFor={`price-${item.id}`} className="text-xs">Asking price · RIM</Label><Input id={`price-${item.id}`} type="number" min="0.01" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required /><Button size="sm" type="submit" className="w-full">Confirm listing</Button></form>}
      {confirm && <div className="space-y-2 border-t border-border pt-2"><p className="text-xs">Destroy this equipment for {salvageValue(item)} Nanites?</p><Button size="sm" variant="destructive" className="w-full" onClick={() => { const n = salvage(item.id); if (n) toast.success(`+${n} Nanites`); }}>Confirm salvage</Button></div>}
    </div>}
  </article>;
}