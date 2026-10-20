# Roadmap

## Approved expeditions
- [x] Tiered daily mission rules, Nanite fuel, base/equipment checks and rewards
- [x] Five chest rarities, item shards, 100-shard crafting and tactical supplies
- [x] Expedition dispatch, countdown, speed-up, claim and HUD integration
- [x] Rule tests and signed-in end-to-end verification
- [ ] Live boss combat, player reconnaissance and Plasma raids (blocked: live player targets and combat settlement not yet implemented)

## Station costs and troops (done: 3 ground + 3 ships, instant, resources only)
- [x] Production facility resource-specific costs and tests
- [x] Separate owner-scoped ship counts, resource-only orders and stat rules
- [x] Orbital Shipyard and Fleet Command integration
- [ ] Verify purchases and fleet bonuses on desktop and mobile

## Operator rankings
- [x] Reference-weighted ranking rules and tests
- [x] Rankings dialog, HUD access, current operator and pagination
- [x] Verify signed-in rankings and narrow-screen layout

## Inventory and marketplace
- [x] Separate stackable item quantities from equipment; rewire station and fleet payments
- [x] Inventory with crates and equipment management
- [x] Marketplace with RIM listing, cancellation and purchase (session-only simulation)
- [x] Rule tests and signed-in browser verification

## Solana chain module
- [x] login event (Phantom, Solflare, Backpack, MetaMask)
- [x] get-token-balance (SOL + SPL)
- [x] get-transaction
- [x] transfer-token (wallet + server treasury signer)
- [x] validate-payment
- [x] Provider-agnostic mainnet RPC (Helius key or any RPC URL)

## Transaction worker
- [x] Pending/processed transaction modules + poller, tests discoverable, docs updated
- [x] Unified processor + dev in-app worker + transaction status lookup

## Later
- [ ] Persist players in MongoDB (currently in-memory mock)
- [ ] XRPL module events
- [ ] Game scenes behind login
- [ ] Add the Solana treasury key + RPC key as secrets before server-signed payouts

## XRPL login
- [x] Xaman (QR + deep link), Joey (WalletConnect), GemWallet
- [ ] Add XAMAN_API_KEY / XAMAN_API_SECRET secrets and VITE_REOWN_PROJECT_ID (blocked: needs your developer accounts)

## TerraCore-inspired systems
- [x] Study TerraCore mechanics → docs/TERRACORE_GAME_CONTEXT.md
- [x] 6-slot fleet equipment (mothership, commander, attack wing, shield, mining rig, ECM): crates, equip, upgrade, dismantle
- [ ] Save fleet equipment between sessions (needs saved player data)
- [ ] Boss encounters on map worlds (HP, attack, salvage drops, combat log)
- [ ] Ship roster required to travel to boss worlds

## Space world update
- [x] Generated starfield, isometric station and gathering-planet artwork
- [x] Phaser 3 world with large borderless isometric hex sectors, camera and selection bridge
- [x] Space-sector inspector and station/planet presentation
- [x] Verify sign-in, map selection, camera controls and narrow-screen layout

## Station management
- [x] Six station modules with instant pay-to-upgrade (no construction queue), Command Rig gates levels
- [ ] Save station levels and Alloy between sessions (needs saved player data)

## Resource & extraction engine
- [x] Extractor produces Exposed Alloy over time (60 × level / hr), capped by Storehouse (1,000 × level)
- [x] Secure Haul moves exposed Alloy into the spendable secured vault; HUD + sector panel show both balances
