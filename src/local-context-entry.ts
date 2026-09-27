import type { GitHubReaderInput } from "./github-reader.js";
import {
  readIntegratedContext,
  type IntegratedContextDependencies,
  type IntegratedContextResult
} from "./integrated-context-runner.js";

export class LocalContextInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LocalContextInputError";
  }
}

export type SafeContextEvidence =
  | {
      result: "CONTEXT_READY";
      repository: string;
      workItemNumber: number;
      prNumber: number | null;
      revisionRef: string | null;
      sourceId: string;
      workItemUrl: string;
      prUrl: string | null;
      workItemUpdatedAt: string;
      prUpdatedAt: string | null;
      issueCommentCount: number;
      prCommentCount: number;
      contextRefCount: number;
      retrievedAt: string;
      readOnly: true;
      writeEffects: "NONE";
    }
  | {
      result: "CONTEXT_BLOCKED" | "CONTEXT_FETCH_FAILED";
      repository: string;
      workItemNumber: number;
      prNumber: number | null;
      revisionRef: null;
      errorCode: string;
      httpStatus?: number;
      readOnly: true;
      writeEffects: "NONE";
    };

function parsePositiveInteger(value: string, flag: string): number {
  if (!/^[1-9][0-9]*$/.test(value)) {
    throw new LocalContextInputError(`${flag} must be a positive integer.`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new LocalContextInputError(`${flag} is outside the supported integer range.`);
  }
  return parsed;
}

export function parseLocalContextArgs(args: string[]): GitHubReaderInput {
  let repository: string | undefined;
  let workItemNumber: number | undefined;
  let prNumber: number | undefined;

  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];

    if (flag === undefined || value === undefined || value.startsWith("--")) {
      throw new LocalContextInputError(`${flag ?? "argument"} requires an explicit value.`);
    }

    if (flag === "--repository") {
      if (repository !== undefined) {
        throw new LocalContextInputError("--repository may be supplied only once.");
      }
      repository = value;
      continue;
    }

    if (flag === "--issue") {
      if (workItemNumber !== undefined) {
        throw new LocalContextInputError("--issue may be supplied only once.");
      }
      workItemNumber = parsePositiveInteger(value, "--issue");
      continue;
    }

    if (flag === "--pr") {
      if (prNumber !== undefined) {
        throw new LocalContextInputError("--pr may be supplied only once.");
      }
      prNumber = parsePositiveInteger(value, "--pr");
      continue;
    }

    throw new LocalContextInputError(`Unknown argument: ${flag}.`);
  }

  if (repository === undefined || repository.length === 0) {
    throw new LocalContextInputError("--repository owner/name is required.");
  }
  if (workItemNumber === undefined) {
    throw new LocalContextInputError("--issue is required.");
  }

  return {
    repository,
    workItemNumber,
    ...(prNumber === undefined ? {} : { prNumber })
  };
}

export function toSafeContextEvidence(
  input: GitHubReaderInput,
  result: IntegratedContextResult
): SafeContextEvidence {
  if (result.result === "CONTEXT_READY") {
    return {
      result: "CONTEXT_READY",
      repository: result.context.repository,
      workItemNumber: result.context.workItemRef.number,
      prNumber: result.context.prRef?.number ?? null,
      revisionRef: result.context.revisionRef,
      sourceId: result.context.sourceId,
      workItemUrl: result.context.workItemRef.htmlUrl,
      prUrl: result.context.prRef?.htmlUrl ?? null,
      workItemUpdatedAt: result.context.workItem.updatedAt,
      prUpdatedAt: result.context.pr?.updatedAt ?? null,
      issueCommentCount: result.context.workItem.comments.length,
      prCommentCount: result.context.pr?.comments.length ?? 0,
      contextRefCount: result.context.contextRefs.length,
      retrievedAt: result.context.retrievedAt,
      readOnly: true,
      writeEffects: "NONE"
    };
  }

  return {
    result: result.result,
    repository: input.repository,
    workItemNumber: input.workItemNumber,
    prNumber: input.prNumber ?? null,
    revisionRef: null,
    errorCode: result.errorCode,
    ...(result.result === "CONTEXT_FETCH_FAILED" && result.httpStatus !== undefined
      ? { httpStatus: result.httpStatus }
      : {}),
    readOnly: true,
    writeEffects: "NONE"
  };
}

export async function runLocalContext(
  args: string[],
  dependencies: IntegratedContextDependencies = {}
): Promise<SafeContextEvidence> {
  const input = parseLocalContextArgs(args);
  const result = await readIntegratedContext(input, dependencies);
  return toSafeContextEvidence(input, result);
}
