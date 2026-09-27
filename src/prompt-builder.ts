import type {
  ActuationHandoffKind,
  ActuationRequestValidationResult,
  ActuationTargetActor
} from "./actuation-request-validator.js";
import type { GitHubComment } from "./github-reader.js";
import type { WorkflowContext } from "./workflow-context-adapter.js";
import { renderImplementerWebEnvelope } from "./prompts/implementer-web.js";
import { renderSupervisorWebEnvelope } from "./prompts/supervisor-web.js";

export interface ActorAuthoredHandoffPayload {
  sourceRef: string;
  authorActor: ActuationTargetActor;
  text: string;
}

export interface SelectedPayloadSourceEvidence {
  comment: GitHubComment;
}

export interface PromptEnvelope {
  recipient: ActuationTargetActor;
  handoffKind: ActuationHandoffKind;
  payloadAuthorActor: ActuationTargetActor;
  payloadSourceRef: string;
  workItemRef: {
    repository: string;
    number: number;
    htmlUrl: string;
  };
  prRef: {
    number: number;
    htmlUrl: string;
  } | null;
  expectedRevision: string | null;
  prompt: string;
}

export interface PromptReady {
  result: "PROMPT_READY";
  envelope: PromptEnvelope;
}

export interface PromptBlocked {
  result: "PROMPT_BLOCKED";
  errorCode:
    | "REQUEST_NOT_READY"
    | "CONTEXT_MISMATCH"
    | "HANDOFF_RECIPIENT_MISMATCH"
    | "PAYLOAD_INVALID"
    | "PAYLOAD_AUTHOR_MISMATCH"
    | "PAYLOAD_SOURCE_NOT_FOUND"
    | "PAYLOAD_SOURCE_MISMATCH"
    | "REVIEW_CONTEXT_MISMATCH";
  detail: string;
}

export type PromptBuildResult = PromptReady | PromptBlocked;

function blocked(
  errorCode: PromptBlocked["errorCode"],
  detail: string
): PromptBlocked {
  return {
    result: "PROMPT_BLOCKED",
    errorCode,
    detail
  };
}

function findPersistedComment(
  sourceRef: string,
  context: WorkflowContext,
  sourceEvidence?: SelectedPayloadSourceEvidence
): GitHubComment | null {
  if (sourceEvidence !== undefined) {
    return sourceEvidence.comment.htmlUrl === sourceRef
      ? sourceEvidence.comment
      : null;
  }

  const comments = [
    ...context.workItem.comments,
    ...(context.pr?.comments ?? [])
  ];
  const matches = comments.filter((comment) => comment.htmlUrl === sourceRef);
  return matches.length === 1 ? matches[0]! : null;
}

function validatePayload(
  payload: ActorAuthoredHandoffPayload,
  expectedAuthor: ActuationTargetActor,
  context: WorkflowContext,
  sourceEvidence?: SelectedPayloadSourceEvidence
): PromptBlocked | null {
  if (
    typeof payload !== "object" ||
    payload === null ||
    typeof payload.sourceRef !== "string" ||
    payload.sourceRef.length === 0 ||
    payload.sourceRef !== payload.sourceRef.trim() ||
    typeof payload.text !== "string" ||
    payload.text.trim().length === 0 ||
    (payload.authorActor !== "IMPLEMENTER_WEB" &&
      payload.authorActor !== "SUPERVISOR_WEB")
  ) {
    return blocked(
      "PAYLOAD_INVALID",
      "Actor-authored payload must contain one explicit sourceRef, authorActor, and non-empty text."
    );
  }

  if (payload.authorActor !== expectedAuthor) {
    return blocked(
      "PAYLOAD_AUTHOR_MISMATCH",
      `Handoff requires actor-authored payload from ${expectedAuthor}.`
    );
  }

  if (sourceEvidence === undefined) {
    const contextReference = context.contextRefs.find(
      (reference) => reference.htmlUrl === payload.sourceRef
    );
    if (contextReference === undefined) {
      return blocked(
        "PAYLOAD_SOURCE_NOT_FOUND",
        "Payload sourceRef must exactly match one factual comment reference in WorkflowContext or one explicitly selected source evidence record."
      );
    }
  }

  const persisted = findPersistedComment(
    payload.sourceRef,
    context,
    sourceEvidence
  );
  if (persisted === null || persisted.body === null) {
    return blocked(
      "PAYLOAD_SOURCE_NOT_FOUND",
      "Payload sourceRef must resolve to exactly one persisted comment body in WorkflowContext or the explicitly selected source evidence record."
    );
  }

  if (persisted.body !== payload.text) {
    return blocked(
      "PAYLOAD_SOURCE_MISMATCH",
      "Actor-authored payload text must exactly match the persisted source comment body."
    );
  }

  return null;
}

