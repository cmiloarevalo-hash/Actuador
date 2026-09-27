// Experimental candidate only. Rotation authority must be validated upstream.

export type WebRole = "IMPLEMENTER_WEB" | "SUPERVISOR_WEB";
export type SessionStatus = "ACTIVE" | "RETIRED";
export type RotationStatus = "NORMAL" | "RECOMMENDED" | "REQUESTED";

export interface ChatSession {
  role: WebRole;
  sessionId: string;
  status: SessionStatus;
  startedAt: string;
  deliveryCount: number;
  deliveredInputSize: number;
  rotationStatus: RotationStatus;
  bootstrapRef: string;
}

export interface ValidatedRotationInput {
  role: WebRole;
  activeSessionId: string;
  persistedRequestRef: string;
  authorizationRef: string;
  bootstrapRef: string;
  newSessionId: string;
}

export interface DeliveryAttemptEvidence {
  requestFingerprint: string;
  state: "NOT_ATTEMPTED" | "SEND_ATTEMPTED" | "UNCERTAIN_AFTER_SEND";
}

export type RotationDecision =
  | {
      decision: "PREPARE_NEW_SESSION";
      retireSessionId: string;
      candidateSession: Omit<ChatSession, "status">;
    }
  | { decision: "STOP_ESCALATE"; reason: string };

export function advisoryRotationStatus(
  session: ChatSession,
  limits: {
    maxAgeMs: number;
    maxDeliveries: number;
    maxDeliveredInputSize: number;
  },
  nowMs: number
): RotationStatus {
  if (session.rotationStatus === "REQUESTED") return "REQUESTED";

  const started = Date.parse(session.startedAt);
  const ageExceeded =
    Number.isFinite(started) && nowMs - started >= limits.maxAgeMs;
  const countExceeded = session.deliveryCount >= limits.maxDeliveries;
  const sizeExceeded =
    session.deliveredInputSize >= limits.maxDeliveredInputSize;

  return ageExceeded || countExceeded || sizeExceeded
    ? "RECOMMENDED"
    : "NORMAL";
}

export function planRotation(
  sessions: readonly ChatSession[],
  input: ValidatedRotationInput,
  requestAttempt: DeliveryAttemptEvidence | null
): RotationDecision {
  const activeForRole = sessions.filter(
    (session) => session.role === input.role && session.status === "ACTIVE"
  );

  if (activeForRole.length !== 1) {
    return {
      decision: "STOP_ESCALATE",
      reason: "role must have exactly one ACTIVE session before rotation"
    };
  }

  const current = activeForRole[0]!;
  if (current.sessionId !== input.activeSessionId) {
    return {
      decision: "STOP_ESCALATE",
      reason: "rotation request does not identify the unique ACTIVE session"
    };
  }

  if (
    input.persistedRequestRef.trim().length === 0 ||
    input.authorizationRef.trim().length === 0 ||
    input.bootstrapRef.trim().length === 0 ||
    input.newSessionId.trim().length === 0
  ) {
    return {
      decision: "STOP_ESCALATE",
      reason: "rotation requires explicit persisted request/authorization/bootstrap references"
    };
  }

  if (
    requestAttempt !== null &&
    requestAttempt.state !== "NOT_ATTEMPTED"
  ) {
    return {
      decision: "STOP_ESCALATE",
      reason:
        "session rotation cannot reset or replay an attempted/uncertain request"
    };
  }

  if (sessions.some((session) => session.sessionId === input.newSessionId)) {
    return {
      decision: "STOP_ESCALATE",
      reason: "new SESSION_ID must be unique"
    };
  }

  return {
    decision: "PREPARE_NEW_SESSION",
    retireSessionId: current.sessionId,
    candidateSession: {
      role: input.role,
      sessionId: input.newSessionId,
      startedAt: new Date().toISOString(),
      deliveryCount: 0,
      deliveredInputSize: 0,
      rotationStatus: "NORMAL",
      bootstrapRef: input.bootstrapRef
    }
  };
}

// Commit protocol after mechanical verification of the candidate chat:
// 1. verify configured URL + role/session/destination marker using minimal DOM.
// 2. bootstrap only from GitHub/Workflow reference; do not read/copy transcript.
// 3. atomically mark old ACTIVE record RETIRED and persist candidate as ACTIVE.
// 4. if the transition cannot be atomic/proven, STOP; do not keep two active records.
// 5. delivery-attempt evidence is request-scoped and is never reset by this transition.
