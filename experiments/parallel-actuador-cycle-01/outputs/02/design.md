# Task 02 — Operational ledger candidate

## Purpose

Persist only local technical memory needed to avoid duplicate delivery across polling overlap, pagination and process restart. This state is operational evidence, never Workflow authority.

## Minimal record

- repository;
- cursorUpdatedAt;
- commentId/commentRef;
- updatedAt;
- SHA-256 of the exact bounded mailbox payload/request representation;
- normalized request reference;
- recipient;
- latest technical result;
- attempt state.

## Dedup

The same comment id + same update timestamp + same hash + same request ref + same recipient is a duplicate. Overlap therefore becomes harmless.

A repeated request through a different comment may still require request-level dedup during canonical adoption. Candidate recommendation: derive a second request fingerprint from explicit ACTUATION_REQUEST identity fields and keep it in the same local ledger. Do not infer identity from prose.

## Mutation

Mailbox records are append-only by protocol. If an already observed comment changes timestamp/hash/ref/recipient, return BLOCK/ESCALATE. An edit never renews authority and is not silently substituted.

Deleted records are detected when an exact pre-Send revalidation cannot retrieve the observed source; block/escalate.

## Restart and loss

Normal restart reloads the ledger and repeats overlap polling.

If the ledger is missing/corrupt and a historical candidate could have crossed Send, state becomes `STOP_UNKNOWN_PRIOR_SEND`. GitHub reconstruction must not recreate `NOT_ATTEMPTED` because GitHub does not prove the mechanical Send did not occur.

A Supervisor recovery procedure may establish a new baseline, but this candidate does not invent that decision.

## Authority

No ledger field can turn REQUEST_BLOCKED into REQUEST_READY, satisfy HUMAN_REQUIRED, select an actor, prioritize work, or authorize retry.
