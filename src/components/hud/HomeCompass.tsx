import { Navigation } from "lucide-react";
import { HOME, hexDistance, type Hex } from "@/lib/game/world/hex";

/** Floating arrow that points back to the home station when the camera drifts away. */
export function HomeCompass({ view, onHome }: { view: Hex | null; onHome: () => void }) {
  if (!view) return null;
  const distance = hexDistance(view, HOME);
  if (distance < 3) return null;
  const dq = HOME.q - view.q, dr = HOME.r - view.r;
  const angle = (Math.atan2(1.5 * dr, Math.sqrt(3) * (dq + dr / 2)) * 180) / Math.PI + 90;
  return (
    <button onClick={onHome} aria-label={`Return to home station, ${distance} sectors away`} title="Return home"
      className="pointer-events-auto flex size-14 flex-col items-center justify-center rounded-full border-2 border-primary bg-card/90 text-primary shadow-lg backdrop-blur transition hover:scale-105">
      <Navigation className="size-5 fill-primary/30" style={{ transform: `rotate(${angle - 45}deg)` }} />
      <span className="font-mono text-[9px] leading-none">{distance.toLocaleString()}</span>
    </button>
  );
}
