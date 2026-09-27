// Experimental candidate only. No real browser execution occurs here.

export type Recipient = "IMPLEMENTER_WEB" | "SUPERVISOR_WEB";

export interface Signal {
  commentRef: string;
  mailboxIssue: 31 | 32;
}

export interface FactualContext {
  repository: string;
  workItemNumber: number;
  refs: string[];
}

export interface ValidatedRequest {
  requestId: string;
  targetActor: Recipient;
  deliveryLimit: 1;
}

export interface PromptEnvelopeCandidate {
  recipient: Recipient;
  firstLine: string;
  payloadSourceRef: string;
  prompt: string;
}

export interface OperationalRecord {
  requestId: string;
  recipient: Recipient;
  attemptState: "NOT_ATTEMPTED" | "SEND_ATTEMPTED" | "UNCERTAIN_AFTER_SEND";
}

export interface SessionGate {
  role: Recipient;
  sessionId: string;
  uniqueActive: boolean;
  destinationMarkerMatches: boolean;
}

export type TechnicalDeliveryResult =
  | "SUCCESS"
  | "FAILED_BEFORE_SEND"
  | "UNCERTAIN_AFTER_SEND";

export interface RuntimePorts {
  pollSignals(): Promise<Signal[]>;
  readFactualContext(signal: Signal): Promise<FactualContext>;
  validateActuationRequest(
    signal: Signal,
    context: FactualContext
  ): Promise<ValidatedRequest | null>;
  buildActorAuthoredEnvelope(
    request: ValidatedRequest,
    context: FactualContext
  ): Promise<PromptEnvelopeCandidate | null>;
  loadOperationalRecord(
    request: ValidatedRequest
  ): Promise<OperationalRecord>;
  checkRecipientStore(
    request: ValidatedRequest,
    envelope: PromptEnvelopeCandidate
  ): Promise<boolean>;
  checkSession(
    request: ValidatedRequest
  ): Promise<SessionGate>;
  markSendAttempted(requestId: string): Promise<void>;
  deliverOutputBlind(
    envelope: PromptEnvelopeCandidate
  ): Promise<TechnicalDeliveryResult>;
}

export type CycleDecision =
  | { result: "IDLE" }
  | { result: "WAIT"; reason: string }
  | { result: "STOP_ESCALATE"; reason: string }
  | { result: "PREPARED_NO_SEND"; requestId: string; recipient: Recipient }
  | {
      result: "TECHNICAL_RESULT";
      requestId: string;
      recipient: Recipient;
      delivery: TechnicalDeliveryResult;
    };

function recipientPrefix(actor: Recipient): string {
  return `DESTINATARIO: ${actor}`;
}

export async function runOneCycle(
  ports: RuntimePorts,
  externalSendAuthorized: boolean
): Promise<CycleDecision> {
  const signals = await ports.pollSignals();
  if (signals.length === 0) return { result: "IDLE" };

  // Candidate orchestration deliberately refuses to select among multiple
  // simultaneous signals. Task 03/Supervisor must resolve priority first.
  if (signals.length !== 1) {
    return {
      result: "STOP_ESCALATE",
      reason: "multiple signal candidates require continuity/priority classification"
    };
  }

  const signal = signals[0]!;
  const context = await ports.readFactualContext(signal);
  const request = await ports.validateActuationRequest(signal, context);
  if (request === null) {
    return { result: "WAIT", reason: "ACTUATION_REQUEST is not ready" };
  }

  const envelope = await ports.buildActorAuthoredEnvelope(request, context);
  if (envelope === null) {
    return { result: "WAIT", reason: "PromptEnvelope is not ready" };
  }

  if (
    envelope.recipient !== request.targetActor ||
    envelope.firstLine !== recipientPrefix(request.targetActor)
  ) {
    return {
      result: "STOP_ESCALATE",
      reason: "recipient metadata/prefix mismatch"
    };
  }

  const ledger = await ports.loadOperationalRecord(request);
  if (
    ledger.requestId !== request.requestId ||
    ledger.recipient !== request.targetActor ||
    ledger.attemptState !== "NOT_ATTEMPTED"
  ) {
    return {
      result: "STOP_ESCALATE",
      reason: "operational ledger blocks replay or recipient mismatch"
    };
  }

  if (!(await ports.checkRecipientStore(request, envelope))) {
    return {
      result: "STOP_ESCALATE",
      reason: "recipient-specific prompt store gate failed"
    };
  }

  const session = await ports.checkSession(request);
  if (
    session.role !== request.targetActor ||
    !session.uniqueActive ||
    !session.destinationMarkerMatches
  ) {
    return {
      result: "STOP_ESCALATE",
      reason: "role/session/destination gate failed"
    };
  }

  if (!externalSendAuthorized) {
    return {
      result: "PREPARED_NO_SEND",
      requestId: request.requestId,
      recipient: request.targetActor
    };
  }

  // In a canonical implementation this transition must be durable before the
  // single mechanical Send boundary is crossed.
  await ports.markSendAttempted(request.requestId);

  const delivery = await ports.deliverOutputBlind(envelope);
  return {
    result: "TECHNICAL_RESULT",
    requestId: request.requestId,
    recipient: request.targetActor,
    delivery
  };
}

// deliverOutputBlind is intentionally narrow: implementation may use only
// configured URL/role-session marker/input/exact own-input readback/Send/
// own-input post-Send transition. It must expose no transcript/response API.
