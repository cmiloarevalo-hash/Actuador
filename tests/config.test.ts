import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { validateConfig } from "../src/config.js";

const rawConfig = {
  version: 1,
  destinationName: "test",
  targetUrl: "https://example.test/conversation",
  expectedUrlPrefix: "https://example.test/conversation",
  profileDir: ".actuador/profile",
  logDir: ".actuador/logs",
  browserChannel: "chrome",
  prompt: "exact prompt",
  timeoutMs: 1000,
  postSendTimeoutMs: 1000,
  selectors: {
    sessionMarker: { strategy: "role", role: "button", name: "Account" },
    destinationMarker: { strategy: "label", value: "Conversation" },
    promptInput: { strategy: "placeholder", value: "Message" },
    sendButton: { strategy: "css", value: "button[data-send]" }
  }
};

test("validates supported locator strategies and resolves local paths", () => {
  const config = validateConfig(rawConfig, "/repo");

  assert.equal(config.profileDir, path.resolve("/repo", ".actuador", "profile"));
  assert.equal(config.logDir, path.resolve("/repo", ".actuador", "logs"));
  assert.equal(config.prompt, "exact prompt");
});

test("rejects an empty prompt", () => {
  assert.throws(
    () => validateConfig({ ...rawConfig, prompt: "" }, "/repo"),
    /prompt must be a non-empty string/
  );
});

test("rejects unsupported browser channels", () => {
  assert.throws(
    () => validateConfig({ ...rawConfig, browserChannel: "firefox" }, "/repo"),
    /browserChannel must be chrome or msedge/
  );
});
