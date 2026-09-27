export const GITHUB_API_VERSION = "2026-03-10";
export const GITHUB_ACCEPT = "application/vnd.github+json";

const GITHUB_API_ROOT = "https://api.github.com";
const COMMENTS_PER_PAGE = 100;
const MAX_COMMENT_PAGES = 100;

export interface GitHubReaderInput {
  repository: string;
  workItemNumber: number;
  prNumber?: number | null;
}

export interface GitHubIssue {
  number: number;
  title: string;
  state: string;
  stateReason: string | null;
  body: string | null;
  htmlUrl: string;
  updatedAt: string;
}

export interface GitHubPullRequest {
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
}

export interface GitHubComment {
  id: number;
  author: string;
  body: string | null;
  createdAt: string;
  updatedAt: string;
  htmlUrl: string;
}

export interface GitHubReadData {
  repository: string;
  issue: GitHubIssue;
  issueComments: GitHubComment[];
  pullRequest: GitHubPullRequest | null;
  pullRequestComments: GitHubComment[];
}

export interface GitHubFetchReady {
  result: "FETCH_READY";
  data: GitHubReadData;
}

export interface GitHubFetchBlocked {
  result: "FETCH_BLOCKED";
  errorCode: string;
  detail: string;
  httpStatus?: number;
  rateLimitRemaining?: string;
  rateLimitReset?: string;
}

export interface GitHubFetchFailed {
  result: "FETCH_FAILED";
  errorCode: string;
  detail: string;
  httpStatus?: number;
}

export type GitHubReaderResult = GitHubFetchReady | GitHubFetchBlocked | GitHubFetchFailed;
export type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

