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

export function mapReaderResult(
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
  return mapReaderResult(readerResult, dependencies.clock ?? (() => new Date()));
}
