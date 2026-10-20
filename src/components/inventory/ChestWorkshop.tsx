import { Package, Hammer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useItemsStore, useOwnedItems } from "@/features/stores/items.store";
import { useEquipmentStore } from "@/features/stores/equipment.store";
import { CRATE_IDS, CRATE_RARITY, crateOdds, shardId, SHARDS_PER_CRATE } from "@/lib/game/items/chests";
import { ITEM_CATALOG } from "@/lib/game/items/catalog";
import { equipmentName } from "./EquipmentCard";

export function ChestWorkshop() {
  const quantities = useOwnedItems(); const craft = useItemsStore((s) => s.craftCrate); const open = useEquipmentStore((s) => s.openCrate);
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{CRATE_IDS.map((id) => {
    const shards = shardId(CRATE_RARITY[id]);
    return <article key={id} className="flex flex-col gap-3 border border-border bg-background/40 p-4"><img src="/assets/stock/salvage-cache.webp" alt={ITEM_CATALOG[id].name} className="mx-auto size-24 object-contain" /><h3 className="text-sm font-semibold">{ITEM_CATALOG[id].name} <span className="text-primary">× {quantities[id]}</span></h3><p className="text-xs text-muted-foreground">{quantities[shards]} / {SHARDS_PER_CRATE} {ITEM_CATALOG[shards].name}s</p><p className="flex-1 text-[11px] text-muted-foreground">{crateOdds(id).map((o) => `${o.rarity} ${o.percent.toFixed(2)}%`).join(" · ")}</p><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={quantities[shards] < SHARDS_PER_CRATE} onClick={() => craft(id) && toast.success(`Crafted ${ITEM_CATALOG[id].name}`)}><Hammer className="size-3" />Craft · 100</Button><Button size="sm" disabled={quantities[id] < 1} onClick={() => { const item = open(id); if (item) toast.success(`Received ${equipmentName(item)}`); }}><Package className="size-3" />Open</Button></div></article>;
  })}</div>;
}