class GitHubReadError extends Error {
  constructor(
    readonly result: "FETCH_BLOCKED" | "FETCH_FAILED",
    readonly errorCode: string,
    detail: string,
    readonly metadata: {
      httpStatus?: number;
      rateLimitRemaining?: string;
      rateLimitReset?: string;
    } = {}
  ) {
    super(detail);
    this.name = "GitHubReadError";
  }
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new GitHubReadError("FETCH_FAILED", "INVALID_RESPONSE_SCHEMA", `${label} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function stringField(source: Record<string, unknown>, key: string, label: string): string {
  const value = source[key];
  if (typeof value !== "string") {
    throw new GitHubReadError("FETCH_FAILED", "INVALID_RESPONSE_SCHEMA", `${label}.${key} must be a string.`);
  }
  return value;
}

function nullableStringField(source: Record<string, unknown>, key: string, label: string): string | null {
  const value = source[key];
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    throw new GitHubReadError("FETCH_FAILED", "INVALID_RESPONSE_SCHEMA", `${label}.${key} must be a string or null.`);
  }
  return value;
}

function integerField(source: Record<string, unknown>, key: string, label: string): number {
  const value = source[key];
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new GitHubReadError("FETCH_FAILED", "INVALID_RESPONSE_SCHEMA", `${label}.${key} must be an integer.`);
  }
  return value;
}

function booleanField(source: Record<string, unknown>, key: string, label: string): boolean {
  const value = source[key];
  if (typeof value !== "boolean") {
    throw new GitHubReadError("FETCH_FAILED", "INVALID_RESPONSE_SCHEMA", `${label}.${key} must be a boolean.`);
  }
  return value;
}

function validateInput(input: GitHubReaderInput): void {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(input.repository)) {
    throw new GitHubReadError("FETCH_BLOCKED", "INVALID_REPOSITORY", "repository must be an explicit owner/name reference.");
  }
  if (!Number.isInteger(input.workItemNumber) || input.workItemNumber <= 0) {
    throw new GitHubReadError("FETCH_BLOCKED", "INVALID_WORK_ITEM", "workItemNumber must be a positive integer.");
  }
  if (input.prNumber !== undefined && input.prNumber !== null && (!Number.isInteger(input.prNumber) || input.prNumber <= 0)) {
    throw new GitHubReadError("FETCH_BLOCKED", "INVALID_PR", "prNumber must be a positive integer or null.");
  }
}

function repositoryPath(repository: string): string {
  const [owner, name] = repository.split("/");
  return `${encodeURIComponent(owner!)}\/${encodeURIComponent(name!)}`;
}

async function getJson(fetchImpl: FetchLike, url: string): Promise<unknown> {
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
    throw new GitHubReadError("FETCH_FAILED", "NETWORK_ERROR", `GitHub request failed: ${message}`);
  }

  if (!response.ok) {
    const remaining = response.headers.get("x-ratelimit-remaining") ?? undefined;
    const reset = response.headers.get("x-ratelimit-reset") ?? undefined;
    const rateLimited = response.status === 429 || (response.status === 403 && remaining === "0");

    if (rateLimited) {
      throw new GitHubReadError("FETCH_BLOCKED", "RATE_LIMITED", `GitHub returned HTTP ${response.status}.`, {
        httpStatus: response.status,
        ...(remaining === undefined ? {} : { rateLimitRemaining: remaining }),
        ...(reset === undefined ? {} : { rateLimitReset: reset })
      });
    }

    if (response.status === 403) {
      throw new GitHubReadError("FETCH_BLOCKED", "ACCESS_BLOCKED", "GitHub returned HTTP 403.", {
        httpStatus: 403
      });
    }

    throw new GitHubReadError(
      "FETCH_FAILED",
      response.status === 404 ? "NOT_FOUND" : `HTTP_${response.status}`,
      `GitHub returned HTTP ${response.status}.`,
      { httpStatus: response.status }
    );
  }

  try {
    return await response.json();
  } catch {
    throw new GitHubReadError("FETCH_FAILED", "INVALID_JSON", "GitHub returned an invalid JSON response.");
  }
}

function parseIssue(value: unknown, expectedNumber: number): GitHubIssue {
  const source = asRecord(value, "issue");
  if (source.pull_request !== undefined) {
    throw new GitHubReadError("FETCH_BLOCKED", "WORK_ITEM_IS_PULL_REQUEST", "workItemNumber resolved to a pull request, not an issue.");
  }
  const number = integerField(source, "number", "issue");
  if (number !== expectedNumber) {
    throw new GitHubReadError("FETCH_FAILED", "REFERENCE_MISMATCH", "GitHub Issue number does not match the explicit reference.");
  }
  return {
    number,
    title: stringField(source, "title", "issue"),
    state: stringField(source, "state", "issue"),
    stateReason: nullableStringField(source, "state_reason", "issue"),
    body: nullableStringField(source, "body", "issue"),
    htmlUrl: stringField(source, "html_url", "issue"),
    updatedAt: stringField(source, "updated_at", "issue")
  };
}

function parsePullRequest(value: unknown, expectedNumber: number): GitHubPullRequest {
  const source = asRecord(value, "pullRequest");
  const number = integerField(source, "number", "pullRequest");
  if (number !== expectedNumber) {
    throw new GitHubReadError("FETCH_FAILED", "REFERENCE_MISMATCH", "GitHub PR number does not match the explicit reference.");
  }
  const base = asRecord(source.base, "pullRequest.base");
  const head = asRecord(source.head, "pullRequest.head");
  return {
    number,
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
    updatedAt: stringField(source, "updated_at", "pullRequest")
  };
}

function parseComment(value: unknown, label: string): GitHubComment {
  const source = asRecord(value, label);
  const user = asRecord(source.user, `${label}.user`);
  return {
    id: integerField(source, "id", label),
    author: stringField(user, "login", `${label}.user`),
    body: nullableStringField(source, "body", label),
    createdAt: stringField(source, "created_at", label),
    updatedAt: stringField(source, "updated_at", label),
    htmlUrl: stringField(source, "html_url", label)
  };
}

async function fetchComments(fetchImpl: FetchLike, repository: string, issueOrPrNumber: number): Promise<GitHubComment[]> {
  const comments: GitHubComment[] = [];

  for (let page = 1; page <= MAX_COMMENT_PAGES; page += 1) {
    const url = `${GITHUB_API_ROOT}/repos/${repositoryPath(repository)}/issues/${issueOrPrNumber}/comments?per_page=${COMMENTS_PER_PAGE}&page=${page}`;
    const body = await getJson(fetchImpl, url);
    if (!Array.isArray(body)) {
      throw new GitHubReadError("FETCH_FAILED", "INVALID_RESPONSE_SCHEMA", "GitHub comments response must be an array.");
    }

    const offset = comments.length;
    body.forEach((comment, index) => comments.push(parseComment(comment, `comments[${offset + index}]`)));
    if (body.length < COMMENTS_PER_PAGE) return comments;
  }

  throw new GitHubReadError("FETCH_BLOCKED", "PAGINATION_LIMIT", `Comment pagination exceeded ${MAX_COMMENT_PAGES} pages.`);
}

function errorResult(error: unknown): GitHubFetchBlocked | GitHubFetchFailed {
  if (!(error instanceof GitHubReadError)) {
    return {
      result: "FETCH_FAILED",
      errorCode: "UNEXPECTED_ERROR",
      detail: error instanceof Error ? error.message : String(error)
    };
  }

  if (error.result === "FETCH_BLOCKED") {
    return {
      result: "FETCH_BLOCKED",
      errorCode: error.errorCode,
      detail: error.message,
      ...(error.metadata.httpStatus === undefined ? {} : { httpStatus: error.metadata.httpStatus }),
      ...(error.metadata.rateLimitRemaining === undefined ? {} : { rateLimitRemaining: error.metadata.rateLimitRemaining }),
      ...(error.metadata.rateLimitReset === undefined ? {} : { rateLimitReset: error.metadata.rateLimitReset })
    };
  }

  return {
    result: "FETCH_FAILED",
    errorCode: error.errorCode,
    detail: error.message,
    ...(error.metadata.httpStatus === undefined ? {} : { httpStatus: error.metadata.httpStatus })
  };
}

export async function readGitHub(
  input: GitHubReaderInput,
  fetchImpl: FetchLike = fetch
): Promise<GitHubReaderResult> {
  try {
    validateInput(input);
    const repository = repositoryPath(input.repository);

    const issueBody = await getJson(
      fetchImpl,
      `${GITHUB_API_ROOT}/repos/${repository}/issues/${input.workItemNumber}`
    );
    const issue = parseIssue(issueBody, input.workItemNumber);
    const issueComments = await fetchComments(fetchImpl, input.repository, input.workItemNumber);

    let pullRequest: GitHubPullRequest | null = null;
    let pullRequestComments: GitHubComment[] = [];

    if (input.prNumber !== undefined && input.prNumber !== null) {
      const pullRequestBody = await getJson(
        fetchImpl,
        `${GITHUB_API_ROOT}/repos/${repository}/pulls/${input.prNumber}`
      );
      pullRequest = parsePullRequest(pullRequestBody, input.prNumber);
      pullRequestComments = await fetchComments(fetchImpl, input.repository, input.prNumber);
    }

    return {
      result: "FETCH_READY",
      data: {
        repository: input.repository,
        issue,
        issueComments,
        pullRequest,
        pullRequestComments
      }
    };
  } catch (error) {
    return errorResult(error);
  }
}
