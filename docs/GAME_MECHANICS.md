# Outer Rim — Game Mechanics

Player-facing rules and every number the game uses today. Values come straight from the rule modules in `src/lib/game/` — when a number changes there, update this file.

> **Scope:** this is a mock game. Balances live in the browser session; there is no database persistence and no live token settlement.

---

## 1. Core loop

```text
Station produces RIM + resources ──► Collect into balance (capped by Vault)
        │                                       │
        ▼                                       ▼
Upgrade facilities (XP)              Shop: crates / consumables (RIM)
        │                            Barracks & Shipyard: troops (resources)
        ▼                                       │
Attack / Defense stats ◄── Equipment (crates) ◄─┘
        │                        │
        ▼                        ▼ salvage → Nanites → fuel expeditions / upgrade gear
PvP raids (Plasma fuel)    Expeditions & bosses (Nanite fuel) → resources, shards, XP
        │                        │
        ▼                        ▼ 100 shards → higher-rarity crate
     Plunder               Mail reports · Leaderboard · Guild territories
```

## 2. Currencies & resources

| Key | Name | Source | Main sinks |
|---|---|---|---|
| `rim` | RIM | Tribute Office | Facility upgrades, Shop stock, Marketplace |
| `titanium` | Titanium | Titanium Extractor, expeditions | Upgrades, troops |
| `plasma` | Plasma | Plasma Condenser, expeditions | Upgrades, troops, **raid fuel** |
| `rations` | Rations | Ration Synthesizer, expeditions | Upgrades, troops |
| `nanites` | Nanites | Salvaging equipment | **Expedition fuel**, equipment upgrades |

Starting balance: **10 RIM · 500 Titanium · 250 Plasma · 250 Rations · 0 Nanites**.

## 3. Station facilities

All seven start at level 1. Upgrades are instant on payment.

| Facility | Effect per level | Upgrade cost (L → L+1), `sq = max(1, L²)` |
|---|---|---|
| Tribute Office | +1 RIM/h | `sq` RIM |
| Titanium Extractor | +100 Titanium/h | `sq` RIM + `100·sq` Titanium |
| Plasma Condenser | +100 Plasma/h | `sq` RIM + `100·sq` Plasma |
| Ration Synthesizer | +100 Rations/h | `sq` RIM + `100·sq` Rations |
| Vault | Holds 10 RIM + 1,000 of each resource | `sq` RIM + `100·sq` of all three resources |
| Attack Array | +10 attack | `sq` RIM + `100·sq` of all three |
| Defense Grid | +10 defense | `sq` RIM + `100·sq` of all three |

Example: Vault 2 → 3 costs 4 RIM + 400 Titanium + 400 Plasma + 400 Rations.

**Production:** uncollected ("exposed") output = `hours since last collect × rate`, capped at Vault capacity per resource. RIM keeps 2 decimals, resources are whole numbers. Exposed output is what raiders can steal. Collecting banks it (+10 XP per haul). The RIM formula (1 RIM/h per level, level² cost) is fixed and must not be rescaled.

## 4. Operator level & XP

- Cumulative XP to reach level N = `(N − 1)² × 1000`; `level = floor(√(xp/1000)) + 1`, max **100**.
- XP sources: 10 XP per RIM spent on facilities · 100 XP per Nanite spent upgrading or earned salvaging · 10 XP per collected haul · expedition XP (table §8).
- Level gates expedition tiers and the troop cap.

## 5. Equipment (fleet modules)

**Slots** (one equipped each) and their signature stat:

| Slot | Signature stat |
|---|---|
| Mothership | Luck (required for all expeditions) |
| Commander | Crit |
| Attack Wing | Attack |
| Shield Array | Defense |
| Mining Rig | Extraction |
| ECM Suite | Evasion |

**Stats:** extraction, attack, defense, luck, evasion, crit. Attack/defense are stored ×10.

**Rarity** (base crate odds): Common 70% · Uncommon 20% · Rare 8% · Epic 1.8% · Legendary 0.2%. Rarity index 1/2/3/4/6 = number of stats rolled (max 6); each stat rolls in `[0.1·index, index]`, signature stat always included.

