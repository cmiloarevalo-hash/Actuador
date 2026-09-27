# Parallel Actuador Cycle 01

Experimental, non-canonical workpack authorized by Issue #33 and Supervisor comment 5853658326.

## Isolation

- Base: `main@06803b8e684c887acebb8ec418164b28782af695`
- Branch: `experiment/parallel-actuador-cycle-01`
- Persistent writes: this directory only.
- Canonical product source/tests/config/package/docs: read-only.
- Canonical Workflow: read-only.
- PR #30 / `4ea027957511055d8682a30a7d4ae9d854c80a81`: technical reference only.
- Real Web Send: not authorized.
- Merge: not authorized.

Candidate code is intentionally not wired into the product build. It exists only for Supervisor/Human evaluation.

## Closed technical decisions used

- #26: repository-wide unauthenticated Issue-comment polling, 90 s default/floor, two role mailboxes, local operational cursor/dedup/attempt state.
- #27: Playwright/DOM + direct in-process orchestration; no prototype CDP/private-site WebSocket.
- #28: Actuador consumes no chatbot Output; GitHub/Workflow is the continuity path.
- Workflow §33: closed Web actors, explicit authority, one-Send maximum, no retry after post-Send uncertainty.

## Sequence

Tasks 01–06 are executed in order. A task may continue only after its checkpoint commit and only while no STOP condition is active.
