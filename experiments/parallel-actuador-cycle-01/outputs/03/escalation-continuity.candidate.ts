// Experimental candidate only. No product priority is selected here.

export type SupportedWebActor = "IMPLEMENTER_WEB" | "SUPERVISOR_WEB";

export interface WorkCandidate {
  id: string;
  actor: string;
  requestState: "READY" | "BLOCKED";
  humanRequired: boolean;
  humanSatisfied: boolean;
}

export interface IndependenceEvidence {
  leftId: string;
  rightId: string;
  kind: "EXPLICIT_PERSISTENT_INDEPENDENCE";
  refs: string[];
}

export type ContinuityDecision =
  | { decision: "CONTINUE_ONE"; candidateId: string }
  | { decision: "WAIT"; reason: string }
  | { decision: "STOP_ESCALATE"; reason: string; candidateIds: string[] };

function supported(actor: string): actor is SupportedWebActor {
  return actor === "IMPLEMENTER_WEB" || actor === "SUPERVISOR_WEB";
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("::");
}

export function classifyContinuity(
  candidates: readonly WorkCandidate[],
  independence: readonly IndependenceEvidence[]
): ContinuityDecision {
  const evidence = new Set(
    independence
      .filter(
        (item) =>
          item.kind === "EXPLICIT_PERSISTENT_INDEPENDENCE" &&
          item.refs.length > 0 &&
          item.refs.every((ref) => ref.trim().length > 0)
      )
      .map((item) => pairKey(item.leftId, item.rightId))
  );

  const unsupported = candidates.filter((item) => !supported(item.actor));
  if (unsupported.length > 0) {
    return {
      decision: "STOP_ESCALATE",
      reason: "unsupported actor requires Supervisor routing decision",
      candidateIds: unsupported.map((item) => item.id)
    };
  }

  const humanWait = candidates.filter(
    (item) => item.humanRequired && !item.humanSatisfied
  );
  const ready = candidates.filter(
    (item) =>
      item.requestState === "READY" &&
      (!item.humanRequired || item.humanSatisfied)
  );

  if (ready.length > 1) {
    return {
      decision: "STOP_ESCALATE",
      reason:
        "multiple independently deliverable candidates require a priority choice Actuador cannot make",
      candidateIds: ready.map((item) => item.id)
    };
  }

  if (ready.length === 0) {
    if (humanWait.length > 0) {
      return {
        decision: "WAIT",
        reason: "HUMAN_REQUIRED is not satisfied"
      };
    }
    return {
      decision: "WAIT",
      reason: "no independently ready candidate exists"
    };
  }

  const selected = ready[0]!;
  const otherNonReady = candidates.filter((item) => item.id !== selected.id);
  const allIndependent = otherNonReady.every((item) =>
    evidence.has(pairKey(selected.id, item.id))
  );

  if (!allIndependent) {
    return {
      decision: "STOP_ESCALATE",
      reason:
        "continuation would require inferring independence from missing or non-explicit evidence",
      candidateIds: candidates.map((item) => item.id)
    };
  }

  return {
    decision: "CONTINUE_ONE",
    candidateId: selected.id
  };
}

// Deliberately absent:
// - FIFO ordering
// - oldest/newest ordering
// - mailbox ordering
// - issue-number ordering
// - arbitrary score/rank
