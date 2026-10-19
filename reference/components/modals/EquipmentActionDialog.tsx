"use client";
import { equipmentDisplayName } from "@/features/types/game/item-names";
import { useEffect } from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Root as Dialog } from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { itemUpgradeCost, salvageValue } from "@/features/types/game/items";
import { formatHash } from "@/lib/format";
import { useGameActionFlow } from "@/hooks/useGameActionFlow";
import { buildEquipmentAction } from "@/lib/utils/game/action-protocol";
import type { EquipmentActionKind } from "@/features/types/game/actions";
import type { Equipment } from "@/features/types/game/types";
export interface EquipmentActionRequest {
  kind: EquipmentActionKind;
  item: Equipment;
}
export function EquipmentActionDialog({
  request,
  onClose,
  actionsDisabled = false,
}: {
  request: EquipmentActionRequest | null;
  onClose: () => void;
  actionsDisabled?: boolean;
}) {
  const flow = useGameActionFlow({ onSubmitted: onClose });
  const { reset } = flow;
  useEffect(() => {
    if (request) reset();
  }, [request, reset]);
  const settled =
    flow.lifecycle === "broadcast" || flow.lifecycle === "processed";
  return (
    <Dialog
      open={request !== null}
      onOpenChange={(open) => {
        if (!open && !flow.busy) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {request
              ? {
                  equip: "Equip",
                  unequip: "Unequip",
                  upgrade: "Tune Module",
                  salvage: "Dismantle",
                }[request.kind] +
                " " +
                equipmentDisplayName(request.item.name)
              : "Update modules"}
          </DialogTitle>
        </DialogHeader>
        {request?.kind === "salvage" ? (
          <p className="text-sm text-muted-foreground">
            Dismantling permanently consumes this module and returns{" "}
            {formatHash(salvageValue(request.item))} Sparks. Equipped or listed
            modules cannot be dismantled.
          </p>
        ) : request?.kind === "upgrade" ? (
          <p className="text-sm text-muted-foreground">
            Tune this module by one level for{" "}
            {formatHash(itemUpgradeCost(request.item))} Sparks. Each rolled stat
            increases by 5%. Confirmation uses the authoritative inventory.
          </p>
        ) : null}
        {flow.errorMessage ? (
          <p role="alert" className="text-sm text-destructive">
            {flow.errorMessage}
          </p>
        ) : null}
        {flow.lifecycle === "broadcasting" ? (
          <p role="status" className="text-xs text-muted-foreground">
            Waiting for Hive Keychain approval…
          </p>
        ) : null}
        {actionsDisabled ? (
          <p role="status" className="text-sm text-muted-foreground">
            Inventory is unavailable. Refresh Inventory before confirming.
          </p>
        ) : null}
        <Button
          disabled={
            !request ||
            actionsDisabled ||
            flow.busy ||
            flow.unavailable ||
            settled
          }
          loading={flow.busy}
          onClick={() => {
            if (request && !actionsDisabled)
              void flow.run({
                build: (nonce) =>
                  buildEquipmentAction(request.kind, request.item, nonce),
              });
          }}
        >
          {flow.busy
            ? "Waiting for Keychain…"
            : settled
              ? "Awaiting processing"
              : "Confirm with Hive Keychain"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
