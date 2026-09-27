# Task 01 — GitHub signal poller candidate

## Candidate

Use the public repository-wide Issue-comments endpoint as the sole idle activation read:

`GET /repos/cmiloarevalo-hash/Actuador/issues/comments?sort=updated&direction=asc&since=<cursor-overlap>&per_page=100`

One initial GET occurs every 90 seconds. Every page is fetched serially. Activation candidates are filtered locally by exact `issue_url` equality to mailbox Issues #31 and #32.

## Cursor behavior

- high-water value is the largest observed `updated_at` after a complete cycle;
- query `since` uses a 60-second overlap;
- overlap duplicates are intentionally expected and are deferred to Task 02 dedup;
- partial pagination never advances the high-water cursor.

## Rate limits

Read `x-ratelimit-remaining`, `x-ratelimit-reset`, and `retry-after`.
Normal delay is 90 s. If near exhaustion or limited, wait at least until the relevant reset/retry time. No busy retry.

## Authority boundary

A comment is only a signal candidate because it resides in one configured mailbox Issue. Its body cannot create authority. Subsequent M2/M3 validation still decides whether a persisted ACTUATION_REQUEST is valid.

## Writes

None. The candidate exposes only GET/read behavior.
