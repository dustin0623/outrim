import { EQUIPMENT_STATS_EFFECTIVE_AT } from "@/lib/config/constants/game";
import { miningPerSecond } from "@/features/types/game/mining";
import { withGameExecution } from "@/lib/utils/game/execution-context.server";
import { equipItem as equipGameplayItem } from "@/features/events/backend/equipment/equip";
import { unequipItem as unequipGameplayItem } from "@/features/events/backend/equipment/unequip";
import { upgradeEquipment as upgradeGameplayItem } from "@/features/events/backend/equipment/upgrade";
import { settleTick } from "@/features/events/backend/tick-player/action";
import { helpTarget } from "@/features/events/backend/social-actions/help";
vi.mock("@/lib/auth/session", () => ({
  requireSession: async (request: Request) => ({
    wallet: request.headers.get("x-test-wallet") ?? "alice",
    username: request.headers.get("x-test-wallet") ?? "alice",
  }),
}));
import { HIVE_WORKER_LEASE_ID } from "@/lib/modules/game-stats/server.types";
import {
  issueLoginNonce,
  consumeLoginNonce,
  upsertPlayer,
  creditHash,
  applyStatSabotage,
  replaceStatEffect,
  clearStatEffects,
  reserveRaidCharge,
  claimRaidDefender,
  creditRaidProceeds,
  debitRaidRisk,
  readRegisteredMiningBatches,
  readLeaderboardPlayerBatches,
} from "@/lib/modules/players/server.repository";
import {
  readPlayerProfile,
  readTransactions,
} from "@/tests/fixtures/api-reads";
import { completePaymentJob } from "@/server/game-smart-contract/features/events/payment-processing/support";
import type { IInboundTransaction } from "@/lib/modules/transactions-pending/server.types";
import {
  contractStreamRepository,
  gameStatsRepository,
} from "@/lib/modules/game-stats/server.repository";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import mongoose from "mongoose";
import { hiveClient } from "@/lib/chains/modules/hive/client";
import type { StatEffect } from "@/features/types/game/stat-effects";
import { CHARGE_REGEN_MS, MAX_RAID_CHARGES } from "@/lib/config/constants/game";
const statEffect = (
  stat: StatEffect["stat"],
  appliedBy = "saboteur",
): StatEffect => ({
  stat,
  itemId: "sabotage-device",
  appliedBy,
  appliedAt: 1000,
  active: true,
  strength: 0.4,
  critical: false,
  helps: [],
});
const database = await vi.hoisted(async () => {
  const { config: loadEnvironment } = await import("dotenv");
  const { randomUUID } = await import("node:crypto");
  const environment: Record<string, string> = {};
  loadEnvironment({
    path: [".env.local", ".env"],
    processEnv: environment,
    quiet: true,
  });
  return {
    uri: process.env.MONGODB_URI ?? environment.MONGODB_URI,
    name: "chainframe_test_" + randomUUID().replaceAll("-", ""),
  };
});
vi.mock("@/lib/config/config", async (original) => {
  const actual = await original<typeof import("@/lib/config/config")>();
  return {
    config: {
      ...actual.config,
      mongoUri: database.uri ?? "",
      mongoDb: database.name,
      blockchain: { ...actual.config.blockchain, treasuryAccount: "treasury" },
    },
  };
});
import {
  initializeContractDatabase,
  disconnectContractDatabase,
} from "@/server/game-smart-contract/utils/database.server";
import {
  withDatabaseOperation,
  DatabaseOperationUncertainError,
} from "@/lib/utils/database/operation.server";

import { PlayerModel } from "@/lib/modules/players/server.model";
import { InventoryItemModel } from "@/lib/modules/items/server.model";
import { EquipmentModel } from "@/lib/modules/equipments/server.model";
import {
  grantInventoryItems,
  consumeInventoryItem,
  getInventoryQuantity,
} from "@/lib/modules/items/server.repository";
import { GameStatModel } from "@/lib/modules/game-stats/server.model";
import { LogModel } from "@/lib/modules/logs/server.model";
import {
  readAnalyticsLogBatches,
  logRepository,
} from "@/lib/modules/logs/server.repository";
import { decodeCursor } from "@/lib/utils/logs/history";
import { readAnalyticsReceipts } from "@/lib/modules/transactions-processed/server.repository";
import {
  analyticsReceiptKey,
  createGameStatsAccumulator,
  toGameStatsDaily,
} from "@/lib/api/dto/game-stats";
import { currentMiningPerSecond } from "@/features/types/game/mining";
import {
  createLeaderboardAccumulator,
  toLeaderboardDto,
} from "@/lib/api/dto/leaderboard";
import { InboundTransactionModel } from "@/lib/modules/transactions-pending/server.model";
import { ProcessedTransactionModel } from "@/lib/modules/transactions-processed/server.model";

import { registerPlayer } from "@/features/events/backend/player-lifecycle/register";
import { upgradeStat } from "@/features/events/backend/upgrade-stat/action";
import { createGameActionProcessor } from "@/server/game-smart-contract/features/events/process-game-action/action";
import { gameActionPersistence } from "@/server/game-smart-contract/features/events/process-game-action/persistence";
import {
  buildUpgradeStatAction,
  buildClaimAction,
  buildGameAction,
} from "@/lib/utils/game/action-protocol";
import { hiveGameActionEvent } from "@/tests/fixtures/hive-game-action";
import { dispatchTreasuryOnce } from "@/server/game-smart-contract/features/events/treasury/dispatch-once.server";
import { SettlementUncertainError } from "@/server/game-smart-contract/features/events/treasury/errors.server";
vi.mock(
  "@/server/game-smart-contract/features/events/treasury/verify.server",
  () => ({
    verifyTreasuryTransfer: vi.fn(async () => ({
      status: "confirmed",
      evidence: { state: "confirmed", blockNumber: 100, operationIndex: 0 },
    })),
  }),
);
import { createGameActionRegistry } from "@/server/game-smart-contract/features/events/process-game-action/dispatch";
import { processJob } from "@/server/game-smart-contract/features/events/payment-processing/dispatch";
vi.mock(
  "@/lib/chains/modules/hive/server/events/verify-native-payment/action",
  () => ({ verifyNativePayment: vi.fn() }),
);
import { verifyNativePayment } from "@/lib/chains/modules/hive/server/events/verify-native-payment/action";
import { runGameActionStreamWorker } from "@/server/game-smart-contract/workers/game-action-stream-worker";
import { type GameActionStreamPosition } from "@/server/game-smart-contract/features/types/stream";

import {
  listRecoverableGameActions,
  beginQueuedDatabaseEffects,
  resumeReconciledPayment,
} from "@/lib/modules/transactions-pending/server.repository";
vi.mock(
  "@/lib/chains/modules/hive/server/events/verify-token-payment/action",
  () => ({
    verifyTokenPayment: vi.fn(async () => ({
      success: true,
      status: "confirmed",
      operationIndex: 0,
      from: "alice",
      to: "treasury",
      amount: "5",
      trigger: { action: "deposit", metadata: {} },
    })),
  }),
);
// Reuse the application URI, but override its database name for every test run.
function isolatedDatabase() {
  const db = mongoose.connection.db;
  if (
    db?.databaseName !== database.name ||
    !/^chainframe_test_[a-f0-9]{32}$/.test(database.name)
  )
    throw new Error("Refusing cleanup outside the isolated test database");
  return db;
}

