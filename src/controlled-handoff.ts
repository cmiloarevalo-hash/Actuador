import process from "node:process";
import {
  validateActuationRequest,
  type ActuationHandoffKind,
  type ActuationRequest,
  type ActuationTargetActor
} from "./actuation-request-validator.js";
import { executePromptDelivery } from "./actuation-core.js";
import {
  buildRoleScopedPromptEnvelope,
  type ActorAuthoredHandoffPayload,
  type PromptEnvelope
} from "./prompt-builder.js";
import {
  payloadSourceMatchesRoute,
  type ControlledHandoffRoutingConfig,
  type WebActorDestination
} from "./handoff-routing.js";
import {
  RecipientPromptStore,
  type PromptStoreRecord,
  type PromptStoreSeed
} from "./recipient-prompt-store.js";
import { PlaywrightPromptDeliveryDriver } from "./playwright-driver.js";
import type {
  ActuationOutcome,
  ActuatorConfig,
  PromptDeliveryDriver
} from "./types.js";
import { ActuationError } from "./types.js";
import type { WorkflowContext } from "./workflow-context-adapter.js";

export interface RealHandoffProofAuthorization {
  reference: string;
  repository: string;
  workItemNumber: number;
  prNumber: number | null;
  expectedRevision: string | null;
  targetActor: ActuationTargetActor;
  handoffKind: ActuationHandoffKind;
  destinationName: string;
  storeRecipient: ActuationTargetActor;
  storeRecordId: string;
  deliveryLimit: 1;
  noRetryAfterUncertainty: true;
}

export interface ControlledHandoffInput {
  rawRequest: unknown;
  context: WorkflowContext;
  payload: ActorAuthoredHandoffPayload;
  routing: ControlledHandoffRoutingConfig;
  cwd?: string;
}

export interface PreparedHandoff {
  result: "HANDOFF_PREPARED";
  request: ActuationRequest;
  envelope: PromptEnvelope;
  storeRecord: PromptStoreRecord;
  destination: WebActorDestination;
}

export interface HandoffBlocked {
  result: "HANDOFF_BLOCKED";
  errorCode: string;
  detail: string;
  action: "STOP";
  delivery: "NO_DELIVERY";
  escalation: "SUPERVISOR";
  storeRecordId?: string;
}

export interface HandoffTechnicalSuccess {
  result: "HANDOFF_TECHNICAL_SUCCESS";
  delivery: "SEND_ATTEMPTED";
  storeRecordId: string;
  outcome: ActuationOutcome & { result: "SUCCESS" };
}

export interface HandoffUncertain {
  result: "HANDOFF_UNCERTAIN_AFTER_SEND";
  delivery: "SEND_ATTEMPTED";
  action: "STOP";
  escalation: "SUPERVISOR";
  storeRecordId: string;
  outcome: ActuationOutcome & { result: "UNCERTAIN_AFTER_SEND" };
}

export type HandoffPreparationResult = PreparedHandoff | HandoffBlocked;
export type ControlledHandoffResult =
  | HandoffBlocked
  | HandoffTechnicalSuccess
  | HandoffUncertain;

export type PromptDeliveryDriverFactory = (
  config: ActuatorConfig
) => PromptDeliveryDriver;

export const playwrightPromptDeliveryDriverFactory: PromptDeliveryDriverFactory =
  (config) => new PlaywrightPromptDeliveryDriver(config);

function blocked(
  errorCode: string,
  detail: string,
  storeRecordId?: string
): HandoffBlocked {
  const base: HandoffBlocked = {
    result: "HANDOFF_BLOCKED",
    errorCode,
    detail,
    action: "STOP",
    delivery: "NO_DELIVERY",
    escalation: "SUPERVISOR"
  };
  return storeRecordId === undefined ? base : { ...base, storeRecordId };
}

function expectedPayloadAuthor(
  handoffKind: ActuationHandoffKind
): ActuationTargetActor {
  return handoffKind === "IMPLEMENTER_WORK_ITEM"
    ? "SUPERVISOR_WEB"
    : "IMPLEMENTER_WEB";
}

function recipientPrefix(recipient: ActuationTargetActor): string {
  return `DESTINATARIO: ${recipient}`;
}

function sourceIsFactual(
  sourceRef: string,
  context: WorkflowContext
): boolean {
  return context.contextRefs.some((reference) => reference.htmlUrl === sourceRef);
}

function seedFor(
  request: ActuationRequest,
  envelope: PromptEnvelope
): PromptStoreSeed {
  return {
    recipient: envelope.recipient,
    handoffKind: envelope.handoffKind,
    repository: request.workItem.repository,
    workItemNumber: request.workItem.number,
    expectedRevision: envelope.expectedRevision,
    payloadSourceRef: envelope.payloadSourceRef,
    prompt: envelope.prompt
  };
}

