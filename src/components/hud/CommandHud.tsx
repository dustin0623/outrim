import { useState, type ComponentType } from "react";
import { Box, Coins, Droplets, Home, Landmark, MapPin, Search, Sparkles, Wheat } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AccountMenu } from "@/components/hud/AccountMenu";
import { useAuthStore } from "@/features/stores/auth.store";
import { useEquipmentStore } from "@/features/stores/equipment.store";
import { useGuildStore } from "@/features/stores/guilds.store";
import { useOwnedItems } from "@/features/stores/items.store";
import { useStationStore } from "@/features/stores/station.store";
import { useOwnedTroops } from "@/features/stores/troops.store";
import { SLOTS } from "@/lib/game/equipment/fleet";
import { raidStats } from "@/lib/game/raids/rules";
import { hourlyRate, vaultCap } from "@/lib/game/station/economy";
import { HOME, type Hex } from "@/lib/game/world/hex";

const compact = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e4 ? `${(n / 1e3).toFixed(1)}K` : Math.floor(n).toLocaleString());

/** Top-left: avatar/level, guild tag and combat power. Currencies live in ResourceStack. */
export function CommanderDossier() {
  const player = useAuthStore((s) => s.player);

  const levels = useStationStore((s) => s.levels);
  const items = useEquipmentStore((s) => s.items);
  const equipped = useEquipmentStore((s) => s.equipped);
  const troops = useOwnedTroops();
  const guild = useGuildStore((s) => s.guilds.find((g) => player && g.members.includes(player.id)));
  if (!player) return null;
  const gear = SLOTS.map((slot) => items.find((i) => i.id === equipped[slot] && i.ownerId === player.id && !i.marketPrice)).filter((i): i is NonNullable<typeof i> => !!i);
  const stats = raidStats(levels, gear, troops);
  const power = stats.attack + stats.defense;
  return <AccountMenu power={power} guildTag={guild?.tag} />;
}

/** Top-center: live coordinates with quick-jump dialog. */
export function CoordinateBar({ view, onJump }: { view: Hex | null; onJump: (hex: Hex) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [r, setR] = useState("");
  const jump = (hex: Hex) => { onJump(hex); setOpen(false); };
  const qn = Number(q), rn = Number(r);
  const valid = q !== "" && r !== "" && Number.isInteger(qn) && Number.isInteger(rn) && qn >= 0 && qn < 250 && rn >= 0 && rn < 250;
  return (
    <>
      <button onClick={() => { setQ(String(view?.q ?? HOME.q)); setR(String(view?.r ?? HOME.r)); setOpen(true); }}
        className="pointer-events-auto flex items-center gap-2 border border-primary/30 bg-card/90 px-3 py-1.5 font-mono text-xs backdrop-blur transition hover:border-primary" aria-label="Jump to coordinates">
        <Search className="size-3.5 text-primary" />
        <span>Q <b>{view?.q ?? "—"}</b></span><span>R <b>{view?.r ?? "—"}</b></span>
        <MapPin className="size-3.5 text-muted-foreground" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xs border-border bg-card">
          <DialogHeader><DialogTitle>Sector navigation</DialogTitle><DialogDescription>Enter coordinates from 0 to 249.</DialogDescription></DialogHeader>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (valid) jump({ q: qn, r: rn }); }}>
            <div className="flex gap-2">
              <Input aria-label="Q coordinate" inputMode="numeric" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Q" />
              <Input aria-label="R coordinate" inputMode="numeric" value={r} onChange={(e) => setR(e.target.value)} placeholder="R" />
            </div>
            <Button type="submit" className="w-full" disabled={!valid}>Jump</Button>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => jump(HOME)}><Home className="size-4" /> Home</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => jump({ q: 125, r: 125 })}><Landmark className="size-4" /> Federation</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

type ResourceRow = {
  k: "rim" | "nanites" | "titanium" | "plasma" | "rations";
  label: string;
  icon: ComponentType<{ className?: string }>;
  tint: string;
  rate?: number;
  cap?: number;
};

/** Right edge: vertical RIM / Nanites / Titanium / Plasma / Rations stack with hourly rate. */
export function ResourceStack() {
  const balance = useOwnedItems();
  const levels = useStationStore((s) => s.levels);
  const cap = vaultCap(levels);
  const rate = hourlyRate(levels);
  const rows: ResourceRow[] = [
    { k: "rim", label: "RIM", icon: Coins, tint: "text-primary", rate: rate.rim, cap: cap.rim },
    { k: "nanites", label: "Nanites", icon: Sparkles, tint: "text-accent" },
    { k: "titanium", label: "Titanium", icon: Box, tint: "text-primary", rate: rate.titanium, cap: cap.titanium },
    { k: "plasma", label: "Plasma", icon: Droplets, tint: "text-primary", rate: rate.plasma, cap: cap.plasma },
    { k: "rations", label: "Rations", icon: Wheat, tint: "text-primary", rate: rate.rations, cap: cap.rations },
  ];
  return (
    <div className="pointer-events-auto flex w-28 flex-col gap-1 border border-primary/30 bg-card/90 p-1.5 backdrop-blur sm:w-32">
      {rows.map(({ k, label, icon: Icon, tint, rate: perHour, cap: limit }) => (
        <div key={k} title={limit ? `${label}: ${balance[k].toLocaleString()} · +${perHour}/h · vault ${limit.toLocaleString()}` : `${label}: ${balance[k].toLocaleString()}`} className="bg-background/60 px-1.5 py-1">
          <div className="flex items-center gap-1.5">
            <Icon className={`size-3.5 shrink-0 ${tint}`} />
            <b className="font-mono text-xs">{compact(balance[k])}</b>
            {perHour !== undefined && <span className="ml-auto font-mono text-[9px] text-muted-foreground">+{compact(perHour)}/h</span>}
          </div>
        </div>
      ))}
    </div>
  );

}
