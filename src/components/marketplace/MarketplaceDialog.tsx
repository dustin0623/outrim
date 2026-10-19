import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EquipmentCard } from "@/components/inventory/EquipmentCard";
import { DEFAULT_FILTERS, EquipmentFilters, filterEquipment } from "@/components/inventory/EquipmentFilters";
import { useEquipmentStore } from "@/features/stores/equipment.store";
import { initializeDemoMarket, useMarketplaceStore } from "@/features/stores/marketplace.store";
import { useOwnedItems } from "@/features/stores/items.store";
import { useAuthStore } from "@/features/stores/auth.store";
export function MarketplaceDialog({ trigger }: { trigger?: ReactNode }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const { tab, setTab } = useMarketplaceStore();
  const owner = useAuthStore((s) => s.player?.id);
  const items = useEquipmentStore((s) => s.items);
  const { rim } = useOwnedItems();
  useEffect(() => initializeDemoMarket(), []);
  const listed = items.filter((i) => i.marketPrice !== undefined);
  const mine = listed.filter((i) => i.ownerId === owner);
  const sellable = items.filter((i) => i.ownerId === owner && !i.marketPrice);
  const shown = filterEquipment(tab === "mine" ? mine : tab === "sell" ? sellable : listed, filters);
  return <Dialog><DialogTrigger asChild>{trigger ?? <Button size="sm" variant="ghost"><Store className="size-4" /><span>Marketplace</span></Button>}</DialogTrigger>
    <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-5xl overflow-y-auto border-primary/30 bg-card/95 backdrop-blur">
      <DialogHeader><DialogTitle>Fleet marketplace</DialogTitle><DialogDescription>{rim.toLocaleString()} RIM · Session-only market · No live token transfers</DialogDescription></DialogHeader>
      <Tabs value={tab} onValueChange={setTab}><TabsList><TabsTrigger value="browse">Browse</TabsTrigger><TabsTrigger value="mine">My listings ({mine.length})</TabsTrigger><TabsTrigger value="sell">Sell gear</TabsTrigger></TabsList>
        {["browse", "mine", "sell"].map((value) => <TabsContent key={value} value={value} className="space-y-4"><EquipmentFilters value={filters} onChange={setFilters} market={value !== "sell"} /><p className="text-xs text-muted-foreground">{shown.length} {value === "sell" ? "equipment" : "listings"}</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{shown.map((i) => <EquipmentCard key={i.id} item={i} market={value !== "sell"} />)}</div>{!shown.length && <p className="py-10 text-center text-sm text-muted-foreground">{value === "mine" ? "You have no active listings." : value === "sell" ? "No equipment available to list." : "No listings match these filters."}</p>}</TabsContent>)}
      </Tabs>
    </DialogContent>
  </Dialog>;
}