function validateDestination(
  targetActor: ActuationTargetActor,
  destination: WebActorDestination
): string | null {
  if (destination.actor !== targetActor) {
    return "Configured destination actor does not match request targetActor.";
  }
  if (destination.visibleMarkerActor !== targetActor) {
    return "Configured visible role/session marker is not bound to request targetActor.";
  }
  if (destination.driverConfig.destinationName !== targetActor) {
    return "M1 destinationName must exactly equal the configured Web actor identity.";
  }
  return null;
}

function validateProofAuthorization(
  proof: RealHandoffProofAuthorization | null,
  prepared: PreparedHandoff
): string | null {
  if (proof === null) {
    return "Real external Send is not authorized.";
  }

  const { request, envelope, storeRecord, destination } = prepared;
  if (
    request.humanRequired !== true ||
    request.humanAuthorization === null ||
    proof.reference !== request.humanAuthorization
  ) {
    return "Real proof requires HUMAN REQUIRED with the same explicit persistent Human authorization reference.";
  }

  if (
    proof.repository !== request.workItem.repository ||
    proof.workItemNumber !== request.workItem.number ||
    proof.prNumber !== (envelope.prRef?.number ?? null) ||
    proof.expectedRevision !== envelope.expectedRevision ||
    proof.targetActor !== request.targetActor ||
    proof.handoffKind !== request.handoffKind ||
    proof.destinationName !== destination.driverConfig.destinationName ||
    proof.storeRecipient !== storeRecord.recipient ||
    proof.storeRecordId !== storeRecord.recordId ||
    proof.deliveryLimit !== 1 ||
    proof.noRetryAfterUncertainty !== true
  ) {
    return "Human proof authorization does not exactly match the prepared handoff, destination, and recipient-specific store record.";
  }

  return null;
}

export async function prepareControlledHandoff(
  input: ControlledHandoffInput
): Promise<HandoffPreparationResult> {
  const validation = validateActuationRequest(input.rawRequest, input.context);
  if (validation.result !== "REQUEST_READY") {
    return blocked(
      `REQUEST_${validation.errorCode}`,
      validation.detail
    );
  }

  const promptResult = buildRoleScopedPromptEnvelope(
    validation,
    input.context,
    input.payload
  );
  if (promptResult.result !== "PROMPT_READY") {
    return blocked(
      `PROMPT_${promptResult.errorCode}`,
      promptResult.detail
    );
  }

  const request = validation.request;
  const envelope = promptResult.envelope;

  if (
    request.externalEffect !== "PROMPT_DELIVERY" ||
    request.deliveryLimit !== 1
  ) {
    return blocked(
      "DELIVERY_NOT_AUTHORIZED",
      "Controlled handoff requires canonical PROMPT_DELIVERY with deliveryLimit 1."
    );
  }

  if (request.targetActor !== envelope.recipient) {
    return blocked(
      "RECIPIENT_MISMATCH",
      "Validated request targetActor does not match PromptEnvelope recipient."
    );
  }

  if (envelope.prompt.split("\n", 1)[0] !== recipientPrefix(envelope.recipient)) {
    return blocked(
      "RECIPIENT_PREFIX_MISMATCH",
      "Prompt first line does not exactly match the structured recipient."
    );
  }

  const expectedAuthor = expectedPayloadAuthor(request.handoffKind);
  if (envelope.payloadAuthorActor !== expectedAuthor) {
    return blocked(
      "PAYLOAD_AUTHOR_MISMATCH",
      "PromptEnvelope payload author does not match the canonical handoff direction."
    );
  }

  const route = input.routing.sourceRoutes[expectedAuthor];
  if (
    route.authorActor !== expectedAuthor ||
    route.recipientActor !== request.targetActor
  ) {
    return blocked(
      "PAYLOAD_ROUTE_MISMATCH",
      "Configured payload source route does not match the expected sender/recipient direction."
    );
  }

  if (
    !sourceIsFactual(envelope.payloadSourceRef, input.context) ||
    !payloadSourceMatchesRoute(envelope.payloadSourceRef, route)
  ) {
    return blocked(
      "PAYLOAD_PROVENANCE_MISMATCH",
      "Payload source is not bound to the configured role-specific persistent source route."
    );
  }

  const destination = input.routing.destinations[request.targetActor];
  const destinationMismatch = validateDestination(
    request.targetActor,
    destination
  );
  if (destinationMismatch !== null) {
    return blocked("DESTINATION_MISMATCH", destinationMismatch);
  }

  const store = new RecipientPromptStore(
    request.targetActor,
    input.cwd ?? process.cwd()
  );

  let storeRecord: PromptStoreRecord;
  try {
    storeRecord = await store.persist(seedFor(request, envelope));
  } catch (error) {
    return blocked(
      error instanceof ActuationError ? error.code : "PROMPT_STORE_ERROR",
      error instanceof Error ? error.message : String(error)
    );
  }

  if (
    storeRecord.recipient !== request.targetActor ||
    storeRecord.prompt.split("\n", 1)[0] !== recipientPrefix(request.targetActor)
  ) {
    return blocked(
      "PROMPT_STORE_MISMATCH",
      "Recipient-specific prompt store record does not match the validated target and recipient prefix.",
      storeRecord.recordId
    );
  }

  if (storeRecord.status !== "READY") {
    return blocked(
      "PROMPT_RECORD_NOT_READY",
      `Prompt record status is ${storeRecord.status}; automatic replay is prohibited.`,
      storeRecord.recordId
    );
  }

  return {
    result: "HANDOFF_PREPARED",
    request,
    envelope,
    storeRecord,
    destination
  };
}