export function buildRoleScopedPromptEnvelope(
  validation: ActuationRequestValidationResult,
  context: WorkflowContext,
  payload: ActorAuthoredHandoffPayload,
  sourceEvidence?: SelectedPayloadSourceEvidence
): PromptBuildResult {
  if (validation.result !== "REQUEST_READY") {
    return blocked(
      "REQUEST_NOT_READY",
      "Prompt assembly requires a REQUEST_READY validation result."
    );
  }

  const request = validation.request;
  if (
    request.workItem.repository !== context.repository ||
    request.workItem.number !== context.workItemRef.number
  ) {
    return blocked(
      "CONTEXT_MISMATCH",
      "Validated request no longer matches the supplied factual WorkflowContext."
    );
  }

  if (request.handoffKind === "IMPLEMENTER_WORK_ITEM") {
    if (request.targetActor !== "IMPLEMENTER_WEB") {
      return blocked(
        "HANDOFF_RECIPIENT_MISMATCH",
        "IMPLEMENTER_WORK_ITEM requires recipient IMPLEMENTER_WEB."
      );
    }

    const payloadBlock = validatePayload(
      payload,
      "SUPERVISOR_WEB",
      context,
      sourceEvidence
    );
    if (payloadBlock !== null) return payloadBlock;

    return {
      result: "PROMPT_READY",
      envelope: {
        recipient: "IMPLEMENTER_WEB",
        handoffKind: "IMPLEMENTER_WORK_ITEM",
        payloadAuthorActor: payload.authorActor,
        payloadSourceRef: payload.sourceRef,
        workItemRef: {
          repository: context.repository,
          number: context.workItemRef.number,
          htmlUrl: context.workItemRef.htmlUrl
        },
        prRef: null,
        expectedRevision: request.expectedRevision,
        prompt: renderImplementerWebEnvelope({
          repository: context.repository,
          workItemNumber: context.workItemRef.number,
          workItemUrl: context.workItemRef.htmlUrl,
          authorizationRef: request.authorization,
          payloadSourceRef: payload.sourceRef,
          payloadText: payload.text
        })
      }
    };
  }

  if (request.targetActor !== "SUPERVISOR_WEB") {
    return blocked(
      "HANDOFF_RECIPIENT_MISMATCH",
      "SUPERVISOR_REVIEW requires recipient SUPERVISOR_WEB."
    );
  }

  const payloadBlock = validatePayload(
    payload,
    "IMPLEMENTER_WEB",
    context,
    sourceEvidence
  );
  if (payloadBlock !== null) return payloadBlock;

  if (
    context.prRef === null ||
    context.pr === null ||
    context.revisionRef === null ||
    request.expectedRevision === null ||
    request.expectedRevision !== context.revisionRef
  ) {
    return blocked(
      "REVIEW_CONTEXT_MISMATCH",
      "SUPERVISOR_REVIEW requires the same explicit PR and exact revision already validated by M3.2."
    );
  }

  return {
    result: "PROMPT_READY",
    envelope: {
      recipient: "SUPERVISOR_WEB",
      handoffKind: "SUPERVISOR_REVIEW",
      payloadAuthorActor: payload.authorActor,
      payloadSourceRef: payload.sourceRef,
      workItemRef: {
        repository: context.repository,
        number: context.workItemRef.number,
        htmlUrl: context.workItemRef.htmlUrl
      },
      prRef: {
        number: context.prRef.number,
        htmlUrl: context.prRef.htmlUrl
      },
      expectedRevision: request.expectedRevision,
      prompt: renderSupervisorWebEnvelope({
        repository: context.repository,
        workItemNumber: context.workItemRef.number,
        workItemUrl: context.workItemRef.htmlUrl,
        authorizationRef: request.authorization,
        prNumber: context.prRef.number,
        prUrl: context.prRef.htmlUrl,
        expectedRevision: request.expectedRevision,
        payloadSourceRef: payload.sourceRef,
        payloadText: payload.text
      })
    }
  };
}
