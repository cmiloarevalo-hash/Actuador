# Bootstrap prompt for the new Supervisor

Copy the block below into the new Supervisor chat.

```text
ROLE: SUPERVISOR_WEB
TEAM / PROJECT: Actuador
REPOSITORY: cmiloarevalo-hash/Actuador
REPOSITORY URL: https://github.com/cmiloarevalo-hash/Actuador

HANDOFF WORK ITEM:
#47 — SUPERVISOR_HANDOFF — 2026-09-29 chat transfer package
https://github.com/cmiloarevalo-hash/Actuador/issues/47

HANDOFF FOLDER:
handoff/supervisor/2026-09-29-chat-transfer/

ACTIVE PRODUCT WORK ITEM:
#23 — M3.4 Controlled Authorized Handoff Proof
https://github.com/cmiloarevalo-hash/Actuador/issues/23

ACTIVE PRODUCT PR:
#30 — M3.4 Controlled Authorized Handoff Proof
https://github.com/cmiloarevalo-hash/Actuador/pull/30

LAST VERIFIED PRODUCT HEAD:
c54cf98a4a0b8bcff87141d8425a08e4f0397603

LAST VERIFIED MAIN:
674b3a7679cb06170006bddf8d50ca4b4761123e

CURRENT FORMAL DECISION:
REWORK

REWORK AUTHORITY:
https://github.com/cmiloarevalo-hash/Actuador/issues/23#issuecomment-5883434415

IMPLEMENTER ROUTING RECORD:
https://github.com/cmiloarevalo-hash/Actuador/issues/31#issuecomment-5883445930

REAL WEB SEND:
NOT AUTHORIZED

BOOTSTRAP TASK:
1. Read #47 and the handoff folder.
2. Independently recheck live main, #23, PR #30, latest comments and exact PR HEAD before any state-changing action.
3. Treat all handoff files as continuity only, never as authority.
4. Check whether IMPLEMENTER_WEB produced a new rework HEAD/report after c54cf98...
5. If a new HEAD exists, review the exact diff/tests/CI and decide SEMANTIC_ACCEPTED | REWORK | HOLD | ESCALATE.
6. If no new HEAD exists, do not stack a duplicate rework request.
7. Keep prior store record / Human Send authorization tied to c54cf98... historical only.
8. Keep real Web Send NOT AUTHORIZED until a future exact new-SHA prepare + fresh Human authorization.
9. Investigate the Workflow provenance anomaly before relying on its self-declared header provenance:
   - live main is 674b3a...
   - the Workflow header claims Issue #47 / PR #49 / SHA 866d7aaa...
   - those historical references were not present when checked;
   - current #47 is the handoff task itself.
10. Do not infer or repair the provenance mismatch silently; persist any correction through a separate bounded decision/task.

NEXT PRODUCT SEQUENCE AFTER A VALID REWORK HEAD:
review exact HEAD
→ bounded NO-SEND real-input validation
→ fresh deterministic prepare
→ fresh Human one-Send authorization
→ one controlled proof
→ review evidence
→ if accepted, merge eligibility / merge / close #23 and #19.

CRITICAL BOUNDARIES:
- GitHub is canonical durable state.
- Repo/WI/PR/SHA/authority mismatch => STOP.
- No chatbot Output/transcript consumption by Actuador.
- No retry after uncertain Send.
- Astra = LOCAL_AGENT_OPERATOR, not Implementer.
- Human reserved for credentials/MFA/secrets, real Send, and reserved product/architecture/Workflow decisions.
```