export async function executeControlledHandoff(
  input: ControlledHandoffInput,
  proofAuthorization: RealHandoffProofAuthorization | null,
  driverFactory: PromptDeliveryDriverFactory = playwrightPromptDeliveryDriverFactory
): Promise<ControlledHandoffResult> {
  const preparation = await prepareControlledHandoff(input);
  if (preparation.result !== "HANDOFF_PREPARED") {
    return preparation;
  }

  const proofMismatch = validateProofAuthorization(
    proofAuthorization,
    preparation
  );
  if (proofMismatch !== null) {
    return blocked(
      "REAL_SEND_NOT_AUTHORIZED",
      proofMismatch,
      preparation.storeRecord.recordId
    );
  }

  const store = new RecipientPromptStore(
    preparation.storeRecord.recipient,
    input.cwd ?? process.cwd()
  );
  const driverConfig: ActuatorConfig = {
    ...preparation.destination.driverConfig,
    prompt: preparation.storeRecord.prompt
  };

  let driver: PromptDeliveryDriver;
  try {
    driver = driverFactory(driverConfig);
  } catch (error) {
    return blocked(
      "DRIVER_FACTORY_FAILED",
      error instanceof Error ? error.message : String(error),
      preparation.storeRecord.recordId
    );
  }

  try {
    await store.transition(
      preparation.storeRecord.recordId,
      "READY",
      "IN_FLIGHT"
    );
  } catch (error) {
    return blocked(
      error instanceof ActuationError ? error.code : "PROMPT_STORE_ERROR",
      error instanceof Error ? error.message : String(error),
      preparation.storeRecord.recordId
    );
  }

  const outcome = await executePromptDelivery(driver, driverConfig);

  if (outcome.result === "FAILED_BEFORE_SEND") {
    try {
      await store.transition(
        preparation.storeRecord.recordId,
        "IN_FLIGHT",
        "READY"
      );
    } catch {
      return blocked(
        "PROMPT_STORE_RECOVERY_FAILED",
        "Delivery failed before Send, but the local record could not be safely returned to READY; keep it blocked for Supervisor review.",
        preparation.storeRecord.recordId
      );
    }

    return blocked(
      outcome.errorCode ?? "FAILED_BEFORE_SEND",
      outcome.detail ?? "M1 delivery failed before Send.",
      preparation.storeRecord.recordId
    );
  }

  try {
    await store.transition(
      preparation.storeRecord.recordId,
      "IN_FLIGHT",
      "ATTEMPTED"
    );
  } catch {
    return {
      result: "HANDOFF_UNCERTAIN_AFTER_SEND",
      delivery: "SEND_ATTEMPTED",
      action: "STOP",
      escalation: "SUPERVISOR",
      storeRecordId: preparation.storeRecord.recordId,
      outcome: {
        result: "UNCERTAIN_AFTER_SEND",
        errorCode: "PROMPT_STORE_STATE_UPDATE_FAILED_AFTER_SEND",
        detail:
          "Send was attempted but the local attempt state could not be finalized; the IN_FLIGHT record must not be replayed."
      }
    };
  }

  if (outcome.result === "UNCERTAIN_AFTER_SEND") {
    return {
      result: "HANDOFF_UNCERTAIN_AFTER_SEND",
      delivery: "SEND_ATTEMPTED",
      action: "STOP",
      escalation: "SUPERVISOR",
      storeRecordId: preparation.storeRecord.recordId,
      outcome
    };
  }

  return {
    result: "HANDOFF_TECHNICAL_SUCCESS",
    delivery: "SEND_ATTEMPTED",
    storeRecordId: preparation.storeRecord.recordId,
    outcome
  };
}
