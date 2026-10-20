# Outrim expeditions

## Implemented alpha loop
Claim the one-time starter Mothership, launch a daily mission, wait or spend Sublight Overchargers, then collect resources, shards and Operator XP. Shards forge into crates; crates open into equipment; spare equipment dismantles into Nanites for equipment upgrades and expedition fuel.

- All missions require an equipped Mothership.
- One active expedition per operator; each board mission can run once per UTC day. A previous day's flight remains claimable after refresh.
- Six shared, deterministic daily missions, refreshed at midnight UTC. T1 Combat remains available for the starter ship; four higher-tier missions rotate among Salvage, Stealth, Defense and Fortune, plus T1 Salvage.
- Base/equipped stats only; neither troop totals nor temporary consumable effects enter checks or reward rolls. Stats and designated equipment are snapshotted at launch.
- Nanite costs T1–T5: 0 / 15 / 40 / 100 / 250. No RIM or Plasma launch payment. RIM Tribute and troop recruitment formulas are unchanged. Plasma military spending awaits PvP.
- Levels: 1 / 10 / 25 / 50 / 100. Durations: 1 / 4 / 12 / 24 / 48 hours. Base draws: 2 / 3 / 4 / 6 / 10. XP: 150 / 450 / 1200 / 2500 / 6000.
- Attack/Defense/Extraction thresholds: 10 / 50 / 100 / 200 / 500. Luck/Evasion thresholds: 2 / 5 / 12 / 20 / 40, from gear only.
- Attack/Defense base stats are facility level ×10. Extraction uses Tribute level plus Mining Rig/equipped extraction. This is an eligibility score, not a change to RIM production.
- Required designated item from T3 onward: Uncommon / Rare / Epic minimum. Salvage uses Mining Rig; Stealth ECM; Defense and Fortune Mothership; Combat Attack Wing.
- Guaranteed Titanium/Plasma/Rations: T1 50/10/30; T2 120/25/70; T3 280/60/160; T4 600/130/350; T5 1400/300/800.
- Common and all higher shards/crates are stackable items. Exactly 100 matching shards forge one crate. Only Common crates are sold (5 RIM); higher crates roll equipment at their rarity or above using conditioned reference weights.
- Rare+ designated item: +1 draw. Every level above 1 adds 5% chance of another draw, capped at 100%. Existing equipment max level remains 10; the formula supports future higher levels without changing the current cap.
- Overcharger costs 2 RIM, halves remaining time, or completes a trip with 15 minutes or less remaining. It cannot alter stat checks or reward rolls.
- Recon Drone costs 2 RIM and can drop, but player troop reconnaissance remains unavailable until player targets and PvP exist. No invented opponent roster is presented as live data.

## Source versus adaptation
Source: user-supplied `Daily_Quest_System_pasted.txt` and screenshots; compare `docs/TERRACORE_GAME_CONTEXT.md` for broader background. No pricing oracle is implemented.

The supplied source does not disclose the exact score coefficient, shard quantities, XP, T4 odds, per-type tables or minimum item rarities. These are Outrim alpha balancing choices, not claims of exact TerraCore internals. The prior approved proposal supplied XP and Nanite costs. T1 zero fuel and a +2 Luck starter Mothership resolve the beginner lockout.

Screenshot rarity weights (Common→Legendary): T1 47/49/4/0/0; T2 41/44/12/2/1; T3 36/38/15/7/5; T4 30/32/18/10/10 (estimated); T5 26/28/19/12/16. T3/T5 sum to 101 from rounded displays, so sampling and UI normalize weights to 100%. The text's 15.7% T5 Legendary differs from the rounded screenshot; the implementation uses the approved screenshot weights, not a falsely exact reproduction.

Alpha draw formula: stat surplus adds up to 75% to the seeded score; secondary adds up to 10 points. Clamp score to 0–100, map to 0.5–3× base draws, round, then apply independent item bonuses. Per-draw shard baseline falls 10/8/6/4/2 with tier; independent uniform variance is 0.20–1.80×, rounded with minimum one shard. Tactical supply probability is 5% + secondary×0.2%, capped at 25%, split evenly between Recon Drone and Overcharger.

## Boss expeditions
Five daily boss destinations share mission tier requirements, travel times, Nanite costs and the one-active-flight limit. Each boss can be attempted once per UTC day. Combat uses launch-snapshotted base/equipment Attack, Defense, Crit and Evasion, never troops or consumable boosts. On arrival, a seeded simulation resolves at most 20 rounds and exposes a hull/damage battle report. Victory receives the tier's luck-influenced shard draws; retreat still grants guaranteed strategic resources and XP, but no shard draws. No direct higher-rarity chest drops bypass 100-shard crafting.

Boss identities, hull values, damage mitigation and capped crit/evasion probabilities are Outrim alpha balancing choices, not exact TerraCore formulas. The first boss is accessible with the starter Mothership and base combat stats.

## Current boundaries
Everything uses the existing session-only game stores. Reloading loses missions, equipment and balances; this is not persistent or authoritative settlement. Multiplayer reconnaissance, military fuel spending and saved progress are separate future work. Seeded rolls prevent ordinary UI rerolls, not client tampering. Authoritative server validation is required before a live economy.