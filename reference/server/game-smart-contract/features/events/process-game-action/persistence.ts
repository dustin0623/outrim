import type { CustomJsonEvent } from "hivexph-sdk";
import { gameEventKey } from "@/lib/utils/game/event-identity.server";
import {
  getPendingGameEvent,
  findPendingGameNonce,
  claimPendingGameAction,
  deleteClaimedGameAction,
  markGameActionFailed,
  beginQueuedDatabaseEffects,
  clearQueuedDatabaseEffects,
  parkGameAction,
} from "@/lib/modules/transactions-pending/server.repository";
import {
  getProcessedGameEvent,
  findProcessedGameNonce,
  insertGameReceipt,
} from "@/lib/modules/transactions-processed/server.repository";
import { withDatabaseOperation } from "@/lib/utils/database/operation.server";
async function get(eventKey: string) {
  return (
    (await getProcessedGameEvent(eventKey)) ?? getPendingGameEvent(eventKey)
  );
}
async function finish(
  eventKey: string,
  status: "processed" | "rejected",
  reason?: string,
  result?: unknown,
  token?: string,
) {
  return withDatabaseOperation(async () => {
    const job = await getPendingGameEvent(eventKey, token);
    if (!job) throw new Error("Missing claimed gameplay job");
    await insertGameReceipt({
      ...job,
      status,
      reason,
      result,
      updatedAt: Date.now(),
    });
    await deleteClaimedGameAction(eventKey, token);
  });
}
export const gameActionPersistence = {
  get,
  async claim(event: CustomJsonEvent, token?: string) {
    const existing = await getProcessedGameEvent(gameEventKey(event));
    if (existing?.status === "processed" || existing?.status === "rejected")
      return existing.status;
    return claimPendingGameAction(event, token);
  },
  async findNonce(actor: string, nonce: string, exceptKey: string) {
    return (
      (await findPendingGameNonce(
        actor,
        nonce,
        exceptKey,
        await get(exceptKey),
      )) ?? findProcessedGameNonce(actor, nonce, exceptKey)
    );
  },
  markProcessed: (key: string, result?: unknown, token?: string) =>
    finish(key, "processed", undefined, result, token),
  markRejected: (key: string, reason: string, token?: string) =>
    finish(key, "rejected", reason, undefined, token),
  markFailed: markGameActionFailed,
  beginEffects: beginQueuedDatabaseEffects,
  clearEffects: clearQueuedDatabaseEffects,
  park: parkGameAction,
};
