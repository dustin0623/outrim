import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Crosshair, Flag, Hexagon, Orbit, Package, PackageCheck, Radar, Rocket, ShoppingCart, Store } from "lucide-react";
import { toast } from "sonner";
import { LoginPanel } from "@/components/auth/LoginPanel";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { Button } from "@/components/ui/button";
import { CommanderDossier, CoordinateBar, ResourceStack } from "@/components/hud/CommandHud";
import { WorldMap } from "@/components/world/WorldMap";
import { useAuthStore } from "@/features/stores/auth.store";
import { useStationStore } from "@/features/stores/station.store";
import { StationDialog } from "@/components/station/StationDialog";
import { InventoryDialog } from "@/components/inventory/InventoryDialog";
import { MarketplaceDialog } from "@/components/marketplace/MarketplaceDialog";
import { WorldDialog } from "@/components/expeditions/WorldDialog";
import { StationTargetDialog } from "@/components/raids/StationTargetDialog";
import { MailButton, MailDialog } from "@/components/mail/MailDialog";
import { FleetDialog } from "@/components/fleet/FleetDialog";
import { ShopDialog } from "@/components/shop/ShopDialog";
import { LeaderboardDialog } from "@/components/leaderboard/LeaderboardDialog";
import { HOME, hexDistance, type Hex } from "@/lib/game/world/hex";
import { RESOURCE_KEYS, RESOURCE_LABEL, hasAny, vaultCap } from "@/lib/game/station/economy";
import { spaceObjectAt } from "@/lib/game/world/space";
import { territoryAt, type Territory } from "@/lib/game/world/territories";
import { GuildDialog, TerritoryDialog } from "@/components/guilds/GuildDialog";
const starfield = "/assets/world/starfield.jpg";
const station = "/assets/world/station.png";
const ocean = "/assets/world/ocean-planet.png";
const mineral = "/assets/world/mineral-planet.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Outrim — Space Frontier" },
      { name: "description", content: "Explore Outrim's 250×250 space-sector world, command your orbital station and challenge boss worlds." },
      { property: "og:title", content: "Outrim — Space Frontier" },
      { property: "og:description", content: "Your station. A vast space frontier. Worlds waiting to be explored." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const player = useAuthStore((s) => s.player);
  return player ? <WorldScreen /> : <Landing />;
}

function Landing() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6">
      <img src={starfield} alt="" width={1920} height={1088} className="absolute inset-0 h-full w-full object-cover" />
      <div className="relative w-full max-w-sm space-y-7">
        <div className="space-y-2 text-center">
          <Orbit className="mx-auto size-9 text-primary" />
          <h1 className="text-4xl font-black uppercase text-foreground">Outrim</h1>
          <p className="text-xs uppercase text-primary">Space frontier</p>
        </div>
        <div className="border border-border bg-card p-6"><LoginPanel /></div>
      </div>
    </main>
  );
}

