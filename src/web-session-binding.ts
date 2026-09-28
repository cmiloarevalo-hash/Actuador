import type { ActuationTargetActor } from "./actuation-request-validator.js";

export type WebSessionStatus =
  | "UNBOUND"
  | "BOUND"
  | "ACTIVE"
  | "ROTATION_REQUIRED"
  | "REPLACED"
  | "CLOSED";

export interface WebSessionBindingRecord {
  role: ActuationTargetActor;
  bindingId: string;
  contextProfileRef: string;
  generation: number;
  status: WebSessionStatus;
  expectedUrlPrefix: string;
  markerContractRef: string;
  validatedProcessEpoch: string | null;
  predecessorBindingId: string | null;
  bootstrapRef: string;
}

export interface WebSessionBindingInput {
  role: ActuationTargetActor;
  bindingId: string;
  contextProfileRef: string;
  generation: number;
  expectedUrlPrefix: string;
  markerContractRef: string;
  predecessorBindingId?: string;
  bootstrapRef: string;
}

export interface WebSessionRegistry {
  readonly bindings: readonly WebSessionBindingRecord[];
}

export type WebSessionBindingErrorCode =
  | "INVALID_BINDING"
  | "DUPLICATE_BINDING_ID"
  | "DUPLICATE_GENERATION"
  | "DUPLICATE_ACTIVE_ROLE"
  | "INVALID_PREDECESSOR"
  | "INVALID_TRANSITION";

export class WebSessionBindingError extends Error {
  constructor(
    public readonly code: WebSessionBindingErrorCode,
    message: string
  ) {
    super(message);
    this.name = "WebSessionBindingError";
  }
}

const BINDING_KEYS = new Set([
  "role",
  "bindingId",
  "contextProfileRef",
  "generation",
  "status",
  "expectedUrlPrefix",
  "markerContractRef",
  "validatedProcessEpoch",
  "predecessorBindingId",
  "bootstrapRef"
]);

const STATUSES = new Set<WebSessionStatus>([
  "UNBOUND",
  "BOUND",
  "ACTIVE",
  "ROTATION_REQUIRED",
  "REPLACED",
  "CLOSED"
]);

function nonEmpty(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0 || value !== value.trim()) {
    throw new WebSessionBindingError(
      "INVALID_BINDING",
      `${field} must be a non-empty trimmed string.`
    );
  }
  return value;
}

function actor(value: unknown): ActuationTargetActor {
  if (value !== "IMPLEMENTER_WEB" && value !== "SUPERVISOR_WEB") {
    throw new WebSessionBindingError(
      "INVALID_BINDING",
      "role must use the canonical Web actor vocabulary."
    );
  }
  return value;
}

function status(value: unknown): WebSessionStatus {
  if (typeof value !== "string" || !STATUSES.has(value as WebSessionStatus)) {
    throw new WebSessionBindingError(
      "INVALID_BINDING",
      "status must use the canonical Web session lifecycle."
    );
  }
  return value as WebSessionStatus;
}

function validateRecord(value: WebSessionBindingRecord): WebSessionBindingRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new WebSessionBindingError("INVALID_BINDING", "Binding must be an object.");
  }

  const keys = Object.keys(value);
  if (
    keys.length !== BINDING_KEYS.size ||
    !keys.every((key) => BINDING_KEYS.has(key))
  ) {
    throw new WebSessionBindingError(
      "INVALID_BINDING",
      "Binding contains missing or unsupported state fields."
    );
  }

  const validatedStatus = status(value.status);
  const validatedEpoch =
    value.validatedProcessEpoch === null
      ? null
      : nonEmpty(value.validatedProcessEpoch, "validatedProcessEpoch");

  if (validatedStatus === "ACTIVE" && validatedEpoch === null) {
    throw new WebSessionBindingError(
      "INVALID_BINDING",
      "ACTIVE binding requires fresh process-epoch evidence."
    );
  }

  if (validatedStatus !== "ACTIVE" && validatedEpoch !== null) {
    throw new WebSessionBindingError(
      "INVALID_BINDING",
      "Only ACTIVE bindings may carry process-epoch validation evidence."
    );
  }

  if (!Number.isInteger(value.generation) || value.generation <= 0) {
    throw new WebSessionBindingError(
      "INVALID_BINDING",
      "generation must be a positive integer."
    );
  }

  const predecessorBindingId =
    value.predecessorBindingId === null
      ? null
      : nonEmpty(value.predecessorBindingId, "predecessorBindingId");

  const bindingId = nonEmpty(value.bindingId, "bindingId");
  if (predecessorBindingId === bindingId) {
    throw new WebSessionBindingError(
      "INVALID_PREDECESSOR",
      "A binding cannot reference itself as predecessor."
    );
  }

  return Object.freeze({
    role: actor(value.role),
    bindingId,
    contextProfileRef: nonEmpty(value.contextProfileRef, "contextProfileRef"),
    generation: value.generation,
    status: validatedStatus,
    expectedUrlPrefix: nonEmpty(value.expectedUrlPrefix, "expectedUrlPrefix"),
    markerContractRef: nonEmpty(value.markerContractRef, "markerContractRef"),
    validatedProcessEpoch: validatedEpoch,
    predecessorBindingId,
    bootstrapRef: nonEmpty(value.bootstrapRef, "bootstrapRef")
  });
}

