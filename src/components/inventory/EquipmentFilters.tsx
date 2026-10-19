import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RARITIES, RARITY_META, SLOTS, SLOT_META } from "@/lib/game/equipment/fleet";
import type { OwnedEquipment } from "@/features/stores/equipment.store";
export type Filters = { search: string; slot: string; rarity: string; sort: string; maxPrice: string };
export const DEFAULT_FILTERS: Filters = { search: "", slot: "all", rarity: "all", sort: "newest", maxPrice: "" };
export function filterEquipment(items: OwnedEquipment[], f: Filters) {
  return items.filter((i) => (f.slot === "all" || i.slot === f.slot) && (f.rarity === "all" || i.rarity === f.rarity) && `${SLOT_META[i.slot].label} ${RARITY_META[i.rarity].label} ${i.sellerName ?? ""}`.toLowerCase().includes(f.search.toLowerCase()) && (!f.maxPrice || (i.marketPrice ?? 0) <= Number(f.maxPrice))).sort((a, b) => f.sort === "low" ? (a.marketPrice ?? 0) - (b.marketPrice ?? 0) : f.sort === "high" ? (b.marketPrice ?? 0) - (a.marketPrice ?? 0) : f.sort === "level" ? b.level - a.level : (b.listedAt ?? 0) - (a.listedAt ?? 0));
}
export function EquipmentFilters({ value, onChange, market = false }: { value: Filters; onChange: (f: Filters) => void; market?: boolean }) {
  return <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
    <Input aria-label="Search equipment" placeholder="Search equipment…" value={value.search} onChange={(e) => onChange({ ...value, search: e.target.value })} />
    <Select value={value.slot} onValueChange={(slot) => onChange({ ...value, slot })}><SelectTrigger aria-label="Equipment slot"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All slots</SelectItem>{SLOTS.map((s) => <SelectItem key={s} value={s}>{SLOT_META[s].label}</SelectItem>)}</SelectContent></Select>
    <Select value={value.rarity} onValueChange={(rarity) => onChange({ ...value, rarity })}><SelectTrigger aria-label="Rarity"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All rarities</SelectItem>{RARITIES.map((r) => <SelectItem key={r} value={r}>{RARITY_META[r].label}</SelectItem>)}</SelectContent></Select>
    {market ? <Select value={value.sort} onValueChange={(sort) => onChange({ ...value, sort })}><SelectTrigger aria-label="Sort listings"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="newest">Newest</SelectItem><SelectItem value="low">Lowest price</SelectItem><SelectItem value="high">Highest price</SelectItem><SelectItem value="level">Highest level</SelectItem></SelectContent></Select> : <Select value={value.sort} onValueChange={(sort) => onChange({ ...value, sort })}><SelectTrigger aria-label="Sort equipment"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="newest">Default order</SelectItem><SelectItem value="level">Highest level</SelectItem></SelectContent></Select>}
    {market && <Input aria-label="Maximum RIM price" type="number" min="0" step="0.01" placeholder="Max RIM price" value={value.maxPrice} onChange={(e) => onChange({ ...value, maxPrice: e.target.value })} />}
  </div>;
}