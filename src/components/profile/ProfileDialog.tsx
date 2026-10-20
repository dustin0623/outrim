import { Boxes, Coins, Flame, Hammer, PackageCheck, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { EditCosmeticsModal } from "@/components/profile/EditCosmeticsModal";
import { useAuthStore } from "@/features/stores/auth.store";
import { useEquipmentStore } from "@/features/stores/equipment.store";
import { usePlayerStore } from "@/features/stores/player.store";
import { useStationStore } from "@/features/stores/station.store";
import { SLOTS, SLOT_META, STATS, STAT_LABEL, effectiveStats } from "@/lib/game/equipment/fleet";
import { useOwnedShips } from "@/features/stores/fleet-ships.store";
import { combinedFleetTotals } from "@/lib/game/ships/rules";
import { levelFromXp, levelProgress } from "@/lib/game/profile/level";
import { getCosmeticByKind } from "@/lib/game/profile/templates";
import { cn } from "@/lib/utils";

export function ProfileDialog() {
  const player = useAuthStore((s) => s.player);
  const { xp, avatar, banner, background, joinedAt, milestones } = usePlayerStore();
  const levels = useStationStore((s) => s.levels);
  const items = useEquipmentStore((s) => s.items);
  const equipped = useEquipmentStore((s) => s.equipped);
  if (!player) return null;

  const progress = levelProgress(xp);
  const avatarEntry = getCosmeticByKind("avatar", avatar) ?? getCosmeticByKind("avatar", 0)!;
  const bannerEntry = getCosmeticByKind("banner", banner) ?? getCosmeticByKind("banner", 100)!;
  const backgroundEntry = getCosmeticByKind("background", background) ?? getCosmeticByKind("background", 200)!;
  const equippedItems = SLOTS.map((slot) => items.find((i) => i.id === equipped[slot] && i.ownerId === player.id && !i.marketPrice)).filter(Boolean) as NonNullable<ReturnType<typeof items.find>>[];
  const ships = useOwnedShips();
  const fleet = combinedFleetTotals(equippedItems, ships);
  const memberSince = new Date(joinedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  const career = [
    { icon: Flame, label: "Facility upgrades", value: milestones.stationUpgrades },
    { icon: PackageCheck, label: "Hauls banked", value: milestones.totalHauls },
    { icon: Boxes, label: "Crates opened", value: milestones.cratesOpened },
    { icon: Hammer, label: "Gear salvaged", value: milestones.gearSalvaged },
  ];

  const stats = [
    { label: "Station attack", value: levels.attack * 10 },
    { label: "Station defense", value: levels.defense * 10 },
    ...STATS.map((k) => ({ label: `Fleet ${STAT_LABEL[k].toLowerCase()}`, value: fleet[k] })),
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 cursor-pointer text-left" aria-label="Open operator profile">
          <img src={avatarEntry.image} alt="" width={32} height={32} className="size-8 shrink-0 border border-border object-cover" loading="lazy" />
          <div className="hidden text-right sm:block">
            <div className="text-xs font-semibold text-foreground">{player.displayName}</div>
            <div className="text-[9px] uppercase text-primary">Level {progress.level}</div>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] max-w-3xl overflow-y-auto border-border bg-card p-0">
        <div className="relative h-28">
          <img src={bannerEntry.image} alt="" width={768} height={192} className="h-28 w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
        </div>
        <div className="space-y-4 p-4 pt-0">
          <div className="-mt-10 flex items-end gap-3">
            <div className="relative shrink-0">
              <img src={avatarEntry.image} alt={avatarEntry.name} width={80} height={80} className="size-20 rounded-full border-2 border-primary object-cover" />
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 border border-border bg-card px-1.5 text-[10px] font-bold text-primary">LV {progress.level}</span>
            </div>
            <div className="min-w-0 pb-1">
              <DialogTitle className="truncate text-lg font-bold uppercase tracking-wide text-foreground">{player.displayName}</DialogTitle>
              <DialogDescription className="text-[10px] uppercase text-muted-foreground">Outrim commander · {avatarEntry.name} · joined {memberSince}</DialogDescription>
            </div>
            <div className="ml-auto hidden shrink-0 text-right sm:block">
              <p className="text-[9px] uppercase text-muted-foreground">Background</p>
              <p className="text-xs text-foreground">{backgroundEntry.name}</p>
            </div>
          </div>

          <div>
            <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
              <span>Level {progress.level}</span>
              <span className="font-mono">{progress.intoLevel.toLocaleString()} / {progress.levelSpan.toLocaleString()} XP → level {progress.level + 1}</span>
            </div>
            <Progress value={progress.percent} />
          </div>

          <div>
            <h3 className="mb-1 text-[10px] uppercase text-muted-foreground">Career</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {career.map((c) => (
                <div key={c.label} className="border border-border bg-background/60 p-2">
                  <c.icon className="size-4 text-primary" />
                  <p className="mt-1 text-lg font-bold leading-none text-foreground">{c.value.toLocaleString()}</p>
                  <p className="text-[9px] uppercase text-muted-foreground">{c.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-1 text-[10px] uppercase text-muted-foreground">Combat rating</h3>
            <div className="grid grid-cols-3 gap-2 text-xs sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="border border-border bg-background/60 p-2">
                  <p className="text-[9px] uppercase text-muted-foreground">{s.label}</p>
                  <b className="text-primary">{s.value.toLocaleString()}</b>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-1 text-[10px] uppercase text-muted-foreground">Equipped fleet</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {SLOTS.map((slot) => {
                const item = equippedItems.find((i) => i.slot === slot);
                return (
                  <div key={slot} className={cn("border border-border bg-background/60 p-2", item ? "border-accent/50" : "border-dashed")}>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-xs font-semibold text-foreground">{SLOT_META[slot].label}</p>
                      <span className="font-mono text-[10px] text-muted-foreground">{item ? `${item.rarity} · LV ${item.level}` : "empty"}</span>
                    </div>
                    {item ? (
                      <ul className="mt-1 flex flex-wrap gap-1 text-[10px]">
                        {Object.entries(effectiveStats(item)).map(([k, v]) => (
                          <li key={k} className="border border-border px-1.5">{STAT_LABEL[k as keyof typeof STAT_LABEL]} +{v}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-[10px] text-muted-foreground">{SLOT_META[slot].summary}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <EditCosmeticsModal />
        </div>
      </DialogContent>
    </Dialog>
  );
}
