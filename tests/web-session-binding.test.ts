import assert from "node:assert/strict";
import test from "node:test";
import {
  activateWebSession,
  bindWebSession,
  closeWebSession,
  createWebSessionBinding,
  createWebSessionRegistry,
  eligibleWebSessionForRole,
  markWebSessionRotationRequired,
  registerWebSessionBinding,
  replaceWebSession,
  revalidateActiveWebSession,
  WebSessionBindingError,
  type WebSessionBindingInput,
  type WebSessionBindingRecord,
  type WebSessionRegistry
} from "../src/web-session-binding.js";

function input(
  role: WebSessionBindingInput["role"],
  bindingId: string,
  generation: number,
  predecessorBindingId?: string
): WebSessionBindingInput {
  const base = {
    role,
    bindingId,
    contextProfileRef: `profile:${role}`,
    generation,
    expectedUrlPrefix: `https://example.invalid/${role.toLowerCase()}`,
    markerContractRef: `marker:${role}`,
    bootstrapRef: "https://github.com/cmiloarevalo-hash/Actuador/issues/43"
  };

  return predecessorBindingId === undefined
    ? base
    : { ...base, predecessorBindingId };
}

function registerBound(
  registry: WebSessionRegistry,
  bindingInput: WebSessionBindingInput
): WebSessionRegistry {
  const registered = registerWebSessionBinding(
    registry,
    createWebSessionBinding(bindingInput)
  );
  return bindWebSession(registered, bindingInput.bindingId);
}

function expectCode(code: WebSessionBindingError["code"], action: () => unknown): void {
  assert.throws(action, (error: unknown) => {
    assert.ok(error instanceof WebSessionBindingError);
    assert.equal(error.code, code);
    return true;
  });
}

test("allows one independent ACTIVE binding for each canonical Web role", () => {
  let registry = createWebSessionRegistry();
  registry = registerBound(registry, input("IMPLEMENTER_WEB", "impl-1", 1));
  registry = registerBound(registry, input("SUPERVISOR_WEB", "sup-1", 1));
  registry = activateWebSession(registry, "impl-1", "process-1");
  registry = activateWebSession(registry, "sup-1", "process-1");

  assert.equal(
    eligibleWebSessionForRole(registry, "IMPLEMENTER_WEB", "process-1")?.bindingId,
    "impl-1"
  );
  assert.equal(
    eligibleWebSessionForRole(registry, "SUPERVISOR_WEB", "process-1")?.bindingId,
    "sup-1"
  );
});

test("rejects a second ACTIVE binding for the same role", () => {
  let registry = createWebSessionRegistry();
  registry = registerBound(registry, input("IMPLEMENTER_WEB", "impl-1", 1));
  registry = registerBound(registry, input("IMPLEMENTER_WEB", "impl-2", 2));
  registry = activateWebSession(registry, "impl-1", "process-1");

  expectCode("DUPLICATE_ACTIVE_ROLE", () =>
    activateWebSession(registry, "impl-2", "process-1")
  );
});

test("zero ACTIVE bindings means no eligible delivery binding", () => {
  let registry = createWebSessionRegistry();
  registry = registerBound(registry, input("SUPERVISOR_WEB", "sup-1", 1));

  assert.equal(
    eligibleWebSessionForRole(registry, "SUPERVISOR_WEB", "process-1"),
    null
  );
});

test("transitions BOUND to ACTIVE only with explicit process-epoch validation", () => {
  let registry = createWebSessionRegistry();
  registry = registerBound(registry, input("IMPLEMENTER_WEB", "impl-1", 1));
  registry = activateWebSession(registry, "impl-1", "process-1");

  assert.equal(registry.bindings[0]?.status, "ACTIVE");
  assert.equal(registry.bindings[0]?.validatedProcessEpoch, "process-1");
});

test("transitions ACTIVE to ROTATION_REQUIRED and immediately removes eligibility", () => {
  let registry = createWebSessionRegistry();
  registry = registerBound(registry, input("IMPLEMENTER_WEB", "impl-1", 1));
  registry = activateWebSession(registry, "impl-1", "process-1");
  registry = markWebSessionRotationRequired(registry, "impl-1");

  assert.equal(registry.bindings[0]?.status, "ROTATION_REQUIRED");
  assert.equal(
    eligibleWebSessionForRole(registry, "IMPLEMENTER_WEB", "process-1"),
    null
  );
});

