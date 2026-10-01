import assert from "node:assert/strict";
import test from "node:test";
import type { BrowserSessionAdapter, BrowserSessionCandidate, BrowserSessionQuery } from "../src/web-session-adapter.js";
import { WebSessionCoordinator, WebSessionCoordinatorError } from "../src/web-session-coordinator.js";
import { WebSessionBindingError, type WebSessionBindingInput } from "../src/web-session-binding.js";

const input = (bindingId = "one", generation = 1): WebSessionBindingInput => ({
  role: "IMPLEMENTER_WEB", bindingId, generation,
  contextProfileRef: "profile:implementer", expectedUrlPrefix: "https://example.invalid/chat/",
  markerContractRef: "marker:implementer", bootstrapRef: "github:49"
});

const candidate = (query: BrowserSessionQuery): BrowserSessionCandidate => ({
  role: query.role, contextProfileRef: query.contextProfileRef,
  candidateId: query.bindingId, causalBindingId: query.bindingId,
  currentUrl: "https://example.invalid/chat/one", markerContractRef: query.markerContractRef,
  markerMatches: true, open: true, fresh: true, processEpoch: query.processEpoch
});

class FakeAdapter implements BrowserSessionAdapter {
  queries: BrowserSessionQuery[] = [];
  observe: (query: BrowserSessionQuery) => readonly BrowserSessionCandidate[] = query => [candidate(query)];
  observeCandidates(query: BrowserSessionQuery): readonly BrowserSessionCandidate[] {
    this.queries.push(query);
    return this.observe(query);
  }
}

function setup() {
  const adapter = new FakeAdapter();
  const coordinator = new WebSessionCoordinator(adapter, "epoch-1");
  coordinator.register(input());
  return { adapter, coordinator };
}

function expectCode(code: WebSessionCoordinatorError["code"], action: () => unknown) {
  assert.throws(action, error => error instanceof WebSessionCoordinatorError && error.code === code);
}

test("one mechanical candidate progresses UNBOUND -> BOUND -> ACTIVE; roles remain independent", () => {
  const { adapter, coordinator: c } = setup();
  assert.equal(c.snapshot().bindings[0]?.status, "UNBOUND");
  c.bind("one");
  assert.equal(c.snapshot().bindings[0]?.status, "BOUND");
  c.activate("one");
  assert.equal(c.eligible("IMPLEMENTER_WEB").bindingId, "one");
  c.register({ ...input("supervisor"), role: "SUPERVISOR_WEB", contextProfileRef: "profile:supervisor" });
  c.bind("supervisor"); c.activate("supervisor");
  assert.equal(c.eligible("SUPERVISOR_WEB").bindingId, "supervisor");
  assert.equal(adapter.queries.length, 6);
});

const failures: [string, (q: BrowserSessionQuery) => readonly BrowserSessionCandidate[], WebSessionCoordinatorError["code"]][] = [
  ["zero candidates", () => [], "CANDIDATE_COUNT"],
  ["multiple candidates even if one matches", q => [candidate(q), { ...candidate(q), candidateId: "other" }], "CANDIDATE_COUNT"],
  ["duplicate causal event", q => [candidate(q), candidate(q)], "CANDIDATE_COUNT"],
  ["wrong role", q => [{ ...candidate(q), role: "SUPERVISOR_WEB" }], "IDENTITY_MISMATCH"],
  ["wrong context/profile", q => [{ ...candidate(q), contextProfileRef: "other" }], "IDENTITY_MISMATCH"],
  ["wrong opaque ID", q => [{ ...candidate(q), candidateId: "other" }], "IDENTITY_MISMATCH"],
  ["wrong causal binding", q => [{ ...candidate(q), causalBindingId: "other" }], "IDENTITY_MISMATCH"],
  ["wrong URL", q => [{ ...candidate(q), currentUrl: "https://wrong.invalid/" }], "URL_MISMATCH"],
  ["marker false", q => [{ ...candidate(q), markerMatches: false }], "MARKER_MISMATCH"],
  ["marker ambiguous", q => [{ ...candidate(q), markerMatches: null }], "MARKER_MISMATCH"],
  ["wrong marker contract", q => [{ ...candidate(q), markerContractRef: "other" }], "MARKER_MISMATCH"],
  ["closed", q => [{ ...candidate(q), open: false }], "NOT_FRESH"],
  ["stale", q => [{ ...candidate(q), fresh: false }], "NOT_FRESH"],
  ["wrong process epoch", q => [{ ...candidate(q), processEpoch: "old" }], "NOT_FRESH"]
];

for (const [name, observe, code] of failures) {
  test(`${name} blocks bind, activation, revalidation and fresh eligibility`, () => {
    const { adapter, coordinator: c } = setup();
    adapter.observe = observe;
    const unbound = c.snapshot();
    expectCode(code, () => c.bind("one"));
    assert.equal(c.snapshot(), unbound);
    adapter.observe = q => [candidate(q)]; c.bind("one");
    const bound = c.snapshot(); adapter.observe = observe;
    expectCode(code, () => c.activate("one"));
    assert.equal(c.snapshot(), bound);
    adapter.observe = q => [candidate(q)]; c.activate("one");
    const active = c.snapshot(); adapter.observe = observe;
    expectCode(code, () => c.revalidate("one"));
    expectCode(code, () => c.eligible("IMPLEMENTER_WEB"));
    assert.equal(c.snapshot(), active);
  });
}

