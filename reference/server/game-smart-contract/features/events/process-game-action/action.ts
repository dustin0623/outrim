import { logRepository } from "@/lib/modules/logs/server.repository";
import { gameActionPersistence } from "@/server/game-smart-contract/features/events/process-game-action/persistence";
import {
  withDatabaseOperation,
  DatabaseOperationUncertainError,
} from "@/lib/utils/database/operation.server";

import type { CustomJsonEvent } from "hivexph-sdk";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { gameEventKey } from "@/lib/utils/game/event-identity.server";
import type {
  GameActionRegistry,
  GameActionProcessingResult,
} from "@/server/game-smart-contract/features/types/processing";
import {
  normalizeBlockchainTimestamp,
  validateGameActionProtocol,
  GameActionRejectedError,
} from "@/server/game-smart-contract/features/events/process-game-action/validation";
import {
  withGameExecution,
  gameActionHasLog,
} from "@/lib/utils/game/execution-context.server";

function reject(reason: string): never {
  throw new GameActionRejectedError(reason);
}

export function createGameActionProcessor(
  registry: GameActionRegistry,
  beforeCommit: () => Promise<void> = async () => {},
) {
  let tail = Promise.resolve();

  const process = (
    event: CustomJsonEvent,
  ): Promise<GameActionProcessingResult> => {
    const operation = tail.then(async () => {
      const eventKey = gameEventKey(event);
      // Durable claims and write markers prevent replay after interrupted direct writes.
      const token = randomUUID();
      const claim = await gameActionPersistence.claim(event, token);
      if (claim === "reconciliation")
        throw new Error(
          "Game action requires operator review before checkpoint advancement",
        );
      if (claim !== "claimed")
        return {
          status: "rejected",
          eventId: event.eventId,
          reason:
            claim === "processed"
              ? "duplicate game action"
              : `game action already ${claim}`,
        } as const;
      let recoverableWithdrawal = false;
      try {
        const claimedRecord = await gameActionPersistence.get(eventKey);
        if ((claimedRecord?.attempts ?? 0) > 8)
          reject("game action retry limit reached; operator review required");
        const payload = validateGameActionProtocol(event);
        const previous = await gameActionPersistence.findNonce(
          event.account!,
          payload.metadata.nonce,
          eventKey,
        );
        if (previous) reject("nonce already used by this account");
        // Timestamp validation stays after replay checking to preserve rejection precedence.
        const time = normalizeBlockchainTimestamp(event.blockTimestamp);
        const handler = registry[payload.action];
        if (!handler) reject(`no handler registered for ${payload.action}`);

        const record = await gameActionPersistence.get(eventKey);
        if (payload.action === "request_withdrawal") {
          recoverableWithdrawal = true;
          await beforeCommit();
          await withGameExecution(
            time,
            record?.randomSeed ?? eventKey,
            async () => {
              const result = await handler(payload, event);
              await logRepository.create({
                type: "game_action",
                wallet: event.account!,
                settlementKey: `withdrawal-request:${eventKey}`,
                data: { action: payload.action },
              });
              await beforeCommit();
              await gameActionPersistence.markProcessed(
                eventKey,
                result,
                token,
              );
            },
            eventKey,
          );
          return {
            status: "executed",
            eventId: event.eventId,
            action: payload.action,
          } as const;
        }
        await withDatabaseOperation(
          () =>
            withGameExecution(
              time,
              record?.randomSeed ?? eventKey,
              async () => {
                const result = await handler(payload, event);
                if (!gameActionHasLog())
                  await logRepository.create({
                    type: "game_action",
                    wallet: event.account!,
                    data: { action: payload.action },
                  });
                await beforeCommit();
                await gameActionPersistence.markProcessed(
                  eventKey,
                  result,
                  token,
                );
              },
              eventKey,
            ),
          {
            beforeWrite: async () => {
              await beforeCommit();
              await gameActionPersistence.beginEffects(eventKey, token);
            },
            afterSuccess: () => gameActionPersistence.clearEffects(eventKey),
          },
        );
        return {
          status: "executed",
          eventId: event.eventId,
          action: payload.action,
        } as const;
      } catch (error) {
        if (
          error instanceof DatabaseOperationUncertainError &&
          !recoverableWithdrawal
        ) {
          await gameActionPersistence.park(eventKey, error.message, token);
          throw error;
        }
        if (
          error instanceof GameActionRejectedError ||
          error instanceof z.ZodError
        ) {
          const reason =
            error instanceof GameActionRejectedError
              ? error.reason
              : "invalid game-action payload";
          await beforeCommit();
          await withDatabaseOperation(
            () => gameActionPersistence.markRejected(eventKey, reason, token),
            {
              beforeWrite: () =>
                gameActionPersistence.beginEffects(eventKey, token),
              afterSuccess: () => gameActionPersistence.clearEffects(eventKey),
            },
          );
          return {
            status: "rejected",
            eventId: event.eventId,
            reason,
          } as const;
        }
        await gameActionPersistence.markFailed(
          eventKey,
          "Temporary processing failure; retry scheduled",
          token,
        );
        throw error;
      }
    });

    tail = operation.then(
      () => undefined,
      () => undefined,
    );
    return operation;
  };

  return { process };
}