function validateRegistry(
  bindings: readonly WebSessionBindingRecord[]
): readonly WebSessionBindingRecord[] {
  const records = bindings.map((binding) => validateRecord(binding));
  const byId = new Map<string, WebSessionBindingRecord>();
  const generations = new Set<string>();
  const activeRoles = new Set<ActuationTargetActor>();

  for (const binding of records) {
    if (byId.has(binding.bindingId)) {
      throw new WebSessionBindingError(
        "DUPLICATE_BINDING_ID",
        `Duplicate binding id: ${binding.bindingId}.`
      );
    }
    byId.set(binding.bindingId, binding);

    const generationKey = `${binding.role}:${binding.generation}`;
    if (generations.has(generationKey)) {
      throw new WebSessionBindingError(
        "DUPLICATE_GENERATION",
        `Duplicate generation for role: ${generationKey}.`
      );
    }
    generations.add(generationKey);

    if (binding.status === "ACTIVE") {
      if (activeRoles.has(binding.role)) {
        throw new WebSessionBindingError(
          "DUPLICATE_ACTIVE_ROLE",
          `Role ${binding.role} has more than one ACTIVE binding.`
        );
      }
      activeRoles.add(binding.role);
    }
  }

  for (const binding of records) {
    if (binding.predecessorBindingId === null) continue;

    const predecessor = byId.get(binding.predecessorBindingId);
    if (
      predecessor === undefined ||
      predecessor.role !== binding.role ||
      predecessor.generation >= binding.generation
    ) {
      throw new WebSessionBindingError(
        "INVALID_PREDECESSOR",
        `Binding ${binding.bindingId} has an invalid predecessor linkage.`
      );
    }
  }

  return Object.freeze(records);
}

function bindingIndex(registry: WebSessionRegistry, bindingId: string): number {
  const index = registry.bindings.findIndex((binding) => binding.bindingId === bindingId);
  if (index < 0) {
    throw new WebSessionBindingError(
      "INVALID_BINDING",
      `Unknown binding id: ${bindingId}.`
    );
  }
  return index;
}

function replaceAt(
  registry: WebSessionRegistry,
  index: number,
  binding: WebSessionBindingRecord
): WebSessionRegistry {
  const next = [...registry.bindings];
  next[index] = binding;
  return createWebSessionRegistry(next);
}

function transition(
  registry: WebSessionRegistry,
  bindingId: string,
  expectedStatus: WebSessionStatus,
  nextStatus: WebSessionStatus,
  validatedProcessEpoch: string | null
): WebSessionRegistry {
  const index = bindingIndex(registry, bindingId);
  const current = registry.bindings[index];
  if (current === undefined || current.status !== expectedStatus) {
    throw new WebSessionBindingError(
      "INVALID_TRANSITION",
      `Binding ${bindingId} cannot transition from ${current?.status ?? "missing"} to ${nextStatus}.`
    );
  }

  return replaceAt(registry, index, {
    ...current,
    status: nextStatus,
    validatedProcessEpoch
  });
}

export function createWebSessionBinding(
  input: WebSessionBindingInput
): WebSessionBindingRecord {
  return validateRecord({
    role: input.role,
    bindingId: input.bindingId,
    contextProfileRef: input.contextProfileRef,
    generation: input.generation,
    status: "UNBOUND",
    expectedUrlPrefix: input.expectedUrlPrefix,
    markerContractRef: input.markerContractRef,
    validatedProcessEpoch: null,
    predecessorBindingId: input.predecessorBindingId ?? null,
    bootstrapRef: input.bootstrapRef
  });
}

