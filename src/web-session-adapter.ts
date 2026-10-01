import type { ActuationTargetActor } from "./actuation-request-validator.js";

/** Configuration references and opaque IDs only; no browser objects or authority. */
export interface BrowserSessionQuery {
  readonly role: ActuationTargetActor;
  readonly contextProfileRef: string;
  readonly bindingId: string;
  readonly markerContractRef: string;
  readonly processEpoch: string;
}

export interface BrowserSessionCandidate {
  readonly role: ActuationTargetActor;
  readonly contextProfileRef: string;
  /** Uses the caller's opaque binding ID; not a browser-internal identifier. */
  readonly candidateId: string;
  /** The causal identity assigned at the adapter boundary, not tab order/title. */
  readonly causalBindingId: string;
  readonly currentUrl: string;
  readonly markerContractRef: string;
  readonly markerMatches: boolean | null;
  readonly open: boolean;
  readonly fresh: boolean;
  readonly processEpoch: string;
}

/**
 * Returns all candidates for the explicit causal binding, including ambiguous
 * candidates. Implementations must not select the first match or cache evidence
 * across observations. Real browser integration is a separate Work Item.
 */
export interface BrowserSessionAdapter {
  observeCandidates(query: BrowserSessionQuery): readonly BrowserSessionCandidate[];
}
