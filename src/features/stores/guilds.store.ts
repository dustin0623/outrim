import { create } from "zustand";
import type { TerritoryId } from "@/lib/game/world/territories";

/** Session-only guilds (future `guilds` + `guild_members` tables). Sample guilds hold territories. */
export type Guild = { id: string; name: string; tag: string; members: string[]; territories: TerritoryId[]; sample?: boolean };

const SAMPLES: Guild[] = [
  { id: "g-vanguard", name: "Iron Vanguard", tag: "IVG", members: ["Warlord Kade", "Sentry Ix"], territories: ["alpha", "federation"], sample: true },
  { id: "g-solar", name: "Solar Syndicate", tag: "SOL", members: ["Rust Baron"], territories: ["delta"], sample: true },
  { id: "g-void", name: "Void Reapers", tag: "VOID", members: ["Scout Nyx", "Vanta"], territories: [], sample: true },
];

type GuildState = {
  guilds: Guild[];
  create: (owner: string, name: string, tag: string) => string | null;
  join: (owner: string, guildId: string) => void;
  leave: (owner: string) => void;
};

export const useGuildStore = create<GuildState>((set, get) => ({
  guilds: SAMPLES,
  create: (owner, name, tag) => {
    name = name.trim(); tag = tag.trim().toUpperCase();
    if (name.length < 3 || tag.length < 2 || tag.length > 4) return "Name needs 3+ characters, tag 2–4.";
    if (get().guilds.some((g) => g.tag === tag || g.name.toLowerCase() === name.toLowerCase())) return "Name or tag already taken.";
    get().leave(owner);
    set((s) => ({ guilds: [...s.guilds, { id: `g-${Date.now()}`, name, tag, members: [owner], territories: [] }] }));
    return null;
  },
  join: (owner, guildId) => {
    get().leave(owner);
    set((s) => ({ guilds: s.guilds.map((g) => (g.id === guildId ? { ...g, members: [...g.members, owner] } : g)) }));
  },
  leave: (owner) => set((s) => ({
    guilds: s.guilds.map((g) => ({ ...g, members: g.members.filter((m) => m !== owner) })).filter((g) => g.sample || g.members.length > 0),
  })),
}));

export const guildOf = (guilds: Guild[], owner: string) => guilds.find((g) => g.members.includes(owner)) ?? null;
export const holderOf = (guilds: Guild[], id: TerritoryId) => guilds.find((g) => g.territories.includes(id)) ?? null;
