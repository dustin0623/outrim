import { useState } from "react";
import { Mail as MailIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMailStore, useMyMails, type MailCategory } from "@/features/stores/mails.store";

const TABS: { value: "all" | MailCategory; label: string }[] = [
  { value: "all", label: "All" }, { value: "combat", label: "Battles" }, { value: "scout", label: "Scouts" }, { value: "expedition", label: "Expeditions" }, { value: "system", label: "System" },
];

export function MailButton({ onClick }: { onClick: () => void }) {
  const unread = useMyMails().filter((m) => !m.read).length;
  return <Button variant="ghost" size="icon" aria-label={`Mail, ${unread} unread`} title="Mail" className="relative" onClick={onClick}>
    <MailIcon />
    {unread > 0 && <span className="absolute -right-0.5 -top-0.5 min-w-4 bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">{unread}</span>}
  </Button>;
}

export function MailDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const mails = useMyMails();
  const { markRead, markAllRead, remove } = useMailStore();
  const [tab, setTab] = useState<"all" | MailCategory>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const list = [...mails].filter((m) => tab === "all" || m.category === tab).sort((a, b) => b.createdAt - a.createdAt);
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-2xl overflow-y-auto border-primary/30 bg-card/95 backdrop-blur">
      <DialogHeader><DialogTitle>Mail</DialogTitle><DialogDescription>Battle, scout and expedition reports.</DialogDescription></DialogHeader>
      <div className="flex items-center gap-2">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="min-w-0 flex-1"><TabsList className="flex w-full overflow-x-auto">{TABS.map((t) => <TabsTrigger key={t.value} value={t.value} className="flex-1 text-xs">{t.label}</TabsTrigger>)}</TabsList></Tabs>
        <Button size="sm" variant="outline" disabled={!mails.some((m) => !m.read)} onClick={markAllRead}>Read all</Button>
      </div>
      <ul className="divide-y divide-border">
        {list.map((m) => <li key={m.id}>
          <button className="flex w-full items-start gap-2 py-3 text-left" onClick={() => { setOpenId(openId === m.id ? null : m.id); markRead(m.id); }}>
            <span className={`mt-1.5 size-2 shrink-0 ${m.read ? "bg-transparent" : "bg-primary"}`} />
            <span className="min-w-0 flex-1">
              <span className={`block truncate text-sm ${m.read ? "text-muted-foreground" : "font-semibold"}`}>{m.subject}</span>
              <span className="block text-[10px] uppercase text-muted-foreground">{m.sender} · {new Date(m.createdAt).toLocaleString()}</span>
            </span>
          </button>
          {openId === m.id && <div className="mb-3 ml-4 space-y-1 border border-border bg-background/60 p-3 text-xs">
            {m.body.map((line, i) => <p key={i}>{line}</p>)}
            <Button size="sm" variant="ghost" className="mt-2 text-destructive" onClick={() => remove(m.id)}><Trash2 className="size-3" />Delete</Button>
          </div>}
        </li>)}
        {!list.length && <li className="py-10 text-center text-sm text-muted-foreground">No mail yet. Click a rival station or world on the map to get started.</li>}
      </ul>
    </DialogContent>
  </Dialog>;
}
