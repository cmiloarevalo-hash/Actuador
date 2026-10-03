import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { GitHubComment } from "../src/github-reader.js";
import {
  executeControlledHandoff,
  prepareControlledHandoff,
  type ControlledHandoffInput,
  type RealHandoffProofAuthorization
} from "../src/controlled-handoff.js";
import {
  promptStoreDirectory,
  type ControlledHandoffRoutingConfig
} from "../src/handoff-routing.js";
import { recipientBootstrapProtocol } from "../src/recipient-bootstrap.js";
import type { ActuationRequest } from "../src/actuation-request-validator.js";
import type {
  ActuatorConfig,
  PromptDeliveryDriver
} from "../src/types.js";
import { ActuationError } from "../src/types.js";
import type { WorkflowContext } from "../src/workflow-context-adapter.js";

const REVISION = "2222222222222222222222222222222222222222";
const AUTH_REF =
  "https://github.com/owner/repo/issues/23#issuecomment-100";
const HUMAN_REF =
  "https://github.com/owner/repo/issues/23#issuecomment-200";
const IMPLEMENTER_RECIPIENT_MAILBOX_REF =
  "https://github.com/owner/repo/issues/31";
const SUPERVISOR_RECIPIENT_MAILBOX_REF =
  "https://github.com/owner/repo/issues/32";
const SUPERVISOR_PAYLOAD_REF =
  `${IMPLEMENTER_RECIPIENT_MAILBOX_REF}#issuecomment-300`;
const IMPLEMENTER_PAYLOAD_REF =
  `${SUPERVISOR_RECIPIENT_MAILBOX_REF}#issuecomment-400`;

function comment(id: number, body: string): GitHubComment {
  return {
    id,
    author: "actor",
    body,
    createdAt: "2026-09-27T07:00:00Z",
    updatedAt: "2026-09-27T07:00:00Z",
    htmlUrl: `https://github.com/owner/repo/issues/23#issuecomment-${id}`
  };
}

function mailboxComment(
  mailboxNumber: number,
  id: number,
  body: string
): GitHubComment {
  return {
    ...comment(id, body),
    htmlUrl: `https://github.com/owner/repo/issues/${mailboxNumber}#issuecomment-${id}`
  };
}

function context(withPr = false): WorkflowContext {
  const issueComments = [
    comment(100, "authority"),
    comment(200, "human authority")
  ];

  return {
    sourceId: "https://github.com/owner/repo/issues/23",
    repository: "owner/repo",
    workItemRef: {
      number: 23,
      htmlUrl: "https://github.com/owner/repo/issues/23"
    },
    workItem: {
      number: 23,
      title: "M3.4",
      state: "open",
      stateReason: null,
      body: "Issue body must not become prompt content.",
      htmlUrl: "https://github.com/owner/repo/issues/23",
      updatedAt: "2026-09-27T07:00:00Z",
      comments: issueComments
    },
    prRef: withPr
      ? { number: 31, htmlUrl: "https://github.com/owner/repo/pull/31" }
      : null,
    pr: withPr
      ? {
          number: 31,
          state: "open",
          draft: false,
          merged: false,
          base: {
            ref: "main",
            sha: "1111111111111111111111111111111111111111"
          },
          head: {
            ref: "feature",
            sha: REVISION
          },
          title: "Review target",
          body: "PR body must not become prompt content.",
          htmlUrl: "https://github.com/owner/repo/pull/31",
          updatedAt: "2026-09-27T07:01:00Z",
          comments: []
        }
      : null,
    contextRefs: issueComments.map((item) => ({
      kind: "issue_comment",
      id: item.id,
      htmlUrl: item.htmlUrl
    })),
    revisionRef: withPr ? REVISION : null,
    retrievedAt: "2026-09-27T07:02:00.000Z"
  };
}

function request(
  overrides: Partial<ActuationRequest> = {}
): ActuationRequest {
  return {
    kind: "ACTUATION_REQUEST",
    workItem: {
      repository: "owner/repo",
      number: 23
    },
    authorization: AUTH_REF,
    expectedRevision: null,
    targetActor: "IMPLEMENTER_WEB",
    handoffKind: "IMPLEMENTER_WORK_ITEM",
    humanRequired: true,
    humanAuthorization: HUMAN_REF,
    externalEffect: "PROMPT_DELIVERY",
    deliveryLimit: 1,
    contextRefs: ["https://github.com/owner/repo/issues/23"],
    stopConditions: ["context mismatch"],
    ...overrides
  };
}

