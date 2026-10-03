import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type {
  ActuationHandoffKind,
  ActuationTargetActor
} from "./actuation-request-validator.js";
import { promptStoreDirectory } from "./handoff-routing.js";
import { ActuationError } from "./types.js";

export type PromptRecordStatus = "READY" | "IN_FLIGHT" | "ATTEMPTED";

export interface PromptStoreSeed {
  recipient: ActuationTargetActor;
  handoffKind: ActuationHandoffKind;
  repository: string;
  workItemNumber: number;
  expectedRevision: string | null;
  payloadSourceRef: string;
  prompt: string;
}

export interface PromptStoreRecord extends PromptStoreSeed {
  version: 1;
  recordId: string;
  status: PromptRecordStatus;
}

function canonicalSeed(seed: PromptStoreSeed): string {
  return JSON.stringify({
    recipient: seed.recipient,
    handoffKind: seed.handoffKind,
    repository: seed.repository,
    workItemNumber: seed.workItemNumber,
    expectedRevision: seed.expectedRevision,
    payloadSourceRef: seed.payloadSourceRef,
    prompt: seed.prompt
  });
}

export function promptRecordId(seed: PromptStoreSeed): string {
  return createHash("sha256").update(canonicalSeed(seed), "utf8").digest("hex");
}

function sameSeed(record: PromptStoreRecord, seed: PromptStoreSeed): boolean {
  return canonicalSeed(record) === canonicalSeed(seed);
}

function parseRecord(raw: string): PromptStoreRecord {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new ActuationError(
      "PROMPT_STORE_INVALID",
      "Prompt store record is not valid JSON."
    );
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ActuationError(
      "PROMPT_STORE_INVALID",
      "Prompt store record must be an object."
    );
  }

  const record = value as Partial<PromptStoreRecord>;
  if (
    record.version !== 1 ||
    typeof record.recordId !== "string" ||
    (record.recipient !== "IMPLEMENTER_WEB" &&
      record.recipient !== "SUPERVISOR_WEB") ||
    (record.handoffKind !== "IMPLEMENTER_WORK_ITEM" &&
      record.handoffKind !== "SUPERVISOR_REVIEW") ||
    typeof record.repository !== "string" ||
    typeof record.workItemNumber !== "number" ||
    !Number.isInteger(record.workItemNumber) ||
    (record.expectedRevision !== null &&
      typeof record.expectedRevision !== "string") ||
    typeof record.payloadSourceRef !== "string" ||
    typeof record.prompt !== "string" ||
    (record.status !== "READY" &&
      record.status !== "IN_FLIGHT" &&
      record.status !== "ATTEMPTED")
  ) {
    throw new ActuationError(
      "PROMPT_STORE_INVALID",
      "Prompt store record has an invalid schema."
    );
  }

  return record as PromptStoreRecord;
}

export class RecipientPromptStore {
  readonly directory: string;

  constructor(
    readonly recipient: ActuationTargetActor,
    cwd: string
  ) {
    this.directory = promptStoreDirectory(recipient, cwd);
  }

  async persist(seed: PromptStoreSeed): Promise<PromptStoreRecord> {
    if (seed.recipient !== this.recipient) {
      throw new ActuationError(
        "PROMPT_STORE_RECIPIENT_MISMATCH",
        "Prompt record recipient does not match the recipient-specific store."
      );
    }

    await mkdir(this.directory, { recursive: true });
    const record: PromptStoreRecord = {
      version: 1,
      recordId: promptRecordId(seed),
      status: "READY",
      ...seed
    };
    const path = this.pathFor(record.recordId);

    try {
      await writeFile(path, JSON.stringify(record, null, 2), {
        encoding: "utf8",
        flag: "wx",
        mode: 0o600
      });
      return record;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
        throw error;
      }
    }

    const existing = await this.load(record.recordId);
    if (!sameSeed(existing, seed)) {
      throw new ActuationError(
        "PROMPT_STORE_CONFLICT",
        "Existing prompt record does not match the deterministic handoff seed."
      );
    }
    return existing;
  }

  async load(recordId: string): Promise<PromptStoreRecord> {
    const record = parseRecord(await readFile(this.pathFor(recordId), "utf8"));
    if (record.recordId !== recordId || record.recipient !== this.recipient) {
      throw new ActuationError(
        "PROMPT_STORE_INVALID",
        "Prompt store record identity does not match its recipient-specific path."
      );
    }
    return record;
  }

  async transition(
    recordId: string,
    from: PromptRecordStatus,
    to: PromptRecordStatus
  ): Promise<PromptStoreRecord> {
    const record = await this.load(recordId);
    if (record.status !== from) {
      throw new ActuationError(
        "PROMPT_STORE_STATE_MISMATCH",
        `Prompt record is ${record.status}; expected ${from}.`
      );
    }

    const updated: PromptStoreRecord = {
      ...record,
      status: to
    };
    await writeFile(this.pathFor(recordId), JSON.stringify(updated, null, 2), {
      encoding: "utf8",
      mode: 0o600
    });
    return updated;
  }

  private pathFor(recordId: string): string {
    if (!/^[0-9a-f]{64}$/.test(recordId)) {
      throw new ActuationError(
        "PROMPT_STORE_INVALID",
        "Prompt record id must be a SHA-256 hex digest."
      );
    }
    return join(this.directory, `${recordId}.json`);
  }
}