describe.skipIf(!database.uri)(
  "MongoDB direct writes and queue recovery",
  () => {
    beforeAll(async () => {
      await initializeContractDatabase();
      expect(mongoose.connection.db?.databaseName).toBe(database.name);
    }, 60000);
    beforeEach(async () => {
      vi.spyOn(hiveClient, "resolveAccount").mockReturnValue({ account: "treasury" } as never);
      isolatedDatabase();
      for (const model of Object.values(mongoose.models))
        await model.deleteMany({});
    });

    it("settles mining before direct equipment changes and resolves actual gear on authenticated reads", async () => {
      const start = EQUIPMENT_STATS_EFFECTIVE_AT + 1000;
      await upsertPlayer({ wallet: "gear-miner", username: "gear-miner" });
      await PlayerModel.updateOne({ wallet: "gear-miner" }, { $set: {
        vault: 0, vaultStaked: 1000, sparks: 10000, lastTickAt: start, lastSinkAt: start,
      } });
      const item = await EquipmentModel.create({
        templateId: 1000, owner: "gear-miner", name: "Test Miner", slot: "asicMiner",
        rarity: "common", stats: { hashRate: 10, hackPower: 5, luck: 2, exploit: 3 },
      });
      const runAt = <T,>(at: number, execute: () => Promise<T>) =>
        withGameExecution(at, "isolated-equipment-seed", () => withDatabaseOperation(execute));
      await runAt(start + 1000, () => equipGameplayItem("gear-miner", String(item._id)));
      let record = await PlayerModel.findOne({ wallet: "gear-miner" }).lean();
      expect(record!.vault).toBeCloseTo(miningPerSecond(1), 6);
      const profile = await readPlayerProfile("gear-miner", null);
      expect(profile.stats).toMatchObject({ hashRate: 11, hackPower: 15, luck: 7.078, exploit: 4 });
      await runAt(start + 2000, () => settleTick("gear-miner"));
      record = await PlayerModel.findOne({ wallet: "gear-miner" }).lean();
      expect(record!.stats.hashRate).toBe(11);
      expect(record!.vault).toBeCloseTo(miningPerSecond(1) + miningPerSecond(11), 6);
      await runAt(start + 3000, () => upgradeGameplayItem("gear-miner", String(item._id)));
      await runAt(start + 4000, () => unequipGameplayItem("gear-miner", String(item._id)));
      record = await PlayerModel.findOne({ wallet: "gear-miner" }).lean();
      expect(record!.vault).toBeCloseTo(miningPerSecond(1) + 2 * miningPerSecond(11) + miningPerSecond(11.5), 5);
      expect((await readPlayerProfile("gear-miner", null)).stats.hashRate).toBe(1);
    });

    it("records a failed social roll once without changing effects or leaking execution evidence", async () => {
      await upsertPlayer({ wallet: "helper", username: "helper" });
      await upsertPlayer({ wallet: "target", username: "target" });
      await grantInventoryItems("helper", "help-kit", 2);
      await applyStatSabotage("target", statEffect("security"));
      const before = await PlayerModel.findOne({ wallet: "target" }).lean();
      const result = await withDatabaseOperation(() => helpTarget("helper", "target", "help-kit", "security", () => 0.99));
      expect(result).toMatchObject({ ok: true, success: false, itemConsumed: true });
      expect(await getInventoryQuantity("helper", "help-kit")).toBe(1);
      expect((await PlayerModel.findOne({ wallet: "target" }).lean())!.statEffects).toEqual(before!.statEffects);
      const rows = await logRepository.listHistory("helper", { limit: 100 });
      expect(rows.logs.at(0)?.data).toMatchObject({ success: false, itemConsumed: true });
    });

    it("filters full personal history before paging, preserving participants, tie cursors and private-field exclusion", async () => {
      await LogModel.insertMany([
        ...Array.from({ length: 60 }, (_, index) => ({
          type: "salvage",
          wallet: "alice",
          participants: ["alice"],
          recordedAt: 3000 + index,
        })),
        ...Array.from({ length: 4 }, () => ({
          type: "claim",
          wallet: "alice",
          participants: ["alice"],
          recordedAt: 1000,
          amount: 0.1632,
          seed: "hidden",
          data: { serverSeed: "hidden" },
        })),
        {
          type: "claim",
          wallet: "other",
          participants: ["other"],
          recordedAt: 4000,
        },
        {
          type: "raid",
          wallet: "alice",
          target: "bob",
          participants: ["alice", "bob"],
          recordedAt: 2000,
        },
        {
          type: "raid",
          wallet: "bob",
          target: "alice",
          participants: ["bob", "alice"],
          recordedAt: 2000,
        },
        {
          type: "raid",
          wallet: "bob",
          target: "other",
          participants: ["bob", "other"],
          recordedAt: 2000,
        },
      ]);
      const first = await logRepository.listHistory("alice", {
        limit: 2,
        category: "claims",
      });
      const second = await logRepository.listHistory("alice", {
        limit: 2,
        category: "claims",
        cursor: decodeCursor(first.nextCursor!),
      });
      expect(first.logs).toHaveLength(2);
      expect(second.logs).toHaveLength(2);
      expect(
        new Set([...first.logs, ...second.logs].map((log) => log.id)).size,
      ).toBe(4);
      expect(second.nextCursor).toBeNull();
      expect(JSON.stringify([first, second])).not.toContain("hidden");
      expect(
        (await logRepository.listHistory("alice", { limit: 50 })).logs.every(
          (log) => log.type === "salvage",
        ),
      ).toBe(true);
      const raids = await logRepository.listHistory("alice", {
        limit: 50,
        category: "raids",
      });
      expect(raids.logs.map((log) => log.wallet).sort()).toEqual([
        "alice",
        "bob",
      ]);
    });
    it("selects actual category records and keeps paid withdrawals separate from queued requests and compensation", async () => {
      const inputs = [
        { type: "vault", data: { event: "stake" } },
        { type: "vault", data: { event: "mining" } },
        { type: "registration" },
        { type: "chest", data: { paidWith: "hash" } },
        { type: "chest", data: { paidWith: "hive", hiveAmount: 10 } },
        { type: "stat_upgrade" },
        { type: "upgrade" },
        { type: "salvage" },
        { type: "help" },
        { type: "sabotage" },
        { type: "deposit" },
        { type: "withdrawal", amount: -5 },
        { type: "withdrawal", amount: 5, data: { refunded: true } },
        { type: "game_action", data: { action: "request_withdrawal" } },
      ];
      await LogModel.insertMany(
        inputs.map((input) => ({
          ...input,
          wallet: "alice",
          participants: ["alice"],
          recordedAt: 1000,
        })),
      );
      for (const [category, types] of [
        ["staking-registration", ["vault", "registration"]],
        ["equipment-minted", ["chest", "chest"]],
        ["stat-upgrades", ["stat_upgrade"]],
        ["equipment-upgrades", ["upgrade"]],
        ["salvage", ["salvage"]],
        ["social", ["help", "sabotage"]],
        ["deposits-withdrawals", ["deposit", "withdrawal"]],
      ] as const) {
        const page = await logRepository.listHistory("alice", {
          limit: 50,
          category,
        });
        expect(page.logs.map((log) => log.type).sort()).toEqual(
          [...types].sort(),
        );
      }
      const all = await logRepository.listHistory("alice", {
        limit: 50,
        category: "all",
      });
      expect(all.logs).toHaveLength(inputs.length);
      expect(all.logs.find((log) => log.amount === 5)?.data?.refunded).toBe(
        true,
      );
    });
    it("returns the newest 100 personal market actions separately from 100 global HIVE sales", async () => {
      await LogModel.insertMany([
        ...Array.from({ length: 110 }, (_, index) => ({
          type: "market",
          wallet: "buyer",
          target: "alice",
          participants: ["buyer", "alice"],
          createdAt: new Date(1000 + index),
          data: {
            action: "bought",
            currency: "HIVE",
            price: 0.1,
            name: "Miner",
          },
        })),
        {
          type: "market_item",
          wallet: "alice",
          participants: ["alice"],
          createdAt: new Date(9000),
          data: { action: "listed", currency: "HIVE" },
        },
        {
          type: "market_item",
          wallet: "alice",
          participants: ["alice"],
          createdAt: new Date(9001),
          data: { action: "cancelled", currency: "HIVE" },
        },
        {
          type: "market",
          wallet: "alice",
          participants: ["alice"],
          createdAt: new Date(9002),
          data: { action: "refunded", currency: "HIVE" },
        },
        {
          type: "market",
          wallet: "charlie",
          target: "other",
          participants: ["charlie", "other"],
          createdAt: new Date(9003),
          data: { action: "bought", currency: "HIVE" },
        },
        {
          type: "market",
          wallet: "alice",
          target: "other",
          participants: ["alice", "other"],
          createdAt: new Date(9004),
          data: { action: "bought", currency: "HASH" },
        },
      ]);
      const personal = await logRepository.listMarketHistory("alice", 100);
      expect(personal).toHaveLength(100);
      expect(personal.slice(0, 3).map((log) => log.data?.action)).toEqual([
        "refunded",
        "cancelled",
        "listed",
      ]);
      expect(personal.every((log) => log.data?.currency === "HIVE")).toBe(true);
      const sales = await logRepository.listMarketSales(100);
      expect(sales).toHaveLength(100);
      expect(sales[0].wallet).toBe("charlie");
      expect(
        sales.every(
          (log) =>
            log.data?.action === "bought" && log.data.currency === "HIVE",
        ),
      ).toBe(true);
      expect(new Set(sales.map((log) => log.id)).size).toBe(100);
    });
    it("reads all registered ranking inputs in bounded pages without writes or private fields", async () => {
      const now = Date.now();
      await PlayerModel.insertMany(
        Array.from({ length: 251 }, (_, index) => ({
          wallet: `rank-${index.toString().padStart(3, "0")}`,
          username: `rank-${index}`,
          isRegistered: true,
          notoriety: 251 - index,
          xp: index * 1000,
          lastSinkAt: now,
          statLevels: { hashRate: 1 },
          hash: 20,
          vault: 1,
          loginNonce: "private",
        })),
      );
      await issueLoginNonce("shell", "secret", now + 60000);
      await PlayerModel.updateOne(
        { wallet: "shell" },
        {
          $set: {
            xp: 999999999,
            notoriety: 999999999,
            "statLevels.hashRate": 999999,
          },
        },
      );
      const before = await PlayerModel.findOne({ wallet: "rank-000" }).lean();
      const sizes: number[] = [];
      const accumulator = createLeaderboardAccumulator(now);
      for await (const batch of readLeaderboardPlayerBatches()) {
        sizes.push(batch.length);
        for (const row of batch) {
          expect(row).not.toHaveProperty("loginNonce");
          expect(row).not.toHaveProperty("hash");
          expect(row).not.toHaveProperty("vault");
          accumulator.accept(row);
        }
      }
      expect(sizes).toEqual([250, 1]);
      const result = toLeaderboardDto(accumulator.finish(), 4, "rank-000");
      expect(result).toMatchObject({
        registeredPlayers: 251,
        displayedPlayers: 100,
        self: {
          rank: 251,
          miningLevel: 1,
          notoriety: 251,
          xp: 0,
          score: 60,
          points: { notoriety: 30, mining: 30, progression: 0 },
        },
      });
      expect(result.entries).toHaveLength(25);
      expect(await PlayerModel.findOne({ wallet: "rank-000" }).lean()).toEqual(
        before,
      );
      expect(await LogModel.countDocuments()).toBe(0);
      expect(await GameStatModel.countDocuments()).toBe(0);
    });
    it("reads every analytics page without exposing player data or changing balances", async () => {
      await PlayerModel.insertMany(
        Array.from({ length: 251 }, (_, i) => ({
          wallet: `miner${i}`,
          username: `miner${i}`,
          isRegistered: true,
          hash: 5,
          vault: 1,
          statLevels: { hashRate: 1 },
          loginNonce: "private",
        })),
      );
      await PlayerModel.create({
        wallet: "shell",
        username: "shell",
        isRegistered: false,
      });
      const now = Date.now();
      let count = 0,
        rate = 0;
      const sizes: number[] = [];
      for await (const batch of readRegisteredMiningBatches()) {
        sizes.push(batch.length);
        for (const player of batch) {
          count++;
          rate += currentMiningPerSecond(player, now);
          expect(player.wallet).toMatch(/^miner/);
          expect(player).not.toHaveProperty("loginNonce");
        }
      }
      expect(sizes).toEqual([250, 1]);
      expect(count).toBe(251);
      expect(rate * 86400).toBeCloseTo(502, 8);
      expect(
        await PlayerModel.findOne({ wallet: "miner0" }).lean(),
      ).toMatchObject({ hash: 5, vault: 1 });
    });
    it("aggregates exact successful receipts across log pages and original UTC days", async () => {
      const now = Date.now(),
        before = new Date(now - 86400000);
      await LogModel.insertMany(
        Array.from({ length: 251 }, (_, i) => ({
          type: "claim",
          wallet: "alice",
          correlationKey: `analytics-${i}:0`,
          amount: 0.25,
          createdAt: before,
          updatedAt: before,
          recordedAt: now - 1,
          seed: "private",
          data: { serverSeed: "private" },
        })),
        { timestamps: false },
      );
      await ProcessedTransactionModel.insertMany(
        Array.from({ length: 251 }, (_, i) => ({
          txHash: `analytics-${i}:0`,
          wallet: "alice",
          type: "game_action",
          amount: 0,
          status: "success",
          processedAt: now - 1,
          metadata: {
            type: "game_action",
            event: {
              eventKey: `analytics-${i}:0`,
              status: "processed",
              operationIndex: 0,
              event: { action: "claim" },
            },
          },
        })),
      );
      const extra = [
        "unresolved",
        "failed",
        "late-receipt",
        "late-log",
        "wrong-actor",
        "wrong-action",
      ];
      await LogModel.insertMany(
        extra.map((key) => ({
          type: "claim",
          wallet: "alice",
          correlationKey: `${key}:0`,
          amount: 100,
          createdAt: before,
          updatedAt: before,
          recordedAt: key === "late-log" ? now + 1 : now - 1,
        })),
        { timestamps: false },
      );
      await ProcessedTransactionModel.insertMany(
        extra
          .filter((key) => key !== "unresolved")
          .map((key) => ({
            txHash: `${key}:0`,
            wallet: key === "wrong-actor" ? "bob" : "alice",
            type: "game_action",
            amount: 0,
            status: key === "failed" ? "failed" : "success",
            processedAt: key === "late-receipt" ? now + 1 : now - 1,
            metadata: {
              type: "game_action",
              event: {
                eventKey: `${key}:0`,
                status: "processed",
                operationIndex: 0,
                event: { action: key === "wrong-action" ? "raid" : "claim" },
              },
            },
          })),
      );
      const accumulator = createGameStatsAccumulator(now),
        sizes: number[] = [];
      for await (const batch of readAnalyticsLogBatches(now)) {
        sizes.push(batch.length);
        const keys = batch
          .map(analyticsReceiptKey)
          .filter((key): key is string => !!key);
        const evidence = new Map(
          (await readAnalyticsReceipts(keys, now)).map((row) => [row.key, row]),
        );
        for (const log of batch) {
          expect(log).not.toHaveProperty("seed");
          expect(log.data ?? {}).not.toHaveProperty("serverSeed");
          accumulator.accept(log, evidence.get(analyticsReceiptKey(log)!));
        }
      }
      expect(sizes).toEqual([250, 6]);
      const data = toGameStatsDaily(accumulator.finish(), "claimed", 7);
      expect(data.totals).toEqual([62.75, 251]);
      expect(
        data.points.find(
          (point) => point.day === before.toISOString().slice(0, 10),
        )?.values,
      ).toEqual([62.75, 251]);
      expect(JSON.stringify(data)).not.toMatch(/analytics-|private|alice|bob/);
    });
    afterAll(async () => {
      try {
        await isolatedDatabase().dropDatabase();
      } finally {
        await disconnectContractDatabase();
      }
    }, 30000);
    it("nested operations use direct writes and report partial failures without claiming rollback", async () => {
      await expect(
        withDatabaseOperation(async () => {
          await registerPlayer("alice", "registration");
          throw new Error("abort outer");
        }),
      ).rejects.toBeInstanceOf(DatabaseOperationUncertainError);
      expect(await PlayerModel.countDocuments()).toBe(1);
      expect(await gameStatsRepository.get("globalMinerate")).toBe(1);
      expect(
        (await PlayerModel.findOne({ wallet: "alice" }).lean())?.hash,
      ).toBe(10);
      expect((await registerPlayer("alice", "registration")).changed).toBe(false);
      expect(
        (await PlayerModel.findOne({ wallet: "alice" }).lean())?.hash,
      ).toBe(10);
    });
    it("atomically registers competing requests once and adds starting HASH to an existing balance", async () => {
      await upsertPlayer({ wallet: "alice", username: "alice" });
      expect(
        await PlayerModel.findOne({ wallet: "alice" }).lean(),
      ).toMatchObject({ isRegistered: false, hash: 0 });
      await creditHash("alice", 3.5);
      const outcomes = await Promise.all(
        Array.from({ length: 5 }, (_, index) =>
          registerPlayer("alice", `registration-${index}`),
        ),
      );
      expect(outcomes.filter((outcome) => outcome.changed)).toHaveLength(1);
      expect(
        await PlayerModel.findOne({ wallet: "alice" }).lean(),
      ).toMatchObject({
        isRegistered: true,
        hash: 13.5,
        xp: 0,
        sparks: 0,
        vault: 0,
        referralEarned: 0,
      });
      expect(await gameStatsRepository.get("globalMinerate")).toBe(1);
      expect((await registerPlayer("alice", "another-payment")).changed).toBe(false);
      expect(
        (await PlayerModel.findOne({ wallet: "alice" }).lean())?.hash,
      ).toBe(13.5);
      expect(
        await LogModel.countDocuments({
          type: { $in: ["claim", "deposit", "referral"] },
        }),
      ).toBe(0);
      // Previously registered records are not backfilled.
      await PlayerModel.create({
        wallet: "bob",
        username: "bob",
        isRegistered: true,
        hash: 7,
      });
      expect((await registerPlayer("bob", "new-payment")).changed).toBe(false);
      expect((await PlayerModel.findOne({ wallet: "bob" }).lean())?.hash).toBe(
        7,
      );
    });
    it.each([null, "equipment", "sabotage-device", "help-kit"])("awards event inventory once and parks unknown grants at %s", async (fault) => {
      const timestamp = "2026-10-19T00:00:00";
      vi.mocked(verifyNativePayment).mockResolvedValue({ success: true, status: "confirmed", symbol: "HIVE", transactionId: "event-registration", from: "alice", to: "treasury", amount: "75.000", operationIndex: 0, blockNumber: 100, blockTimestamp: timestamp, trigger: { action: "registration", metadata: {} } } as never);
      await upsertPlayer({ wallet: "alice", username: "alice" });
      await grantInventoryItems("alice", "help-kit", 3);
      const itemModule = await import("@/lib/modules/items/server.repository");
      const originalGrant = itemModule.grantInventoryItems;
      const grant = vi.spyOn(itemModule.inventoryItemRepository, "grant").mockImplementation(async (wallet, itemId, quantity) => {
        await originalGrant(wallet, itemId, quantity);
        if (itemId === fault) throw new Error("simulated unknown grant acknowledgement");
      });
      const job = await InboundTransactionModel.create({ type: "registration", signature: "event-registration", depositTxId: "event-registration", walletAddress: "alice", registrationHiveAmount: 75, referralPolicyVersion: 1, paymentOperationIndex: 0 });
      const context = { checkLease: async () => {}, maxRetries: 3 };
      await withGameExecution(Date.parse("2026-11-03T00:00:00Z"), "event-test", () => processJob(context, job));
      const calls = grant.mock.calls.length;
      const fresh = await InboundTransactionModel.findById(job._id).lean();
      const receipt = await ProcessedTransactionModel.findOne({ txHash: "event-registration" }).lean();
      expect((await PlayerModel.findOne({ wallet: "alice" }).lean())!.hash).toBe(10);
      if (fault) {
        expect(fresh).toMatchObject({ status: "reconciliation", databaseEffectsStarted: true, registrationStarterPack: { eventId: "chainframe-invite-challenge-2026-10" } });
        expect(receipt).toBeNull();
        await processJob(context, fresh as IInboundTransaction);
      } else {
        expect(fresh).toBeNull();
        expect(receipt).toMatchObject({ status: "success", metadata: { startingHash: 10, startingItems: [{ itemId: "equipment", quantity: 4 }, { itemId: "sabotage-device", quantity: 10 }, { itemId: "help-kit", quantity: 10 }], registrationStarterPack: { paymentTime: Date.parse(timestamp + "Z") } } });
        expect(await getInventoryQuantity("alice", "help-kit")).toBe(13);
        await processJob(context, job);
        const exposed = await readTransactions("alice", { limit: 100 });
        expect(JSON.stringify(exposed.history)).not.toContain("registrationStarterPack");
        expect(JSON.stringify(exposed.history)).toContain("startingItems");
      }
      expect(grant.mock.calls).toHaveLength(calls);
      expect(await getInventoryQuantity("alice", "equipment")).toBe(4);
      expect(await EquipmentModel.countDocuments()).toBe(0);
      expect(await LogModel.countDocuments({ type: "shop" })).toBe(0);
      expect(await gameStatsRepository.get("globalMinerate")).toBe(1);
      grant.mockRestore();
    });

    it.each(["ack", "log", "counter", "receipt", "receipt-after", "cleanup"])("preserves event grants across an interrupted %s", async (fault) => {
      await upsertPlayer({ wallet: "alice", username: "alice" });
      vi.mocked(verifyNativePayment).mockResolvedValue({ success: true, status: "confirmed", symbol: "HIVE", transactionId: "event-fault", from: "alice", to: "treasury", amount: "75.000", operationIndex: 0, blockNumber: 100, blockTimestamp: "2026-10-19T00:00:00", trigger: { action: "registration", metadata: {} } } as never);
      const pendingModule = await import("@/lib/modules/transactions-pending/server.repository");
      const processedModule = await import("@/lib/modules/transactions-processed/server.repository");
      const statsModule = await import("@/lib/modules/game-stats/server.repository");
      const failure = new Error("simulated event interruption");
      const originalReceipt = processedModule.claimProcessedTransaction;
      const spy = fault === "ack" ? vi.spyOn(pendingModule, "recordRegistrationStarterGrant").mockRejectedValueOnce(failure)
        : fault === "log" ? vi.spyOn(LogModel, "create").mockRejectedValueOnce(failure)
        : fault === "counter" ? vi.spyOn(statsModule, "incrementStat").mockRejectedValueOnce(failure)
        : fault === "cleanup" ? vi.spyOn(pendingModule, "completeJob").mockRejectedValueOnce(new DatabaseOperationUncertainError(failure))
        : fault === "receipt-after" ? vi.spyOn(processedModule, "claimProcessedTransaction").mockImplementationOnce(async (input) => { await originalReceipt(input); throw failure; })
        : vi.spyOn(processedModule, "claimProcessedTransaction").mockRejectedValueOnce(failure);
      const job = await InboundTransactionModel.create({ type: "registration", signature: "event-fault", depositTxId: "event-fault", walletAddress: "alice", registrationHiveAmount: 75, referralPolicyVersion: 1, paymentOperationIndex: 0 });
      const context = { checkLease: async () => {}, maxRetries: 3 };
      try { await processJob(context, job); } finally { spy.mockRestore(); }
      const before = await Promise.all(["equipment", "sabotage-device", "help-kit"].map((id) => getInventoryQuantity("alice", id as "equipment" | "sabotage-device" | "help-kit")));
      const pending = await InboundTransactionModel.findById(job._id).lean();
      expect(pending?.status).toBe(fault === "cleanup" ? "failed" : "reconciliation");
      const receipt = await ProcessedTransactionModel.findOne({ txHash: "event-fault" }).lean();
      expect(!!receipt).toBe(fault === "cleanup" || fault === "receipt-after");
      if (fault === "cleanup") {
        expect(pending?.registrationStarterPackArchived).toBe(true);
        expect(receipt?.status).toBe("success");
      } else {
        expect(pending?.databaseEffectsStarted).toBe(true);
        await expect(pendingModule.completeJob(String(job._id))).rejects.toThrow();
      }
      await processJob(context, pending as IInboundTransaction);
      expect(await Promise.all(["equipment", "sabotage-device", "help-kit"].map((id) => getInventoryQuantity("alice", id as "equipment" | "sabotage-device" | "help-kit")))).toEqual(before);
      expect((await PlayerModel.findOne({ wallet: "alice" }).lean())?.hash).toBe(10);
      expect(await LogModel.countDocuments({ type: "registration" })).toBeLessThanOrEqual(1);
    });

    it.each([false, true])(
      "keeps the registration award once when completion is interrupted: %s",
      async (interrupted) => {
        vi.mocked(verifyNativePayment).mockResolvedValue({
          success: true,
          status: "confirmed",
          from: "alice",
          to: "treasury",
          amount: "100.000",
          blockNumber: 100,
          blockTimestamp: "2026-10-18T12:00:00",
          operationIndex: 0,
          trigger: { action: "registration", metadata: {} },
        } as never);
        await upsertPlayer({ wallet: "alice", username: "alice" });
        await creditHash("alice", 3.5);
        const job = await InboundTransactionModel.create({
          type: "registration",
          signature: "registration-payment",
          depositTxId: "registration-payment",
          walletAddress: "alice",
        registrationHiveAmount: 100,
        referralPolicyVersion: 1,
          paymentOperationIndex: 0,
        });
        const failLog = interrupted
          ? vi
              .spyOn(LogModel, "create")
              .mockRejectedValueOnce(new Error("audit interrupted"))
          : null;
        const context = { checkLease: async () => {}, maxRetries: 3 };
        try {
          await processJob(context, job);
        } finally {
          failLog?.mockRestore();
        }
        expect(
          await PlayerModel.findOne({ wallet: "alice" }).lean(),
        ).toMatchObject({
          hash: 13.5,
          isRegistered: true,
          registrationTxId: "registration-payment",
          xp: 0,
        });
        if (interrupted) {
          const pending = (await InboundTransactionModel.findById(job._id))!;
          expect(pending).toMatchObject({
            status: "reconciliation",
            databaseEffectsStarted: true,
          });
          expect(await ProcessedTransactionModel.countDocuments()).toBe(0);
          await processJob(context, pending);
          expect(await ProcessedTransactionModel.countDocuments()).toBe(0);
        } else {
          expect(
            await LogModel.findOne({ type: "registration" }).lean(),
          ).toMatchObject({ amount: 100, data: { startingHash: 10 } });
          expect(
            await ProcessedTransactionModel.findOne({
              txHash: "registration-payment",
            }).lean(),
          ).toMatchObject({ amount: 100, metadata: { startingHash: 10 } });
          expect(await InboundTransactionModel.countDocuments()).toBe(0);
          await processJob(context, job);
          expect(await LogModel.countDocuments({ type: "registration" })).toBe(
            1,
          );
          const history = await readTransactions("alice", { limit: 10 });
          expect(history.history[0]).toMatchObject({
            amount: 100,
            metadata: { startingHash: 10 },
          });
        }
        expect(
          (await PlayerModel.findOne({ wallet: "alice" }).lean())?.hash,
        ).toBe(13.5);
      },
    );
    it("lets one consumer spend the last consumable without changing other inventory", async () => {
      await grantInventoryItems("alice", "help-kit", 1);
      await grantInventoryItems("alice", "sabotage-device", 2);
      const results = await Promise.all([
        consumeInventoryItem("alice", "help-kit"),
        consumeInventoryItem("alice", "help-kit"),
      ]);
      expect(results.filter((result) => result.ok)).toHaveLength(1);
      expect(await getInventoryQuantity("alice", "help-kit")).toBe(0);
      expect(await getInventoryQuantity("alice", "sabotage-device")).toBe(2);
      expect(await consumeInventoryItem("missing", "help-kit")).toEqual({
        ok: false,
      });
      await expect(
        consumeInventoryItem("alice", "unknown" as never),
      ).rejects.toThrow();
    });
    it("merges competing first grants into one stack and keeps quantities safe", async () => {
      await Promise.all(
        Array.from({ length: 10 }, () =>
          grantInventoryItems("alice", "equipment", 2),
        ),
      );
      expect(
        await InventoryItemModel.countDocuments({
          wallet: "alice",
          itemId: "equipment",
        }),
      ).toBe(1);
      expect(await getInventoryQuantity("alice", "equipment")).toBe(20);
      await grantInventoryItems("bob", "equipment", Number.MAX_SAFE_INTEGER);
      await expect(grantInventoryItems("bob", "equipment", 1)).rejects.toThrow(
        "safe range",
      );
      expect(await getInventoryQuantity("bob", "equipment")).toBe(
        Number.MAX_SAFE_INTEGER,
      );
      await expect(
        grantInventoryItems("alice", "equipment", 0.5),
      ).rejects.toThrow();
      const consumed = await Promise.all(
        Array.from({ length: 25 }, () =>
          consumeInventoryItem("alice", "equipment"),
        ),
      );
      expect(consumed.filter((row) => row.ok)).toHaveLength(20);
      expect(await getInventoryQuantity("alice", "equipment")).toBe(0);
    });
    it("purchases stock then opens once with no second charge and rejects replay", async () => {
      await registerPlayer("alice", "registration");
      await creditHash("alice", 1000);
      const processor = createGameActionProcessor(createGameActionRegistry());
      const purchase = hiveGameActionEvent(
        buildGameAction("purchase_chest", {
          itemId: "equipment",
          quantity: 2,
          expectedUnitPrice: 100,
          nonce: "purchase-stock-001",
        }),
        { transactionId: "tx-stock", eventId: "stock" },
      );
      expect((await processor.process(purchase)).status).toBe("executed");
      expect(await getInventoryQuantity("alice", "equipment")).toBe(2);
      expect(await EquipmentModel.countDocuments()).toBe(0);
      const open = hiveGameActionEvent(
        buildGameAction("open_chest", {
          itemId: "equipment",
          nonce: "open-stock-001",
        }),
        { transactionId: "tx-open", eventId: "open" },
      );
      expect((await processor.process(open)).status).toBe("executed");
      expect(await getInventoryQuantity("alice", "equipment")).toBe(1);
      expect(await EquipmentModel.countDocuments()).toBe(1);
      expect(
        (await PlayerModel.findOne({ wallet: "alice" }).lean())?.hash,
      ).toBe(810);
      expect((await processor.process(open)).status).toBe("rejected");
      expect(await EquipmentModel.countDocuments()).toBe(1);
      expect(await getInventoryQuantity("alice", "equipment")).toBe(1);
      expect(await LogModel.countDocuments({ type: "chest", amount: 0 })).toBe(
        1,
      );
    });
    it("parks a consumed chest after an interrupted mint without restoring or replaying it", async () => {
      await registerPlayer("alice", "registration");
      await grantInventoryItems("alice", "equipment", 1);
      const event = hiveGameActionEvent(
        buildGameAction("open_chest", {
          itemId: "equipment",
          nonce: "open-interrupted-001",
        }),
      );
      const processor = createGameActionProcessor(createGameActionRegistry());
      const mint = vi
        .spyOn(EquipmentModel, "create")
        .mockRejectedValueOnce(new Error("mint interrupted"));
      try {
        await expect(processor.process(event)).rejects.toBeInstanceOf(
          DatabaseOperationUncertainError,
        );
      } finally {
        mint.mockRestore();
      }
      expect(await getInventoryQuantity("alice", "equipment")).toBe(0);
      expect(await EquipmentModel.countDocuments()).toBe(0);
      expect(
        await InboundTransactionModel.countDocuments({
          status: "reconciliation",
          databaseEffectsStarted: true,
        }),
      ).toBe(1);
      await expect(processor.process(event)).rejects.toThrow("operator review");
      expect(await EquipmentModel.countDocuments()).toBe(0);
      expect(
        await ProcessedTransactionModel.countDocuments({ type: "game_action" }),
      ).toBe(0);
    });
    it("guards competing sabotage writes while allowing independent stats and a fully countered replacement", async () => {
      await upsertPlayer({ wallet: "alice", username: "alice" });
      const results = await Promise.all([
        applyStatSabotage("alice", statEffect("security", "first")),
        applyStatSabotage("alice", statEffect("security", "second")),
      ]);
      expect(results.filter((result) => result.ok)).toHaveLength(1);
      const winner = (await PlayerModel.findOne({ wallet: "alice" }).lean())!
        .statEffects!.security!;
      expect(await applyStatSabotage("alice", statEffect("hashRate"))).toEqual({
        ok: true,
      });
      expect(
        await replaceStatEffect("alice", winner, { ...winner, active: false }),
      ).toEqual({ ok: true });
      expect(
        await applyStatSabotage("alice", statEffect("security", "replacement")),
      ).toEqual({ ok: true });
      const effects = (await PlayerModel.findOne({ wallet: "alice" }).lean())!
        .statEffects!;
      expect(effects.security?.appliedBy).toBe("replacement");
      expect(effects.hashRate?.active).toBe(true);
      expect(
        await applyStatSabotage("missing", statEffect("security")),
      ).toEqual({ ok: false });
    });
    it("lets one Help compare-and-set win and preserves unrelated stat effects", async () => {
      await upsertPlayer({ wallet: "alice", username: "alice" });
      const expected = statEffect("security"),
        other = statEffect("hashRate");
      await applyStatSabotage("alice", expected);
      await applyStatSabotage("alice", other);
      const helped = (appliedBy: string): StatEffect => ({
        ...expected,
        helps: [
          {
            itemId: "help-kit",
            appliedBy,
            appliedAt: 1500,
            strength: 0.1,
            critical: false,
          },
        ],
      });
      const results = await Promise.all([
        replaceStatEffect("alice", expected, helped("first")),
        replaceStatEffect("alice", expected, helped("second")),
      ]);
      expect(results.filter((result) => result.ok)).toHaveLength(1);
      const effects = (await PlayerModel.findOne({ wallet: "alice" }).lean())!
        .statEffects!;
      expect(effects.security?.helps).toHaveLength(1);
      expect(effects.hashRate?.appliedBy).toBe(other.appliedBy);
      expect(
        await replaceStatEffect("alice", expected, helped("stale")),
      ).toEqual({ ok: false });
      expect(
        await replaceStatEffect("alice", expected, statEffect("hashRate")),
      ).toEqual({ ok: false });
    });
    it("returns cleared stat effects to exactly one reset without touching balances", async () => {
      await PlayerModel.create({ wallet: "alice", username: "alice", hash: 7 });
      await applyStatSabotage("alice", statEffect("security"));
      await applyStatSabotage("alice", statEffect("hashRate"));
      const results = await Promise.all([
        clearStatEffects("alice"),
        clearStatEffects("alice"),
      ]);
      expect(
        results.map((result) => Object.keys(result).length).sort(),
      ).toEqual([0, 2]);
      const player = await PlayerModel.findOne({ wallet: "alice" }).lean();
      expect(player?.statEffects).toBeUndefined();
      expect(player?.hash).toBe(7);
      expect(await clearStatEffects("missing")).toEqual({});
    });
    it("reserves the last raid charge once under competing requests", async () => {
      const now = Date.now();
      await PlayerModel.create({
        wallet: "alice",
        username: "alice",
        raidCharges: 1,
        lastRaidRegenAt: now,
      });
      const results = await Promise.all([
        reserveRaidCharge("alice", now, CHARGE_REGEN_MS, MAX_RAID_CHARGES),
        reserveRaidCharge("alice", now, CHARGE_REGEN_MS, MAX_RAID_CHARGES),
      ]);
      expect(results.filter((result) => result.ok)).toHaveLength(1);
      expect(
        (await PlayerModel.findOne({ wallet: "alice" }).lean())?.raidCharges,
      ).toBe(0);
    });
    it("debits a defender once and applies protection atomically", async () => {
      const now = Date.now(),
        protection = now + 60_000;
      await PlayerModel.create({
        wallet: "alice",
        username: "alice",
        vault: 100,
        protectionUntil: 0,
      });
      const results = await Promise.all([
        claimRaidDefender("alice", 40, now, protection),
        claimRaidDefender("alice", 40, now, protection),
      ]);
      expect(results.filter((result) => result.ok)).toHaveLength(1);
      const player = await PlayerModel.findOne({ wallet: "alice" }).lean();
      expect(player?.vault).toBe(60);
      expect(player?.protectionUntil).toBe(protection);
      expect(await claimRaidDefender("alice", 40, now + 1, protection)).toEqual(
        { ok: false },
      );
    });
    it("caps competing raid credits and awards Notoriety from the actual credit", async () => {
      await PlayerModel.create({
        wallet: "alice",
        username: "alice",
        vault: 3,
        notoriety: 0,
      });
      const results = await Promise.all([
        creditRaidProceeds("alice", { received: 7, capacity: 10, xp: 10 }),
        creditRaidProceeds("alice", { received: 7, capacity: 10, xp: 10 }),
      ]);
      expect(results.reduce((sum, result) => sum + result.credited, 0)).toBe(7);
      const player = await PlayerModel.findOne({ wallet: "alice" }).lean();
      expect(player?.vault).toBe(10);
      expect(player?.notoriety).toBe(7);
      expect(player?.milestones.totalStolen).toBe(7);
    });
    it("limits failed-raid destruction to the actual vault and treats zero risk as a no-op", async () => {
      await PlayerModel.create({
        wallet: "alice",
        username: "alice",
        vault: 120,
      });
      expect(await debitRaidRisk("alice", 300)).toEqual({
        ok: true,
        deducted: 120,
      });
      expect(
        (await PlayerModel.findOne({ wallet: "alice" }).lean())?.vault,
      ).toBe(0);
      expect(await debitRaidRisk("alice", 0)).toEqual({
        ok: true,
        deducted: 0,
      });
      expect(await debitRaidRisk("missing", 1)).toEqual({
        ok: false,
        deducted: 0,
      });
    });
    it("counts first registration once and accumulates concurrent single and bulk upgrades", async () => {
      await registerPlayer("alice", "registration-a");
      await registerPlayer("alice", "registration-a");
      await registerPlayer("bob", "registration-b");
      expect(await gameStatsRepository.get("globalMinerate")).toBe(2);
      await creditHash("alice", 10000);
      await creditHash("bob", 10000);
      const results = await Promise.all([
        upgradeStat("alice", "hashRate", 2),
        upgradeStat("bob", "hashRate", 1),
      ]);
      expect(results.every((r) => r.ok)).toBe(true);
      expect(await gameStatsRepository.get("globalMinerate")).toBe(5);
      await upgradeStat("alice", "security", 1);
      expect(await gameStatsRepository.get("globalMinerate")).toBe(5);
    });
    it("settles a claim through the real registry once and records its actual amount", async () => {
      await registerPlayer("alice", "registration");
      await PlayerModel.updateOne(
        { wallet: "alice" },
        {
          $set: {
            vault: 0.5,
            lastTickAt: Date.parse("2026-10-10T00:00:00Z"),
            claimCharges: 5,
            lastClaimRegenAt: Date.parse("2026-10-10T00:00:00Z"),
          },
        },
      );
      const event = hiveGameActionEvent(
        buildClaimAction({ nonce: "standalone-claim-0001" }),
      );
      const processor = createGameActionProcessor(createGameActionRegistry());
      expect((await processor.process(event)).status).toBe("executed");
      expect(
        await PlayerModel.findOne({ wallet: "alice" }).lean(),
      ).toMatchObject({ hash: 10.5, vault: 0, claimCharges: 4 });
      expect(await LogModel.findOne({ type: "claim" }).lean()).toMatchObject({
        amount: 0.5,
      });
      expect(await ProcessedTransactionModel.countDocuments()).toBe(1);
      await processor.process(event);
      expect(
        await PlayerModel.findOne({ wallet: "alice" }).lean(),
      ).toMatchObject({ hash: 10.5 });
    });
    it("ignores legacy progress on startup and deduplicates inclusive in-process replay", async () => {
      await GameStatModel.collection.insertOne({
        _id: HIVE_WORKER_LEASE_ID,
        checkpoint: {
          blockNumber: 1,
          transactionIndex: -1,
          operationIndex: -1,
          updatedAt: 1,
        },
        value: 0,
      } as never);
      await registerPlayer("alice", "registration");
      await PlayerModel.updateOne(
        { wallet: "alice" },
        {
          $set: {
            vault: 0.5,
            lastTickAt: Date.parse("2026-10-10T00:00:00Z"),
            claimCharges: 5,
            lastClaimRegenAt: Date.parse("2026-10-10T00:00:00Z"),
          },
        },
      );
      const event = hiveGameActionEvent(
        buildClaimAction({ nonce: "worker-replay-0001" }),
      );
      const position: GameActionStreamPosition = {};
      const resolver = vi.fn(async () => 100);
      async function* interrupted() {
        yield event;
        throw new Error("stream interrupted");
      }
      await expect(
        runGameActionStreamWorker({
          position,
          resolveStartBlock: resolver,
          stream: interrupted(),
        }),
      ).rejects.toThrow("stream interrupted");
      expect(position.blockNumber).toBe(100);
      resolver.mockResolvedValue(200);
      const create = vi.fn(async function* () {
        yield event;
      });
      await runGameActionStreamWorker({
        position,
        resolveStartBlock: resolver,
        createStream: create,
      });
      expect(resolver).toHaveBeenCalledOnce();
      expect(create).toHaveBeenCalledWith(expect.any(AbortSignal), 100);
      expect(
        await PlayerModel.findOne({ wallet: "alice" }).lean(),
      ).toMatchObject({ hash: 10.5, vault: 0, claimCharges: 4 });
      expect(await LogModel.countDocuments({ type: "claim" })).toBe(1);
      expect(await ProcessedTransactionModel.countDocuments()).toBe(1);
      expect(await InboundTransactionModel.countDocuments()).toBe(0);
      expect(
        (
          await GameStatModel.collection.findOne({
            _id: HIVE_WORKER_LEASE_ID,
          } as never)
        )?.checkpoint,
      ).toMatchObject({ blockNumber: 1 });
    });
    it("rejects insufficient upgrade funds after a safe tick without blocking the stream", async () => {
      await registerPlayer("alice", "registration");
      // This scenario starts after the player's starting HASH has been spent.
      await PlayerModel.updateOne({ wallet: "alice" }, { $set: { hash: 0 } });
      const event = hiveGameActionEvent(
        buildUpgradeStatAction({
          stat: "hashRate",
          levels: 1,
          nonce: "standalone-no-funds-0001",
        }),
      );
      const processor = createGameActionProcessor(createGameActionRegistry());
      expect(await processor.process(event)).toMatchObject({
        status: "rejected",
        reason: "Not enough HASH",
      });
      expect(await InboundTransactionModel.countDocuments()).toBe(0);
      expect(
        await PlayerModel.findOne({ wallet: "alice" }).lean(),
      ).toMatchObject({ hash: 0, statLevels: { hashRate: 1 } });
    });
    it("credits a verified deposit before publishing success and ignores duplicate settlement", async () => {
      await registerPlayer("alice", "registration");
      const job = await InboundTransactionModel.create({
        type: "deposit",
        signature: "deposit",
        depositTxId: "deposit",
        depositAmount: 5,
        walletAddress: "alice",
      });
      const context = { checkLease: async () => {}, maxRetries: 3 };
      await processJob(context, job);
      expect(
        await PlayerModel.findOne({ wallet: "alice" }).lean(),
      ).toMatchObject({ hash: 15 });
      expect(
        await ProcessedTransactionModel.findOne({ txHash: "deposit" }).lean(),
      ).toMatchObject({ metadata: { creditedAmount: 5 } });
      expect(await InboundTransactionModel.countDocuments()).toBe(0);
      await processJob(context, job);
      expect(
        await PlayerModel.findOne({ wallet: "alice" }).lean(),
      ).toMatchObject({ hash: 15 });
    });
    it("parks a partially credited deposit, hides its internal marker and refuses automatic replay", async () => {
      await registerPlayer("alice", "registration");
      const job = await InboundTransactionModel.create({
        type: "deposit",
        signature: "interrupted",
        depositTxId: "interrupted",
        depositAmount: 5,
        walletAddress: "alice",
      });
      const failure = vi
        .spyOn(LogModel, "create")
        .mockRejectedValueOnce(new Error("audit unavailable"));
      const context = { checkLease: async () => {}, maxRetries: 3 };
      try {
        await processJob(context, job);
      } finally {
        failure.mockRestore();
      }
      const pending = (await InboundTransactionModel.findById(job._id))!;
      expect(pending).toMatchObject({
        status: "reconciliation",
        databaseEffectsStarted: true,
      });
      expect(
        await PlayerModel.findOne({ wallet: "alice" }).lean(),
      ).toMatchObject({ hash: 15 });
      expect(await ProcessedTransactionModel.countDocuments()).toBe(0);
      await processJob(context, pending);
      await resumeReconciledPayment("interrupted");
      expect(await InboundTransactionModel.findById(job._id)).toMatchObject({
        status: "reconciliation",
      });
      expect(
        await PlayerModel.findOne({ wallet: "alice" }).lean(),
      ).toMatchObject({ hash: 15 });
      const history = await readTransactions("alice", { limit: 10 });
      expect(history.pending[0]).not.toHaveProperty("databaseEffectsStarted");
      expect(history.pending[0]).toMatchObject({ status: "reconciliation" });
    });
    it("detects a process crash marker before reclaiming expired gameplay effects", async () => {
      const event = hiveGameActionEvent(
        buildClaimAction({ nonce: "standalone-crash-0001" }),
      );
      await gameActionPersistence.claim(event, "old-owner");
      await beginQueuedDatabaseEffects(
        event.transactionId + ":" + event.operationIndex,
        "old-owner",
      );
      await InboundTransactionModel.updateOne(
        {},
        { $set: { "gameEvent.claimUntil": 0 } },
      );
      expect(await gameActionPersistence.claim(event, "new-owner")).toBe(
        "reconciliation",
      );
      expect(await listRecoverableGameActions()).toHaveLength(0);
    });
    it("unique durable claims let only one claimant acquire an operation", async () => {
      const event = hiveGameActionEvent(
        buildClaimAction({ nonce: "unique-claim-0001" }),
      );
      const claims = await Promise.all([
        gameActionPersistence.claim(event, "one"),
        gameActionPersistence.claim(event, "two"),
      ]);
      expect(claims.filter((r) => r === "claimed")).toHaveLength(1);
      expect(await InboundTransactionModel.countDocuments()).toBe(1);
    });
    it("writes effects, logs, aggregate and receipt in order and ignores replay", async () => {
      await registerPlayer("alice", "registration");
      await creditHash("alice", 1000);
      const event = hiveGameActionEvent(
        buildUpgradeStatAction({
          stat: "hashRate",
          levels: 2,
          nonce: "atomic-upgrade-01",
        }),
      );
      const processor = createGameActionProcessor({
        upgrade_stat: async () => upgradeStat("alice", "hashRate", 2),
      });
      expect((await processor.process(event)).status).toBe("executed");
      expect(await gameStatsRepository.get("globalMinerate")).toBe(3);
      expect(
        await PlayerModel.findOne({ wallet: "alice" }).lean(),
      ).toMatchObject({ hash: 1005, xp: 50, statLevels: { hashRate: 3 } });
      expect(await LogModel.countDocuments()).toBe(1);
      expect(await ProcessedTransactionModel.countDocuments()).toBe(1);
      expect(await InboundTransactionModel.countDocuments()).toBe(0);
      expect((await processor.process(event)).status).toBe("rejected");
      expect(await gameStatsRepository.get("globalMinerate")).toBe(3);
    });
    it("parks interrupted effects without issuing a receipt or replaying the action", async () => {
      await registerPlayer("alice", "registration");
      await creditHash("alice", 1000);
      const event = hiveGameActionEvent(
        buildUpgradeStatAction({
          stat: "hashRate",
          levels: 2,
          nonce: "atomic-rollback-1",
        }),
      );
      const processor = createGameActionProcessor({
        upgrade_stat: async () => {
          await upgradeStat("alice", "hashRate", 2);
          throw new Error("receipt write interrupted");
        },
      });
      await expect(processor.process(event)).rejects.toBeInstanceOf(
        DatabaseOperationUncertainError,
      );
      expect(await gameStatsRepository.get("globalMinerate")).toBe(3);
      expect(
        await PlayerModel.findOne({ wallet: "alice" }).lean(),
      ).toMatchObject({ hash: 1005, xp: 50, statLevels: { hashRate: 3 } });
      expect(await LogModel.countDocuments()).toBe(1);
      expect(await ProcessedTransactionModel.countDocuments()).toBe(0);
      expect(
        await InboundTransactionModel.countDocuments({
          status: "reconciliation",
          databaseEffectsStarted: true,
        }),
      ).toBe(1);
      await expect(processor.process(event)).rejects.toThrow("operator review");
      expect(await gameStatsRepository.get("globalMinerate")).toBe(3);
    });
    it("reuses confirmed transfers and parks uncertain intents without another broadcast", async () => {
      const send = vi.fn(async () => ({
        success: true,
        transactionId: "payout",
      }));
      const intent = {
        accountAlias: "treasury" as const,
        from: "treasury",
        to: "alice",
        quantity: "1.000",
        symbol: "HASH",
        memo: "test",
      };
      await InboundTransactionModel.create({
        type: "withdrawal",
        signature: "job",
        walletAddress: "alice",
        withdrawAmount: 1,
        financialWorkflowVersion: 1,
        financialPhase: "reserved",
      });
      await dispatchTreasuryOnce("job", "confirmed", intent, send);
      await dispatchTreasuryOnce("job", "confirmed", intent, send);
      expect(send).toHaveBeenCalledOnce();
      await InboundTransactionModel.updateOne(
        { signature: "job" },
        {
          $push: {
            treasuryTransfers: {
              key: "uncertain",
              intent,
              state: "broadcasting",
            },
          },
        },
      );
      await expect(
        dispatchTreasuryOnce("job", "uncertain", intent, send),
      ).rejects.toBeInstanceOf(SettlementUncertainError);
      expect(send).toHaveBeenCalledOnce();
    });
    it("preserves legacy checkpoint data without reading it and retains one exclusive worker lease", async () => {
      // Raw insertion models an existing document from an older worker version.
      await GameStatModel.collection.insertOne({
        _id: HIVE_WORKER_LEASE_ID,
        checkpoint: {
          blockNumber: 1,
          transactionIndex: -1,
          operationIndex: -1,
          updatedAt: 1,
        },
        value: 0,
      } as never);
      const leases = await Promise.all([
        contractStreamRepository.acquireLease("one", 10000),
        contractStreamRepository.acquireLease("two", 10000),
      ]);
      expect(leases.filter(Boolean)).toHaveLength(1);
      const owner = leases[0] ? "one" : "two";
      await expect(getStat(HIVE_WORKER_LEASE_ID)).rejects.toThrow(
        "Reserved Hive worker lease",
      );
      expect(await contractStreamRepository.renewLease("intruder", 10000)).toBe(
        false,
      );
      await contractStreamRepository.releaseLease("intruder");
      expect(await contractStreamRepository.acquireLease("new", 10000)).toBe(
        false,
      );
      expect(await contractStreamRepository.renewLease(owner, 10000)).toBe(
        true,
      );
      expect(
        (
          await GameStatModel.collection.findOne({
            _id: HIVE_WORKER_LEASE_ID,
          } as never)
        )?.checkpoint,
      ).toMatchObject({ blockNumber: 1 });
      expect(
        await GameStatModel.countDocuments({ _id: HIVE_WORKER_LEASE_ID }),
      ).toBe(1);
      await contractStreamRepository.releaseLease(owner);
      expect(await contractStreamRepository.acquireLease("new", 10000)).toBe(
        true,
      );
    });
    it("consumes a player's login nonce once and initializes an auth shell's profile once", async () => {
      const expiresAt = Date.now() + 60000;
      await issueLoginNonce("alice", "hash", expiresAt);
      expect(
        await PlayerModel.findOne({ wallet: "alice" }).lean(),
      ).toMatchObject({
        profileInitialized: false,
        isRegistered: false,
        hash: 0,
      });
      expect(
        await PlayerModel.findOne({ wallet: "alice" }).lean(),
      ).not.toHaveProperty("loginNonce");
      const outcomes = await Promise.all([
        consumeLoginNonce("alice", "hash", expiresAt, Date.now()),
        consumeLoginNonce("alice", "hash", expiresAt, Date.now()),
      ]);
      expect(outcomes.filter(Boolean)).toHaveLength(1);
      await upsertPlayer({ wallet: "bob", username: "bob" });
      await Promise.all([
        readPlayerProfile("alice", "bob"),
        readPlayerProfile("alice", "bob"),
      ]);
      expect(await gameStatsRepository.get("registeredPlayers")).toBe(1);
      expect(await PlayerModel.findOne({ wallet: "bob" }).lean()).toMatchObject(
        {
          referralCount: 1,
        },
      );
      expect(await gameStatsRepository.get("globalMinerate")).toBeNull();
    });
    it("attaches an invitation once to an initialized unregistered account under competing reads", async () => {
      await issueLoginNonce("alice", "hash", Date.now() + 60000);
      await readPlayerProfile("alice", null);
      await upsertPlayer({ wallet: "corven", username: "corven" });
      await upsertPlayer({ wallet: "other", username: "other" });
      const profiles = await Promise.all([
        readPlayerProfile("alice", " CORVEN "), readPlayerProfile("alice", "other"),
        readPlayerProfile("alice", "corven"),
      ]);
      const assigned = await PlayerModel.findOne({ wallet: "alice" }).lean();
      expect(["corven", "other"]).toContain(assigned?.referredBy);
      expect(profiles.every((profile) => profile.referredBy === assigned?.referredBy)).toBe(true);
      expect(assigned).toMatchObject({ isRegistered: false, hash: 0, profileInitialized: true });
      for (const wallet of ["corven", "other"]) {
        expect(await PlayerModel.findOne({ wallet }).lean()).toMatchObject({
          referralCount: assigned?.referredBy === wallet ? 1 : 0,
        });
      }
      expect(await gameStatsRepository.get("registeredPlayers")).toBe(1);
      expect((await readPlayerProfile("alice", assigned?.referredBy === "corven" ? "other" : "corven")).referredBy).toBe(assigned?.referredBy);
      expect(await LogModel.countDocuments({ type: "referral" })).toBe(0);
    });
    it.each(["pending", "reconciliation", "failed", "processed"] as const)("does not attach a referral after a %s registration payment record", async (status) => {
      await upsertPlayer({ wallet: "alice", username: "alice" });
      await upsertPlayer({ wallet: "corven", username: "corven" });
      if (status === "processed") await ProcessedTransactionModel.create({
        txHash: "registration", wallet: "alice", type: "registration", amount: 150, status: "failed", processedAt: Date.now(),
      });
      else await InboundTransactionModel.create({
        signature: "registration", walletAddress: "alice", type: "registration", status,
        referralPolicyVersion: 1, referralObligation: { referrer: null, source: "registration" },
      });
      expect((await readPlayerProfile("alice", "corven")).referredBy).toBeNull();
      expect(await PlayerModel.findOne({ wallet: "corven" }).lean()).toMatchObject({ referralCount: 0 });
      if (status !== "processed") expect(await InboundTransactionModel.findOne({ signature: "registration" }).lean())
        .toMatchObject({ referralObligation: { referrer: null } });
    });
    it("rejects self, missing and already-paid referral attribution without creating recipient profiles", async () => {
      await upsertPlayer({ wallet: "alice", username: "alice" });
      await upsertPlayer({ wallet: "corven", username: "corven" });
      expect((await readPlayerProfile("alice", "alice")).referredBy).toBeNull();
      expect((await readPlayerProfile("alice", "missing")).referredBy).toBeNull();
      expect(await PlayerModel.countDocuments()).toBe(2);
      await registerPlayer("alice", "paid-registration");
      expect((await readPlayerProfile("alice", "corven")).referredBy).toBeNull();
      expect(await PlayerModel.findOne({ wallet: "corven" }).lean()).toMatchObject({ referralCount: 0 });
    });
    it("archives confirmed payouts before deleting the pending job and reuses archived transfers", async () => {
      const job = await InboundTransactionModel.create({
        type: "withdrawal",
        signature: "job",
        walletAddress: "alice",
        treasuryTransfers: [
          {
            key: "key",
            intent: {
              accountAlias: "treasury",
              from: "treasury",
              to: "alice",
              symbol: "HASH",
              quantity: "1.000",
              memo: "test",
            },
            state: "confirmed",
            verifiedAt: Date.now(),
            blockNumber: 100,
            operationIndex: 0,
            transactionId: "tx",
          },
        ],
      });
      await withDatabaseOperation(async () => {
        await ProcessedTransactionModel.create({
          txHash: "job",
          wallet: "alice",
          type: "withdrawal",
          amount: -1,
          processedAt: Date.now(),
        });
        await completePaymentJob(job as IInboundTransaction);
      });
      expect(await InboundTransactionModel.countDocuments()).toBe(0);
      expect(
        (await ProcessedTransactionModel.findOne({ txHash: "job" }).lean())
          ?.metadata?.treasuryTransfers?.[0].transactionId,
      ).toBe("tx");
      const send = vi.fn();
      await expect(
        dispatchTreasuryOnce(
          "job",
          "key",
          {
            accountAlias: "treasury",
            from: "treasury",
            to: "alice",
            symbol: "HASH",
            quantity: "1.000",
            memo: "test",
          },
          send,
        ),
      ).resolves.toMatchObject({ transactionId: "tx" });
      expect(send).not.toHaveBeenCalled();
    });
  },
);

import { getStat } from "@/lib/modules/game-stats/server.repository";
