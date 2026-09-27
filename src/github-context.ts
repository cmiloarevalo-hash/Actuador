export const GITHUB_API_VERSION = "2026-03-10";
export const GITHUB_ACCEPT = "application/vnd.github+json";

const GITHUB_API_ROOT = "https://api.github.com";
const COMMENTS_PER_PAGE = 100;
const MAX_COMMENT_PAGES = 100;

export interface GithubContextInput {
  repository: string;
  workItemNumber: number;
  prNumber?: number | null;
}

export interface GithubComment {
  id: number;
  author: string;
  body: string | null;
  createdAt: string;
  updatedAt: string;
  htmlUrl: string;
}

export interface GithubIssueContext {
  number: number;
  title: string;
  state: string;
  stateReason: string | null;
  body: string | null;
  htmlUrl: string;
  updatedAt: string;
  comments: GithubComment[];
}

export interface GithubPullRequestContext {
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
  comments: GithubComment[];
}

export interface GithubReadOnlyContext {
  sourceId: string;
  repository: string;
  workItemRef: string;
  workItem: GithubIssueContext;
  prRef: string | null;
  pr: GithubPullRequestContext | null;
  contextRefs: string[];
  revisionRef: string | null;
  retrievedAt: string;
}

export interface GithubFetchFailure {
  result: "CONTEXT_FETCH_FAILED";
  errorCode: string;
  detail: string;
  httpStatus?: number;
  rateLimitRemaining?: string;
  rateLimitReset?: string;
}

export interface GithubBlocked {
  result: "CONTEXT_BLOCKED";
  errorCode: string;
  detail: string;
}

export interface GithubReady {
  result: "CONTEXT_READY";
  context: GithubReadOnlyContext;
}

export type GithubContextResult = GithubReady | GithubBlocked | GithubFetchFailure;
export type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

