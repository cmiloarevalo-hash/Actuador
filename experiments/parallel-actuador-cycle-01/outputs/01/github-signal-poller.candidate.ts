// Experimental candidate only. Not wired into product code.

export interface PollCursor {
  highWaterUpdatedAt: string | null;
}

export interface IssueCommentSignal {
  id: number;
  issueUrl: string;
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
  bodyHashInput: string | null;
}

export interface PollPage {
  comments: IssueCommentSignal[];
  nextUrl: string | null;
  rateLimitRemaining: number | null;
  rateLimitResetEpochSeconds: number | null;
  retryAfterSeconds: number | null;
}

export interface PollCycleResult {
  candidates: IssueCommentSignal[];
  nextCursor: PollCursor;
  nextDelayMs: number;
}

export const DEFAULT_POLL_INTERVAL_MS = 90_000;
export const MIN_POLL_INTERVAL_MS = 90_000;
export const OVERLAP_MS = 60_000;

const MAILBOX_ISSUES = new Set([
  "https://api.github.com/repos/cmiloarevalo-hash/Actuador/issues/31",
  "https://api.github.com/repos/cmiloarevalo-hash/Actuador/issues/32"
]);

export function overlappedSince(cursor: PollCursor): string | null {
  if (cursor.highWaterUpdatedAt === null) return null;
  const t = Date.parse(cursor.highWaterUpdatedAt);
  if (!Number.isFinite(t)) throw new Error("INVALID_CURSOR");
  return new Date(Math.max(0, t - OVERLAP_MS)).toISOString();
}

export function filterMailboxSignals(
  comments: readonly IssueCommentSignal[]
): IssueCommentSignal[] {
  return comments.filter((comment) => MAILBOX_ISSUES.has(comment.issueUrl));
}

export function nextHighWater(
  current: PollCursor,
  allPages: readonly IssueCommentSignal[]
): PollCursor {
  let value = current.highWaterUpdatedAt;
  for (const comment of allPages) {
    if (value === null || comment.updatedAt > value) value = comment.updatedAt;
  }
  return { highWaterUpdatedAt: value };
}

export function delayFromRateLimit(
  page: PollPage,
  nowEpochSeconds: number
): number {
  if (page.retryAfterSeconds !== null) {
    return Math.max(
      MIN_POLL_INTERVAL_MS,
      Math.ceil(page.retryAfterSeconds * 1000)
    );
  }
  if (
    page.rateLimitRemaining !== null &&
    page.rateLimitRemaining <= 5 &&
    page.rateLimitResetEpochSeconds !== null
  ) {
    return Math.max(
      MIN_POLL_INTERVAL_MS,
      Math.ceil((page.rateLimitResetEpochSeconds - nowEpochSeconds) * 1000)
    );
  }
  return DEFAULT_POLL_INTERVAL_MS;
}

// Candidate transport contract:
// GET /repos/{owner}/{repo}/issues/comments
//   ?sort=updated&direction=asc&since=<overlapped cursor>&per_page=100
// Follow rel="next" serially until absent.
// Do not return candidates and do not advance the cursor if any page fails.
// Ignore every comment whose issue_url is not exactly mailbox #31 or #32.
// This module defines no GitHub write operation.
