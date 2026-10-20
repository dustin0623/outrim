import { useState, type ReactNode } from "react";
import { Crown, Flag, LogOut, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuthStore } from "@/features/stores/auth.store";
import { guildOf, holderOf, useGuildStore } from "@/features/stores/guilds.store";
import { TERRITORIES, type Territory } from "@/lib/game/world/territories";

export function GuildDialog({ trigger }: { trigger: ReactNode }) {
  const me = useAuthStore((s) => s.player?.displayName ?? "");
  const { guilds, create, join, leave } = useGuildStore();
  const mine = guildOf(guilds, me);
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Flag className="size-5 text-primary" /> Guild Command</DialogTitle>
          <DialogDescription>Join forces and capture the four outposts and the Federation Station.</DialogDescription>
        </DialogHeader>
        {mine ? (
          <section className="border border-primary/40 bg-background/60 p-3">
            <div className="flex items-center justify-between">
              <p className="font-bold">[{mine.tag}] {mine.name}</p>
              <Button size="sm" variant="ghost" onClick={() => { leave(me); toast("Left guild"); }}><LogOut className="size-4" /> Leave</Button>
            </div>
            <p className="mt-2 text-[10px] uppercase text-muted-foreground">Members</p>
            <ul className="text-sm">{mine.members.map((m, i) => <li key={m} className="flex items-center gap-1">{i === 0 && <Crown className="size-3 text-accent" />}{m}</li>)}</ul>
          </section>
        ) : (
          <section className="space-y-2 border border-border p-3">
            <p className="text-[10px] uppercase text-muted-foreground">Found a guild</p>
            <div className="flex gap-2">
              <Input placeholder="Guild name" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="TAG" value={tag} maxLength={4} className="w-20" onChange={(e) => setTag(e.target.value)} />
            </div>
            <Button size="sm" className="w-full" onClick={() => { const err = create(me, name, tag); if (err) toast.error(err); else toast.success("Guild founded"); }}>Create guild</Button>
          </section>
        )}
        <section>
          <p className="mb-1 text-[10px] uppercase text-muted-foreground">Territories</p>
          <ul className="space-y-1 text-xs">
            {TERRITORIES.map((t) => { const h = holderOf(guilds, t.id); return (
              <li key={t.id} className="flex justify-between border border-border bg-background/60 px-2 py-1"><span>{t.name} <span className="text-muted-foreground">· {t.perk}</span></span><b className={h ? "text-accent" : "text-muted-foreground"}>{h ? `[${h.tag}]` : "Unclaimed"}</b></li>
            ); })}
          </ul>
        </section>
        <section>
          <p className="mb-1 text-[10px] uppercase text-muted-foreground">All guilds</p>
          <ul className="space-y-1">
            {guilds.map((g) => (
              <li key={g.id} className="flex items-center justify-between border border-border px-2 py-1.5 text-sm">
                <span>[{g.tag}] {g.name} <span className="text-xs text-muted-foreground"><Users className="inline size-3" /> {g.members.length}</span></span>
                {mine?.id !== g.id && <Button size="sm" variant="outline" onClick={() => { join(me, g.id); toast.success(`Joined ${g.name}`); }}>Join</Button>}
              </li>
            ))}
          </ul>
        </section>
      </DialogContent>
    </Dialog>
  );
}

export function TerritoryDialog({ territory, onClose }: { territory: Territory | null; onClose: () => void }) {
  const guilds = useGuildStore((s) => s.guilds);
  const holder = territory ? holderOf(guilds, territory.id) : null;
  return (
    <Dialog open={!!territory} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Flag className="size-5 text-accent" /> {territory?.name}</DialogTitle>
          <DialogDescription>{territory?.kind === "federation" ? "19-sector central wonder" : "7-sector guild outpost"} · {territory?.q}:{territory?.r}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Held by:</span> <b>{holder ? `[${holder.tag}] ${holder.name}` : "Unclaimed"}</b></p>
          <p><span className="text-muted-foreground">Holder bonus:</span> {territory?.perk}</p>
          <p className="border border-border bg-background/60 p-2 text-xs text-muted-foreground">Guild wars open in a later update. Join a guild now to be ready to capture this territory.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
