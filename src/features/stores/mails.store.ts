import { create } from "zustand";
import { useAuthStore } from "./auth.store";

/** Mirrors a future `mails` table: one row per message, owner-scoped. */
export type MailCategory = "combat" | "scout" | "expedition" | "system";
export type Mail = { id: string; ownerId: string; category: MailCategory; sender: string; subject: string; body: string[]; createdAt: number; read: boolean };
type MailState = {
  mails: Mail[];
  send: (mail: Omit<Mail, "id" | "createdAt" | "read"> & { createdAt?: number }) => string;
  markRead: (id: string) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
};
const owner = () => useAuthStore.getState().player?.id ?? null;

export const useMailStore = create<MailState>((set) => ({
  mails: [],
  send: ({ createdAt = Date.now(), ...mail }) => {
    const id = crypto.randomUUID();
    set((s) => ({ mails: [...s.mails, { ...mail, id, createdAt, read: false }] }));
    return id;
  },
  markRead: (id) => set((s) => ({ mails: s.mails.map((m) => m.id === id && m.ownerId === owner() ? { ...m, read: true } : m) })),
  markAllRead: () => set((s) => ({ mails: s.mails.map((m) => m.ownerId === owner() ? { ...m, read: true } : m) })),
  remove: (id) => set((s) => ({ mails: s.mails.filter((m) => !(m.id === id && m.ownerId === owner())) })),
}));

export function useMyMails() {
  const id = useAuthStore((s) => s.player?.id);
  const mails = useMailStore((s) => s.mails);
  return id ? mails.filter((m) => m.ownerId === id) : [];
}
