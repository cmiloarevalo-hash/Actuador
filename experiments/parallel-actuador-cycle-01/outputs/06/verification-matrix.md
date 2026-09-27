# Task 06 — Verification matrix

This matrix evaluates the experimental candidates only. It does not claim canonical adoption.

| Concern | Candidate under test | Verification case | Required result | Adoption status |
|---|---|---|---|---|
| duplicate | Task 02 ledger | same comment id/version/hash seen twice | second observation = DUPLICATE; no delivery | suitable |
| polling overlap | Tasks 01–02 | 60 s overlapped `since` returns prior comments | dedup removes repeats; cursor advances only after complete cycle | suitable |
| restart | Task 02 ledger | restart with intact ledger | prior attempt/dedup state preserved | suitable |
| restart with missing state | Task 02 | ledger absent/corrupt, possible prior Send | STOP_UNKNOWN_PRIOR_SEND; never reconstruct NOT_ATTEMPTED | suitable, requires atomic persistence design |
| rate limit | Task 01 | remaining <=5 or Retry-After | delay >= reset/retry and >=90 s; no busy retry | suitable |
| pagination | Task 01 | >100 repository comments | follow every next page serially before candidate set/cursor advance | suitable |
| unrelated repository comments | Task 01 | arbitrary Issue comment outside #31/#32 | no activation | suitable |
| mailbox identity | Task 01 | #31/#32 titles/config | #31 IMPLEMENTER_WEB; #32 SUPERVISOR_WEB; placement is routing only | confirmed |
| edited record | Task 02 | same id changes updatedAt/hash/ref/recipient | BLOCK_ESCALATE | suitable |
| deleted record | Task 02 | observed source disappears before exact revalidation | BLOCK_ESCALATE | suitable |
| mutated request | Task 02 | record rebinds request/recipient | BLOCK_ESCALATE | suitable |
| unsupported actor | Task 03 | HUMAN/LOCAL_AGENT_OPERATOR/AI_STUDIO_OPERATOR/unknown | STOP/WAIT/ESCALATE; no substitution | suitable |
| Human wait | Task 03 | HUMAN_REQUIRED not satisfied | WAIT | suitable |
| one blocked + one ready | Task 03 | explicit persistent independence evidence exists | ready candidate may continue | concept suitable |
| one blocked + one ready, no independence evidence | Task 03 | absence only | STOP_ESCALATE; do not infer independence | suitable |
| multiple ready | Task 03 | two deliverable candidates | STOP_ESCALATE; no FIFO/age/mailbox priority | suitable |
| wrong recipient | Task 05 + PR #30 reference | request/envelope/store/session marker mismatch | STOP before delivery | suitable |
| wrong payload route | PR #30 reference + Tasks 01/05 | payload source not from configured role mailbox | STOP before delivery | suitable |
| session rotation | Task 04 | exactly one ACTIVE + validated rotation request | prepare transient new session, verify, then atomic retire/activate | concept suitable |
| zero/multiple active session | Task 04 | role has 0 or >1 ACTIVE | STOP_ESCALATE | suitable |
| rotation advisory metrics | Task 04 | age/count/input-size threshold exceeded | RECOMMENDED only; no authority | suitable |
| rotation after attempted request | Task 04 | SEND_ATTEMPTED or UNCERTAIN | no replay/reset | suitable |
| uncertain Send | Tasks 02/05 + M1 | post-Send uncertainty | record attempt; STOP; no second Send | suitable |
| lost ledger after possible Send | Task 02 | recovery cannot prove attempt absence | STOP; never replay | suitable |
| output-blind boundary | Tasks 04–05 + #28 | chatbot Output/transcript/network/WebSocket hidden state exists | never read or exposed through port | suitable |
| CDP/private WebSocket | Task 04 | candidate would require either | reject prototype path | suitable |
| model-controlled browser | Task 05 | free-form model action requested | unsupported/rejected | suitable |
| automatic GitHub writes | Tasks 01/05 | runtime tries mutation | absent by design | suitable |
| priority decision | Tasks 03/05 | selection requires preference | Supervisor escalation | suitable |

## Residual verification needed before canonical adoption

1. Compile candidate code only inside a future authorized canonical Work Item after adapting it to actual product types.
2. Add deterministic unit tests using injected fetch/filesystem/clock adapters.
3. Add crash-consistency tests for atomic ledger/session lifecycle persistence.
4. Reuse PR #30 recipient/provenance/output-blind gates rather than duplicating authority logic.
5. Any real browser proof remains separately Human-authorized and is outside this experiment.
