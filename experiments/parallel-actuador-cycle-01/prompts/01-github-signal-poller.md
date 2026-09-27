# TASK 01

TASK ID: 01
OBJECTIVE: Design repository-wide GitHub Issue-comment polling candidate: one idle GET/cycle, 90 s default/floor, filter only mailbox Issues #31/#32, bounded since-overlap, pagination, rate-limit/backoff, no runtime writes.
AUTHORIZED PATH: experiments/parallel-actuador-cycle-01/**
READ-ONLY SOURCES: Issue #33; Supervisor 5853658326; accepted #26; Workflow §33.
REQUIRED OUTPUTS: outputs/01/**; update STATE.md.
VERIFICATION: Review candidate against #26 accepted strategy; verify unrelated comments cannot activate; verify pagination completes before cursor advance; verify only experimental paths changed.
STOP CONDITIONS: Any need for authentication, GitHub writes, product-file changes, priority decision, Workflow change, or real Web Send.
CHECKPOINT COMMIT: experiment cycle 01 task 01: github signal poller
NEXT TASK: 02 — only after checkpoint and no STOP.
