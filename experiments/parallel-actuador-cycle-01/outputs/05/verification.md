# Task 05 verification trace matrix

| Stage fault | Expected boundary |
|---|---|
| zero mailbox signals | IDLE |
| multiple signal candidates | STOP_ESCALATE; no priority selection |
| context read incomplete | fail/WAIT before request validation |
| REQUEST_BLOCKED | WAIT/no delivery |
| PromptEnvelope blocked | WAIT/no delivery |
| recipient/prefix mismatch | STOP_ESCALATE |
| ledger prior SEND_ATTEMPTED | STOP_ESCALATE; no replay |
| wrong recipient store | STOP_ESCALATE |
| zero/multiple active sessions | STOP_ESCALATE |
| visible marker mismatch | STOP_ESCALATE |
| external Send authorization absent | PREPARED_NO_SEND |
| authorization present | mark attempt before delivery boundary |
| FAILED_BEFORE_SEND | technical result; future policy may preserve retryability only if absence of Send is proven |
| UNCERTAIN_AFTER_SEND | technical result; no retry |
| SUCCESS | technical mechanical result only, not actor completion |
| chatbot Output present in page | ignored; no read API exists |

## Adoption note

PR #30 provides a useful read-only pattern for recipient store state and controlled M1 invocation. A future canonical implementation should combine that reviewed pattern with Tasks 01–04 rather than replacing its authority gates.
