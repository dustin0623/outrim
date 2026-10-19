import type { ReactNode } from "react";
import { useState } from "react";
import { Bomb, Package, ShieldPlus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useItemsStore, useOwnedItems } from "@/features/stores/items.store";
import { ITEM_CATALOG, MAX_PURCHASE_QUANTITY, SHOP_DESCRIPTIONS, SHOP_PRICES_RIM, type ShopItemId } from "@/lib/game/items/catalog";
import { RARITIES, RARITY_META } from "@/lib/game/equipment/fleet";

const STOCK: { id: ShopItemId; icon: typeof Package }[] = [
  { id: "equipment-crate", icon: Package },
  { id: "sabotage-device", icon: Bomb },
  { id: "help-kit", icon: ShieldPlus },
];

function StockCard({ id, icon: Icon }: { id: ShopItemId; icon: typeof Package }) {
  const owned = useOwnedItems();
  const buyStock = useItemsStore((s) => s.buyStock);
  const [raw, setRaw] = useState("1");
  const qty = Number(raw);
  const valid = Number.isInteger(qty) && qty >= 1 && qty <= MAX_PURCHASE_QUANTITY;
  const total = valid ? qty * SHOP_PRICES_RIM[id] : 0;
  const name = ITEM_CATALOG[id].name;
  return (
    <article className="flex flex-col gap-3 border border-border bg-background/40 p-4">
      <div className="flex h-24 items-center justify-center">
        {id === "equipment-crate" ? <img src="/assets/stock/salvage-cache.webp" alt="Salvage crate" className="size-24 object-contain" /> : <Icon className={`size-14 ${id === "sabotage-device" ? "text-destructive" : "text-primary"}`} />}
      </div>
      <div>
        <h3 className="font-semibold">{name}</h3>
        <p className="text-xs text-muted-foreground">Owned × {owned[id]} · {SHOP_PRICES_RIM[id]} RIM each</p>
      </div>
      <p className="flex-1 text-xs text-muted-foreground">{SHOP_DESCRIPTIONS[id]}</p>
      {id === "equipment-crate" && <p className="text-[11px] text-muted-foreground">{RARITIES.map((r) => `${RARITY_META[r].label} ${RARITY_META[r].odds}%`).join(" · ")}</p>}
      <div className="flex gap-2">
        <Input aria-label={`${name} quantity`} type="number" min="1" max={MAX_PURCHASE_QUANTITY} step="1" className="w-20" value={raw} onChange={(e) => setRaw(e.target.value)} />
        <Button className="flex-1" disabled={!valid || owned.rim < total} onClick={() => buyStock(id, qty) && toast.success(`Bought ${qty} ${name}${qty === 1 ? "" : "s"}`)}>
          Buy · {total.toLocaleString()} RIM
        </Button>
      </div>
    </article>
  );
}

export function ShopDialog({ trigger }: { trigger?: ReactNode }) {
  const { rim } = useOwnedItems();
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? <Button size="sm" variant="ghost"><ShoppingCart className="size-4" /><span>Shop</span></Button>}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-4xl overflow-y-auto border-primary/30 bg-card/95 backdrop-blur">
        <DialogHeader>
          <DialogTitle>Supply Depot</DialogTitle>
          <DialogDescription>{rim.toLocaleString()} RIM · Up to {MAX_PURCHASE_QUANTITY} per purchase · Open crates from Inventory</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-3">{STOCK.map((s) => <StockCard key={s.id} {...s} />)}</div>
      </DialogContent>
    </Dialog>
  );
}
