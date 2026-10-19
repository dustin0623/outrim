# Outrim next version — game design

Status: proposed implementable alpha baseline. See [scope and authority](../LOVABLE_BUILD_GUIDE.md). These rules describe the new project and do not describe or modify the existing Hive game.

## 1. Player experience

Outrim is a persistent frontier strategy game. Each operator controls one industrial installation in a shared world. The primary loop is:

**Produce → secure → build/train → dispatch → gather/scout/raid → return → improve.**

The world continues while players are offline. Troops move between fixed locations on timers; players do not steer individual units in real time. Fighting is a server-resolved encounter on arrival. The 2.5D presentation uses illustrated structures and terrain over a mathematical hex grid.

No research, technology tree, fuel, hunger, hero collection, land purchase, base destruction, teleportation, alliance, chat, player marketplace, paid speedup or blockchain action is included in this first version. Future concepts stay absent from playable navigation until implemented.

## 2. Identity and onboarding

1. Read a public landing page and Field Manual.
2. Sign up with email/password, verify email, choose a username and sign in.
3. Select the open world and review capacity and new-player protection.
4. Submit `join_world` once with a request ID.
5. Server atomically allocates a valid spawn, creates the base and starter state, and records the result.
6. Open the world centered on the new base. A dismissible tutorial explains exposed versus secured resources, construction and the first gathering march.

Username: 3–20 ASCII letters, digits or underscores; first character a letter; trim surrounding whitespace; uniqueness uses lowercase. Display spelling can preserve case. No username change in alpha. Email remains private in Auth; public game responses never contain it.

### Proposed starting state

| Field | Initial value |
| --- | --- |
| Secured Alloy | 500 |
| Exposed Alloy | 0 |
| Sparks | 0 |
| Buildings | HQ, Extractor, Storehouse, Barracks and Dispatch Bay at level 1; Defense Array at level 0 |
| Available units | 10 Haulers, 4 Skirmishers, 2 Sentinels |
| Equipment / stacks | None |
| Protection | 24 hours from world joining, unless explicitly broken by the owner's first raid |

The grant exists once per base/world. Retry, reload and concurrent joining cannot regrant it. A full world cannot spend a slot or create partial state. Development test resets are isolated from player environments.

## 3. World and coordinates

- Initial world: 250 columns × 250 rows expressed as axial coordinates `q=0..249`, `r=0..249`; 62,500 hexes. This bounded axial grid has a parallelogram outline; a rectangular offset outline is a future presentation/coordinate change requiring specification.
- Pointy-top orientation. Hex size is a renderer setting, not a game distance.
- Hex distance: `(abs(dq) + abs(dr) + abs(dq + dr)) / 2`.
- No wrapping. Six neighbors are `(1,0), (1,-1), (0,-1), (-1,0), (-1,1), (0,1)` within bounds.
- Sectors: `sector_q=floor(q/16)`, `sector_r=floor(r/16)`; 16 × 16 sectors, with partial sectors along the last edges.
- Terrain generation is deterministic for `(seed, generator_version)`; generate and validate before marking a world open.
- Alpha terrain weights: plain 60%, rock 25%, scrap field 10%, ridge 5%, subject to connectivity/spawn validation. These are targets, not a requirement to hit exact counts.
- Plain/rock/scrap are traversable at movement cost 1/2/1 per step respectively. Ridges are blocked.
- Reject/regenerate disconnected worlds. Verify at least 1,000 valid spawn candidates and sufficient nearby resource sites. Never modify live geography to repair generation.
- Bases occupy plain tiles. One base per tile; resource sites and bases cannot share a tile. Bases are blocked intermediate path tiles but allowed as their owner's origin and as a mission's valid final destination.
- No relocation or base removal in alpha; the world capacity counts bases, including offline accounts.

Spawn selection uses server-chosen valid candidates, minimum hex distance 3 from another base, and at least one reachable resource site within 6 hexes. If no candidate remains, return `NO_SPAWN_AVAILABLE`; do not loop indefinitely or silently exceed constraints. World provisioning must test sequential allocation of all 1,000 bases with this rule before opening. A world may fill before the configured player limit if generation is invalid; that is a provisioning failure, not permission to change rules.

