import type { ActuationTargetActor } from "./actuation-request-validator.js";
import type { BrowserSessionAdapter, BrowserSessionCandidate } from "./web-session-adapter.js";
import {
  activateWebSession, bindWebSession, closeWebSession,
  createWebSessionBinding, createWebSessionRegistry, eligibleWebSessionForRole,
  markWebSessionRotationRequired, registerWebSessionBinding,
  replaceWebSession, revalidateActiveWebSession,
  type WebSessionBindingInput, type WebSessionBindingRecord,
  type WebSessionRegistry
} from "./web-session-binding.js";

export type WebSessionCoordinatorErrorCode =
  | "INVALID_EVIDENCE" | "CANDIDATE_COUNT" | "IDENTITY_MISMATCH"
  | "URL_MISMATCH" | "MARKER_MISMATCH" | "NOT_FRESH"
  | "NO_ELIGIBLE_SESSION" | "INVALID_OPERATION";

export class WebSessionCoordinatorError extends Error {
  constructor(public readonly code: WebSessionCoordinatorErrorCode) {
    super(code);
    this.name = "WebSessionCoordinatorError";
  }
}

const candidateKeys = new Set([
  "role", "contextProfileRef", "candidateId", "causalBindingId", "currentUrl",
  "markerContractRef", "markerMatches", "open", "fresh", "processEpoch"
]);

function fail(code: WebSessionCoordinatorErrorCode): never {
  throw new WebSessionCoordinatorError(code);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value === value.trim();
}

/** Technical session coordination only. Eligibility never authorizes Send. */
export class WebSessionCoordinator {
  private registry: WebSessionRegistry;
  private observing = false;

  constructor(
    private readonly adapter: BrowserSessionAdapter,
    private readonly processEpoch: string,
    registry: WebSessionRegistry = createWebSessionRegistry()
  ) {
    if (!nonEmpty(processEpoch)) fail("INVALID_EVIDENCE");
    this.registry = createWebSessionRegistry(registry.bindings);
  }

  snapshot(): WebSessionRegistry {
    return this.registry;
  }

  register(input: WebSessionBindingInput): void {
    this.assertIdle();
    this.registry = registerWebSessionBinding(this.registry, createWebSessionBinding(input));
  }

  /** Validation precedes UNBOUND -> BOUND; failed observations commit nothing. */
  bind(bindingId: string): void {
    this.assertIdle();
    const binding = this.binding(bindingId);
    if (binding.status !== "UNBOUND") fail("INVALID_OPERATION");
    this.validate(binding);
    this.registry = bindWebSession(this.registry, bindingId);
  }

  activate(bindingId: string): void {
    this.assertIdle();
    const binding = this.binding(bindingId);
    // A successor must use atomic replacement, never independent activation.
    if (binding.status !== "BOUND" || binding.predecessorBindingId !== null) {
      fail("INVALID_OPERATION");
    }
    this.validate(binding);
    this.registry = activateWebSession(this.registry, bindingId, this.processEpoch);
  }

  revalidate(bindingId: string): void {
    this.assertIdle();
    const binding = this.binding(bindingId);
    if (binding.status !== "ACTIVE") fail("INVALID_OPERATION");
    this.validate(binding);
    this.registry = revalidateActiveWebSession(this.registry, bindingId, this.processEpoch);
  }

  eligible(role: ActuationTargetActor): WebSessionBindingRecord {
    this.assertIdle();
    if (role !== "IMPLEMENTER_WEB" && role !== "SUPERVISOR_WEB") fail("INVALID_OPERATION");
    const binding = eligibleWebSessionForRole(this.registry, role, this.processEpoch);
    if (binding === null) fail("NO_ELIGIBLE_SESSION");
    // ACTIVE metadata is not sufficient: every eligibility query observes anew.
    this.validate(binding);
    return binding;
  }

  requireRotation(bindingId: string): void {
    this.assertIdle();
    this.registry = markWebSessionRotationRequired(this.registry, bindingId);
  }

  replace(predecessorId: string, successorId: string): void {
    this.assertIdle();
    const predecessor = this.binding(predecessorId);
    const successor = this.binding(successorId);
    if (predecessor.status !== "ROTATION_REQUIRED" || successor.status !== "BOUND" ||
        successor.predecessorBindingId !== predecessorId ||
        successor.contextProfileRef !== predecessor.contextProfileRef) {
      fail("INVALID_OPERATION");
    }
    this.validate(successor);
    // The core constructs and validates both changes before publishing either.
    this.registry = replaceWebSession(this.registry, predecessorId, successorId, this.processEpoch);
  }

  closeReplaced(bindingId: string): void {
    this.assertIdle();
    // Registry retirement only; does not close a real browser/page.
    this.registry = closeWebSession(this.registry, bindingId);
  }

  private assertIdle(): void {
    if (this.observing) fail("INVALID_OPERATION");
  }

  private binding(bindingId: string): WebSessionBindingRecord {
    const binding = this.registry.bindings.find(record => record.bindingId === bindingId);
    if (binding === undefined) fail("INVALID_OPERATION");
    return binding;
  }

  private validate(binding: WebSessionBindingRecord): void {
    this.observing = true;
    try {
      const candidates = this.adapter.observeCandidates(Object.freeze({
        role: binding.role,
        contextProfileRef: binding.contextProfileRef,
        bindingId: binding.bindingId,
        markerContractRef: binding.markerContractRef,
        processEpoch: this.processEpoch
      }));
      if (!Array.isArray(candidates)) fail("INVALID_EVIDENCE");
      if (candidates.length !== 1) fail("CANDIDATE_COUNT");
      const candidate: BrowserSessionCandidate = candidates[0];
      if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate) ||
          Reflect.ownKeys(candidate).length !== candidateKeys.size ||
          !Reflect.ownKeys(candidate).every(key => typeof key === "string" && candidateKeys.has(key))) {
        fail("INVALID_EVIDENCE");
      }
      if (!nonEmpty(candidate.candidateId) ||
          candidate.candidateId !== binding.bindingId ||
          candidate.causalBindingId !== binding.bindingId ||
          candidate.role !== binding.role || candidate.contextProfileRef !== binding.contextProfileRef) {
        fail("IDENTITY_MISMATCH");
      }
      if (candidate.open !== true || candidate.fresh !== true || candidate.processEpoch !== this.processEpoch) {
        fail("NOT_FRESH");
      }
      if (candidate.markerContractRef !== binding.markerContractRef || candidate.markerMatches !== true) {
        fail("MARKER_MISMATCH");
      }
      if (!nonEmpty(candidate.currentUrl) || !candidate.currentUrl.startsWith(binding.expectedUrlPrefix)) {
        fail("URL_MISMATCH");
      }
    } finally {
      this.observing = false;
    }
  }
}
