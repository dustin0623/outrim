# Roadmap

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

## Space world update
- [x] Generated starfield, isometric station and gathering-planet artwork
- [x] Phaser 3 world with large borderless isometric hex sectors, camera and selection bridge
- [x] Space-sector inspector and station/planet presentation
- [x] Verify sign-in, map selection, camera controls and narrow-screen layout

## Station management
- [x] Six station modules with instant pay-to-upgrade (no construction queue), Command Rig gates levels
- [ ] Save station levels and Alloy between sessions (needs saved player data)
