# TASK 03

TASK ID: 03
OBJECTIVE: Design deterministic escalation/continuity classification: unsupported actor STOP/WAIT/ESCALATE, HUMAN_REQUIRED WAIT, independent work may continue only without priority choice.
AUTHORIZED PATH: experiments/parallel-actuador-cycle-01/**
READ-ONLY SOURCES: Issue #33; Tasks 01–02 outputs; Workflow §33; accepted #26/#28.
REQUIRED OUTPUTS: outputs/03/**; update STATE.md.
VERIFICATION: Verify no FIFO/age/mailbox ordering; verify multiple ready ambiguous candidates escalate; verify observable independence is required.
STOP CONDITIONS: Any product-priority choice, inferred independence, actor substitution, authority change, product-file or Workflow change.
CHECKPOINT COMMIT: experiment cycle 01 task 03: escalation and continuity
NEXT TASK: 04 — only after checkpoint and no STOP.