function m1Config(actor: "IMPLEMENTER_WEB" | "SUPERVISOR_WEB"): Omit<ActuatorConfig, "prompt"> {
  return {
    version: 1,
    destinationName: actor,
    targetUrl: `https://example.test/${actor.toLowerCase()}`,
    expectedUrlPrefix: `https://example.test/${actor.toLowerCase()}`,
    profileDir: `/tmp/${actor.toLowerCase()}-profile`,
    logDir: "/tmp/logs",
    timeoutMs: 1000,
    postSendTimeoutMs: 1000,
    selectors: {
      sessionMarker: {
        strategy: "css",
        value: `[data-session-role="${actor}"]`
      },
      destinationMarker: {
        strategy: "css",
        value: `[data-destination-role="${actor}"]`
      },
      promptInput: {
        strategy: "css",
        value: "[data-prompt-input]"
      },
      sendButton: {
        strategy: "css",
        value: "[data-send]"
      }
    }
  };
}

function routing(): ControlledHandoffRoutingConfig {
  return {
    sourceRoutes: {
      SUPERVISOR_WEB: {
        authorActor: "SUPERVISOR_WEB",
        recipientActor: "IMPLEMENTER_WEB",
        mailboxRef: IMPLEMENTER_RECIPIENT_MAILBOX_REF
      },
      IMPLEMENTER_WEB: {
        authorActor: "IMPLEMENTER_WEB",
        recipientActor: "SUPERVISOR_WEB",
        mailboxRef: SUPERVISOR_RECIPIENT_MAILBOX_REF
      }
    },
    destinations: {
      IMPLEMENTER_WEB: {
        actor: "IMPLEMENTER_WEB",
        visibleMarkerActor: "IMPLEMENTER_WEB",
        driverConfig: m1Config("IMPLEMENTER_WEB")
      },
      SUPERVISOR_WEB: {
        actor: "SUPERVISOR_WEB",
        visibleMarkerActor: "SUPERVISOR_WEB",
        driverConfig: m1Config("SUPERVISOR_WEB")
      }
    }
  };
}

function input(
  cwd: string,
  options: {
    supervisorReview?: boolean;
    routingConfig?: ControlledHandoffRoutingConfig;
  } = {}
): ControlledHandoffInput {
  const supervisorReview = options.supervisorReview ?? false;
  return {
    rawRequest: supervisorReview
      ? request({
          expectedRevision: REVISION,
          targetActor: "SUPERVISOR_WEB",
          handoffKind: "SUPERVISOR_REVIEW"
        })
      : request(),
    context: context(supervisorReview),
    payload: supervisorReview
      ? {
          sourceRef: IMPLEMENTER_PAYLOAD_REF,
          authorActor: "IMPLEMENTER_WEB",
          text: "Implementer-authored review payload."
        }
      : {
          sourceRef: SUPERVISOR_PAYLOAD_REF,
          authorActor: "SUPERVISOR_WEB",
          text: "Supervisor-authored implementation payload."
        },
    mailboxPayloadEvidence: supervisorReview
      ? {
          mailboxRef: SUPERVISOR_RECIPIENT_MAILBOX_REF,
          comment: mailboxComment(
            32,
            400,
            "Implementer-authored review payload."
          )
        }
      : {
          mailboxRef: IMPLEMENTER_RECIPIENT_MAILBOX_REF,
          comment: mailboxComment(
            31,
            300,
            "Supervisor-authored implementation payload."
          )
        },
    routing: options.routingConfig ?? routing(),
    cwd
  };
}

class FakeDriver implements PromptDeliveryDriver {
  sendCount = 0;
  insertedPrompt = "";
  failAfterSend = false;
  failSession = false;

  async openActor(): Promise<void> {}
  async checkSession(): Promise<void> {
    if (this.failSession) {
      throw new ActuationError("SESSION_INVALID", "wrong visible session marker");
    }
  }
  async focusConversation(): Promise<void> {}
  async locatePromptInput(): Promise<void> {}
  async insertPrompt(prompt: string): Promise<void> {
    this.insertedPrompt = prompt;
  }
  async readPrompt(): Promise<string> {
    return this.insertedPrompt;
  }
  async locateSendControl(): Promise<void> {}
  async sendPrompt(): Promise<void> {
    this.sendCount += 1;
  }
  async confirmSend(_prompt: string): Promise<void> {
    if (this.failAfterSend) {
      throw new ActuationError(
        "POST_SEND_UNCONFIRMED",
        "own input transition uncertain"
      );
    }
    this.insertedPrompt = "";
  }
  async close(): Promise<void> {}
}

