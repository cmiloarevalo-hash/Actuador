import {
  readGitHub,
  type FetchLike,
  type GitHubReaderInput,
  type GitHubReaderResult
} from "./github-reader.js";
import {
  normalizeWorkflowContext,
  type WorkflowContext
} from "./workflow-context-adapter.js";

export interface IntegratedContextReady {
  result: "CONTEXT_READY";
  context: WorkflowContext;
}

export interface IntegratedContextBlocked {
  result: "CONTEXT_BLOCKED";
  errorCode: string;
  detail: string;
  sourceResult?: "FETCH_BLOCKED" | "CONTEXT_BLOCKED";
}

export interface IntegratedContextFetchFailed {
  result: "CONTEXT_FETCH_FAILED";
  errorCode: string;
  detail: string;
  httpStatus?: number;
}

export type IntegratedContextResult =
  | IntegratedContextReady
  | IntegratedContextBlocked
  | IntegratedContextFetchFailed;

export interface IntegratedContextDependencies {
  fetchImpl?: FetchLike;
  clock?: () => Date;
}

export type IntegratedContextEvidence =
  | {
      result: "CONTEXT_READY";
      repository: string;
      issue: number;
      pr: number | null;
      revisionRef: string | null;
      sourceId: string;
      retrievedAt: string;
      contextRefCount: number;
    }
  | {
      result: "CONTEXT_BLOCKED" | "CONTEXT_FETCH_FAILED";
      repository: string;
      issue: number;
      pr: number | null;
      errorCode: string;
      detail: string;
    };

export function integrateReaderResult(
  readerResult: GitHubReaderResult,
  clock: () => Date = () => new Date()
): IntegratedContextResult {
  if (readerResult.result === "FETCH_FAILED") {
    return {
      result: "CONTEXT_FETCH_FAILED",
      errorCode: readerResult.errorCode,
      detail: readerResult.detail,
      ...(readerResult.httpStatus === undefined ? {} : { httpStatus: readerResult.httpStatus })
    };
  }

  if (readerResult.result === "FETCH_BLOCKED") {
    return {
      result: "CONTEXT_BLOCKED",
      errorCode: readerResult.errorCode,
      detail: readerResult.detail,
      sourceResult: "FETCH_BLOCKED"
    };
  }

  const normalized = normalizeWorkflowContext(readerResult, clock);
  if (normalized.result === "CONTEXT_BLOCKED") {
    return {
      result: "CONTEXT_BLOCKED",
      errorCode: normalized.errorCode,
      detail: normalized.detail,
      sourceResult: "CONTEXT_BLOCKED"
    };
  }

  return {
    result: "CONTEXT_READY",
    context: normalized.context
  };
}

export async function readIntegratedContext(
  input: GitHubReaderInput,
  dependencies: IntegratedContextDependencies = {}
): Promise<IntegratedContextResult> {
  const readerResult = await readGitHub(input, dependencies.fetchImpl ?? fetch);
  return integrateReaderResult(readerResult, dependencies.clock ?? (() => new Date()));
}

export function summarizeIntegratedContext(
  input: GitHubReaderInput,
  result: IntegratedContextResult
): IntegratedContextEvidence {
  if (result.result === "CONTEXT_READY") {
    return {
      result: "CONTEXT_READY",
      repository: result.context.repository,
      issue: result.context.workItemRef.number,
      pr: result.context.prRef?.number ?? null,
      revisionRef: result.context.revisionRef,
      sourceId: result.context.sourceId,
      retrievedAt: result.context.retrievedAt,
      contextRefCount: result.context.contextRefs.length
    };
  }

  return {
    result: result.result,
    repository: input.repository,
    issue: input.workItemNumber,
    pr: input.prNumber ?? null,
    errorCode: result.errorCode,
    detail: result.detail
  };
}
