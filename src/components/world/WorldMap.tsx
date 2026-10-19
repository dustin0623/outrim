import { useEffect, useRef, useState } from "react";
import { Crosshair, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameBridge } from "@/game/bridge/GameBridge";
import type { Hex } from "@/lib/game/world/hex";
import starfield from "@/assets/world/starfield.jpg";

type Props = { selected: Hex | null; onSelect: (h: Hex) => void; recenterKey: number };

export function WorldMap({ selected, onSelect, recenterKey }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [bridge] = useState(() => new GameBridge());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  useEffect(() => {
    const parent = mountRef.current;
    if (!parent) return;
    let cancelled = false;
    let destroy: (() => void) | undefined;
    const unsubscribe = bridge.onEvent((event) => {
      if (event.type === "selected") selectRef.current(event.hex);
      if (event.type === "camera") setZoom(event.zoom);
      if (event.type === "ready") { setReady(true); bridge.command({ type: "select", hex: selectedRef.current }); }
    });
    // Phaser and its Scene are imported together only after the browser mounts.
    void Promise.all([import("phaser"), import("@/game/scenes/SpaceWorldScene")]).then(([{ default: Phaser }, { SpaceWorldScene }]) => {
      if (cancelled) return;
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
      {!ready && <div role="status" className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-primary">{error ? "Space map could not load. Please refresh." : "Connecting to sector…"}</div>}
      <div className="absolute bottom-5 right-5 flex flex-col items-center gap-1 border border-border bg-card p-1">
        <Button variant="ghost" size="icon" title="Zoom in" aria-label="Zoom in" onClick={() => bridge.command({ type: "zoom", factor: 1.2 })}><Plus /></Button>
        <span className="w-10 text-center font-mono text-[10px] text-muted-foreground">{Math.round(zoom * 100)}%</span>
        <Button variant="ghost" size="icon" title="Zoom out" aria-label="Zoom out" onClick={() => bridge.command({ type: "zoom", factor: 1 / 1.2 })}><Minus /></Button>
        <div className="my-1 w-6 border-t border-border" />
        <Button variant="ghost" size="icon" title="Center on your station" aria-label="Center on your station" onClick={() => bridge.command({ type: "center" })}><Crosshair /></Button>
      </div>
    </div>
  );
}
