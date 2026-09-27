# Task 06 — Adoption assessment

## Dependency-based candidate sequence

This is dependency structure, not product priority.

1. **Repository-wide signal poller**: supplies bounded #31/#32 signal candidates.
2. **Operational ledger**: makes polling overlap/restart safe and preserves Send-attempt memory.
3. **Escalation/continuity classifier**: prevents the orchestrator from inventing priority when more than one candidate exists.
4. **Session lifecycle/rotation record**: supplies a unique role-bound active destination and preserves request attempt state.
5. **Runtime orchestration**: composes the above with existing M2/M3.2/M3.3 and the reviewed PR #30 controlled-delivery pattern.

## Candidate disposition

### Task 01 — signal poller
**KEEP FOR CANONICAL WORK-ITEM CONSIDERATION**

Strengths: one idle GET/cycle, 90 s margin, strict #31/#32 filtering, bounded overlap, complete pagination, rate-limit fail-closed behavior, no writes.

Risk: high unrelated repository comment volume can force pagination. Accepted #26 already identifies two mailbox-specific GETs as fallback, not default.

### Task 02 — operational ledger
**KEEP, WITH IMPLEMENTATION HARDENING**

Strengths: explicit dedup/mutation/attempt semantics; conservative recovery.

Hardening needed: atomic persistence, corruption detection/versioning, and request-level fingerprint definition tied only to canonical structured fields.

### Task 03 — escalation/continuity
**KEEP THE RULES; REWORK THE INDEPENDENCE-EVIDENCE ADAPTER BEFORE ADOPTION**

The no-priority behavior is sound. The experimental `IndependenceEvidence` type intentionally assumes an upstream factual mechanism. A canonical Work Item must define which existing persistent GitHub/Workflow facts are sufficient to demonstrate independence without introducing a new authority source.

### Task 04 — session rotation
**KEEP THE RECORD/LIFECYCLE MODEL; REWORK ATOMIC TRANSITION DETAILS BEFORE ADOPTION**

The ACTIVE/RETIRED model, GitHub bootstrap and advisory counters align with accepted #26/#28. Canonical implementation must define the exact validated rotation authorization input and atomic old-retire/new-activate persistence.

### Task 05 — runtime orchestration
**KEEP AS COMPOSITION BLUEPRINT**

It should not replace PR #30 logic. Canonical adoption should integrate Tasks 01–04 around the reviewed controlled-handoff boundaries rather than duplicate validator/recipient/one-Send authority checks.

## Reject / do not adopt

- authenticated polling unless later justified by rate/scale;
- custom local WebSocket for prototype;
- CDP/remote debugging;
- private target-site WebSocket;
- transcript/Output scraping;
- model API or model-controlled browser orchestration;
- DB/vector store/distributed queue;
- automatic GitHub runtime writes;
- FIFO/age/mailbox priority;
- replay after uncertain/attempted Send.
