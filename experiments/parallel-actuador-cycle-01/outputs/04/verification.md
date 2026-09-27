# Task 04 verification vectors

| Scenario | Expected |
|---|---|
| exactly one ACTIVE role session + validated rotation input | PREPARE_NEW_SESSION |
| zero ACTIVE sessions | STOP_ESCALATE |
| two ACTIVE sessions for same role | STOP_ESCALATE |
| request names stale session id | STOP_ESCALATE |
| duplicate new SESSION_ID | STOP_ESCALATE |
| missing persisted request/auth/bootstrap ref | STOP_ESCALATE |
| advisory age/count/size threshold exceeded | RECOMMENDED only |
| REQUESTED status | remains request signal; upstream authority still required |
| SEND_ATTEMPTED request | rotation cannot replay it |
| UNCERTAIN_AFTER_SEND request | rotation cannot replay it |
| new session bootstrap | GitHub/Workflow reference only |
| old transcript | never read/copied as canonical context |
| marker verification fails | STOP; old active record remains authoritative operational target |
| lifecycle persistence would leave two ACTIVE sessions | STOP |
| CDP/private WebSocket needed | reject candidate path |
