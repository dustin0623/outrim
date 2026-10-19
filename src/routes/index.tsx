import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Box, Crosshair, Globe2, Hexagon, Orbit, PackageCheck, Satellite, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { LoginPanel } from "@/components/auth/LoginPanel";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { Button } from "@/components/ui/button";
import { WorldMap } from "@/components/world/WorldMap";
import { useAuthStore } from "@/features/stores/auth.store";
import { useStationStore } from "@/features/stores/station.store";
import { StationDialog } from "@/components/station/StationDialog";
import { FleetDialog } from "@/components/fleet/FleetDialog";
import { HOME, hexDistance, type Hex } from "@/lib/game/world/hex";
import { RESOURCE_KEYS, RESOURCE_LABEL, hasAny, vaultCap } from "@/lib/game/station/economy";
import { spaceObjectAt } from "@/lib/game/world/space";
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
  const balance = useStationStore((s) => s.balance);
  const nanites = useStationStore((s) => s.nanites);
  const levels = useStationStore((s) => s.levels);
  const exposedOf = useStationStore((s) => s.exposed);
  const secureHaul = useStationStore((s) => s.secureHaul);
  const [selected, setSelected] = useState<Hex | null>(HOME);
  const [recenter, setRecenter] = useState(0);
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

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-background text-foreground">
      <WorldMap selected={selected} onSelect={setSelected} recenterKey={recenter} />
      <header className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-3 sm:p-5">
        <div className="pointer-events-auto flex min-w-0 items-center gap-4 border border-border bg-card px-4 py-3 sm:gap-7">
          <div className="flex items-center gap-2"><Orbit className="size-6 text-primary" /><h1 className="text-xl font-black uppercase">Outrim</h1></div>
          <div className="hidden h-7 border-l border-border sm:block" />
          {RESOURCE_KEYS.map((k) => (
            <div key={k} className="flex items-center gap-2"><Box className="size-4 text-primary" /><div><div className="text-[9px] uppercase text-muted-foreground">{RESOURCE_LABEL[k]}</div><b className="text-sm">{balance[k].toLocaleString()}</b></div></div>
          ))}
          <div className="flex items-center gap-2"><Sparkles className="size-4 text-accent" /><div><div className="text-[9px] uppercase text-muted-foreground">Nanites</div><b className="text-sm">{nanites.toLocaleString()}</b></div></div>
        </div>
        <div className="pointer-events-auto flex items-center gap-3 border border-border bg-card px-3 py-2">
          <div className="hidden text-right sm:block"><div className="text-xs font-semibold">{player.displayName}</div><div className="text-[9px] uppercase text-primary">Commander</div></div>
          <LoginDialog />
        </div>
      </header>
      <div className="pointer-events-none absolute left-5 top-28 hidden sm:block">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground"><Hexagon className="size-4 text-primary" /> THE OUTER RIM</div>
        <p className="mt-1 font-mono text-[10px] text-muted-foreground">WORLD 01 · 250 × 250 SECTORS</p>
      </div>
      <aside aria-label="Sector details" className="absolute bottom-5 left-3 w-[min(19rem,calc(100vw-5.5rem))] border border-border bg-card sm:left-5">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5 text-[10px] uppercase text-muted-foreground">
          <span className="flex items-center gap-2"><Crosshair className="size-3 text-primary" /> Sector signal</span>
          <span className="font-mono">{selected ? `${selected.q} : ${selected.r}` : "—"}</span>
        </div>
        <div className="p-4">
          <div className="mb-4 flex items-center gap-3">
            {object ? <img src={art} alt="" width={64} height={64} className="size-16 shrink-0 object-contain" loading="lazy" /> : <Orbit className="m-3 size-10 shrink-0 text-muted-foreground" />}
            <div className="min-w-0"><p className="mb-1 text-[9px] uppercase text-primary">{object?.kind === "station" ? (object.variant === "own" ? "Home sector" : "Occupied sector") : object ? "Boss world" : "Unoccupied sector"}</p><h2 className="text-lg font-semibold">{object?.name ?? "Deep Space"}</h2></div>
          </div>
          <dl className="space-y-2 text-xs">
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Classification</dt><dd>{object?.kind === "station" ? "Orbital station" : object ? (object.variant === "ocean" ? "Ocean planet" : "Mineral planet") : "Open space"}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">From your station</dt><dd>{selected ? hexDistance(HOME, selected) : 0} sectors</dd></div>
            {object?.kind === "planet" && <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Resource</dt><dd className="text-accent">{object.resource}</dd></div>}
          </dl>
          {object?.kind === "planet" && <p className="mt-3 border-t border-border pt-3 text-[10px] text-muted-foreground">Expeditions not yet available</p>}
          <Button variant="secondary" className="mt-4 w-full text-xs" onClick={() => { setSelected(HOME); setRecenter((n) => n + 1); }}><Satellite className="size-4" /> Your station <Crosshair className="ml-auto size-3" /></Button>
          <div className="mt-2 border border-border bg-background/60 p-3">
            <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground"><PackageCheck className="size-4 text-primary" /> Unsecured output</div>
            {RESOURCE_KEYS.map((k) => (
              <div key={k} className="mt-1">
                <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">{RESOURCE_LABEL[k]}</span><span className="font-mono"><b className="text-foreground">{exposed[k].toLocaleString()}</b> / {cap[k].toLocaleString()}</span></div>
                <div className="h-1 w-full bg-primary/20"><div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, (exposed[k] / cap[k]) * 100)}%` }} /></div>
              </div>
            ))}
            <Button
              size="sm" className="mt-2 w-full text-xs" disabled={!hasAny(exposed)}
              onClick={() => { const n = secureHaul(); if (n) toast.success(`Secured ${RESOURCE_KEYS.map((k) => `${n[k]} ${RESOURCE_LABEL[k]}`).join(", ")}`); }}
            >
              <PackageCheck className="size-4" /> Secure haul
            </Button>
          </div>
          <StationDialog />
          <FleetDialog />
        </div>
      </aside>
      <div className="pointer-events-none absolute bottom-6 right-24 hidden items-center gap-5 text-[10px] text-muted-foreground md:flex">
        <span className="flex items-center gap-2"><Satellite className="size-3 text-primary" /> Station</span>
        <span className="flex items-center gap-2"><Globe2 className="size-3 text-accent" /> Gathering world</span>
        <span className="font-mono">ALPHA WORLD</span>
      </div>
    </main>
  );
}
