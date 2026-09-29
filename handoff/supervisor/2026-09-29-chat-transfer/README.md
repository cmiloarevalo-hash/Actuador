# Supervisor handoff — 2026-09-29

Purpose: persist continuity material for transferring the current `SUPERVISOR_WEB` session to a new chat.

This folder is **continuity evidence only**. It is not Workflow authority, does not supersede live GitHub state, and does not authorize product changes, merge, or real Web Send.

Contents:

- `STATE.md` — live project state verified immediately before handoff creation.
- `CONVERSATION_SNAPSHOT.md` — structured summary of the current Supervisor conversation and decisions.
- `NEW_SUPERVISOR_PROMPT.md` — compact bootstrap prompt for the next Supervisor chat.

Primary continuity Work Item: #47.

Before acting, the new Supervisor must independently recheck:
- live `main`;
- #23;
- PR #30;
- latest #23 decision tied to the current PR HEAD;
- any Implementer response after rework request 5883434415.

## Workflow provenance warning

At handoff creation, live `main` is:

`674b3a7679cb06170006bddf8d50ca4b4761123e`

The Workflow file present at that ref contains a header claiming it became active through a purported Issue #47 / PR #49 / `main@866d7aaa793cb9d1a2675965f911c6ddb37275e9`.

Immediately before this handoff Issue was created:
- Issue #47 did not exist;
- PR #49 did not exist;
- commit `866d7aaa...` was not found in this repository.

Issue #47 now refers to this handoff task, not to the historical consolidation claimed by that header. Therefore the header's provenance claim is inconsistent and must not be silently treated as verified fact.
