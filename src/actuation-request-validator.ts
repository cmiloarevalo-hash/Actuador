import type { WorkflowContext } from "./workflow-context-adapter.js";

export type ActuationTargetActor =
  | "IMPLEMENTER_WEB"
  | "SUPERVISOR_WEB";

export type ActuationHandoffKind =
  | "IMPLEMENTER_WORK_ITEM"
  | "SUPERVISOR_REVIEW";

export type ActuationExternalEffect =
  | "NONE"
  | "PROMPT_DELIVERY";

export type PersistentAuthorityReference = string;

export interface ActuationWorkItemRef {
  repository: string;
  number: number;
}

export interface ActuationRequest {
  kind: "ACTUATION_REQUEST";
  workItem: ActuationWorkItemRef;
  authorization: PersistentAuthorityReference;
  expectedRevision: string | null;
  targetActor: ActuationTargetActor;
  handoffKind: ActuationHandoffKind;
  humanRequired: boolean;
  humanAuthorization: PersistentAuthorityReference | null;
  externalEffect: ActuationExternalEffect;
  deliveryLimit: 0 | 1;
  contextRefs: string[];
  stopConditions: string[];
}

export interface RequestReady {
  result: "REQUEST_READY";
  request: ActuationRequest;
}

export interface RequestBlocked {
  result: "REQUEST_BLOCKED";
  errorCode:
    | "INVALID_REQUEST"
    | "CONTEXT_MISMATCH"
    | "ACTOR_HANDOFF_MISMATCH"
    | "AUTHORIZATION_REQUIRED"
    | "AUTHORIZATION_NOT_APPLICABLE"
    | "HUMAN_AUTHORIZATION_REQUIRED"
    | "HUMAN_AUTHORIZATION_NOT_APPLICABLE"
    | "PR_REQUIRED"
    | "EXPECTED_REVISION_REQUIRED"
    | "REVISION_MISMATCH"
    | "EXTERNAL_EFFECT_MISMATCH";
  detail: string;
}

export type ActuationRequestValidationResult =
  | RequestReady
  | RequestBlocked;

const REQUEST_KEYS = new Set([
  "kind",
  "workItem",
  "authorization",
  "expectedRevision",
  "targetActor",
  "handoffKind",
  "humanRequired",
  "humanAuthorization",
  "externalEffect",
  "deliveryLimit",
  "contextRefs",
  "stopConditions"
]);

const WORK_ITEM_KEYS = new Set(["repository", "number"]);
const SHA_PATTERN = /^[0-9a-f]{40}$/i;
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

function blocked(
  errorCode: RequestBlocked["errorCode"],
  detail: string
): RequestBlocked {
  return {
    result: "REQUEST_BLOCKED",
    errorCode,
    detail
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function hasOnlyKeys(
  value: Record<string, unknown>,
  allowed: ReadonlySet<string>
): boolean {
  return Object.keys(value).every((key) => allowed.has(key));
}

function persistentReference(value: unknown): PersistentAuthorityReference | null {
  if (typeof value !== "string") return null;
  if (value.length === 0 || value !== value.trim()) return null;
  if (value === "NONE" || value.includes("\n") || value.includes("\r")) return null;
  if (value.includes("<") || value.includes(">")) return null;

  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "github.com" ||
      url.username !== "" ||
      url.password !== "" ||
      url.port !== ""
    ) {
      return null;
    }
  } catch {
    return null;
  }

  return value;
}

function nullablePersistentReference(
  value: unknown
): PersistentAuthorityReference | null | undefined {
  if (value === null) return null;
  const reference = persistentReference(value);
  return reference === null ? undefined : reference;
}

function factualPersistentReferences(context: WorkflowContext): ReadonlySet<string> {
  const refs = new Set<string>([
    context.sourceId,
    context.workItemRef.htmlUrl,
    ...context.contextRefs.map((reference) => reference.htmlUrl)
  ]);

  if (context.prRef !== null) {
    refs.add(context.prRef.htmlUrl);
  }

  return refs;
}

function stringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const result: string[] = [];
  for (const item of value) {
    if (typeof item !== "string" || item.length === 0 || item !== item.trim()) {
      return null;
    }
    result.push(item);
  }
  return result;
}

