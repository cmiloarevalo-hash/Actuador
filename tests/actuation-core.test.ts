import test from "node:test";
import assert from "node:assert/strict";
import { executePromptDelivery } from "../src/actuation-core.js";
import { ActuationError, type ActuatorConfig, type PromptDeliveryDriver } from "../src/types.js";

const config: ActuatorConfig = {
  version: 1,
  destinationName: "test",
  targetUrl: "https://example.test/conversation",
  expectedUrlPrefix: "https://example.test/conversation",
  profileDir: "/tmp/profile",
  logDir: "/tmp/logs",
  prompt: "exact prompt",
  timeoutMs: 1000,
  postSendTimeoutMs: 1000,
  selectors: {
    sessionMarker: { strategy: "css", value: "#session" },
    destinationMarker: { strategy: "css", value: "#destination" },
    promptInput: { strategy: "css", value: "#input" },
    sendButton: { strategy: "css", value: "#send" }
  }
};

class FakeDriver implements PromptDeliveryDriver {
  prompt = "exact prompt";
  sendCount = 0;
  closed = false;
  failBeforeSend = false;
  failSendControl = false;
  failOnSend = false;
  failAfterSend = false;
  failOnClose = false;

  async openActor(): Promise<void> {}
  async checkSession(): Promise<void> {
    if (this.failBeforeSend) throw new ActuationError("SESSION_INVALID", "session invalid");
  }
  async focusConversation(): Promise<void> {}
  async locatePromptInput(): Promise<void> {}
  async insertPrompt(_prompt: string): Promise<void> {}
  async readPrompt(): Promise<string> { return this.prompt; }
  async locateSendControl(): Promise<void> {
    if (this.failSendControl) throw new ActuationError("SEND_CONTROL_NOT_READY", "send disabled");
  }
  async sendPrompt(): Promise<void> {
    this.sendCount += 1;
    if (this.failOnSend) throw new Error("click outcome unknown");
  }
  async confirmSend(_prompt: string): Promise<void> {
    if (this.failAfterSend) throw new Error("post-send confirmation failed");
  }
  async close(): Promise<void> {
    this.closed = true;
    if (this.failOnClose) throw new Error("close failed");
  }
}

test("returns SUCCESS and sends exactly once", async () => {
  const driver = new FakeDriver();
  const outcome = await executePromptDelivery(driver, config);

  assert.deepEqual(outcome, { result: "SUCCESS" });
  assert.equal(driver.sendCount, 1);
  assert.equal(driver.closed, true);
});

test("returns FAILED_BEFORE_SEND and does not send when prompt verification fails", async () => {
  const driver = new FakeDriver();
  driver.prompt = "different prompt";

  const outcome = await executePromptDelivery(driver, config);

  assert.equal(outcome.result, "FAILED_BEFORE_SEND");
  assert.equal(outcome.errorCode, "PROMPT_MISMATCH");
  assert.equal(driver.sendCount, 0);
  assert.equal(driver.closed, true);
});

test("returns FAILED_BEFORE_SEND for a session failure", async () => {
  const driver = new FakeDriver();
  driver.failBeforeSend = true;

  const outcome = await executePromptDelivery(driver, config);

  assert.equal(outcome.result, "FAILED_BEFORE_SEND");
  assert.equal(outcome.errorCode, "SESSION_INVALID");
  assert.equal(driver.sendCount, 0);
});



test("returns FAILED_BEFORE_SEND when the Send control is unavailable", async () => {
  const driver = new FakeDriver();
  driver.failSendControl = true;

  const outcome = await executePromptDelivery(driver, config);

  assert.equal(outcome.result, "FAILED_BEFORE_SEND");
  assert.equal(outcome.errorCode, "SEND_CONTROL_NOT_READY");
  assert.equal(driver.sendCount, 0);
});

test("returns UNCERTAIN_AFTER_SEND and never retries when Send throws", async () => {
  const driver = new FakeDriver();
  driver.failOnSend = true;

  const outcome = await executePromptDelivery(driver, config);

  assert.equal(outcome.result, "UNCERTAIN_AFTER_SEND");
  assert.equal(driver.sendCount, 1);
  assert.equal(driver.closed, true);
});

test("returns UNCERTAIN_AFTER_SEND and never retries when post-send confirmation fails", async () => {
  const driver = new FakeDriver();
  driver.failAfterSend = true;

  const outcome = await executePromptDelivery(driver, config);

  assert.equal(outcome.result, "UNCERTAIN_AFTER_SEND");
  assert.equal(driver.sendCount, 1);
  assert.equal(driver.closed, true);
});


test("does not report SUCCESS when controlled close fails after Send", async () => {
  const driver = new FakeDriver();
  driver.failOnClose = true;

  const outcome = await executePromptDelivery(driver, config);

  assert.equal(outcome.result, "UNCERTAIN_AFTER_SEND");
  assert.equal(outcome.errorCode, "CLOSE_FAILED_AFTER_SEND");
  assert.equal(driver.sendCount, 1);
});
