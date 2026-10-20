# Chain and authentication rules

- Each chain module splits into wallet/ (browser-only: extension/WalletConnect signing, player transfers) and server/ (verification, treasury payouts, RPC reads), each with events/{event}/action.ts and an index.ts barrel; shared client.ts/types.ts stay at the chain root. providers/{chain}/sign.ts imports from wallet/, verify.ts from server/ (why: secrets and server crypto never mix with browser wallet code).
- Auth lives in src/lib/chains/providers/{email}; wallet login = HMAC-signed challenge → wallet signature via module signer → server verify via module verifier (why: stateless, no private keys ever requested).
- Hive login uses hivexph-sdk (Keychain client for signing, shared rpc client for account keys) plus @noble/secp256k1 for key recovery; @hiveio/dhive is a devDependency used only to generate reference signatures in tests (why: one SDK for all Hive traffic).
- Solana login: Phantom/Solflare/Backpack via injected providers, MetaMask via @metamask/connect-solana (standard:connect + solana:signMessage); all yield ed25519 detached sigs so one verifier covers all (why: no per-wallet server code).
- Enabled chain set via config.auth.chain (single value) — at most one chain provider.
- Chain-specific settings (endpoints, application id, signing env var NAMES) live in src/lib/chains/modules/config.ts; src/lib/config/config.ts is app config only. The SDK's own defaults (RPC/beacon URLs) and token symbols/precisions are NOT duplicated there — pass tokens directly in each action file and only add config entries to override the SDK.
- Hive operations use hivexph-sdk via one shared client in src/lib/chains/modules/hive/client.ts (why: single RPC engine, lazy server-side key resolution).
- Chain events return HiveActionResult instead of throwing (why: the worker must record ERROR outcomes, never lose failures).
- Chain event actions accept an optional `client` for injection (why: testable without real blockchain infrastructure).
