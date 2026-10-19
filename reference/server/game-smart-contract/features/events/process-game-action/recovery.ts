import type { CustomJsonEvent } from "hivexph-sdk";
import { listRecoverableGameActions } from "@/lib/modules/transactions-pending/server.repository";
import { logger } from "@/lib/logger.server";

/** Recover saved submissions through the worker's existing guarded/retry processing callback. */
export async function recoverPendingGameActions(
  processEvent: (event: CustomJsonEvent) => Promise<void>,
): Promise<void> {
  const recoverable = await listRecoverableGameActions();
  if (recoverable.length > 0)
    logger.info("Recovering pending game actions", {
      count: recoverable.length,
    });
  for (const event of recoverable) await processEvent(event);
}
