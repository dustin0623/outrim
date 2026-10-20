import { HOME, PROTOTYPE_SITES, WORLD_SIZE, type Hex } from "@/lib/game/world/hex";
import { TERRITORIES } from "@/lib/game/world/territories";

const W = 176, H = 132;
/** Axial → minimap pixel, matching the pointy-top layout (rows shift right by r/2). */
const toMini = ({ q, r }: Hex) => {
  const x = q + r / 2, y = r;
  return { x: ((x - 0) / (WORLD_SIZE * 1.5)) * W, y: (y / WORLD_SIZE) * H };
};
const fromMini = (px: number, py: number): Hex => {
  const r = Math.round((py / H) * WORLD_SIZE);
  return { q: Math.round((px / W) * WORLD_SIZE * 1.5 - r / 2), r };
};

export function Minimap({ view, onJump }: { view: Hex | null; onJump: (h: Hex) => void }) {
  const corners = [{ q: 0, r: 0 }, { q: WORLD_SIZE - 1, r: 0 }, { q: WORLD_SIZE / 2 + WORLD_SIZE / 2 - 1, r: WORLD_SIZE - 1 }, { q: 0, r: WORLD_SIZE - 1 }].map(toMini);
  const home = toMini(HOME), v = view ? toMini(view) : null;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="World map. Click to jump."
      className="block cursor-pointer bg-background/80"
      onClick={(e) => { const b = e.currentTarget.getBoundingClientRect(); onJump(fromMini(e.clientX - b.left, e.clientY - b.top)); }}>
      <polygon points={corners.map((c) => `${c.x},${c.y}`).join(" ")} className="fill-primary/10 stroke-primary/40" />
      {TERRITORIES.map((t) => { const p = toMini(t); const fed = t.kind === "federation"; return (
        <g key={t.id}><circle cx={p.x} cy={p.y} r={fed ? 7 : 4.5} className={fed ? "fill-accent/40 stroke-accent" : "fill-secondary/40 stroke-foreground/70"} /><title>{t.name}</title></g>
      ); })}
      {PROTOTYPE_SITES.filter((s) => s.kind === "rival").map((s) => { const p = toMini(s); return <circle key={s.name} cx={p.x} cy={p.y} r={1.5} className="fill-destructive" />; })}
      <circle cx={home.x} cy={home.y} r={2.5} className="fill-primary" />
      {v && <rect x={v.x - 6} y={v.y - 4} width={12} height={8} className="fill-none stroke-foreground" strokeWidth={1} />}
    </svg>
  );
}
