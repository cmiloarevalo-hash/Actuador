import type {
  GitHubComment,
  GitHubIssue,
  GitHubPullRequest,
  GitHubReaderResult
} from "./github-reader.js";

export interface WorkflowContextReference {
  kind: "issue_comment" | "pull_request_comment";
  id: number;
  htmlUrl: string;
}

export interface WorkflowWorkItem {
  number: number;
  title: string;
  state: string;
  stateReason: string | null;
  body: string | null;
  htmlUrl: string;
  updatedAt: string;
  comments: GitHubComment[];
}

export interface WorkflowPullRequest {
  number: number;
  state: string;
  draft: boolean;
  merged: boolean;
  base: { ref: string; sha: string };
  head: { ref: string; sha: string };
  title: string;
  body: string | null;
  htmlUrl: string;
  updatedAt: string;
  comments: GitHubComment[];
}

export interface WorkflowContext {
  sourceId: string;
  repository: string;
  workItemRef: { number: number; htmlUrl: string };
  workItem: WorkflowWorkItem;
  prRef: { number: number; htmlUrl: string } | null;
  pr: WorkflowPullRequest | null;
  contextRefs: WorkflowContextReference[];
  revisionRef: string | null;
  retrievedAt: string;
}

export interface ContextReady {
  result: "CONTEXT_READY";
  context: WorkflowContext;
}

export interface ContextBlocked {
  result: "CONTEXT_BLOCKED";
  errorCode: string;
  detail: string;
  sourceResult?: "FETCH_BLOCKED" | "FETCH_FAILED";
}

export type WorkflowContextResult = ContextReady | ContextBlocked;

class ContextAdapterError extends Error {
  constructor(readonly errorCode: string, detail: string) {
    super(detail);
    this.name = "ContextAdapterError";
  }
}

function requireNonEmpty(value: string, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ContextAdapterError("INVALID_CONTEXT", `${label} must be a non-empty string.`);
  }
  return value;
}

function requirePositiveInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new ContextAdapterError("INVALID_CONTEXT", `${label} must be a positive integer.`);
  }
  return value;
}

function requireAbsoluteUrl(value: string, label: string): string {
  requireNonEmpty(value, label);
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") {
      throw new Error("unsupported protocol");
    }
  } catch {
    throw new ContextAdapterError("INVALID_CONTEXT", `${label} must be an absolute HTTPS URL.`);
  }
  return value;
}

function copyComment(comment: GitHubComment, label: string): GitHubComment {
  return {
    id: requirePositiveInteger(comment.id, `${label}.id`),
    author: requireNonEmpty(comment.author, `${label}.author`),
    body: comment.body,
    createdAt: requireNonEmpty(comment.createdAt, `${label}.createdAt`),
    updatedAt: requireNonEmpty(comment.updatedAt, `${label}.updatedAt`),
    htmlUrl: requireAbsoluteUrl(comment.htmlUrl, `${label}.htmlUrl`)
  };
}

function copyComments(comments: GitHubComment[], label: string): GitHubComment[] {
  if (!Array.isArray(comments)) {
    throw new ContextAdapterError("INVALID_CONTEXT", `${label} must be an array.`);
  }
  return comments.map((comment, index) => copyComment(comment, `${label}[${index}]`));
}

function copyIssue(issue: GitHubIssue, comments: GitHubComment[]): WorkflowWorkItem {
  return {
    number: requirePositiveInteger(issue.number, "issue.number"),
    title: requireNonEmpty(issue.title, "issue.title"),
    state: requireNonEmpty(issue.state, "issue.state"),
    stateReason: issue.stateReason,
    body: issue.body,
    htmlUrl: requireAbsoluteUrl(issue.htmlUrl, "issue.htmlUrl"),
    updatedAt: requireNonEmpty(issue.updatedAt, "issue.updatedAt"),
    comments
  };
}