All terrain and base positions are visible to authenticated world members. There is no fog of war. Exploration means navigating terrain, inspecting sites and sending expeditions. Scouting reveals a timestamped private snapshot of a rival's exposed Alloy and available garrison; it is not required to see their base position.

## 4. Resources and production

Only two resources exist in alpha:

| Resource | Earn | Spend |
| --- | --- | --- |
| Alloy | Passive extraction into exposure; returned gathering/raid cargo into exposure; Secure Haul makes it spendable | Construction, training, cache purchase |
| Sparks | Dismantling modules | Tuning modules |

UI says **Alloy** and **Sparks**. Do not append HASH, HIVE, SOL, a token ticker or a cash value. These are internal game resources with no withdrawal or transfer functionality.

Represent Alloy in integer milli-Alloy (`1 Alloy = 1000 milli-Alloy`); represent Sparks as whole integers. Transport database `bigint` values as decimal strings and format without floating-point money arithmetic. Server limits all quantities to documented safe bounds before multiplication.

### Production baseline

```text
base output = 60 × Extractor level Alloy/hour
exposed capacity = 1000 × Storehouse level Alloy
secured capacity = unlimited within the numeric safety bound
bonus multiplier = (10000 + extraction_bonus_bps) / 10000
```

Settle with UTC whole-second logical timestamps. Keep a production remainder so frequent settlement does not lose fractional milli-Alloy:

```text
denominator = 3600 × 10000
numerator = elapsed_seconds × (60000 × extractor_level) × (10000 + bonus_bps)
            + previous_remainder
credit_milli = floor(numerator / denominator)
new_remainder = numerator mod denominator
```

Apply only up to exposed capacity. At a full hold discard excess production and its remainder; do not bank overflow for later. Advance settlement time even when full. Example: Extractor 1 produces exactly 60 Alloy in one hour without bonuses or a full hold.

Settle the previous interval before changing output, capacity or equipment. Settle the defender before a raid. `Secure Haul` settles production, moves all exposure into secured Alloy and empties exposure; it is immediate and has no charge system in this new design. It grants no XP or extra reward.

Returned cargo credits exposure up to capacity; discard and report overflow explicitly. Display that risk before dispatch. No cargo becomes secured automatically. Construction and training spend secured Alloy only.

## 5. Buildings

There are six fixed slots, one of each building. Max level 10. HQ gates every other building's target level. Building costs/durations use the **target** level `N`.

| ID / display | Base cost factor (Alloy) | Base duration factor (seconds) | Effect |
| --- | ---: | ---: | --- |
| `hq` / Command Rig | 120 | 60 | Maximum building level |
| `extractor` / Extractor | 80 | 45 | Production formula above |
| `storehouse` / Storehouse | 60 | 30 | Exposed capacity formula above |
| `barracks` / Barracks | 100 | 45 | Required to train; each level cuts base training time by 5%, capped at 45% |
| `dispatch` / Dispatch Bay | 90 | 45 | Maximum simultaneous active marches = `min(5, level)` |
| `defense` / Defense Array | 110 | 60 | Adds `20 × level` defense strength |

```text
cost = cost_factor × N²
base duration = duration_factor × N²
actual construction seconds = max(1, ceil(base duration × 10000 / (10000 + build_bonus_bps)))
```

Example: Extractor 1→2 costs 320 Alloy and takes 180 seconds without bonuses. Costs are deducted atomically on acceptance. One active construction job per base. The old level remains effective until completion. Queue completion settles old production at the due time, then applies the new level. No cancellation, instant completion or refunds in alpha. Reject a second construction rather than silently queuing it.

## 6. Units and training

| ID | Role | Alloy cost | Base training seconds/unit | Attack | Defense | Carry (Alloy) | Seconds/movement cost |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `hauler` | Gather/carry | 10 | 10 | 1 | 1 | 20 | 6 |
| `skirmisher` | Attack | 25 | 20 | 8 | 3 | 5 | 4 |
| `sentinel` | Defense | 25 | 20 | 3 | 8 | 5 | 8 |

No unit tiers, research unlocks, heroes or hospital in alpha. Lost units are permanently removed. UI must explain casualties before the first raid.

