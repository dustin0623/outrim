import type { GameActionPayload } from "@/lib/utils/game/action-protocol";
export type GameActionLifecycle =
  "idle" | "broadcasting" | "broadcast" | "processed" | "failed";

export interface GameActionExecutionContext {
  session: {
    mode: string | null;
    address: string | null;
    connectedAt: number | null;
  };
  signer: string | null;
}

export interface GameActionFlowOptions {
  build: (nonce: string) => GameActionPayload;
  signal?: AbortSignal;
  context?: GameActionExecutionContext;
}

export interface GameActionFlowHandlers {
  onSubmitted?: () => void;
  onLifecycle: (lifecycle: GameActionLifecycle) => void;
  onTransactionId: (transactionId: string | null) => void;
  onError: (message: string | null) => void;
  onAwaiting: (awaiting: boolean) => void;
}

export interface SignedActionOutcome {
  ok: boolean;
  error?: string;
  transactionId?: string;
  amount?: number;
  itemId?: string;
}
export type EquipmentActionKind = "equip" | "unequip" | "upgrade" | "salvage";

/** Local submission labels only; signed action names remain unchanged. */
export const GAME_ACTION_LABELS: Record<GameActionPayload["action"], string> = {
  claim: "Secure Haul",
  increase_vault: "Expand Hold",
  upgrade_stat: "Upgrade stat",
  raid: "Raid",
  sabotage: "Disrupt operator",
  help: "Assist operator",
  purchase_consumable: "Buy supplies",
  purchase_chest: "Buy Salvage Caches",
  open_chest: "Open Salvage Cache",
  equip: "Equip module",
  unequip: "Unequip module",
  upgrade_equipment: "Tune Module",
  salvage_equipment: "Dismantle module",
  equip_cosmetic: "Update cosmetic",
  market_list: "List module",
  market_cancel: "Cancel listing",
  request_withdrawal: "Request withdrawal",
};