function copyPullRequest(
  pullRequest: GitHubPullRequest,
  comments: GitHubComment[]
): WorkflowPullRequest {
  return {
    number: requirePositiveInteger(pullRequest.number, "pullRequest.number"),
    state: requireNonEmpty(pullRequest.state, "pullRequest.state"),
    draft: pullRequest.draft,
    merged: pullRequest.merged,
    base: {
      ref: requireNonEmpty(pullRequest.base.ref, "pullRequest.base.ref"),
      sha: requireNonEmpty(pullRequest.base.sha, "pullRequest.base.sha")
    },
    head: {
      ref: requireNonEmpty(pullRequest.head.ref, "pullRequest.head.ref"),
      sha: requireNonEmpty(pullRequest.head.sha, "pullRequest.head.sha")
    },
    title: requireNonEmpty(pullRequest.title, "pullRequest.title"),
    body: pullRequest.body,
    htmlUrl: requireAbsoluteUrl(pullRequest.htmlUrl, "pullRequest.htmlUrl"),
    updatedAt: requireNonEmpty(pullRequest.updatedAt, "pullRequest.updatedAt"),
    comments
  };
}

function blockedFromSource(readerResult: Exclude<GitHubReaderResult, { result: "FETCH_READY" }>): ContextBlocked {
  return {
    result: "CONTEXT_BLOCKED",
    errorCode: "SOURCE_NOT_READY",
    detail: `GitHub Reader returned ${readerResult.result}.`,
    sourceResult: readerResult.result
  };
}

export function normalizeWorkflowContext(
  readerResult: GitHubReaderResult,
  clock: () => Date = () => new Date()
): WorkflowContextResult {
  if (readerResult.result !== "FETCH_READY") {
    return blockedFromSource(readerResult);
  }

  try {
    const data = readerResult.data;
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(data.repository)) {
      throw new ContextAdapterError("INVALID_CONTEXT", "repository must be an explicit owner/name reference.");
    }

    const issueComments = copyComments(data.issueComments, "issueComments");
    const workItem = copyIssue(data.issue, issueComments);

    if (data.pullRequest === null && data.pullRequestComments.length !== 0) {
      throw new ContextAdapterError(
        "INCONSISTENT_CONTEXT",
        "pullRequestComments cannot be present when pullRequest is null."
      );
    }

    const prComments = copyComments(data.pullRequestComments, "pullRequestComments");
    const pr = data.pullRequest === null ? null : copyPullRequest(data.pullRequest, prComments);

    const timestamp = clock();
    if (!(timestamp instanceof Date) || Number.isNaN(timestamp.getTime())) {
      throw new ContextAdapterError("INVALID_CONTEXT", "retrievedAt clock returned an invalid date.");
    }

    const contextRefs: WorkflowContextReference[] = [
      ...issueComments.map((comment) => ({
        kind: "issue_comment" as const,
        id: comment.id,
        htmlUrl: comment.htmlUrl
      })),
      ...prComments.map((comment) => ({
        kind: "pull_request_comment" as const,
        id: comment.id,
        htmlUrl: comment.htmlUrl
      }))
    ];

    return {
      result: "CONTEXT_READY",
      context: {
        sourceId: workItem.htmlUrl,
        repository: data.repository,
        workItemRef: {
          number: workItem.number,
          htmlUrl: workItem.htmlUrl
        },
        workItem,
        prRef: pr === null ? null : {
          number: pr.number,
          htmlUrl: pr.htmlUrl
        },
        pr,
        contextRefs,
        revisionRef: pr === null ? null : pr.head.sha,
        retrievedAt: timestamp.toISOString()
      }
    };
  } catch (error) {
    if (error instanceof ContextAdapterError) {
      return {
        result: "CONTEXT_BLOCKED",
        errorCode: error.errorCode,
        detail: error.message
      };
    }
    return {
      result: "CONTEXT_BLOCKED",
      errorCode: "ADAPTER_ERROR",
      detail: error instanceof Error ? error.message : String(error)
    };
  }
}