function proof(
  prepared: Awaited<ReturnType<typeof prepareControlledHandoff>>
): RealHandoffProofAuthorization {
  assert.equal(prepared.result, "HANDOFF_PREPARED");
  if (prepared.result !== "HANDOFF_PREPARED") {
    throw new Error("expected prepared handoff");
  }
  return {
    reference: HUMAN_REF,
    repository: prepared.request.workItem.repository,
    workItemNumber: prepared.request.workItem.number,
    prNumber: prepared.envelope.prRef?.number ?? null,
    expectedRevision: prepared.envelope.expectedRevision,
    targetActor: prepared.request.targetActor,
    handoffKind: prepared.request.handoffKind,
    destinationName: prepared.destination.driverConfig.destinationName,
    storeRecipient: prepared.storeRecord.recipient,
    storeRecordId: prepared.storeRecord.recordId,
    deliveryLimit: 1,
    noRetryAfterUncertainty: true
  };
}

test("prepares IMPLEMENTER_WEB handoff in only the implementer recipient store", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "actuador-m34-"));
  const prepared = await prepareControlledHandoff(input(cwd));

  assert.equal(prepared.result, "HANDOFF_PREPARED");
  if (prepared.result !== "HANDOFF_PREPARED") return;

  assert.equal(prepared.request.targetActor, "IMPLEMENTER_WEB");
  assert.equal(prepared.envelope.recipient, "IMPLEMENTER_WEB");
  assert.equal(
    prepared.envelope.prompt.split("\n")[0],
    "DESTINATARIO: IMPLEMENTER_WEB"
  );
  assert.equal(prepared.storeRecord.recipient, "IMPLEMENTER_WEB");
  assert.equal(prepared.storeRecord.status, "READY");
  assert.equal(
    prepared.storeRecord.prompt,
    prepared.envelope.prompt
  );

  const implementerPath = join(
    promptStoreDirectory("IMPLEMENTER_WEB", cwd),
    `${prepared.storeRecord.recordId}.json`
  );
  const persisted = JSON.parse(await readFile(implementerPath, "utf8"));
  assert.equal(persisted.recipient, "IMPLEMENTER_WEB");
  assert.equal(persisted.status, "READY");
  assert.notEqual(
    promptStoreDirectory("IMPLEMENTER_WEB", cwd),
    promptStoreDirectory("SUPERVISOR_WEB", cwd)
  );
});

test("SUPERVISOR_WEB handoff preserves payload and includes alignment suffix in the same stored prompt", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "actuador-m34-"));
  const prepared = await prepareControlledHandoff(
    input(cwd, { supervisorReview: true })
  );

  assert.equal(prepared.result, "HANDOFF_PREPARED");
  if (prepared.result !== "HANDOFF_PREPARED") return;

  assert.equal(prepared.envelope.recipient, "SUPERVISOR_WEB");
  assert.match(
    prepared.storeRecord.prompt,
    /Implementer-authored review payload\.[\s\S]*PROJECT_ALIGNMENT_CHECK/
  );
  assert.equal(
    prepared.storeRecord.prompt.split("\n")[0],
    "DESTINATARIO: SUPERVISOR_WEB"
  );
});


test("explicit selected #32-style mailbox source with exact body can prepare", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "actuador-m34-"));
  const result = await prepareControlledHandoff(
    input(cwd, { supervisorReview: true })
  );

  assert.equal(result.result, "HANDOFF_PREPARED");
  if (result.result !== "HANDOFF_PREPARED") return;
  assert.equal(result.envelope.payloadSourceRef, IMPLEMENTER_PAYLOAD_REF);
  assert.equal(
    result.envelope.prompt.includes("Implementer-authored review payload."),
    true
  );
});

test("same payload from wrong mailbox route blocks", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "actuador-m34-"));
  const base = input(cwd, { supervisorReview: true });
  const wrongSource =
    `${IMPLEMENTER_RECIPIENT_MAILBOX_REF}#issuecomment-400`;

  const result = await prepareControlledHandoff({
    ...base,
    payload: {
      ...base.payload,
      sourceRef: wrongSource
    },
    mailboxPayloadEvidence: {
      mailboxRef: IMPLEMENTER_RECIPIENT_MAILBOX_REF,
      comment: mailboxComment(
        31,
        400,
        "Implementer-authored review payload."
      )
    }
  });

  assert.equal(result.result, "HANDOFF_BLOCKED");
  if (result.result === "HANDOFF_BLOCKED") {
    assert.equal(result.errorCode, "PAYLOAD_PROVENANCE_MISMATCH");
  }
});

