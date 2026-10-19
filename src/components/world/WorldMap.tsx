import { useCallback, useEffect, useRef, useState } from "react";
import {
  HOME, MOVE_COST, WORLD_SIZE, hexToPixel, inBounds, pixelToHex, siteAt, tileTerrain,
  type Hex, type Terrain,
} from "@/lib/game/world/hex";

const BASE_SIZE = 34;
const MIN_ZOOM = 0.35;
const MAX_ZOOM = 2.5;

type View = { x: number; y: number; zoom: number };
type Props = { selected: Hex | null; onSelect: (h: Hex) => void; recenterKey: number };

function readColors() {
  const s = getComputedStyle(document.documentElement);
  const v = (n: string) => s.getPropertyValue(n).trim();
  return {
    plain: v("--terrain-plain"), rock: v("--terrain-rock"), scrap: v("--terrain-scrap"),
    ridge: v("--terrain-ridge"), edge: v("--hex-edge"), own: v("--base-own"),
    rival: v("--base-rival"), ring: v("--ring"), accent: v("--accent"),
    fg: v("--foreground"), bg: v("--background"),
  } as Record<Terrain | "edge" | "own" | "rival" | "ring" | "accent" | "fg" | "bg", string>;
}

function hexPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30);
    const px = cx + size * Math.cos(a), py = cy + size * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 ? r * 0.45 : r;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    ctx.lineTo(cx + rad * Math.cos(a), cy + rad * Math.sin(a));
  }
  ctx.closePath();
}

