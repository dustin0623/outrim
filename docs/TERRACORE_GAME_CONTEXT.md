# TerraCore — Game Context & Mechanics

Reference document for https://www.terracoregame.com/ (official wiki, 2026 state).
Purpose: a shared vocabulary of TerraCore's systems so we can consciously adopt,
adapt, or reject each mechanic when building Outrim. Sources: the official wiki
(home, gameplay/battles, gameplay/boss-fights, planets, nfts, economy, stats)
and the @terracore PeakD devlog feed.

---

## 1. What TerraCore is

TerraCore is a post-apocalyptic idle strategy game built on the Hive blockchain.
The core loop is:

```
Passive mine ($SCRAP) → upgrade stats → raid players / defend stash
                      → earn $FLUX → unlock planets → daily boss fights → NFT crates
```

Key traits:

- **Idle-first**: rewards trickle in every few seconds; the player's decisions are
  about *allocation* (stats, staking, claiming) rather than real-time actions.
- **Risk by exposure**: unclaimed currency in your stash is raidable; claiming
  often is the basic defense.
- **Asset ownership**: items are NFTs on Hive; tokens ($SCRAP, $FLUX) trade on
  Hive Engine's marketplace (Tribaldex order book).
- **Daily rhythm**: attacks regenerate over hours; boss fights are once per day
  per planet. Progression rewards consistent daily play.

## 2. Economy — two tokens

| Token | Role | Earned by | Spent on |
| --- | --- | --- | --- |
| $SCRAP | Primary currency | Passive mining (Engineering stat) | Stat upgrades, crates, Favor contributions, staking |
| $FLUX | Exploration fuel | Salvaging unwanted NFT items | Boss fight runs (per planet, e.g. 1–2 FLUX) |

Economic design points worth copying:

- **Closed loops.** $SCRAP: mine → claim → spend → upgrade → mine faster.
  $FLUX: crates → items → salvage → fuel → boss runs → crates. Each loop funds
  itself; sinks (upgrades, crate purchases, contributions) prevent inflation.
- **Staking as a sink + defense.** Staked $SCRAP is locked (unraidable) and
  grants passive Luck and Dodge bonuses — a dual-purpose commitment.
- **Unclaimed = at risk.** Only stash (unclaimed) $SCRAP can be stolen. Claim
  timers create the PvP economy.

> Outrim mapping: $SCRAP ≈ **Alloy** (mine → Secure Haul → spend), $FLUX ≈
> **Sparks** (salvage/repair currency). TerraCore's "exposure" mechanic is the
> same idea as our Exposed-vs-Secured Alloy split.

## 3. Player stats

Ten core stats, upgraded with $SCRAP on an **exponential cost curve** (marginal
cost roughly doubles every few levels — early broad investment beats maxing one
stat).

| Stat | Primary use | Notes |
| --- | --- | --- |
| Engineering | Passive mine rate | The "production" stat |
| Damage | PvP offense | Gates whom you can attack |
| Defense | PvP defense | Gates who can attack you |
| Stash Size | Max unclaimed currency | Full stash pauses mining |
| Attacks | Daily attack count | Energy system |
| Luck | Loot discovery on bosses | Also boosted by staking & items |
| Dodge | Chance to fully evade a raid | Also boosted by staking & items |
| Crit | Floor for stolen loot on a win | Boosted by Favor and items |
| Staked SCRAP | Toughness + passive Luck | Locked currency |
| Favor | Planet access | Earned by contributing (burning) $SCRAP |

Stat synergy model (worth keeping as a design principle):
offense = Damage + Crit; defense = Defense + Dodge + Staked; loot = Luck +
equipped items; access = Favor. No stat is standalone.

## 4. PvP battles

**Energy**: 1 attack regenerates every 4 hours, capped at 8 (overflow lost).

**Combat sequence, in order:**

1. **Dodge check** (defender): `random(0,100) < defenderDodge` → attack misses
   entirely. No damage, no loot.
2. **Crit check** (attacker): a crit multiplies effective damage / raises the
   loot floor. Favor shifts the crit probability curve.
3. **Damage vs Defense**: `attackerDamage = (damage/10)^2`,
   `defenderDefense = (defense/10)^2`. If attacker > defender, the attacker wins
   and steals a **percentage of claimable $SCRAP scaling with the margin of
   victory**.
4. **Staked toughness**: staked $SCRAP adds a second dodge-probability layer.

**Target selection**: the battle screen lists targets sorted by defense with a
max-defense filter (and a Focus consumable to narrow further) — players only see
targets they can plausibly beat.