test("absent selected mailbox source evidence blocks", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "actuador-m34-"));
  const base = input(cwd, { supervisorReview: true });
  const { mailboxPayloadEvidence: _mailboxPayloadEvidence, ...withoutEvidence } =
    base;

  const result = await prepareControlledHandoff(withoutEvidence);

  assert.equal(result.result, "HANDOFF_BLOCKED");
  if (result.result === "HANDOFF_BLOCKED") {
    assert.equal(result.errorCode, "PROMPT_PAYLOAD_SOURCE_NOT_FOUND");
  }
});

test("selected mailbox persisted body mismatch blocks", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "actuador-m34-"));
  const base = input(cwd, { supervisorReview: true });
  assert.notEqual(base.mailboxPayloadEvidence, undefined);
  if (base.mailboxPayloadEvidence === undefined) {
    throw new Error("expected mailbox payload evidence");
  }

  const result = await prepareControlledHandoff({
    ...base,
    mailboxPayloadEvidence: {
      ...base.mailboxPayloadEvidence,
      comment: {
        ...base.mailboxPayloadEvidence.comment,
        body: "edited persisted payload body"
      }
    }
  });

  assert.equal(result.result, "HANDOFF_BLOCKED");
  if (result.result === "HANDOFF_BLOCKED") {
    assert.equal(result.errorCode, "PROMPT_PAYLOAD_SOURCE_MISMATCH");
  }
});

test("mailbox payload evidence cannot satisfy Workflow authorization", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "actuador-m34-"));
  const base = input(cwd, { supervisorReview: true });

  const result = await prepareControlledHandoff({
    ...base,
    rawRequest: {
      ...(base.rawRequest as ActuationRequest),
      authorization: IMPLEMENTER_PAYLOAD_REF
    }
  });

  assert.equal(result.result, "HANDOFF_BLOCKED");
  if (result.result === "HANDOFF_BLOCKED") {
    assert.equal(result.errorCode, "REQUEST_AUTHORIZATION_NOT_APPLICABLE");
  }
});

test("payload provenance blocks a correct author label from the wrong configured source route", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "actuador-m34-"));
  const bad = routing();
  bad.sourceRoutes.SUPERVISOR_WEB = {
    authorActor: "SUPERVISOR_WEB",
    recipientActor: "IMPLEMENTER_WEB",
    mailboxRef: "https://github.com/owner/repo/issues/999"
  };

  const result = await prepareControlledHandoff(
    input(cwd, { routingConfig: bad })
  );

  assert.equal(result.result, "HANDOFF_BLOCKED");
  if (result.result === "HANDOFF_BLOCKED") {
    assert.equal(result.errorCode, "PAYLOAD_PROVENANCE_MISMATCH");
    assert.equal(result.delivery, "NO_DELIVERY");
    assert.equal(result.escalation, "SUPERVISOR");
  }
});

test("configured destination actor or visible marker mismatch blocks before driver creation", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "actuador-m34-"));
  const bad = routing();
  bad.destinations.IMPLEMENTER_WEB = {
    ...bad.destinations.IMPLEMENTER_WEB,
    visibleMarkerActor: "SUPERVISOR_WEB"
  };

  const result = await prepareControlledHandoff(
    input(cwd, { routingConfig: bad })
  );

  assert.equal(result.result, "HANDOFF_BLOCKED");
  if (result.result === "HANDOFF_BLOCKED") {
    assert.equal(result.errorCode, "DESTINATION_MISMATCH");
  }
});

test("unsupported actor stops in M3.2 before prompt/store/delivery", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "actuador-m34-"));
  const base = input(cwd);
  const result = await prepareControlledHandoff({
    ...base,
    rawRequest: {
      ...(base.rawRequest as ActuationRequest),
      targetActor: "HUMAN"
    }
  });

  assert.equal(result.result, "HANDOFF_BLOCKED");
  if (result.result === "HANDOFF_BLOCKED") {
    assert.equal(result.errorCode, "REQUEST_INVALID_REQUEST");
    assert.equal(result.delivery, "NO_DELIVERY");
  }
});

