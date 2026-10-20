import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuthStore } from "@/features/stores/auth.store";
import { usePlayerStore } from "@/features/stores/player.store";
import { useStationStore } from "@/features/stores/station.store";
import { hourlyRate } from "@/lib/game/station/economy";
import { getCosmeticByKind } from "@/lib/game/profile/templates";
import { DEMO_OPERATORS } from "@/lib/game/leaderboard/demo";
import { rankOperators, rankingPage } from "@/lib/game/leaderboard/rankings";

const number = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 2 });

export function LeaderboardDialog() {
  const player = useAuthStore((s) => s.player);
  const xp = usePlayerStore((s) => s.xp);
  const avatar = usePlayerStore((s) => s.avatar);
  const levels = useStationStore((s) => s.levels);
  const [page, setPage] = useState(1);
  const [samples, setSamples] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const snapshot = useMemo(() => {
    const current = player ? [{ id: player.id, username: player.username, avatar, xp, renown: 0, production: hourlyRate(levels).rim }] : [];
    return { rows: rankOperators([...current, ...(samples ? DEMO_OPERATORS : [])]), asOf: Date.now() };
  }, [player, xp, avatar, levels, samples, refresh]);
  if (!player) return null;
  const data = rankingPage(snapshot.rows, page, player.id);
  return (
    <Dialog onOpenChange={(open) => { if (open) { setPage(1); setRefresh((n) => n + 1); } }}>
      <DialogTrigger asChild><Button variant="ghost" size="icon" title="Operator Rankings" aria-label="Operator Rankings"><Trophy /></Button></DialogTrigger>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-1rem)] max-w-4xl gap-0 overflow-hidden border-primary/30 bg-card/95 p-0 backdrop-blur">
        <div className="relative overflow-hidden border-b border-border px-4 pb-4 pt-6 sm:px-6">
          <img src="/assets/banners/the-leaderboard-tower.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-15" />
          <DialogHeader className="relative pr-8 text-left">
            <DialogTitle className="flex items-center gap-2 text-xl"><Trophy className="size-5 text-accent" />Operator Rankings</DialogTitle>
            <DialogDescription className="text-xs">Outer Rim · Top 100</DialogDescription>
          </DialogHeader>
          <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-[10px] uppercase text-muted-foreground">Your rank {samples && "· Preview"}</p><div className="flex items-baseline gap-3"><strong className="font-mono text-3xl text-primary">{data.self ? `#${data.self.rank}` : "—"}</strong><span className="text-xs text-muted-foreground">{data.self?.score.toFixed(2) ?? "0.00"} points</span></div></div>
            <div className="flex gap-2"><Button size="sm" variant={samples ? "secondary" : "outline"} aria-pressed={samples} onClick={() => { setSamples((v) => !v); setPage(1); }}>Sample opponents {samples ? "on" : "off"}</Button><Button size="icon" variant="outline" title="Refresh rankings" aria-label="Refresh rankings" onClick={() => setRefresh((n) => n + 1)}><RefreshCw /></Button></div>
          </div>
        </div>
        <div className="border-b border-border px-4 py-3 sm:px-6">
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-muted-foreground"><span>Renown <b className="text-foreground">30%</b></span><span>Tribute output <b className="text-foreground">30%</b></span><span>Experience <b className="text-foreground">40%</b></span></div>
          <p role="status" className="mt-2 text-[11px] text-muted-foreground">{samples ? "Preview standings · 32 sample opponents + your current operator" : "Current session · Your operator only"} · Renown inactive</p>
        </div>
        <div className="max-h-[48dvh] overflow-auto">
          <table className="w-full min-w-[520px] text-left text-xs">
            <caption className="sr-only">Operator standings, page {data.page} of {data.pageCount}</caption>
            <thead className="sticky top-0 z-10 bg-card text-[10px] uppercase text-muted-foreground"><tr className="border-b border-border"><th scope="col" className="px-4 py-3">Rank</th><th scope="col" className="px-3 py-3">Operator</th><th scope="col" className="px-3 py-3 text-right">RIM / h</th><th scope="col" className="px-3 py-3 text-right">Renown</th><th scope="col" className="px-3 py-3 text-right">XP</th><th scope="col" className="px-4 py-3 text-right">Score</th></tr></thead>
            <tbody>{data.entries.map((entry) => {
              const self = entry.id === player.id;
              const image = getCosmeticByKind("avatar", entry.avatar)?.image ?? "/assets/avatars/the-operator.webp";
              return <tr key={entry.id} aria-current={self ? "true" : undefined} className={`border-b border-border/60 last:border-0 ${self ? "bg-primary/10" : "hover:bg-secondary/40"}`}>
                <td className={`px-4 py-3 font-mono ${entry.rank <= 3 ? "text-accent" : "text-muted-foreground"}`}>#{entry.rank}</td>
                <th scope="row" className="px-3 py-3 font-medium"><div className="flex items-center gap-2"><img src={image} alt="" width={32} height={32} loading="lazy" className="size-8 shrink-0 rounded-sm object-cover" /><div className="min-w-0"><p className="max-w-40 break-all">{entry.username}{self && <span className="ml-1 text-primary">· You</span>}</p><p className="mt-0.5 text-[10px] font-normal text-muted-foreground">Lv. {entry.level}{!self && " · Sample"}</p></div></div></th>
                <td className="px-3 py-3 text-right font-mono">{number(entry.production)}</td><td className="px-3 py-3 text-right font-mono text-muted-foreground">{number(entry.renown)}</td><td className="px-3 py-3 text-right font-mono">{number(entry.xp)}</td><td className="px-4 py-3 text-right font-mono font-semibold text-primary">{entry.score.toFixed(2)}</td>
              </tr>;
            })}</tbody>
          </table>
          {!data.entries.length && <p className="p-6 text-center text-sm text-muted-foreground">No operators in this snapshot.</p>}
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-[11px] text-muted-foreground sm:px-6">
          <p>{data.total} operators · Updated {new Date(snapshot.asOf).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</p>
          <nav aria-label="Rankings pages" className="flex items-center gap-3"><Button size="icon" variant="outline" disabled={data.page <= 1} aria-label="Previous rankings page" onClick={() => setPage(data.page - 1)}><ChevronLeft /></Button><span className="font-mono">{data.page} / {data.pageCount}</span><Button size="icon" variant="outline" disabled={data.page >= data.pageCount} aria-label="Next rankings page" onClick={() => setPage(data.page + 1)}><ChevronRight /></Button></nav>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
