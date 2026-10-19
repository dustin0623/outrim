import { effectiveStatValue } from "@/features/types/game/stat-effects";
import { logRaid } from "./log";
import { playerRepository } from "@/lib/modules/players/server.repository";
import { gameStatsRepository } from "@/lib/modules/game-stats/server.repository";

import {
  regenCharges,
  simulateRaid,
  raidProtectionUntil,
  summarizeStatEffects,
} from "@/features/events/backend/raid/calculations.server";
import { vaultCapacity } from "@/features/types/game/mining";
import { gameActionNow } from "@/lib/utils/game/execution-context.server";
import { resolvePlayerStats, settleTick } from "@/features/events/backend/tick-player/action";
import { CHARGE_REGEN_MS, MAX_RAID_CHARGES } from "@/lib/config/constants/game";

/** HTTP-style outcome so the route can keep its 400/404 mapping while the stream adapter reads `status`. */
export type RaidActionResult = {
  status: number;
  body: Record<string, unknown> & { ok: boolean; error?: string };
};

function failure(status: number, error: string): RaidActionResult {
  return { status, body: { ok: false, error } };
}

export async function raidTarget(
  wallet: string,
  target: string,
  seed: string,
): Promise<RaidActionResult> {
  let attacker = await playerRepository.findByWallet(wallet);
  let defender = await playerRepository.findByWallet(target);
  if (!attacker || !defender) return failure(404, "Player not found");

  if (attacker.wallet === defender.wallet) return failure(400, "Cannot raid yourself");
  attacker.stats = await resolvePlayerStats(attacker);
  defender.stats = await resolvePlayerStats(defender);
  if (effectiveStatValue(attacker.stats.hackPower, attacker.statEffects?.hackPower) <=
      effectiveStatValue(defender.stats.security, defender.statEffects?.security))
    return failure(400, "Your Hack Power must exceed the target's Security");
  if (defender.statEffects?.hashRate) {
    await settleTick(target);
    defender = (await playerRepository.findByWallet(target))!;
    defender.stats = await resolvePlayerStats(defender);
  }

  // Regenerate + reserve (consume) exactly one raid charge atomically in
  // the DB before simulating anything. Checking `raidCharges > 0` against
  // the in-memory player object (read moments earlier) and writing the
  // decremented value back at the end — the previous approach — let two
  // concurrent raid requests from the same wallet both read the same
  // starting charge count, both pass the check, and both spend a charge
  // the player only had one of. This is now the single place raidCharges
  // is mutated for a raid attempt, win or lose.
  const reservation = await playerRepository.reserveRaidCharge(
    attacker.wallet,
    gameActionNow(),
    CHARGE_REGEN_MS,
    MAX_RAID_CHARGES,
  );
  if (!reservation.ok) return failure(400, "No raid charges");

  // claimCharges regen is independent of raidCharges/lastRaidRegenAt
  // (already persisted atomically above) — only $set the claim-charge
  // fields below, never raidCharges/lastRaidRegenAt again here.
  regenCharges(attacker);

  // Stat-specific effects: the defender's are cleared in the same atomic step that returns
  // them (a raid resets the raided player), so the Security modifier used below is the one
  // this request consumed and a concurrent raid cannot apply it a second time. The
  // attacker's own effects (e.g. a Sabotaged Hack Power) stay stored; they reset on claim.
  const defenderEffects = await playerRepository.clearStatEffects(
    defender.wallet,
  );
  const attackerEffects = attacker.statEffects ?? {};

  // simulateRaid is pure: it only computes the outcome from a stale read.
  // Nothing from the client (other than the audit seed) influences it.
  let result = simulateRaid(attacker, defender, seed, {
    statEffects: { attacker: attackerEffects, defender: defenderEffects },
  });
  // Field-scoped writes only — never the whole document. A blind
  // full-document write would silently revert a concurrent stake/
  // upgrade's atomic $inc to an unrelated field back to what this request
  // read at the start.
  await playerRepository.recordClaimChargeRegen(
    attacker.wallet,
    attacker.claimCharges,
    attacker.lastClaimRegenAt,
  );
  if (result.success) {
    // 1) Debit the defender and start protection in one conditional update.
    //    A concurrent raid that already landed leaves this one blocked, so
    //    the same HASH can never be taken twice.
    const now = gameActionNow();
    const claim = await playerRepository.claimRaidDefender(
      defender.wallet,
      result.takenFromVault,
      now,
      raidProtectionUntil(now),
    );
    if (!claim.ok) {
      result = {
        ...result,
        success: false,
        reason: "blocked",
        chance: 0,
        stealPercent: 0,
        exposure: 0,
        critical: false,
        takenFromVault: 0,
        stolen: 0,
        destroyed: 0,
        notorietyGained: 0,
        xp: 0,
      };
    } else {
      // 2) Credit the attacker. Notoriety is incremented inside the same
      //    atomic update from the amount actually credited. If this throws,
      //    refund the defender so HASH is never removed without a credit.
      try {
        const credit = await playerRepository.creditRaidProceeds(
          attacker.wallet,
          {
            received: result.stolen,
            capacity: vaultCapacity(attacker.vaultStaked),
            xp: result.xp,
          },
        );
        const credited = credit.ok ? credit.credited : 0;
        result = {
          ...result,
          stolen: credited,
          destroyed: result.takenFromVault - credited,
          notorietyGained: credited,
        };
      } catch (creditError) {
        await playerRepository.incrementRaidFields(defender.wallet, {
          vault: result.takenFromVault,
        });
        throw creditError;
      }
    }
  } else if (result.reason === "failed") {
    // D2: the attacker's risk is burned (not paid to the defender as HASH);
    // the defender gains exactly that amount as Notoriety.
    const risk = await playerRepository.debitRaidRisk(
      attacker.wallet,
      result.riskAmount ?? 0,
    );
    const deducted = risk.deducted;
    if (deducted > 0) {
      try {
        await playerRepository.incrementRaidFields(defender.wallet, {
          notoriety: deducted,
        });
      } catch (notorietyError) {
        await playerRepository.incrementRaidFields(attacker.wallet, {
          vault: deducted,
        });
        throw notorietyError;
      }
    }
    result = {
      ...result,
      riskAmount: deducted,
      defenderNotorietyGained: deducted,
    };
  }

  try {
    await logRaid(
      attacker.wallet,
      defender.wallet,
      result,
      seed,
      result.serverSeed,
      {
        defenderEffects: summarizeStatEffects(defenderEffects),
        attackerEffects: summarizeStatEffects(attackerEffects),
      },
    );
  } catch (logErr) {
    // HASH, effects and raid outcomes are already settled; a failed audit write must not turn the raid into a 500.
    throw logErr;
  }
  // Fire-and-forget: track global raid counters.
  await gameStatsRepository.increment("totalRaids");
  if (result.success) await gameStatsRepository.increment("totalRaidWins");
  // serverSeed is a server-only audit field — never returned to the client.
  const { serverSeed: _serverSeed, ...publicResult } = result;
  return { status: 200, body: { ok: result.success, ...publicResult } };
}
