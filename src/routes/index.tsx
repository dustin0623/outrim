import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LoginPanel } from "@/components/auth/LoginPanel";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { WorldMap } from "@/components/world/WorldMap";
import { useAuthStore } from "@/features/stores/auth.store";
import { HOME, MOVE_COST, hexDistance, sectorOf, siteAt, tileTerrain, type Hex } from "@/lib/game/world/hex";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Outrim — Frontier World Map" },
      { name: "description", content: "Command an industrial frontier base on a 250×250 hex world. Produce Alloy, dispatch expeditions and raid rivals." },
      { property: "og:title", content: "Outrim — Frontier World Map" },
      { property: "og:description", content: "Command an industrial frontier base on a 250×250 hex world." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const TERRAIN_LABEL = { plain: "Plain", rock: "Rock", scrap: "Scrap field", ridge: "Ridge" } as const;

function Index() {
  const player = useAuthStore((s) => s.player);
  return player ? <WorldScreen /> : <Landing />;
}

function Landing() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-6 rounded border border-border bg-card p-6">
        <div className="space-y-1 text-center">
          <h1 className="text-3xl font-black uppercase tracking-[0.2em] text-primary">Outrim</h1>
          <p className="text-sm text-muted-foreground">Sign in to open the frontier map.</p>
        </div>
        <LoginPanel />
      </div>
    </main>
  );
}

function WorldScreen() {
  const player = useAuthStore((s) => s.player)!;
  const [selected, setSelected] = useState<Hex | null>(HOME);
  const [recenter, setRecenter] = useState(0);
  const t = selected ? tileTerrain(selected.q, selected.r) : null;
  const site = selected ? siteAt(selected.q, selected.r) : null;

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background text-foreground">
      <WorldMap selected={selected} onSelect={setSelected} recenterKey={recenter} />

      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
        <div className="pointer-events-auto flex items-center gap-4 rounded border border-border bg-card px-4 py-2 text-sm">
          <span className="font-black uppercase tracking-[0.2em] text-primary">Outrim</span>
          <span>Alloy <b>500</b></span>
          <span className="text-muted-foreground">Exposed <b className="text-foreground">0 / 1,000</b></span>
          <span>Sparks <b>0</b></span>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <span className="hidden rounded border border-border bg-card px-3 py-2 text-sm sm:inline">{player.displayName}</span>
          <LoginDialog />
        </div>
      </header>

      <aside className="absolute bottom-4 left-4 w-[min(20rem,calc(100vw-6rem))] space-y-3 rounded border border-border bg-card p-4 text-sm">
        {selected && t ? (
          <>
            <div className="flex items-baseline justify-between">
              <h2 className="text-base font-bold">{site ? site.name : TERRAIN_LABEL[t]}</h2>
              <span className="font-mono text-xs text-muted-foreground">q{selected.q} · r{selected.r}</span>
            </div>
            <dl className="grid grid-cols-2 gap-y-1 text-muted-foreground">
              <dt>Terrain</dt><dd className="text-foreground">{TERRAIN_LABEL[t]}</dd>
              <dt>Move cost</dt><dd className="text-foreground">{MOVE_COST[t] ?? "Blocked"}</dd>
              <dt>From base</dt><dd className="text-foreground">{hexDistance(HOME, selected)} hexes</dd>
              <dt>Sector</dt><dd className="text-foreground">{sectorOf(selected).sq}, {sectorOf(selected).sr}</dd>
            </dl>
            {t === "scrap" && <p className="text-xs text-accent">Alloy node · gathering arrives in the expeditions phase.</p>}
          </>
        ) : <p className="text-muted-foreground">Select a tile to inspect it.</p>}
        <button
          onClick={() => { setSelected(HOME); setRecenter((n) => n + 1); }}
          className="w-full rounded bg-primary px-3 py-2 font-semibold text-primary-foreground hover:opacity-90"
        >
          Recenter on base
        </button>
      </aside>

      <ul className="absolute right-16 bottom-4 hidden space-y-1 rounded border border-border bg-card p-3 text-xs sm:block">
        {(["plain", "rock", "scrap", "ridge"] as const).map((k) => (
          <li key={k} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm" style={{ background: `var(--terrain-${k})` }} />
            {TERRAIN_LABEL[k]}
          </li>
        ))}
        <li className="flex items-center gap-2"><span className="text-[color:var(--base-own)]">★</span>Your base</li>
        <li className="flex items-center gap-2"><span className="text-[color:var(--base-rival)]">★</span>Rival base</li>
      </ul>
    </main>
  );
}