function parseRequest(value: unknown): ActuationRequest | RequestBlocked {
  const request = asRecord(value);
  if (request === null || !hasOnlyKeys(request, REQUEST_KEYS)) {
    return blocked(
      "INVALID_REQUEST",
      "ACTUATION_REQUEST must be an object containing only canonical fields."
    );
  }

  if (request.kind !== "ACTUATION_REQUEST") {
    return blocked("INVALID_REQUEST", "kind must be ACTUATION_REQUEST.");
  }

  const workItem = asRecord(request.workItem);
  if (
    workItem === null ||
    !hasOnlyKeys(workItem, WORK_ITEM_KEYS) ||
    typeof workItem.repository !== "string" ||
    !REPOSITORY_PATTERN.test(workItem.repository) ||
    typeof workItem.number !== "number" ||
    !Number.isInteger(workItem.number) ||
    workItem.number <= 0
  ) {
    return blocked(
      "INVALID_REQUEST",
      "workItem must contain an explicit repository and positive Issue number."
    );
  }

  const authorization = persistentReference(request.authorization);
  if (authorization === null) {
    return blocked(
      "AUTHORIZATION_REQUIRED",
      "authorization must be one demonstrable persistent GitHub authority reference."
    );
  }

  let expectedRevision: string | null;
  if (request.expectedRevision === null) {
    expectedRevision = null;
  } else if (
    typeof request.expectedRevision === "string" &&
    SHA_PATTERN.test(request.expectedRevision)
  ) {
    expectedRevision = request.expectedRevision;
  } else {
    return blocked(
      "INVALID_REQUEST",
      "expectedRevision must be an exact 40-hex SHA or null for NONE."
    );
  }

  if (
    request.targetActor !== "IMPLEMENTER_WEB" &&
    request.targetActor !== "SUPERVISOR_WEB"
  ) {
    return blocked(
      "INVALID_REQUEST",
      "targetActor must use the canonical closed actor vocabulary."
    );
  }

  if (
    request.handoffKind !== "IMPLEMENTER_WORK_ITEM" &&
    request.handoffKind !== "SUPERVISOR_REVIEW"
  ) {
    return blocked(
      "INVALID_REQUEST",
      "handoffKind must use the canonical closed handoff vocabulary."
    );
  }

  if (typeof request.humanRequired !== "boolean") {
    return blocked("INVALID_REQUEST", "humanRequired must be boolean.");
  }

  const humanAuthorization = nullablePersistentReference(request.humanAuthorization);
  if (humanAuthorization === undefined) {
    return blocked(
      "HUMAN_AUTHORIZATION_REQUIRED",
      "humanAuthorization must be one demonstrable persistent GitHub authority reference or null for NONE."
    );
  }

  if (
    request.externalEffect !== "NONE" &&
    request.externalEffect !== "PROMPT_DELIVERY"
  ) {
    return blocked(
      "INVALID_REQUEST",
      "externalEffect must use the canonical closed vocabulary."
    );
  }

  if (request.deliveryLimit !== 0 && request.deliveryLimit !== 1) {
    return blocked("INVALID_REQUEST", "deliveryLimit must be 0 or 1.");
  }

  const contextRefs = stringArray(request.contextRefs);
  if (contextRefs === null) {
    return blocked(
      "INVALID_REQUEST",
      "contextRefs must be an array of explicit non-empty references."
    );
  }

  const stopConditions = stringArray(request.stopConditions);
  if (stopConditions === null) {
    return blocked(
      "INVALID_REQUEST",
      "stopConditions must be an array of explicit observable conditions."
    );
  }

  return {
    kind: "ACTUATION_REQUEST",
    workItem: {
      repository: workItem.repository,
      number: workItem.number
    },
    authorization,
    expectedRevision,
    targetActor: request.targetActor,
    handoffKind: request.handoffKind,
    humanRequired: request.humanRequired,
    humanAuthorization,
    externalEffect: request.externalEffect,
    deliveryLimit: request.deliveryLimit,
    contextRefs,
    stopConditions
  };
}

export function validateActuationRequest(
  value: unknown,
  context: WorkflowContext
): ActuationRequestValidationResult {
  const request = parseRequest(value);
  if ("result" in request) return request;

  if (
    request.workItem.repository !== context.repository ||
    request.workItem.number !== context.workItemRef.number
  ) {
    return blocked(
      "CONTEXT_MISMATCH",
      "ACTUATION_REQUEST repository and Work Item must match factual WorkflowContext."
    );
  }

  const applicableReferences = factualPersistentReferences(context);
  if (!applicableReferences.has(request.authorization)) {
    return blocked(
      "AUTHORIZATION_NOT_APPLICABLE",
      "authorization must exactly match a persistent factual reference observed in the current WorkflowContext."
    );
  }

  if (
    request.humanAuthorization !== null &&
    !applicableReferences.has(request.humanAuthorization)
  ) {
    return blocked(
      "HUMAN_AUTHORIZATION_NOT_APPLICABLE",
      "humanAuthorization must exactly match a persistent factual reference observed in the current WorkflowContext."
    );
  }

  if (
    (request.handoffKind === "IMPLEMENTER_WORK_ITEM" &&
      request.targetActor !== "IMPLEMENTER_WEB") ||
    (request.handoffKind === "SUPERVISOR_REVIEW" &&
      request.targetActor !== "SUPERVISOR_WEB")
  ) {
    return blocked(
      "ACTOR_HANDOFF_MISMATCH",
      "handoffKind and targetActor do not match the canonical mapping."
    );
  }

  if (request.humanRequired && request.humanAuthorization === null) {
    return blocked(
      "HUMAN_AUTHORIZATION_REQUIRED",
      "HUMAN REQUIRED cannot be satisfied without explicit Human authorization."
    );
  }

  if (request.handoffKind === "SUPERVISOR_REVIEW") {
    if (context.prRef === null || context.pr === null || context.revisionRef === null) {
      return blocked(
        "PR_REQUIRED",
        "SUPERVISOR_REVIEW requires an explicit factual PR context."
      );
    }

    if (request.expectedRevision === null) {
      return blocked(
        "EXPECTED_REVISION_REQUIRED",
        "SUPERVISOR_REVIEW requires an explicit expected revision SHA."
      );
    }

    if (request.expectedRevision !== context.revisionRef) {
      return blocked(
        "REVISION_MISMATCH",
        "SUPERVISOR_REVIEW expected revision must exactly match factual WorkflowContext revisionRef."
      );
    }
  }

  if (
    (request.externalEffect === "NONE" && request.deliveryLimit !== 0) ||
    (request.externalEffect === "PROMPT_DELIVERY" && request.deliveryLimit !== 1)
  ) {
    return blocked(
      "EXTERNAL_EFFECT_MISMATCH",
      "externalEffect and deliveryLimit must match the canonical NONE/0 or PROMPT_DELIVERY/1 combinations."
    );
  }

  return {
    result: "REQUEST_READY",
    request
  };
}
