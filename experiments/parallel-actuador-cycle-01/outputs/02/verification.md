# Task 02 verification vectors

| Scenario | Candidate result |
|---|---|
| same comment through 60 s overlap | DUPLICATE |
| same comment on pagination replay | DUPLICATE |
| restart with intact ledger | duplicate remains duplicate |
| same id, changed updatedAt/hash | BLOCK_ESCALATE |
| same id rebound to different request/recipient | BLOCK_ESCALATE |
| observed source deleted before delivery | BLOCK_ESCALATE at exact-source revalidation |
| SEND_ATTEMPTED then duplicate | replay blocked |
| UNCERTAIN_AFTER_SEND then restart | replay blocked |
| corrupt/missing ledger + possible prior Send | STOP_UNKNOWN_PRIOR_SEND |
| local record says READY but ACTUATION_REQUEST is blocked | validator result wins; no authority from ledger |
| arbitrary body claims "retry" | no effect on attempt state |

## Candidate persistence shape

A single small local file could hold this structure atomically in a future canonical implementation. That is an adoption detail; this experiment does not select a database or add dependencies.
