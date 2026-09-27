# Task 03 — Escalation and continuable-work candidate

## Closed actor handling

Only IMPLEMENTER_WEB and SUPERVISOR_WEB are eligible for Web delivery. HUMAN, LOCAL_AGENT_OPERATOR, AI_STUDIO_OPERATOR and unknown/future actors trigger STOP/ESCALATE at the Web-delivery selector. They are never aliased to a supported actor.

HUMAN_REQUIRED with missing Human authorization is WAIT, preserving the canonical validator boundary.

## Continuation without prioritization

A blocked request need not globally stall an unrelated request, but Actuador cannot infer that unrelatedness.

Candidate rule:

1. validate each request independently;
2. identify candidates that are individually READY and Human-satisfied;
3. if none are ready: WAIT;
4. if more than one is ready: STOP/ESCALATE because choosing would be priority;
5. if exactly one is ready while other requests exist, continue only when explicit persistent references provide observable independence between that ready request and every non-ready request;
6. otherwise STOP/ESCALATE.

The candidate deliberately rejects “no dependency found” as proof of independence.

## What does not order work

- first seen;
- FIFO;
- comment age;
- Issue number;
- mailbox #31 versus #32;
- poll order;
- implementation cost;
- arbitrary score.

## Evidence boundary

`IndependenceEvidence` is an input to the technical classifier and must be produced from explicit persistent GitHub/Workflow facts by a future authorized canonical design. The classifier does not mine free-text payloads to create it.
