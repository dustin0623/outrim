# Outer Rim — Game Architecture

How the code is organised. For gameplay rules and numbers see `GAME_MECHANICS.md`; for one-line decisions see `AGENTS.md`.

## 1. Stack

- **TanStack Start v1** (React 19, SSR, Vite 7) targeting an edge worker runtime.
- **Tailwind CSS v4** via `src/styles.css` tokens; shadcn/ui + an 8-bit UI kit (`src/components/ui-8bit`).
- **Zustand** stores for all game state (session only).
- **Phaser 3** for the sector map, browser-only.
- **Zod** for order/input validation. **Vitest** for tests.

## 2. Layering

```text
src/routes/index.tsx           single game screen: HUD + map + dialogs
        │
src/components/<feature>/      dialogs and HUD (presentation only)
        │  read/act via hooks
src/features/stores/*.store.ts session state, owner-scoped, one per future table
        │  call
src/lib/game/<domain>/         PURE rules: formulas, catalogs, RNG-injected resolution
```

Rules never import stores or React. Stores own state transitions and call rules. Components never compute balances or outcomes themselves. This keeps every rule unit-testable and portable to a server unchanged.

## 3. Rule modules (`src/lib/game`)

| Module | Responsibility |
|---|---|
| `station/economy.ts` | Resource keys, production rates, vault caps, exposed-yield calculation |
| `station/buildings.ts` | Facility catalog, starting levels/balance, `upgradeCost`, `canAfford` |
| `equipment/fleet.ts` | Slots, stats, rarities, item rolling, upgrade/salvage values, `fleetTotals` |
| `items/catalog.ts` | Every stackable item ID, shop prices, `applyItemBatch` (all-or-nothing) |
| `items/chests.ts` | Crate rarities, conditioned odds, 100-shard forge constant |
| `troops/rules.ts` | Troop catalog, cap formula, batch cost, troop totals |
| `raids/rules.ts`, `raids/targets.ts` | Raid stats, chance, loot resolution; sample opponents |
| `expeditions/rules.ts`, `bosses.ts` | Tier table, daily board, requirement checks, rewards, boss simulation |
| `profile/level.ts`, `templates.ts` | XP curve, XP sources, cosmetic catalog |
| `leaderboard/rankings.ts`, `demo.ts` | Weighted score, tie ranking, pagination |
| `world/hex.ts`, `space.ts`, `generation.ts`, `territories.ts` | Axial geometry, map objects, daily world placement, guild territories |

Randomness is always passed in as `rng: () => number`, so outcomes are deterministic in tests; expedition rewards use a seeded RNG stored with the run.

## 4. Stores (`src/features/stores`)

Each store is keyed by owner (current signed-in account) and mirrors a future table:

| Store | Future table | Holds |
|---|---|---|
| `items.store` | `items` | All stackable quantities: RIM, resources, Nanites, crates, shards, consumables |
| `equipment.store` | `equipments` | Unique rolled gear, equipped slots, market listing price |
| `troops.store` | `troops` | owner + troop type + quantity (ground and ship) |
| `station.store` | `stations` | Facility levels, last-collected time (never balances) |
| `player.store` | `players` | XP, cosmetics |
| `expeditions.store` | `expeditions` | Runs with snapshot, seed, finish time, claimed flag |
| `raids.store` | `raids` | Raid attempts, recon intel with expiry |
| `mails.store` | `mails` | Every report/notification |
| `guilds.store` | `guilds`, `guild_members` | Guilds, members, territories |
| `marketplace.store` | — | Listing/purchase actions over equipment + items |
| `auth.store` | — | Session identity |

Invariants: one balance source (`items.store`); batches validate fully before any change; XP is credited only by the store performing the action; rewards are credited once.

## 5. UI composition

- `src/routes/index.tsx` mounts the HUD (`components/hud`: `AccountMenu`, `CommandHud` resource stack & coordinates, `HomeCompass`), the bottom tactical ribbon, `WorldMap`, and opens dialogs by state.
- Map clicks open `raids/StationTargetDialog` or `expeditions/WorldDialog` — the map is the only targeting surface.
- Feature dialogs: Station, Fleet, Inventory (+ ChestWorkshop), Shop (+ TroopCard), Marketplace, Guild, Leaderboard, Mail, Profile.
- Styling uses semantic tokens only; no hard-coded colours.

## 6. Sector map

- Pure geometry in `src/lib/game/world`; Phaser scene in `src/game/scenes/SpaceWorldScene.ts`.
- React talks to Phaser only through `src/game/bridge/GameBridge.ts` (select, recenter, view changes).
- Phaser is loaded only after hydration, never imported during SSR. Only visible sectors are rendered.
- Artwork lives in `public/assets/world` and is referenced by literal `/assets/...` URLs.

## 7. Server side & persistence (dormant)

- `src/lib/config/database.ts` picks storage: `MONGODB_URI` set → MongoDB, otherwise the mock store (`src/features/stores/mock/database.ts`). Only repositories in `src/lib/modules/<collection>/` touch it.
- `server/smart-contract/` contains the transaction poller and processor (`chain:action` routing). In mock mode a dev-only hook runs one poll cycle every few seconds; in live mode a separate worker would run the same code.
- `src/lib/chains/` holds wallet login (Hive, Solana, XRPL) and email auth; see its own `AGENTS.md`. Demo email login exists only in development.
- Gameplay does **not** use the database or chain settlement yet — this is intentional.

## 8. Testing

- Rule and store tests sit next to the code (`*.test.ts`), plus `src/test/` for routing and `server/**/test.ts` for the worker.
- Run: `bunx vitest run`. Tests assert concrete rule values (costs, caps, odds, chances), not markup.

## 9. Adding a feature

1. Write the formula/catalog as a pure function in `src/lib/game/<domain>` with tests.
2. Add or extend an owner-scoped store that calls it and debits/credits `items.store`.
3. Build the dialog in `src/components/<feature>`, reached from the map or the ribbon.
4. Send a Mail for any asynchronous result.
5. Update `GAME_MECHANICS.md` numbers and, for structural choices, `AGENTS.md`.