export function WorldMap({ selected, onSelect, recenterKey }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [view, setView] = useState<View>({ x: 0, y: 0, zoom: 1 });
  const [hover, setHover] = useState<Hex | null>(null);
  const viewRef = useRef(view);
  viewRef.current = view;
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  const centerOn = useCallback((h: Hex, zoom = viewRef.current.zoom) => {
    const el = wrapRef.current;
    if (!el) return;
    const p = hexToPixel(h, BASE_SIZE * zoom);
    setView({ zoom, x: el.clientWidth / 2 - p.x, y: el.clientHeight / 2 - p.y });
  }, []);

  useEffect(() => { centerOn(HOME); }, [centerOn, recenterKey]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current, el = wrapRef.current;
    if (!canvas || !el) return;
    const dpr = window.devicePixelRatio || 1;
    const w = el.clientWidth, h = el.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const c = readColors();
    ctx.fillStyle = c.bg;
    ctx.fillRect(0, 0, w, h);

    const size = BASE_SIZE * view.zoom;
    const corners = [
      pixelToHex(-view.x, -view.y, size), pixelToHex(w - view.x, -view.y, size),
      pixelToHex(-view.x, h - view.y, size), pixelToHex(w - view.x, h - view.y, size),
    ];
    const qs = corners.map((k) => k.q), rs = corners.map((k) => k.r);
    const rMin = Math.max(0, Math.min(...rs) - 1), rMax = Math.min(WORLD_SIZE - 1, Math.max(...rs) + 1);
    const qMin = Math.max(0, Math.min(...qs) - 1), qMax = Math.min(WORLD_SIZE - 1, Math.max(...qs) + 1);
    const gap = Math.max(1.5, size * 0.12);

    for (let r = rMin; r <= rMax; r++) {
      for (let q = qMin; q <= qMax; q++) {
        const p = hexToPixel({ q, r }, size);
        const cx = p.x + view.x, cy = p.y + view.y;
        if (cx < -size || cy < -size || cx > w + size || cy > h + size) continue;
        const t = tileTerrain(q, r);
        hexPath(ctx, cx, cy, size - gap / 2);
        ctx.fillStyle = c[t];
        ctx.fill();
        ctx.lineWidth = gap;
        ctx.strokeStyle = c.edge;
        ctx.stroke();
        if (t === "scrap" && size > 14) {
          ctx.fillStyle = c.accent;
          for (const [dx, dy] of [[-0.25, 0.1], [0.2, -0.15], [0.05, 0.3]]) {
            ctx.fillRect(cx + dx * size - 2, cy + dy * size - 2, size * 0.12, size * 0.12);
          }
        }
        if (t === "ridge" && size > 14) {
          ctx.fillStyle = c.rock;
          ctx.beginPath();
          ctx.moveTo(cx - size * 0.45, cy + size * 0.3);
          ctx.lineTo(cx - size * 0.1, cy - size * 0.35);
          ctx.lineTo(cx + size * 0.15, cy + size * 0.05);
          ctx.lineTo(cx + size * 0.3, cy - size * 0.15);
          ctx.lineTo(cx + size * 0.5, cy + size * 0.3);
          ctx.fill();
        }
        const site = siteAt(q, r);
        if (site) {
          ctx.fillStyle = site.kind === "own" ? c.own : c.rival;
          star(ctx, cx, cy, size * 0.5);
          ctx.fill();
          ctx.lineWidth = Math.max(1, size * 0.06);
          ctx.strokeStyle = c.edge;
          ctx.stroke();
        }
      }
    }

    const outline = (hx: Hex | null, color: string, lw: number) => {
      if (!hx || !inBounds(hx)) return;
      const p = hexToPixel(hx, size);
      hexPath(ctx, p.x + view.x, p.y + view.y, size - gap / 2);
      ctx.lineWidth = lw;
      ctx.strokeStyle = color;
      ctx.stroke();
    };
    outline(hover, c.fg, 2);
    outline(selected, c.ring, 3.5);
  }, [view, hover, selected]);

  // Resize
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setView((v) => ({ ...v })));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const zoomAt = useCallback((next: number, px: number, py: number) => {
    setView((v) => {
      const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
      const k = z / v.zoom;
      return { zoom: z, x: px - (px - v.x) * k, y: py - (py - v.y) * k };
    });
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const rect = el.getBoundingClientRect();
      zoomAt(viewRef.current.zoom * Math.exp(-dy * 0.0015), e.clientX - rect.left, e.clientY - rect.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const hexFromEvent = (e: React.PointerEvent) => {
    const rect = wrapRef.current!.getBoundingClientRect();
    const v = viewRef.current;
    return pixelToHex(e.clientX - rect.left - v.x, e.clientY - rect.top - v.y, BASE_SIZE * v.zoom);
  };

  const zoomBtn = (f: number) => {
    const el = wrapRef.current!;
    zoomAt(view.zoom * f, el.clientWidth / 2, el.clientHeight / 2);
  };

  const onKey = (e: React.KeyboardEvent) => {
    const step = 60;
    const moves: Record<string, [number, number]> = {
      ArrowUp: [0, step], ArrowDown: [0, -step], ArrowLeft: [step, 0], ArrowRight: [-step, 0],
    };
    if (moves[e.key]) {
      e.preventDefault();
      const [dx, dy] = moves[e.key];
      setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
    } else if (e.key === "+" || e.key === "=") zoomBtn(1.2);
    else if (e.key === "-") zoomBtn(1 / 1.2);
  };

  return (
    <div className="relative h-full w-full">
      <div
        ref={wrapRef}
        tabIndex={0}
        role="application"
        aria-label="World map. Drag or use arrow keys to pan, plus and minus to zoom."
        onKeyDown={onKey}
        className="h-full w-full cursor-grab touch-none outline-none active:cursor-grabbing"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY, moved: false };
          (e.target as Element).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (drag.current) {
            const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
            if (Math.abs(dx) + Math.abs(dy) > 3) drag.current.moved = true;
            drag.current.x = e.clientX; drag.current.y = e.clientY;
            if (drag.current.moved) setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
          } else {
            const h = hexFromEvent(e);
            setHover(inBounds(h) ? h : null);
          }
        }}
        onPointerUp={(e) => {
          if (drag.current && !drag.current.moved) {
            const h = hexFromEvent(e);
            if (inBounds(h)) onSelect(h);
          }
          drag.current = null;
        }}
        onPointerLeave={() => setHover(null)}
      >
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>
      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        {[["+", 1.25], ["−", 0.8]].map(([l, f]) => (
          <button
            key={l as string}
            aria-label={l === "+" ? "Zoom in" : "Zoom out"}
            onClick={() => zoomBtn(f as number)}
            className="h-10 w-10 rounded border border-border bg-card text-lg font-bold text-foreground hover:bg-secondary"
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

export { MOVE_COST };