test("real Send gate blocks when separate Human proof authorization is absent", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "actuador-m34-"));
  let driverCreated = false;

  const result = await executeControlledHandoff(
    input(cwd),
    null,
    () => {
      driverCreated = true;
      return new FakeDriver();
    }
  );

  assert.equal(result.result, "HANDOFF_BLOCKED");
  if (result.result === "HANDOFF_BLOCKED") {
    assert.equal(result.errorCode, "REAL_SEND_NOT_AUTHORIZED");
  }
  assert.equal(driverCreated, false);
});

test("exact proof authorization plus all gates reaches existing M1 once with a fake driver", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "actuador-m34-"));
  const handoffInput = input(cwd);
  const prepared = await prepareControlledHandoff(handoffInput);
  const driver = new FakeDriver();

  const result = await executeControlledHandoff(
    handoffInput,
    proof(prepared),
    (config) => {
      assert.equal(config.destinationName, "IMPLEMENTER_WEB");
      assert.equal(
        config.prompt.split("\n")[0],
        "DESTINATARIO: IMPLEMENTER_WEB"
      );
      return driver;
    }
  );

  assert.equal(result.result, "HANDOFF_TECHNICAL_SUCCESS");
  assert.equal(driver.sendCount, 1);
  assert.match(
    driver.insertedPrompt,
    /^$/ 
  );

  const preparedAgain = await prepareControlledHandoff(handoffInput);
  assert.equal(preparedAgain.result, "HANDOFF_BLOCKED");
  if (preparedAgain.result === "HANDOFF_BLOCKED") {
    assert.equal(preparedAgain.errorCode, "PROMPT_RECORD_NOT_READY");
  }
});

test("uncertainty after Send is persisted as attempted and never replayed", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "actuador-m34-"));
  const handoffInput = input(cwd);
  const prepared = await prepareControlledHandoff(handoffInput);
  const driver = new FakeDriver();
  driver.failAfterSend = true;

  const first = await executeControlledHandoff(
    handoffInput,
    proof(prepared),
    () => driver
  );

  assert.equal(first.result, "HANDOFF_UNCERTAIN_AFTER_SEND");
  assert.equal(driver.sendCount, 1);

  const second = await executeControlledHandoff(
    handoffInput,
    proof(prepared),
    () => driver
  );

  assert.equal(second.result, "HANDOFF_BLOCKED");
  assert.equal(driver.sendCount, 1);
  if (second.result === "HANDOFF_BLOCKED") {
    assert.equal(second.errorCode, "PROMPT_RECORD_NOT_READY");
  }
});

test("M1 pre-Send session failure returns NO DELIVERY and leaves record retryable", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "actuador-m34-"));
  const handoffInput = input(cwd);
  const prepared = await prepareControlledHandoff(handoffInput);
  const driver = new FakeDriver();
  driver.failSession = true;

  const result = await executeControlledHandoff(
    handoffInput,
    proof(prepared),
    () => driver
  );

  assert.equal(result.result, "HANDOFF_BLOCKED");
  assert.equal(driver.sendCount, 0);
  if (result.result === "HANDOFF_BLOCKED") {
    assert.equal(result.errorCode, "SESSION_INVALID");
    assert.equal(result.delivery, "NO_DELIVERY");
  }

  const after = await prepareControlledHandoff(handoffInput);
  assert.equal(after.result, "HANDOFF_PREPARED");
});

test("recipient-side bootstrap protocol rejects the other Web role without rerouting", () => {
  const implementer = recipientBootstrapProtocol("IMPLEMENTER_WEB");
  const supervisor = recipientBootstrapProtocol("SUPERVISOR_WEB");

  assert.match(implementer, /DESTINATARIO: SUPERVISOR_WEB/);
  assert.match(supervisor, /DESTINATARIO: IMPLEMENTER_WEB/);
  assert.match(implementer, /DESTINATARIO_INCORRECTO/);
  assert.match(supervisor, /No ejecutaré la actuación/);
});

test("Playwright driver source exposes only own-input post-Send confirmation, not chatbot Output extraction", async () => {
  const source = await readFile("src/playwright-driver.ts", "utf8");
  for (const forbidden of [
    "newCDPSession",
    "connectOverCDP",
    "page.on(\"response\"",
    "page.on('response'",
    "websocket",
    "WebSocket",
    "response.body",
    "response.text"
  ]) {
    assert.equal(source.includes(forbidden), false);
  }
  assert.match(source, /async readPrompt\(\)/);
  assert.match(source, /this\.requirePromptInput\(\)/);
  assert.match(source, /await this\.readPrompt\(\)\) !== prompt/);
});
