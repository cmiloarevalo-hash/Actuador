# RECOMMENDATIONS — Parallel Actuador Cycle 01

Experimental observations only. Supervisor/Human decide whether any item becomes a canonical Work Item.

## ACTUADOR_RECOMMENDATIONS

1. Consider the Task 01 repository-wide poller as the activation candidate: one unauthenticated `issues/comments` GET per idle cycle, 90 s default/floor, 60 s overlap, full pagination, exact filter to mailbox #31 (IMPLEMENTER_WEB) and #32 (SUPERVISOR_WEB), adaptive rate-limit backoff, no runtime writes.
2. Pair polling with a small non-authoritative local ledger before enabling unattended continuation. Persist comment/version/hash/request-ref/recipient/result/attempt state; mutation blocks; unknown possible prior Send never replays.
3. Preserve the Task 03 conservative continuity rule: no FIFO/age/mailbox priority; multiple ready candidates escalate; one ready candidate may bypass a blocked one only when independence is positively demonstrated by explicit persistent facts.
4. Use the Task 04 CHAT_SESSION model if session rotation is adopted: one ACTIVE session per role, unique SESSION_ID, GitHub/Workflow bootstrap, advisory age/count/input-size metrics, no transcript, no attempt reset/replay.
5. Use Task 05 only as an orchestration blueprint around existing canonical components. If PR #30 or an equivalent controlled-handoff implementation is later adopted, reuse its recipient/provenance/store/one-Send/output-blind gates rather than duplicating them.
6. Keep the Web boundary output-blind and mechanical. Do not add CDP, private WebSocket, chatbot response parsing, model-controlled browser actions, model API, DB/vector store, distributed infrastructure or automatic GitHub writes for this prototype.
7. Before canonical adoption, require unit/crash-consistency tests for cursor/ledger/session state and static/runtime tests proving no Output-consumption path.

## WORKFLOW_RECOMMENDATIONS

Observations only; no Workflow modification is proposed by this experiment.

1. Current Workflow §33 already supplies the key authority constraints needed by these candidates: closed actors, explicit authorization, Human wait, one-Send maximum, no retry after uncertainty, and no authority inference from free text.
2. The main unresolved semantic input is **observable independence** for continuable work. The experiment intentionally does not define a new Workflow field or authority. Supervisor/Human should decide, in a future authorized design gate if needed, which existing persistent facts can prove independence without becoming an implicit priority mechanism.
3. Session rotation likewise needs an explicit applicable authorization/input before any New-chat external action. The accepted #26 rule that rotation signals/counters are not self-authorizing should remain intact.
4. Mailbox #31/#32 placement should remain routing/provenance evidence only, never authority.
5. No recommendation here authorizes a new Work Item, implementation, merge, priority decision or real Web Send.