test("restart invalidates eligibility until explicit observation and revalidation", () => {
  const { adapter, coordinator: c } = setup();
  c.bind("one"); c.activate("one");
  const restored = new WebSessionCoordinator(adapter, "epoch-2", c.snapshot());
  expectCode("NO_ELIGIBLE_SESSION", () => restored.eligible("IMPLEMENTER_WEB"));
  adapter.observe = q => [{ ...candidate(q), processEpoch: "epoch-1" }];
  expectCode("NOT_FRESH", () => restored.revalidate("one"));
  expectCode("NO_ELIGIBLE_SESSION", () => restored.eligible("IMPLEMENTER_WEB"));
  adapter.observe = q => [candidate(q)];
  restored.revalidate("one");
  assert.equal(restored.eligible("IMPLEMENTER_WEB").validatedProcessEpoch, "epoch-2");
  assert.equal(c.snapshot().bindings[0]?.validatedProcessEpoch, "epoch-1");
});

test("replacement validates successor freshly and commits predecessor retirement atomically", () => {
  const { adapter, coordinator: c } = setup();
  c.bind("one"); c.activate("one"); c.requireRotation("one");
  expectCode("NO_ELIGIBLE_SESSION", () => c.eligible("IMPLEMENTER_WEB"));
  c.register({ ...input("two", 2), predecessorBindingId: "one" }); c.bind("two");
  expectCode("INVALID_OPERATION", () => c.activate("two"));
  const before = c.snapshot();
  for (const [, observe, code] of failures) {
    adapter.observe = observe;
    expectCode(code, () => c.replace("one", "two"));
    assert.equal(c.snapshot(), before);
  }
  adapter.observe = q => {
    assert.equal(c.snapshot(), before);
    return [candidate(q)];
  };
  c.replace("one", "two");
  assert.deepEqual(c.snapshot().bindings.map(b => b.status), ["REPLACED", "ACTIVE"]);
  assert.deepEqual(before.bindings.map(b => b.status), ["ROTATION_REQUIRED", "BOUND"]);
  adapter.observe = q => [candidate(q)];
  for (const status of ["REPLACED", "CLOSED"]) {
    assert.equal(c.snapshot().bindings[0]?.status, status);
    expectCode("INVALID_OPERATION", () => c.bind("one"));
    expectCode("INVALID_OPERATION", () => c.activate("one"));
    expectCode("INVALID_OPERATION", () => c.revalidate("one"));
    assert.equal(c.eligible("IMPLEMENTER_WEB").bindingId, "two");
    if (status === "REPLACED") c.closeReplaced("one");
  }
});

test("core rejects dual ACTIVE and coordinator rejects cross-profile replacement", () => {
  const { coordinator: c } = setup(); c.bind("one"); c.activate("one");
  c.register(input("two", 2)); c.bind("two");
  assert.throws(() => c.activate("two"), e => e instanceof WebSessionBindingError && e.code === "DUPLICATE_ACTIVE_ROLE");
  assert.equal(c.snapshot().bindings.filter(b => b.status === "ACTIVE").length, 1);
  c.requireRotation("one");
  c.register({ ...input("three", 3), predecessorBindingId: "one", contextProfileRef: "other-profile" });
  c.bind("three");
  expectCode("INVALID_OPERATION", () => c.replace("one", "three"));
});

test("adapter failure and reentrant mutation do not commit partial transitions", () => {
  const { adapter, coordinator: c } = setup(); const before = c.snapshot();
  adapter.observe = () => { throw new Error("adapter unavailable"); };
  assert.throws(() => c.bind("one"), /adapter unavailable/);
  assert.equal(c.snapshot(), before);
  adapter.observe = q => { c.register(input("two", 2)); return [candidate(q)]; };
  expectCode("INVALID_OPERATION", () => c.bind("one"));
  assert.equal(c.snapshot(), before);
  adapter.observe = q => [candidate(q)]; c.bind("one");
  assert.equal(c.snapshot().bindings[0]?.status, "BOUND");
});

test("public adapter facts and coordinator snapshots exclude forbidden surfaces", () => {
  const { adapter, coordinator: c } = setup();
  const forbidden = ["output", "transcript", "messages", "conversationText", "network", "webSocket",
    "cookies", "credentials", "storage", "title", "tabOrder", "cdp", "page", "browserContext",
    "authorization", "send", "attempts"];
  for (const key of forbidden) {
    adapter.observe = q => [{ ...candidate(q), [key]: "forbidden" }];
    expectCode("INVALID_EVIDENCE", () => c.bind("one"));
    assert.equal(Object.hasOwn(c.snapshot().bindings[0]!, key), false);
  }
  adapter.observe = q => {
    assert.deepEqual(Object.keys(q).sort(), ["bindingId", "contextProfileRef", "markerContractRef", "processEpoch", "role"]);
    return [candidate(q)];
  };
  c.bind("one");
});

// Compile-time assertions guard the complete public keys, including optional fields.
type AssertNever<T extends never> = T;
type CandidateKeys = "role" | "contextProfileRef" | "candidateId" | "causalBindingId" |
  "currentUrl" | "markerContractRef" | "markerMatches" | "open" | "fresh" | "processEpoch";
type CandidateSurface = AssertNever<Exclude<keyof BrowserSessionCandidate, CandidateKeys>>;
type AdapterSurface = AssertNever<Exclude<keyof BrowserSessionAdapter, "observeCandidates">>;
type QuerySurface = AssertNever<Exclude<keyof BrowserSessionQuery,
  "role" | "contextProfileRef" | "bindingId" | "markerContractRef" | "processEpoch">>;
type CoordinatorSurface = AssertNever<Exclude<keyof WebSessionCoordinator,
  "snapshot" | "register" | "bind" | "activate" | "revalidate" | "eligible" | "requireRotation" | "replace" | "closeReplaced">>;