class ContextReadError extends Error {
  constructor(
    readonly result: "CONTEXT_BLOCKED" | "CONTEXT_FETCH_FAILED",
    readonly code: string,
    message: string,
    readonly metadata: {
      httpStatus?: number;
      rateLimitRemaining?: string;
      rateLimitReset?: string;
    } = {}
  ) {
    super(message);
    this.name = "ContextReadError";
  }
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ContextReadError("CONTEXT_FETCH_FAILED", "INVALID_RESPONSE_SCHEMA", `${label} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function stringField(source: Record<string, unknown>, key: string, label: string): string {
  const value = source[key];
  if (typeof value !== "string") {
    throw new ContextReadError("CONTEXT_FETCH_FAILED", "INVALID_RESPONSE_SCHEMA", `${label}.${key} must be a string.`);
  }
  return value;
}

function nullableStringField(source: Record<string, unknown>, key: string, label: string): string | null {
  const value = source[key];
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    throw new ContextReadError("CONTEXT_FETCH_FAILED", "INVALID_RESPONSE_SCHEMA", `${label}.${key} must be a string or null.`);
  }
  return value;
}

function numberField(source: Record<string, unknown>, key: string, label: string): number {
  const value = source[key];
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new ContextReadError("CONTEXT_FETCH_FAILED", "INVALID_RESPONSE_SCHEMA", `${label}.${key} must be an integer.`);
  }
  return value;
}

function booleanField(source: Record<string, unknown>, key: string, label: string): boolean {
  const value = source[key];
  if (typeof value !== "boolean") {
    throw new ContextReadError("CONTEXT_FETCH_FAILED", "INVALID_RESPONSE_SCHEMA", `${label}.${key} must be a boolean.`);
  }
  return value;
}

function validateInput(input: GithubContextInput): void {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(input.repository)) {
    throw new ContextReadError("CONTEXT_BLOCKED", "INVALID_REPOSITORY", "repository must be an explicit owner/name reference.");
  }
  if (!Number.isInteger(input.workItemNumber) || input.workItemNumber <= 0) {
    throw new ContextReadError("CONTEXT_BLOCKED", "INVALID_WORK_ITEM", "workItemNumber must be a positive integer.");
  }
  if (input.prNumber !== undefined && input.prNumber !== null && (!Number.isInteger(input.prNumber) || input.prNumber <= 0)) {
    throw new ContextReadError("CONTEXT_BLOCKED", "INVALID_PR", "prNumber must be a positive integer or null.");
  }
}

function repoPath(repository: string): string {
  const [owner, name] = repository.split("/");
  return `${encodeURIComponent(owner!)}\/${encodeURIComponent(name!)}`;
}

async function getJson(fetchImpl: FetchLike, url: string): Promise<{ body: unknown; response: Response }> {
  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: "GET",
      headers: {
        Accept: GITHUB_ACCEPT,
        "X-GitHub-Api-Version": GITHUB_API_VERSION
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ContextReadError("CONTEXT_FETCH_FAILED", "NETWORK_ERROR", `GitHub request failed: ${message}`);
  }

  if (!response.ok) {
    const remaining = response.headers.get("x-ratelimit-remaining") ?? undefined;
    const reset = response.headers.get("x-ratelimit-reset") ?? undefined;
    const rateLimited = response.status === 429 || (response.status === 403 && remaining === "0");
    const code = rateLimited ? "RATE_LIMITED" : response.status === 404 ? "NOT_FOUND" : `HTTP_${response.status}`;
    throw new ContextReadError(
      "CONTEXT_FETCH_FAILED",
      code,
      `GitHub returned HTTP ${response.status}.`,
      {
        httpStatus: response.status,
        ...(remaining !== undefined ? { rateLimitRemaining: remaining } : {}),
        ...(reset !== undefined ? { rateLimitReset: reset } : {})
      }
    );
  }

  try {
    return { body: await response.json(), response };
  } catch {
    throw new ContextReadError("CONTEXT_FETCH_FAILED", "INVALID_JSON", "GitHub returned an invalid JSON response.");
  }
}

function parseComment(value: unknown, label: string): GithubComment {
  const source = asRecord(value, label);
  const user = asRecord(source.user, `${label}.user`);
  return {
    id: numberField(source, "id", label),
    author: stringField(user, "login", `${label}.user`),
    body: nullableStringField(source, "body", label),
    createdAt: stringField(source, "created_at", label),
    updatedAt: stringField(source, "updated_at", label),
    htmlUrl: stringField(source, "html_url", label)
  };
}

async function fetchComments(fetchImpl: FetchLike, repository: string, number: number): Promise<GithubComment[]> {
  const comments: GithubComment[] = [];
  for (let page = 1; page <= MAX_COMMENT_PAGES; page += 1) {
    const url = `${GITHUB_API_ROOT}/repos/${repoPath(repository)}/issues/${number}/comments?per_page=${COMMENTS_PER_PAGE}&page=${page}`;
    const { body } = await getJson(fetchImpl, url);
    if (!Array.isArray(body)) {
      throw new ContextReadError("CONTEXT_FETCH_FAILED", "INVALID_RESPONSE_SCHEMA", "GitHub comments response must be an array.");
    }
    const offset = comments.length;
    body.forEach((comment, index) => comments.push(parseComment(comment, `comments[${offset + index}]`)));
    if (body.length < COMMENTS_PER_PAGE) return comments;
  }
  throw new ContextReadError("CONTEXT_BLOCKED", "PAGINATION_LIMIT", `Comment pagination exceeded ${MAX_COMMENT_PAGES} pages.`);
}

function parseIssue(value: unknown, comments: GithubComment[]): GithubIssueContext {
  const source = asRecord(value, "issue");
  if (source.pull_request !== undefined) {
    throw new ContextReadError("CONTEXT_BLOCKED", "WORK_ITEM_IS_PULL_REQUEST", "workItemNumber resolved to a pull request, not an issue.");
  }
  return {
    number: numberField(source, "number", "issue"),
    title: stringField(source, "title", "issue"),
    state: stringField(source, "state", "issue"),
    stateReason: nullableStringField(source, "state_reason", "issue"),
    body: nullableStringField(source, "body", "issue"),
    htmlUrl: stringField(source, "html_url", "issue"),
    updatedAt: stringField(source, "updated_at", "issue"),
    comments
  };
}

function parsePullRequest(value: unknown, comments: GithubComment[]): GithubPullRequestContext {
  const source = asRecord(value, "pullRequest");
  const base = asRecord(source.base, "pullRequest.base");
  const head = asRecord(source.head, "pullRequest.head");
  return {
    number: numberField(source, "number", "pullRequest"),
    state: stringField(source, "state", "pullRequest"),
    draft: booleanField(source, "draft", "pullRequest"),
    merged: booleanField(source, "merged", "pullRequest"),
    base: {
      ref: stringField(base, "ref", "pullRequest.base"),
      sha: stringField(base, "sha", "pullRequest.base")
    },
    head: {
      ref: stringField(head, "ref", "pullRequest.head"),
      sha: stringField(head, "sha", "pullRequest.head")
    },
    title: stringField(source, "title", "pullRequest"),
    body: nullableStringField(source, "body", "pullRequest"),
    htmlUrl: stringField(source, "html_url", "pullRequest"),
    updatedAt: stringField(source, "updated_at", "pullRequest"),
    comments
  };
}

function failure(error: ContextReadError): GithubBlocked | GithubFetchFailure {
  if (error.result === "CONTEXT_BLOCKED") {
    return { result: error.result, errorCode: error.code, detail: error.message };
  }
  return {
    result: error.result,
    errorCode: error.code,
    detail: error.message,
    ...(error.metadata.httpStatus !== undefined ? { httpStatus: error.metadata.httpStatus } : {}),
    ...(error.metadata.rateLimitRemaining !== undefined ? { rateLimitRemaining: error.metadata.rateLimitRemaining } : {}),
    ...(error.metadata.rateLimitReset !== undefined ? { rateLimitReset: error.metadata.rateLimitReset } : {})
  };
}

export async function readGithubContext(
  input: GithubContextInput,
  options: { fetchImpl?: FetchLike; now?: () => Date } = {}
): Promise<GithubContextResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? (() => new Date());

  try {
    validateInput(input);
    const issueUrl = `${GITHUB_API_ROOT}/repos/${repoPath(input.repository)}/issues/${input.workItemNumber}`;
    const [{ body: issueBody }, issueComments] = await Promise.all([
      getJson(fetchImpl, issueUrl),
      fetchComments(fetchImpl, input.repository, input.workItemNumber)
    ]);
    const workItem = parseIssue(issueBody, issueComments);
    if (workItem.number !== input.workItemNumber) {
      throw new ContextReadError("CONTEXT_BLOCKED", "REFERENCE_MISMATCH", "GitHub issue number does not match the requested workItemNumber.");
    }

    let pr: GithubPullRequestContext | null = null;
    if (input.prNumber !== undefined && input.prNumber !== null) {
      const prUrl = `${GITHUB_API_ROOT}/repos/${repoPath(input.repository)}/pulls/${input.prNumber}`;
      const [{ body: prBody }, prComments] = await Promise.all([
        getJson(fetchImpl, prUrl),
        fetchComments(fetchImpl, input.repository, input.prNumber)
      ]);
      pr = parsePullRequest(prBody, prComments);
      if (pr.number !== input.prNumber) {
        throw new ContextReadError("CONTEXT_BLOCKED", "REFERENCE_MISMATCH", "GitHub pull request number does not match the requested prNumber.");
      }
    }

    const contextRefs = [
      workItem.htmlUrl,
      ...workItem.comments.map((comment) => comment.htmlUrl),
      ...(pr ? [pr.htmlUrl, ...pr.comments.map((comment) => comment.htmlUrl)] : [])
    ];

    return {
      result: "CONTEXT_READY",
      context: {
        sourceId: `github:${input.repository}:issue:${workItem.number}${pr ? `:pr:${pr.number}` : ""}`,
        repository: input.repository,
        workItemRef: `${input.repository}#${workItem.number}`,
        workItem,
        prRef: pr ? `${input.repository}#${pr.number}` : null,
        pr,
        contextRefs,
        revisionRef: pr?.head.sha ?? null,
        retrievedAt: now().toISOString()
      }
    };
  } catch (error) {
    if (error instanceof ContextReadError) return failure(error);
    const message = error instanceof Error ? error.message : String(error);
    return { result: "CONTEXT_FETCH_FAILED", errorCode: "UNEXPECTED_ERROR", detail: message };
  }
}