Training accepts one unit type, quantity 1–100 per request. One active training job per base, independent of construction. Cost is per-unit cost × quantity. Duration is `max(1, ceil(base_seconds × quantity × (100 - 5 × (barracks_level - 1)) / 100))`. Capture costs, duration and rules version on acceptance; later upgrades do not reprice or accelerate an accepted job. Units become available together on completion.

Training grants no resources. Available units and committed march units are separate rows; dispatch and return atomically move quantities between them. Never maintain a second independent total-troop counter.

## 7. Marching and pathfinding

Mission types: `gather`, `scout`, `raid`. An accepted mission has a fixed server-approved path and speed snapshot.

```text
path cost = sum(cost of each entered tile, excluding origin)
slowest seconds per cost = max(selected unit movement seconds)
outbound duration = max(15, ceil(path cost × slowest_seconds × 10000 / (10000 + march_bonus_bps)))
carry_milli = floor(sum(unit quantity × carry × 1000) × (10000 + carry_bonus_bps) / 10000)
```

Use deterministic A* with fixed neighbor/tie ordering; the heuristic uses hex distance × minimum step cost. Server calculates and validates the path. The browser preview is advisory. Return follows the reversed outbound route with the original travel duration; casualties do not speed it up. Static geography and no base relocation make this stable, but newly occupied intermediate tiles must not invalidate an already accepted route. Spawn selection must not block routes of active marches.

One owner may have at most Dispatch Bay level active marches, capped at five. Selected units must be positive, available and total at most 10,000. No empty, self-targeted, cross-world, blocked or unreachable mission is accepted. No recall, interception or rerouting in alpha.

States:

```text
gather: outbound → gathering → returning → completed
scout:  outbound → returning → completed
raid:   outbound → returning → completed
```

A destroyed force can complete at arrival without a return. Full march rows and cargo are private to their owner. World map public markers reveal origin/destination, mission type and timestamps, never exact troops/cargo. In alpha these public markers are visible to every member who loads the relevant sector; there is no hidden-march mechanic.

## 8. Gathering

- Scrap fields hold Alloy nodes: capacity 10,000 Alloy; initial stock equals capacity.
- Only one march can gather a node at a time. Outbound dispatch does not reserve the node.
- At arrival, a node already occupied or depleted causes an empty return with an explanatory report.
- Otherwise reserve `min(current stock, march carry)` milli-Alloy, deduct it once from node stock, and capture it on the march as pending yield.
- Gathering rate is `selected surviving unit count × 1000 milli-Alloy/second`; duration is `max(1, ceil(reserved_yield_milli / rate))`.
- At gathering completion, move pending yield to cargo, release the node and begin returning.
- When a node first reaches zero, schedule one refill for 3,600 seconds later. Refill restores capacity. Existing gathering reservations remain valid; occupancy still blocks a new gatherer until departure.
- A march with pending yield/cargo remains durable during disconnects. Resource reservation, job creation and march transition occur in one transaction.
- A unique partial index prevents two marches from simultaneously gathering the same tile. Arrival ordering follows [backend execution rules](BACKEND_SECURITY.md).

Example: ten Haulers carry 200 Alloy, gather it in 20 seconds from an available node, and return with 200 Alloy. If the home hold has only 80 Alloy of space on return, credit 80 and record 120 lost to overflow.

## 9. Scouting, protection and raids

### Scouting

Send at least one unit to another base. Scouting has no combat or casualties in alpha, does not break either shield and returns no resources. At arrival, record exposed Alloy, available garrison and Defense Array level as a private snapshot. Show the observation time and a stale warning after 30 minutes. No live subscription reveals subsequent private changes. New-player protection permits scouting.

### Protection

Protection lasts until `protection_until`. Dispatch rejects a raid against an actively protected target. A protected attacker must explicitly confirm `break_protection=true`; break only when a valid raid is atomically accepted. Declining or an invalid request changes nothing. Protection cannot be purchased or reinstated in alpha. Recheck target protection on arrival; if protected, return without combat or casualties. Secure Haul remains possible while an enemy march travels.

### Deterministic alpha combat

Capture attack/carry bonuses at dispatch; read the defender's completed equipment/buildings and available garrison at arrival. Units away on marches cannot defend. Settle both bases' production at the event time before outcome application.

