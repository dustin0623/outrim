import { useEffect, useState } from "react";
import { Check, Copy, History, LogOut, Star, Swords, UserRound, Users } from "lucide-react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProfileDialog } from "@/components/profile/ProfileDialog";
import { useAuthStore } from "@/features/stores/auth.store";
import { usePlayerStore } from "@/features/stores/player.store";
import { useMyMails, type MailCategory } from "@/features/stores/mails.store";
import { levelFromXp } from "@/lib/game/profile/level";
import { getCosmeticByKind } from "@/lib/game/profile/templates";
import { cn } from "@/lib/utils";

const short = (v: string) => (v.length > 14 ? `${v.slice(0, 6)}…${v.slice(-4)}` : v);

/** Top-left account dropdown (mirrors reference AccountDropdown): copy, profile, referrals, histories, disconnect. */
export function AccountMenu({ power, guildTag }: { power: number; guildTag?: string }) {
  const player = useAuthStore((s) => s.player);
  const logout = useAuthStore((s) => s.logout);
  const xp = usePlayerStore((s) => s.xp);
  const avatar = usePlayerStore((s) => s.avatar);
  const [profile, setProfile] = useState(false);
  const [referrals, setReferrals] = useState(false);
  const [histories, setHistories] = useState(false);
  if (!player) return null;
  const level = levelFromXp(xp);
  const address = player.walletAddress ?? player.id;
  const img = (getCosmeticByKind("avatar", avatar) ?? getCosmeticByKind("avatar", 0))?.image;
  const name = (
    <span className="flex items-center gap-1.5 text-sm font-semibold">
      {guildTag && <span className="text-accent">[{guildTag}]</span>}
      <span className="truncate">{player.displayName}</span>
      <span className="flex items-center gap-0.5 text-[11px] text-accent"><Star className="size-3 fill-current" />{level}</span>
    </span>
  );
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="Account menu" className="pointer-events-auto flex items-center gap-2.5 border border-primary/30 bg-card/90 p-1.5 pr-3 text-left backdrop-blur transition hover:border-primary focus:outline-none">
          <span className="size-9 shrink-0 rounded-full bg-gradient-to-tr from-primary via-accent to-primary p-[2px]">
            {img ? <img src={img} alt="" className="size-full rounded-full object-cover" /> : <span className="grid size-full place-items-center rounded-full bg-secondary font-mono text-[10px] font-bold uppercase">{player.displayName.slice(0, 2)}</span>}
          </span>
          <span className="min-w-0 leading-tight">
            {name}
            <span className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
              <span className="hidden sm:inline">{player.username}</span>
              <span className="flex items-center gap-0.5 text-primary" title="Combat power (attack + defense)"><Swords className="size-3" />{power.toLocaleString()}</span>
            </span>
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-60">
          <div className="px-1.5 py-2">
            {name}
            <p className="truncate font-mono text-[10px] text-muted-foreground">{player.username}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => { void navigator.clipboard?.writeText(address); toast.success("Address copied"); }}><Copy className="size-3.5" />Copy address</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setProfile(true)}><UserRound className="size-3.5" />Profile</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setReferrals(true)}><Users className="size-3.5" />Referrals</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setHistories(true)}><History className="size-3.5" />Histories</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => { logout(); toast("Disconnected"); }}><LogOut className="size-3.5" />Disconnect</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ProfileDialog open={profile} onOpenChange={setProfile} />
      <ReferralsDialog open={referrals} onOpenChange={setReferrals} username={player.username} address={short(address)} />
      <HistoriesDialog open={histories} onOpenChange={setHistories} />
    </>
  );
}

function ReferralsDialog({ open, onOpenChange, username }: { open: boolean; onOpenChange: (o: boolean) => void; username: string; address: string }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => setOrigin(window.location.origin), []);
  const link = origin ? `${origin}/?${new URLSearchParams({ join: username })}` : "";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Users className="size-4 text-primary" />Referrals</DialogTitle>
          <DialogDescription>Invite commanders to the Outer Rim. You earn 5% of what they spend in the Shop.</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Input readOnly value={link} aria-label="Referral link" className="font-mono text-xs" />
          <Button variant="outline" size="icon" aria-label="Copy referral link" disabled={!link}
            onClick={() => { void navigator.clipboard?.writeText(link); setCopied(true); toast.success("Referral link copied"); setTimeout(() => setCopied(false), 2000); }}>
            {copied ? <Check /> : <Copy />}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="border border-border bg-background/60 p-3"><p className="text-[10px] uppercase text-muted-foreground">Recruits</p><b className="text-lg text-primary">0</b></div>
          <div className="border border-border bg-background/60 p-3"><p className="text-[10px] uppercase text-muted-foreground">Earned</p><b className="text-lg text-primary">0 RIM</b></div>
        </div>
        <p className="text-center text-xs text-muted-foreground">No recruits yet. Share your link to start your network.</p>
      </DialogContent>
    </Dialog>
  );
}

const CATS: { k: MailCategory | "all"; label: string }[] = [
  { k: "all", label: "All" }, { k: "combat", label: "Raids" }, { k: "scout", label: "Recon" }, { k: "expedition", label: "Expeditions" }, { k: "system", label: "System" },
];

function HistoriesDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const mails = useMyMails();
  const [cat, setCat] = useState<MailCategory | "all">("all");
  const rows = mails.filter((m) => cat === "all" || m.category === cat).sort((a, b) => b.createdAt - a.createdAt).slice(0, 100);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] border-border bg-card sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><History className="size-4 text-primary" />Histories</DialogTitle>
          <DialogDescription>Your latest 100 operations.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-1">
          {CATS.map((c) => <Button key={c.k} size="sm" variant={cat === c.k ? "secondary" : "ghost"} onClick={() => setCat(c.k)}>{c.label}</Button>)}
        </div>
        <ul className="max-h-[55dvh] space-y-1 overflow-y-auto">
          {rows.length === 0 && <li className="py-8 text-center text-xs text-muted-foreground">No history yet.</li>}
          {rows.map((m) => (
            <li key={m.id} className={cn("flex items-start justify-between gap-3 border border-border bg-background/60 p-2 text-xs")}>
              <div className="min-w-0"><p className="font-semibold">{m.subject}</p><p className="truncate text-muted-foreground">{m.body[0]}</p></div>
              <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{new Date(m.createdAt).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
