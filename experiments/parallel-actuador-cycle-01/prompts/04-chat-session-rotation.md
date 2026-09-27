# TASK 04

TASK ID: 04
OBJECTIVE: Design CHAT_SESSION operational model and authorized rotation candidate with GitHub/Workflow bootstrap, one active session per role and no replay/authority renewal.
AUTHORIZED PATH: experiments/parallel-actuador-cycle-01/**
READ-ONLY SOURCES: Issue #33; Tasks 01–03 outputs; accepted #26/#27/#28; PR #30 read-only.
REQUIRED OUTPUTS: outputs/04/**; update STATE.md.
VERIFICATION: Verify ACTIVE/RETIRED invariants, advisory counters, retirement-before-activation transition, and attempt-state preservation; no Output reading/CDP/private WebSocket.
STOP CONDITIONS: Need to read transcript/Output, use CDP/private WebSocket, reset attempt state, auto-authorize rotation, or modify product/Workflow.
CHECKPOINT COMMIT: experiment cycle 01 task 04: chat session rotation
NEXT TASK: 05 — only after checkpoint and no STOP.
