# Task 04 — Chat/session rotation candidate

## CHAT_SESSION

Required persisted operational fields:

- ROLE: IMPLEMENTER_WEB | SUPERVISOR_WEB
- SESSION_ID: unique local id
- STATUS: ACTIVE | RETIRED
- STARTED_AT
- DELIVERY_COUNT
- DELIVERED_INPUT_SIZE
- ROTATION_STATUS: NORMAL | RECOMMENDED | REQUESTED
- BOOTSTRAP_REF: persistent GitHub/Workflow reference

This record is local operational state, not authority.

## Rotation authorization boundary

An explicit persisted rotation request is required, but accepted #26 says a signal/request does not create authority by itself. The candidate therefore consumes a `ValidatedRotationInput`: a future canonical caller must already have verified the persistent request and applicable authorization before any New-chat browser action.

Advisory counters can produce RECOMMENDED only. They never authorize rotation.

## Safe transition

1. require exactly one ACTIVE session for the role;
2. require explicit request/auth/bootstrap refs and a unique new SESSION_ID;
3. block if the request to be delivered has SEND_ATTEMPTED or UNCERTAIN_AFTER_SEND;
4. prepare a new chat transiently;
5. bootstrap from GitHub/Workflow only;
6. verify configured URL + role/session/destination marker using minimal Playwright/DOM;
7. commit lifecycle state so old becomes RETIRED and new becomes ACTIVE as one proven transition;
8. if transition cannot be proven, STOP.

The transient candidate is not persisted as ACTIVE before verification, so the durable state never intentionally contains two active sessions for one role.

## Output-blind boundary

Allowed: configured URL, role/session/destination marker, New chat control when separately authorized, prompt input/readback/Send surface as applicable.

Rejected: transcript reading, chatbot Output, response DOM, network/WebSocket responses, hidden state, CDP/remote debugging, private target-site WebSocket.

## Attempt preservation

Rotation is session-scoped; delivery attempt evidence is request-scoped. Rotating a chat cannot reset an attempted or uncertain request.
