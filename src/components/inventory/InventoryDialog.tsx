import { useState } from "react";
import { Box, Coins, Flame, Package, Pickaxe, Sparkles, Sprout } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOwnedItems } from "@/features/stores/items.store";
import { useEquipmentStore } from "@/features/stores/equipment.store";
import { useAuthStore } from "@/features/stores/auth.store";
import { ITEM_CATALOG, ITEM_IDS, type ItemId } from "@/lib/game/items/catalog";
import { CRATE_COST_RIM, RARITIES, RARITY_META } from "@/lib/game/equipment/fleet";
import { EquipmentCard, equipmentName } from "./EquipmentCard";
import { DEFAULT_FILTERS, EquipmentFilters, filterEquipment } from "./EquipmentFilters";
const ICONS: Record<ItemId, typeof Box> = { rim: Coins, nanites: Sparkles, titanium: Pickaxe, plasma: Flame, rations: Sprout, "equipment-crate": Package };
export function InventoryDialog() {
  const quantities = useOwnedItems();
  const player = useAuthStore((s) => s.player);
  const { items, buyCrates, openCrate } = useEquipmentStore();
  const [quantity, setQuantity] = useState("1");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const owned = items.filter((i) => i.ownerId === player?.id);
  const gear = filterEquipment(owned, filters);
  const count = Number(quantity);
  return <Dialog><DialogTrigger asChild><Button variant="ghost" size="sm"><Package className="size-4" /><span className="hidden sm:inline">Inventory</span><span className="sr-only sm:hidden">Inventory</span></Button></DialogTrigger>
    <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-5xl overflow-y-auto bg-card">
      <DialogHeader><DialogTitle>Inventory</DialogTitle><DialogDescription>{quantities.rim.toLocaleString()} RIM · {quantities.nanites.toLocaleString()} Nanites · {owned.length} equipment</DialogDescription></DialogHeader>
      <Tabs defaultValue="items"><TabsList><TabsTrigger value="items">Items</TabsTrigger><TabsTrigger value="gear">Equipment ({owned.length})</TabsTrigger></TabsList>
        <TabsContent value="items" className="space-y-5">
          {(["currency", "resource"] as const).map((type) => <section key={type}><h2 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{type === "currency" ? "Currencies" : "Resources"}</h2><div className="grid gap-3 sm:grid-cols-3">{ITEM_IDS.filter((id) => ITEM_CATALOG[id].type === type).map((id) => { const Icon = ICONS[id]; return <article key={id} className="flex items-center gap-4 border border-border bg-background/40 p-4"><Icon className="size-7 text-primary" /><div><h3 className="text-xs text-muted-foreground">{ITEM_CATALOG[id].name}</h3><b className="font-mono text-xl">{quantities[id].toLocaleString()}</b></div></article>; })}</div></section>)}
          <section className="border-t border-border pt-4"><h2 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Containers</h2><div className="flex flex-wrap items-center gap-5"><img src="/assets/stock/salvage-cache.webp" alt="Salvage crate" className="size-24 object-contain" /><div className="min-w-0 flex-1 space-y-3"><h3 className="font-semibold">Salvage Crate <span className="text-primary">× {quantities["equipment-crate"]}</span></h3><p className="text-xs text-muted-foreground">{RARITIES.map((r) => `${RARITY_META[r].label} ${RARITY_META[r].odds}%`).join(" · ")}</p><div className="flex flex-wrap gap-2"><Button disabled={quantities["equipment-crate"] < 1} onClick={() => { const item = openCrate(); if (item) toast.success(`Received ${equipmentName(item)}`); }}><Package className="size-4" />Open crate</Button><Input aria-label="Crate quantity" type="number" min="1" max="25" step="1" className="w-20" value={quantity} onChange={(e) => setQuantity(e.target.value)} /><Button variant="outline" disabled={!Number.isInteger(count) || count < 1 || count > 25 || quantities.rim < count * CRATE_COST_RIM} onClick={() => buyCrates(count) && toast.success(`Bought ${count} salvage crate${count === 1 ? "" : "s"}`)}>Buy crates · {Number.isFinite(count) ? count * CRATE_COST_RIM : 0} RIM</Button></div></div></div></section>
        </TabsContent>
        <TabsContent value="gear" className="space-y-4"><EquipmentFilters value={filters} onChange={setFilters} /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{gear.map((i) => <EquipmentCard key={i.id} item={i} />)}</div>{gear.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">{owned.length ? "No equipment matches these filters." : "No equipment in your inventory."}</p>}</TabsContent>
      </Tabs>
    </DialogContent>
  </Dialog>;
}