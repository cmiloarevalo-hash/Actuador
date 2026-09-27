// Experimental candidate only. Non-authoritative local state.

import { createHash } from "node:crypto";

export type Recipient = "IMPLEMENTER_WEB" | "SUPERVISOR_WEB";
export type AttemptState = "NOT_ATTEMPTED" | "SEND_ATTEMPTED" | "UNCERTAIN_AFTER_SEND";
export type LedgerResult =
  | "SEEN"
  | "REQUEST_READY"
  | "REQUEST_BLOCKED"
  | "FAILED_BEFORE_SEND"
  | "SUCCESS"
  | "UNCERTAIN_AFTER_SEND";

export interface ObservedMailboxRecord {
  commentId: number;
  commentRef: string;
  updatedAt: string;
  normalizedRequestRef: string;
  recipient: Recipient;
  payloadHash: string;
  result: LedgerResult;
  attemptState: AttemptState;
}

export interface OperationalLedger {
  version: 1;
  repository: string;
  cursorUpdatedAt: string | null;
  observed: Record<string, ObservedMailboxRecord>;
  recoveryState: "NORMAL" | "STOP_UNKNOWN_PRIOR_SEND";
}

export type ObservationDecision =
  | { decision: "NEW"; key: string }
  | { decision: "DUPLICATE"; key: string }
  | { decision: "BLOCK_ESCALATE"; key: string; reason: string };

export function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function recordKey(commentId: number): string {
  return String(commentId);
}

export function classifyObservation(
  ledger: OperationalLedger,
  incoming: Omit<ObservedMailboxRecord, "result" | "attemptState">
): ObservationDecision {
  if (ledger.recoveryState !== "NORMAL") {
    return {
      decision: "BLOCK_ESCALATE",
      key: recordKey(incoming.commentId),
      reason: "ledger recovery state cannot prove absence of a prior Send"
    };
  }

  const key = recordKey(incoming.commentId);
  const existing = ledger.observed[key];
  if (!existing) return { decision: "NEW", key };

  if (
    existing.commentRef !== incoming.commentRef ||
    existing.updatedAt !== incoming.updatedAt ||
    existing.payloadHash !== incoming.payloadHash ||
    existing.normalizedRequestRef !== incoming.normalizedRequestRef ||
    existing.recipient !== incoming.recipient
  ) {
    return {
      decision: "BLOCK_ESCALATE",
      key,
      reason: "observed mailbox record was edited, moved, mutated, or rebound"
    };
  }

  return { decision: "DUPLICATE", key };
}

export function canDeliver(record: ObservedMailboxRecord): boolean {
  return record.attemptState === "NOT_ATTEMPTED";
}

export function markSendAttempted(
  record: ObservedMailboxRecord
): ObservedMailboxRecord {
  if (record.attemptState !== "NOT_ATTEMPTED") {
    throw new Error("REPLAY_BLOCKED");
  }
  return {
    ...record,
    attemptState: "SEND_ATTEMPTED"
  };
}

export function markUncertain(
  record: ObservedMailboxRecord
): ObservedMailboxRecord {
  if (record.attemptState === "NOT_ATTEMPTED") {
    throw new Error("UNCERTAINTY_REQUIRES_SEND_ATTEMPT");
  }
  return {
    ...record,
    result: "UNCERTAIN_AFTER_SEND",
    attemptState: "UNCERTAIN_AFTER_SEND"
  };
}

// Recovery rule:
// if the ledger is missing/corrupt and any historical mailbox record might
// already have crossed Send, initialize recoveryState=STOP_UNKNOWN_PRIOR_SEND.
// Never reconstruct NOT_ATTEMPTED from GitHub text alone.
