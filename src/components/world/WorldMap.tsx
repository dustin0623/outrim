import { useEffect, useRef, useState } from "react";
import { Crosshair, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Minimap } from "@/components/world/Minimap";
import { GameBridge } from "@/game/bridge/GameBridge";
import type { Hex } from "@/lib/game/world/hex";
const starfield = "/assets/world/starfield.jpg";

type Props = { selected: Hex | null; onSelect: (h: Hex) => void; recenterKey: number; jump?: { hex: Hex; key: number } | null; onView?: (h: Hex) => void };

export function WorldMap({ selected, onSelect, recenterKey, jump, onView }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [bridge] = useState(() => new GameBridge());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [view, setView] = useState<Hex | null>(null);
  const [progress, setProgress] = useState({ value: 5, stage: "Initializing core simulation" });
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const viewRef = useRef(onView);
  viewRef.current = onView;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  useEffect(() => {
    const parent = mountRef.current;
    if (!parent) return;
    let cancelled = false;
    let destroy: (() => void) | undefined;
    const unsubscribe = bridge.onEvent((event) => {
      if (event.type === "selected") selectRef.current(event.hex);
      if (event.type === "view") viewRef.current?.(event.hex);
      if (event.type === "view") setView((v) => (v && v.q === event.hex.q && v.r === event.hex.r ? v : event.hex));
      if (event.type === "progress") setProgress({ value: event.value, stage: event.stage });
      if (event.type === "ready") { setReady(true); bridge.command({ type: "select", hex: selectedRef.current }); }
    });
    // Phaser and its Scene are imported together only after the browser mounts.
    void Promise.all([import("phaser"), import("@/game/scenes/SpaceWorldScene")]).then(([Phaser, { SpaceWorldScene }]) => {
      if (cancelled) return;
      setProgress({ value: 35, stage: "Loading engine" });
      const game = new Phaser.Game({
        type: Phaser.AUTO,
        parent,
        transparent: true,
        antialias: true,
        scale: { mode: Phaser.Scale.RESIZE, width: parent.clientWidth, height: parent.clientHeight },
        scene: [new SpaceWorldScene(bridge)],
        input: { activePointers: 2, mouse: { preventDefaultWheel: true } },
        render: { roundPixels: false, antialiasGL: true },
      });
      destroy = () => game.destroy(true);
    }).catch((reason: unknown) => { if (!cancelled) { console.error("Space world failed to load", reason); setError(true); } });
    return () => { cancelled = true; unsubscribe(); destroy?.(); };
  }, [bridge]);

  useEffect(() => { bridge.command({ type: "select", hex: selected }); }, [bridge, selected]);
  useEffect(() => { bridge.command({ type: "center" }); }, [bridge, recenterKey]);
  useEffect(() => { if (jump) bridge.command({ type: "goto", hex: jump.hex }); }, [bridge, jump]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <img src={starfield} alt="" width={1920} height={1088} className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
      <div
        ref={mountRef}
        tabIndex={0}
        role="application"
        aria-label="Space sector map. Drag or use arrow keys to pan. Plus and minus to zoom."
        className="absolute inset-0 cursor-grab touch-none outline-none active:cursor-grabbing"
        onKeyDown={(event) => {
          const moves: Record<string, [number, number]> = { ArrowUp: [0, -80], ArrowDown: [0, 80], ArrowLeft: [-80, 0], ArrowRight: [80, 0] };
          const move = moves[event.key];
          if (move) { event.preventDefault(); bridge.command({ type: "pan", x: move[0], y: move[1] }); }
          if (event.key === "+" || event.key === "=") bridge.command({ type: "zoom", factor: 1.2 });
          if (event.key === "-") bridge.command({ type: "zoom", factor: 1 / 1.2 });
        }}
      />
      {!ready && (
        <div role="status" className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {error ? (
            <span className="text-sm text-primary">Space map could not load. Please refresh.</span>
          ) : (
            <div className="w-72 border border-border bg-card/90 p-4">
              <div className="mb-1 flex items-baseline justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
                <span>{progress.stage}</span>
                <span className="font-mono text-primary">{progress.value}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden bg-primary/20">
                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress.value}%` }} />
              </div>
            </div>
          )}
        </div>
      )}
      <div className="absolute bottom-5 right-5 border border-primary/30 bg-card/90 p-1 backdrop-blur">
        <div className="mb-1 flex items-center justify-between gap-1 px-1">
          <span className="text-[9px] uppercase text-muted-foreground">World map</span>
          <span className="flex">
            <Button variant="ghost" size="icon" className="size-7" title="Go to Federation Station" aria-label="Go to Federation Station" onClick={() => bridge.command({ type: "goto", hex: { q: 125, r: 125 } })}><Landmark className="size-4" /></Button>
            <Button variant="ghost" size="icon" className="size-7" title="Center on your station" aria-label="Center on your station" onClick={() => bridge.command({ type: "center" })}><Crosshair className="size-4" /></Button>
          </span>
        </div>
        <Minimap view={view} onJump={(hex) => bridge.command({ type: "goto", hex })} />
      </div>
    </div>
  );
}
