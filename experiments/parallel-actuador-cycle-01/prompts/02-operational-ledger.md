# TASK 02

TASK ID: 02
OBJECTIVE: Design a non-authoritative local cursor/dedup/attempt ledger with restart/overlap safety and fail-closed mutation/loss handling.
AUTHORIZED PATH: experiments/parallel-actuador-cycle-01/**
READ-ONLY SOURCES: Issue #33; Task 01 outputs; Workflow §33; accepted #26/#28; PR #30 read-only attempt-state pattern.
REQUIRED OUTPUTS: outputs/02/**; update STATE.md.
VERIFICATION: Exercise duplicate, overlap, restart, edit/delete/mutation and possible-prior-Send loss cases in candidate test vectors; verify no authority is created.
STOP CONDITIONS: Need to infer authorization/priority, replay uncertain Send, add DB/material dependency, modify product/Workflow, or write GitHub.
CHECKPOINT COMMIT: experiment cycle 01 task 02: operational ledger
NEXT TASK: 03 — only after checkpoint and no STOP.