- **Upgrade:** max level 10; cost = `salvageValue × 0.0498 × level` Nanites; every stat ×1.05.
- **Salvage:** destroys the item for Nanites = Σ stat × weight (attack 0.5, defense 0.5, extraction 5, evasion 5, crit 5, luck 10).
- New players can claim one free **Starter Mothership** (common, luck 2).

## 6. Crates, shards & forging

| Crate | Minimum rarity | How to get |
|---|---|---|
| Equipment Crate | Common | Shop, 5 RIM |
| Uncommon / Rare / Epic / Legendary Crate | that rarity | Forge 100 matching shards |

Higher crates keep the base odds but only among rarities at or above the minimum (re-normalised). Shards are ordinary stackable items (`shard-<rarity>`), earned from expeditions. Opening happens in Inventory.

## 7. Shop (Supply Depot)

RIM prices, 1–25 units per purchase, all-or-nothing payment:

| Item | Price | Use |
|---|---|---|
| Equipment Crate | 5 RIM | Rolls one module |
| Recon Drone | 2 RIM | Scout a rival: troops, true totals, exposed supplies (intel lasts 1 h) |
| Sublight Overcharger | 2 RIM | Halve remaining expedition time; finishes instantly at ≤15 min |
| Disruptor | 1 RIM | Sabotage a rival's Tribute/Attack/Defense *(item sold; effect not yet active)* |
| Repair Kit | 1 RIM | Clear sabotage on another operator *(item sold; effect not yet active)* |

## 8. Troops (Barracks & Shipyard)

Instant recruitment, paid in resources only — **never RIM**. Troops are never destroyed.

| Unit | Type | ATK | DEF | Titanium | Plasma | Rations |
|---|---|---|---|---|---|---|
| Void Marine | Ground | 3 | 5 | 30 | 0 | 40 |
| Rail Sniper | Ground | 6 | 2 | 20 | 15 | 30 |
| Hover Lancer | Ground | 9 | 6 | 60 | 20 | 60 |
| Vanguard Striker | Ship | 25 | 5 | 180 | 90 | 0 |
| Bulwark Frigate | Ship | 5 | 25 | 200 | 0 | 80 |
| Aegis Dreadnought | Ship | 40 | 40 | 450 | 220 | 160 |

**Troop cap** (shared across all units): `50 + level × 25` (level clamped 1–100 → 75 … 2,550). Max 25 per order.

## 9. PvP raids

Started by clicking a rival station on the sector map.

- **Combat stats:** attack = Attack Array × 10 + gear attack + troop attack; defense likewise; crit = gear crit.
- **Fuel:** 10 Plasma per raid.
- **Chance:** 0% if attack ≤ defender defense ("Outmatched"); else `clamp(50 + (atk − def) × 2, 10, 100)`%.
- **Loot on win:** exposure 15–30% of the defender's *uncollected* output; a crit (chance = crit%) doubles it, capped at 45%. Loot is also capped by the attacker's free Vault space.
- Fail = "Repelled", no loot. No troop losses either way. Every raid sends a Mail report.
- Current targets are labelled sample opponents (Scavenger L1, Sentry L4, Warlord L10).

## 10. Expeditions & bosses

Worlds appear on the map; clicking one opens the mission. The board is identical for everyone and refreshes at 00:00 UTC: one T1 combat, one T2–T5 rotating mission (salvage/stealth/fortune/defense), one T1 salvage, plus five bosses.

**Only base stats + equipped gear count** (troops and consumables never do). Base adds Attack Array ×10, Defense Grid ×10, Tribute level to extraction.

| Tier | Level | Primary stat | Secondary stat | Time | Nanite fuel | Base draws | XP | Resources (Ti/Pl/Ra) | Odds C/U/R/E/L % |
|---|---|---|---|---|---|---|---|---|---|
| T1 | 1 | 10 | 2 | 1 h | 0 | 2 | 150 | 50/10/30 | 47/49/4/0/0 |
| T2 | 10 | 50 | 5 | 4 h | 15 | 3 | 450 | 120/25/70 | 41/44/12/2/1 |
| T3 | 25 | 100 | 12 | 12 h | 40 | 4 | 1,200 | 280/60/160 | 36/38/15/7/5 |
| T4 | 50 | 200 | 20 | 24 h | 100 | 6 | 2,500 | 600/130/350 | 30/32/18/10/10 |
| T5 | 100 | 500 | 40 | 48 h | 250 | 10 | 6,000 | 1,400/300/800 | 26/28/19/12/16 |