export function createWebSessionRegistry(
  bindings: readonly WebSessionBindingRecord[] = []
): WebSessionRegistry {
  return Object.freeze({
    bindings: validateRegistry(bindings)
  });
}

export function registerWebSessionBinding(
  registry: WebSessionRegistry,
  binding: WebSessionBindingRecord
): WebSessionRegistry {
  return createWebSessionRegistry([...registry.bindings, binding]);
}

export function bindWebSession(
  registry: WebSessionRegistry,
  bindingId: string
): WebSessionRegistry {
  return transition(registry, bindingId, "UNBOUND", "BOUND", null);
}

export function activateWebSession(
  registry: WebSessionRegistry,
  bindingId: string,
  processEpoch: string
): WebSessionRegistry {
  const epoch = nonEmpty(processEpoch, "processEpoch");
  return transition(registry, bindingId, "BOUND", "ACTIVE", epoch);
}

export function markWebSessionRotationRequired(
  registry: WebSessionRegistry,
  bindingId: string
): WebSessionRegistry {
  return transition(
    registry,
    bindingId,
    "ACTIVE",
    "ROTATION_REQUIRED",
    null
  );
}

export function revalidateActiveWebSession(
  registry: WebSessionRegistry,
  bindingId: string,
  processEpoch: string
): WebSessionRegistry {
  const epoch = nonEmpty(processEpoch, "processEpoch");
  const index = bindingIndex(registry, bindingId);
  const current = registry.bindings[index];
  if (current === undefined || current.status !== "ACTIVE") {
    throw new WebSessionBindingError(
      "INVALID_TRANSITION",
      "Only an ACTIVE binding can be explicitly revalidated."
    );
  }

  return replaceAt(registry, index, {
    ...current,
    validatedProcessEpoch: epoch
  });
}

export function replaceWebSession(
  registry: WebSessionRegistry,
  predecessorBindingId: string,
  successorBindingId: string,
  processEpoch: string
): WebSessionRegistry {
  const epoch = nonEmpty(processEpoch, "processEpoch");
  const predecessorIndex = bindingIndex(registry, predecessorBindingId);
  const successorIndex = bindingIndex(registry, successorBindingId);
  const predecessor = registry.bindings[predecessorIndex];
  const successor = registry.bindings[successorIndex];

  if (
    predecessor === undefined ||
    successor === undefined ||
    predecessor.status !== "ROTATION_REQUIRED" ||
    successor.status !== "BOUND" ||
    predecessor.role !== successor.role ||
    successor.predecessorBindingId !== predecessor.bindingId ||
    successor.generation <= predecessor.generation
  ) {
    throw new WebSessionBindingError(
      "INVALID_TRANSITION",
      "Replacement requires a ROTATION_REQUIRED predecessor and a later BOUND successor for the same role."
    );
  }

  const next = [...registry.bindings];
  next[predecessorIndex] = {
    ...predecessor,
    status: "REPLACED",
    validatedProcessEpoch: null
  };
  next[successorIndex] = {
    ...successor,
    status: "ACTIVE",
    validatedProcessEpoch: epoch
  };

  return createWebSessionRegistry(next);
}

export function closeWebSession(
  registry: WebSessionRegistry,
  bindingId: string
): WebSessionRegistry {
  return transition(registry, bindingId, "REPLACED", "CLOSED", null);
}

export function eligibleWebSessionForRole(
  registry: WebSessionRegistry,
  role: ActuationTargetActor,
  processEpoch: string
): WebSessionBindingRecord | null {
  const epoch = nonEmpty(processEpoch, "processEpoch");
  const active = registry.bindings.filter(
    (binding) => binding.role === role && binding.status === "ACTIVE"
  );

  if (active.length === 0) return null;
  if (active.length > 1) {
    throw new WebSessionBindingError(
      "DUPLICATE_ACTIVE_ROLE",
      `Role ${role} has more than one ACTIVE binding.`
    );
  }

  const binding = active[0];
  if (binding === undefined || binding.validatedProcessEpoch !== epoch) {
    return null;
  }

  return binding;
}
