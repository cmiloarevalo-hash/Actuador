# Task 05 — Lightweight runtime orchestration candidate

## Composition

```text
repository-wide poll
→ strict #31/#32 signal filter
→ factual GitHub context
→ canonical ACTUATION_REQUEST validation
→ actor-authored PromptEnvelope
→ local operational ledger
→ recipient-specific prompt store gate
→ unique role/session/destination gate
→ explicit external real-Send authorization gate
→ output-blind controlled Playwright delivery
→ technical result
```

## Separation of concerns

- poller discovers only configured mailbox signals;
- M2-style reader supplies facts;
- M3.2-style validator owns authority/schema checks;
- M3.3-style builder preserves actor-authored payload;
- ledger owns duplicate/attempt memory but no authority;
- session/store gates prove mechanical routing;
- Playwright port owns the single mechanical Send boundary only.

The orchestrator does not read free-text payloads to select actors, infer authority or choose priority.

## Lightweight constraint

Candidate requires:
- one local process;
- direct in-process interfaces;
- small file-backed local operational state in a future implementation;
- existing Playwright/DOM transport.

Explicitly excluded:
- model API;
- model-controlled browser;
- DB/vector store;
- queues/brokers/distributed infra;
- custom WebSocket;
- automatic GitHub writes;
- automatic priority scheduler.

## Multiple signals

The candidate core refuses to pick one when more than one signal candidate enters a cycle. Task 03's continuity classifier or a persistent Supervisor decision must first reduce the set to exactly one independently deliverable request.

## Output-blind delivery port

The delivery interface exposes only one function returning a technical M1 result. A concrete adapter must be restricted to configured URL, role/session marker, input, exact own-input readback, Send, and own-input post-Send state.

No method exists to read model Output, transcript, response DOM, network/WebSocket responses, hidden state or browser internals.