Luck, evasion and crit use the low column; other stats the high column. T3/T4/T5 also need an Uncommon/Rare/Epic+ item in the mission's slot. A Mothership is always required.

| Mission | Primary | Secondary | Slot |
|---|---|---|---|
| Wreckage Recovery (salvage) | Extraction | Luck | Mining Rig |
| Silent Ledger (stealth) | Evasion | Luck | ECM Suite |
| Frontier Lockdown (defense) | Defense | Evasion | Mothership |
| Fortune Anomaly (fortune) | Luck | Evasion | Mothership |
| Citadel Raid (combat) | Attack | Luck | Attack Wing |

**Rewards:** resources always; draws scale with a roll boosted by overshooting the primary stat (up to +75%) and by the secondary; +1 draw for a Rare+ designated item, chance of +1 more from item level. Each draw gives shards of a rolled rarity. Small chance (5–25%) of a Recon Drone or Overcharger. Stats are snapshotted at launch; rewards are seeded so they can't be rerolled, and credited once on claim.

**Bosses:** up to 20 rounds. Player HP = 100 + defense × 5. Damage dealt = attack ±10% (×1.5 on crit, crit ≤ 50%) − boss defense; incoming = boss attack ±10% − defense × 0.4, dodged by evasion (≤ 50%).

| Boss | Tier | HP | ATK | DEF |
|---|---|---|---|---|
| Scrap Warden | 1 | 60 | 8 | 2 |
| Relay Phantom | 2 | 300 | 40 | 10 |
| Iron Regent | 3 | 650 | 85 | 25 |
| Abyss Leviathan | 4 | 1,400 | 170 | 50 |
| Citadel Sovereign | 5 | 3,500 | 425 | 125 |

## 11. Sector map

- 250 × 250 axial hex grid; home station at (125, 140).
- Worlds are placed deterministically per UTC day: higher tiers farther out, bosses beyond them, never on territories.
- Clicking a rival station → target dialog (raid / recon). Clicking a world → mission dialog. There are no separate raid/explore consoles.
- HUD: commander menu (Profile, Referrals, Histories, Disconnect) and Mail top-left, coordinate jump top-centre, resource stack right, minimap bottom-right, Home compass, tactical ribbon (Station, Fleet, Items, Shop, Market, Guild, Rankings) with alert badges.

## 12. Guilds & territories

| Territory | Size | Location | Perk |
|---|---|---|---|
| Outpost Alpha | 7 tiles | (65, 65) | +15% Titanium |
| Outpost Beta | 7 tiles | (185, 65) | +15% Plasma |
| Outpost Gamma | 7 tiles | (65, 185) | +15% Rations |
| Outpost Delta | 7 tiles | (185, 185) | +10% fleet defense |
| Federation Station | 19 tiles | (125, 125) | +20% all resources, +15% fleet attack |

Guilds can be created and joined (sample guilds exist). Perks are displayed but **not yet applied**; capture battles are the next planned feature.

## 13. Marketplace

Players list unique equipment for RIM; purchases check the listing and price, then transfer RIM and ownership instantly. No fee.

## 14. Mail, histories & rankings

- Every raid, recon, expedition and system event lands in Mail (category, sender, subject, body, read flag). Histories shows the same reports filtered by type.
- **Leaderboard score (0–100):** Renown 30 + Production 30 + Progression (XP) 40, each scaled against the top player. Ties share a rank; top 100 shown, 25 per page. Opponents are labelled samples.
- Referrals show an invite link; recruit tracking is not implemented yet.

## 15. Not yet implemented

Guild capture battles and perk effects · Disruptor/Repair Kit effects · referral tracking · database persistence · live token settlement (deliberately out of scope).