```text
attack = floor(sum(attacking unit attack) × (10000 + attack_bonus_bps) / 10000)
defense = floor(sum(available defender unit defense) × (10000 + defense_bonus_bps) / 10000)
          + 20 × Defense Array level
attacker wins only when attack > defense; ties defend
```

Casualties apply independently to each unit-type quantity, capped at that quantity:

| Outcome | Attacker losses | Defender losses |
| --- | --- | --- |
| Attacker wins | `ceil(quantity × 10 / 100)` | `ceil(quantity × 20 / 100)` |
| Defender wins / tie | `ceil(quantity × 30 / 100)` | `ceil(quantity × 5 / 100)` |

These simple formulas are intentionally proposed alpha rules. There are no criticals, RNG, unit counters or combat rounds yet. Small forces can lose all units because casualties round up; the preview must show this.

On attacker victory, loot is `min(floor(defender exposed_milli × 25 / 100), surviving carry_milli)`. Deduct it from defender exposure and place it in the attacking march's cargo in the same transaction. Secured Alloy, Sparks and equipment cannot be looted. Defender victory yields no loot or bonus resources. Base buildings cannot be damaged or seized. Survivors return; zero survivors imply zero carry and zero loot.

Create immutable reports for both participants. Reports contain exact pre-combat relevant snapshots, casualties, loot and rules version. A report is evidence of one outcome; revisiting it never reruns combat. Multiple same-time raids resolve sequentially by due job ordering, so later raids see earlier losses/loot.

## 10. Inventory and modules — later alpha milestone

Keep this milestone after the expedition loop works. No player trading is included.

- Supply Depot offers one Salvage Cache for 100 secured Alloy; buy 1–25 into an owned stack.
- Opening consumes one cache and grants one module in the same transaction, without a second Alloy charge.
- Choose uniformly among six slots. Rarity weights in basis points: Common 7000, Uncommon 2000, Rare 800, Epic 180, Legendary 20; total 10000.
- Use server-side cryptographic randomness with unbiased bounded selection. Save the committed outcome against the request ID. Failed/uncommitted requests cannot expose a roll. A repeated committed request returns its original result.
- Alpha modules have fixed catalog bonuses per rarity, rather than arbitrary rolled stats: 100/200/300/400/500 basis points. This intentionally differs from the current Hive game.

| Slot | Bonus |
| --- | --- |
| Extraction Head | Passive extraction |
| Control Core | Construction speed |
| Reactor | Raid attack |
| Thermal Array | Garrison defense |
| Signal Array | March speed |
| Logic Module | Carry capacity |

One equipped module per slot. Tuning adds 25 basis points per upgrade level, max upgrade level 5. Cost to reach upgrade level `N` is `10 × N` Sparks. Dismantle an unequipped module for 5/10/20/40/80 Sparks by rarity; tuning costs are not refunded. Owned/equipped/consumed status must be validated server-side. Preserve a consumed tombstone for audit, hide it from usable inventory.

Settle old production before equipment changes. Construction/training/travel already accepted keep their snapshots. Raids use attacker dispatch and defender arrival snapshots as described above. Cache rewards stay visible after consuming the last cache or switching inventory tabs.

## 11. Progression and reports

Alpha progression is building levels, unit strength and modules. There is no separate XP/level, research, Renown score, season or reward ladder. Cosmetic selection initially uses freely available approved portraits; no inherited Hive unlock gates.

Operations Ledger displays private scout/gather/raid/return reports, newest first, with stable cursor pagination. Build/training/cache results are accessible through owner-scoped command results. Notifications are driven by newly observed durable result IDs, deduplicated per session; initial hydration does not replay old notifications.

Reports distinguish accepted orders, completed tasks, losses, empty returns and credited versus discarded cargo. Never display a dispatch as already earned resources. Delete no combat evidence merely because the user dismissed a notification.

## 12. Balancing and changes

Every command/job captures `rules_version`. Retain implementations for in-flight versions until all associated jobs complete. A release must not silently reprice construction, reroll caches or recalculate committed battle reports. Define an explicit safe cutover for passive production changes.

Before external playtesting, review: 24-hour protection, spawn density, free Secure Haul, large-map travel, griefing through repeated raids, rounding of small-force casualties, starter resources, storage overflow and cache/Sparks progression. Measure these in the alpha; do not market the proposed baseline as balanced.