function WorldScreen() {
  const player = useAuthStore((s) => s.player);
  const levels = useStationStore((s) => s.levels);
  const exposedOf = useStationStore((s) => s.exposed);
  const secureHaul = useStationStore((s) => s.secureHaul);
  const [selected, setSelected] = useState<Hex | null>(HOME);
  const [recenter, setRecenter] = useState(0);
  const [popup, setPopup] = useState<{ hex: Hex; targetId?: string; missionId?: string; name: string } | null>(null);
  const [mailOpen, setMailOpen] = useState(false);
  const [view, setView] = useState<Hex | null>(HOME);
  const [jump, setJump] = useState<{ hex: Hex; key: number } | null>(null);
  const [territory, setTerritory] = useState<Territory | null>(null);
  const selectSector = (hex: Hex) => {
    setSelected(hex);
    const t = territoryAt(hex);
    if (t) { setTerritory(t); return; }
    const hit = spaceObjectAt(hex);
    if (hit?.targetId) setPopup({ hex, targetId: hit.targetId, name: hit.name });
    else if (hit?.missionId) setPopup({ hex, missionId: hit.missionId, name: hit.name });
  };
  const openMail = () => { setPopup(null); setMailOpen(true); };
  const [reconOpen, setReconOpen] = useState(true);
  useEffect(() => { if (window.innerWidth < 640) setReconOpen(false); }, []);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);
  if (!player) return null;
  const exposed = exposedOf();
  const cap = vaultCap(levels);
  const object = selected ? spaceObjectAt(selected) : null;
  const art = object?.kind === "station" ? station : object?.variant === "ocean" ? ocean : mineral;

  const dock = "pointer-events-auto flex min-w-14 flex-col items-center gap-1 border border-primary/20 bg-background/70 px-2 py-2 text-[10px] font-semibold uppercase text-muted-foreground transition hover:border-primary hover:text-primary sm:min-w-20";

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-background text-foreground">
      <WorldMap selected={selected} onSelect={selectSector} recenterKey={recenter} jump={jump} onView={setView} />

      {/* Top command bar: dossier left, actions right, coordinates centered below */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-2 sm:p-4">
        <CommanderDossier />
        <div className="pointer-events-auto flex shrink-0 items-center border border-primary/20 bg-card/80 p-1 backdrop-blur"><MailButton onClick={() => setMailOpen(true)} /><LeaderboardDialog /><LoginDialog /></div>
      </header>
      <div className="pointer-events-none absolute inset-x-0 top-[4.6rem] z-10 flex justify-center px-2 sm:top-[5.4rem]">
        <CoordinateBar view={view} onJump={(hex) => setJump({ hex, key: Date.now() })} />
      </div>
      <div className="pointer-events-none absolute right-2 top-[4.6rem] z-10 flex justify-end sm:right-4 sm:top-[5.4rem]">
        <ResourceStack />
      </div>

      <div className="pointer-events-none absolute left-4 top-20 hidden sm:block">
        <div className="flex items-center gap-2 text-xs font-semibold"><Hexagon className="size-4 text-primary" /> THE OUTER RIM</div>
        <p className="mt-1 font-mono text-[10px] text-muted-foreground">WORLD 01 · 250 × 250 SECTORS</p>
      </div>

      {/* Sector recon */}
      <aside aria-label="Sector details" className="absolute bottom-24 left-2 w-[min(18rem,calc(100vw-1rem))] border border-primary/30 bg-card/90 backdrop-blur sm:bottom-28 sm:left-4">
        <button onClick={() => setReconOpen((o) => !o)} className="flex w-full items-center justify-between border-b border-border px-3 py-2 text-[10px] uppercase text-muted-foreground">
          <span className="flex items-center gap-2"><Crosshair className="size-3 text-primary" /> {object?.name ?? "Deep Space"}</span>
          <span className="flex items-center gap-2 font-mono">{selected ? `${selected.q}:${selected.r}` : "—"}{reconOpen ? <ChevronDown className="size-3" /> : <ChevronUp className="size-3" />}</span>
        </button>
        {reconOpen && <div className="space-y-3 p-3">
          <div className="flex items-center gap-3">
            {object ? <img src={art} alt="" width={56} height={56} className="size-14 shrink-0 object-contain" loading="lazy" /> : <Orbit className="m-2 size-10 shrink-0 text-muted-foreground" />}
            <div className="min-w-0 text-xs">
              <p className="text-[9px] uppercase text-primary">{object?.kind === "station" ? (object.variant === "own" ? "Home sector" : "Occupied sector") : object ? "Expedition world" : "Unoccupied sector"}</p>
              <p className="text-muted-foreground">{object?.kind === "station" ? "Orbital station" : object ? (object.variant === "ocean" ? "Ocean planet" : "Mineral planet") : "Open space"} · {selected ? hexDistance(HOME, selected) : 0} sectors away</p>
              {object?.kind === "planet" && <p className="text-[10px] text-accent">{object.subtitle} · click to explore</p>}
            </div>
          </div>
          <div className="border border-border bg-background/60 p-2">
            <div className="mb-1 flex items-center gap-2 text-[10px] uppercase text-muted-foreground"><PackageCheck className="size-3 text-primary" /> Uncollected output</div>
            {RESOURCE_KEYS.map((k) => (
              <div key={k} className="mt-1">
                <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">{RESOURCE_LABEL[k]}</span><span className="font-mono"><b>{exposed[k].toLocaleString()}</b> / {cap[k].toLocaleString()}</span></div>
                <div className="h-1 w-full bg-primary/20"><div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, (exposed[k] / cap[k]) * 100)}%` }} /></div>
              </div>
            ))}
            <Button size="sm" className="mt-2 w-full text-xs" disabled={!hasAny(exposed)}
              onClick={() => { const n = secureHaul(); if (n) toast.success(`Collected ${RESOURCE_KEYS.map((k) => `${n[k]} ${RESOURCE_LABEL[k]}`).join(", ")}`); }}>
              <PackageCheck className="size-4" /> Collect all
            </Button>
          </div>
        </div>}
      </aside>

      {/* Bottom command dock */}
      <nav aria-label="Command dock" className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-2 sm:p-4">
        <div className="pointer-events-auto flex max-w-full gap-1 overflow-x-auto border border-primary/30 bg-card/90 p-1.5 backdrop-blur sm:gap-2">
          <StationDialog trigger={<button className={dock}><Radar className="size-5" />Station</button>} />
          <FleetDialog trigger={<button className={dock}><Rocket className="size-5" />Fleet</button>} />
          <InventoryDialog trigger={<button className={dock}><Package className="size-5" />Items</button>} />
          <ShopDialog trigger={<button className={dock}><ShoppingCart className="size-5" />Shop</button>} />
          <MarketplaceDialog trigger={<button className={dock}><Store className="size-5" />Market</button>} />
          <GuildDialog trigger={<button className={dock}><Flag className="size-5" />Guild</button>} />
        </div>
      </nav>

      <StationTargetDialog targetId={popup?.targetId ?? null} stationName={popup?.name ?? ""} hex={popup?.hex ?? null} onClose={() => setPopup(null)} onOpenMail={openMail} />
      <WorldDialog missionId={popup?.missionId ?? null} hex={popup?.hex ?? null} onClose={() => setPopup(null)} onOpenMail={openMail} />
      <TerritoryDialog territory={territory} onClose={() => setTerritory(null)} />
      <MailDialog open={mailOpen} onOpenChange={setMailOpen} />
    </main>
  );
}