**Stash protection guidance** the wiki gives players: claim often, raise Defense,
raise Dodge, stake SCRAP. Large unclaimed balances are deliberate bait.

## 5. Planets & exploration

| Planet | Boss | Favor required | $FLUX cost | Daily runs |
| --- | --- | --- | --- | --- |
| TerraCore | — | none | 1 | 1 |
| Oceana | Leviathan | Moderate | 2 | 2 |
| Celestia | Void Titan | High | 2 | 2 |
| Arborealis | — | — | 2 | 2 |
| Neptolith | — | — | 2 | 2 |
| Solisar | — | — | 2 | 2 |

- Planets unlock permanently by **contributing (burning) $SCRAP to earn Favor**
  past a threshold.
- Higher planets cost more Favor but have better rarity odds.
- Exploration requires a **starship NFT** fueled with $FLUX.

> Outrim mapping: planets/bosses replace "gathering worlds". The player's base
> is the economy; planets are PvE destinations reached with ships.

## 6. Boss fights

Once per day per planet, costing $FLUX:

1. **Luck roll**: `roll = random * 100`; `roll < luck` → a crate is found.
   Without Luck, no crate.
2. **Rarity roll** (0–1000), thresholds per planet:

| Tier | Oceana | Celestia |
| --- | --- | --- |
| Uncommon | 95% | 90% |
| Rare | 3.5% | 7% |
| Epic | 1% | 2.25% |
| Legendary | 0.5% | 0.75% |

- Equipped item quality shifts the probability curves.
- Daily cooldown makes consistency the biggest long-term factor.

## 7. Items (NFTs)

Five-tier rarity: **Common (grey) / Uncommon (green) / Rare (blue) / Epic
(purple) / Legendary (orange)**. Higher rarity = better attribute ranges *and
more attribute slots*.

| Type | Purpose |
| --- | --- |
| Items | Equipment that boosts stats — see slots below |
| Crates | Containers holding one item; forged, bought, or dropped by bosses |
| Relics | Forge 100 of a rarity → crate of that rarity; main quest reward |
| Potions | Single-use temporary stat boosts (one grants temporary invulnerability) |

**Equipment categories**: Avatars (appearance + stats), Weapons (damage, rarer
ones add other stats), Armors (defense, rarer add others), Starships (unlock
game modes + stats), Special (all-purpose stat boosts — rarer = more stats).

> Outrim mapping (agreed direction): five equippable slots on the player —
> **Operator** (≈ avatar), **Attacker Ships** (≈ weapons), **Shield** (≈ armor),
> **Mining Ships** (engineering/production side), **Special System** (≈ special)
> — using the same five-tier rarity and per-rarity bonus scaling.

## 8. Salvaging

Salvaging destroys an owned item and produces $FLUX. Salvage yield scales with
item rarity. This is the *only* production path for $FLUX, which couples the
item economy to exploration access: bad pulls are never worthless.

## 9. Marketplace & Web3

- All assets (tokens, items, consumables) trade on Hive Engine / Tribaldex.
- Citizenship and Common crates are priced in HIVE (USD-denominated).
- Social layer: Discord activity and Hive blog posts pay passive $SCRAP.
- Notable devlog themes (2026): bot-farm crackdowns, marketplace fee → buyback,
  verifiable RNG, API versioning for builders, treasury-funded leaderboard
  rewards, quests leaving beta (mission board).

## 10. What we adopt for Outrim (working notes)

**Adopt:**
- Exposed-vs-secured currency split with claim (Secure Haul) as the core risk loop.
- Exponential upgrade cost curves; broad early investment encouraged.
- Luck-gated loot rolls with per-destination rarity tables (boss worlds).
- Salvage loop: unwanted modules → Sparks (our $FLUX analog).
- Rarity tiers with "higher rarity = bigger ranges + more bonus slots".
- Daily/energy-gated actions to pace PvP and boss content.
- Target lists filtered by "can I actually beat them".

**Adapt:**
- Damage/Defense quadratic scaling → fits our deterministic combat if we want
  margin-of-victory loot percentages.
- Staking → possibly "secured Alloy commitments" that grant defense bonuses.
- Favor → spend Alloy to unlock boss worlds instead of gathering on them.

**Reject (for now):**
- Real-money/true-asset NFT trading (Outrim keeps internal game resources; no
  ticker, no cash value, no player marketplace in alpha).
- Token staking economics; Hive account requirement.

Open questions to decide when we design the equipment system: whether Mining
Ships boost extraction rate vs. carry capacity, and whether Potions have an
Outrim analog (temporary boosts from the Special slot).