test("atomically replaces a predecessor without creating dual ACTIVE state", () => {
  let registry = createWebSessionRegistry();
  registry = registerBound(registry, input("IMPLEMENTER_WEB", "impl-1", 1));
  registry = activateWebSession(registry, "impl-1", "process-1");
  registry = markWebSessionRotationRequired(registry, "impl-1");
  registry = registerBound(
    registry,
    input("IMPLEMENTER_WEB", "impl-2", 2, "impl-1")
  );

  registry = replaceWebSession(registry, "impl-1", "impl-2", "process-1");

  const predecessor = registry.bindings.find((binding) => binding.bindingId === "impl-1");
  const successor = registry.bindings.find((binding) => binding.bindingId === "impl-2");
  assert.equal(predecessor?.status, "REPLACED");
  assert.equal(successor?.status, "ACTIVE");
  assert.equal(
    registry.bindings.filter(
      (binding) => binding.role === "IMPLEMENTER_WEB" && binding.status === "ACTIVE"
    ).length,
    1
  );
});

test("REPLACED and CLOSED bindings cannot silently reactivate", () => {
  let registry = createWebSessionRegistry();
  registry = registerBound(registry, input("SUPERVISOR_WEB", "sup-1", 1));
  registry = activateWebSession(registry, "sup-1", "process-1");
  registry = markWebSessionRotationRequired(registry, "sup-1");
  registry = registerBound(
    registry,
    input("SUPERVISOR_WEB", "sup-2", 2, "sup-1")
  );
  registry = replaceWebSession(registry, "sup-1", "sup-2", "process-1");

  expectCode("INVALID_TRANSITION", () =>
    activateWebSession(registry, "sup-1", "process-1")
  );

  registry = closeWebSession(registry, "sup-1");
  assert.equal(
    registry.bindings.find((binding) => binding.bindingId === "sup-1")?.status,
    "CLOSED"
  );

  expectCode("INVALID_TRANSITION", () =>
    activateWebSession(registry, "sup-1", "process-1")
  );
});

test("restart-carried ACTIVE state is ineligible until explicit fresh revalidation", () => {
  let registry = createWebSessionRegistry();
  registry = registerBound(registry, input("IMPLEMENTER_WEB", "impl-1", 1));
  registry = activateWebSession(registry, "impl-1", "process-1");

  assert.equal(
    eligibleWebSessionForRole(registry, "IMPLEMENTER_WEB", "process-2"),
    null
  );

  registry = revalidateActiveWebSession(registry, "impl-1", "process-2");
  assert.equal(
    eligibleWebSessionForRole(registry, "IMPLEMENTER_WEB", "process-2")?.bindingId,
    "impl-1"
  );
});

test("rejects stale or contradictory binding records rather than inferring missing state", () => {
  const missingFreshness = {
    role: "IMPLEMENTER_WEB",
    bindingId: "impl-1",
    contextProfileRef: "profile:IMPLEMENTER_WEB",
    generation: 1,
    status: "ACTIVE",
    expectedUrlPrefix: "https://example.invalid/implementer_web",
    markerContractRef: "marker:IMPLEMENTER_WEB",
    validatedProcessEpoch: null,
    predecessorBindingId: null,
    bootstrapRef: "https://github.com/cmiloarevalo-hash/Actuador/issues/43"
  } as WebSessionBindingRecord;

  expectCode("INVALID_BINDING", () =>
    createWebSessionRegistry([missingFreshness])
  );

  const missingPredecessor = {
    ...createWebSessionBinding(
      input("SUPERVISOR_WEB", "sup-2", 2, "sup-missing")
    )
  };
  expectCode("INVALID_PREDECESSOR", () =>
    createWebSessionRegistry([missingPredecessor])
  );
});

test("public binding state rejects transcript, Output and browser-secret fields", () => {
  const binding = createWebSessionBinding(
    input("IMPLEMENTER_WEB", "impl-1", 1)
  );

  assert.deepEqual(Object.keys(binding).sort(), [
    "bindingId",
    "bootstrapRef",
    "contextProfileRef",
    "expectedUrlPrefix",
    "generation",
    "markerContractRef",
    "predecessorBindingId",
    "role",
    "status",
    "validatedProcessEpoch"
  ]);

  const forbidden = {
    ...binding,
    transcript: "forbidden"
  } as unknown as WebSessionBindingRecord;

  expectCode("INVALID_BINDING", () =>
    createWebSessionRegistry([forbidden])
  );

  for (const forbiddenKey of [
    "cookies",
    "credentials",
    "browserStorage",
    "transcript",
    "output",
    "title",
    "tabOrder",
    "page",
    "browserContext"
  ]) {
    assert.equal(Object.hasOwn(binding, forbiddenKey), false);
  }
});
