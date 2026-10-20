import type { BattleReport as Report } from "@/lib/game/expeditions/bosses";

export function BattleReport({ report }: { report: Report }) {
  const final = report.rounds.at(-1);
  return <details className="mt-3 text-xs"><summary className="cursor-pointer font-semibold text-primary">{report.won ? "Victory" : "Retreat"} · {report.rounds.length} rounds · Battle report</summary>
    <p className="my-2 text-muted-foreground">Fleet hull {final?.playerHp ?? report.playerMaxHp}/{report.playerMaxHp} · Boss hull {final?.bossHp ?? report.bossMaxHp}/{report.bossMaxHp}</p>
    <ol className="max-h-48 space-y-1 overflow-y-auto font-mono text-muted-foreground">{report.rounds.map((round) => <li key={round.round}>R{round.round} · Dealt {round.dealt}{round.critical ? " critical" : ""} · {round.dodged ? "Evaded" : `Received ${round.received}`}</li>)}</ol>
  </details>;
}