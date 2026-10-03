import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import type { ActuatorConfig, LocatorSpec } from "./types.js";
import { ActuationError } from "./types.js";

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ActuationError("CONFIG_INVALID", "Configuration must be a JSON object.");
  }
  return value as Record<string, unknown>;
}

function requiredString(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ActuationError("CONFIG_INVALID", `Configuration field ${key} must be a non-empty string.`);
  }
  return value;
}

function positiveInteger(source: Record<string, unknown>, key: string): number {
  const value = source[key];
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new ActuationError("CONFIG_INVALID", `Configuration field ${key} must be a positive integer.`);
  }
  return value;
}

function locator(source: unknown, key: string): LocatorSpec {
  const value = record(source);
  const strategy = requiredString(value, "strategy");

  if (strategy === "role") {
    return {
      strategy,
      role: requiredString(value, "role"),
      name: requiredString(value, "name")
    };
  }

  if (strategy === "label" || strategy === "placeholder" || strategy === "css") {
    return { strategy, value: requiredString(value, "value") };
  }

  throw new ActuationError("CONFIG_INVALID", `Unsupported locator strategy for ${key}: ${strategy}`);
}

export function validateConfig(raw: unknown, cwd = process.cwd()): ActuatorConfig {
  const source = record(raw);
  if (source.version !== 1) {
    throw new ActuationError("CONFIG_INVALID", "Configuration version must be 1.");
  }

  const browserMode = source.browserMode === undefined ? "managed" : requiredString(source, "browserMode");
  if (browserMode !== "managed" && browserMode !== "cdp") {
    throw new ActuationError("CONFIG_INVALID", "browserMode must be managed or cdp.");
  }
  const cdpEndpoint = source.cdpEndpoint === undefined ? undefined : requiredString(source, "cdpEndpoint");
  if (browserMode === "cdp") {
    if (!cdpEndpoint) {
      throw new ActuationError("CONFIG_INVALID", "cdpEndpoint is required when browserMode is cdp.");
    }
    let endpoint: URL;
    try {
      endpoint = new URL(cdpEndpoint);
    } catch {
      throw new ActuationError("CONFIG_INVALID", "cdpEndpoint must be an absolute HTTP URL.");
    }
    if (endpoint.protocol !== "http:" || endpoint.hostname !== "127.0.0.1") {
      throw new ActuationError("CONFIG_INVALID", "cdpEndpoint must use http://127.0.0.1.");
    }
  } else if (cdpEndpoint !== undefined) {
    throw new ActuationError("CONFIG_INVALID", "cdpEndpoint is only valid when browserMode is cdp.");
  }

  const selectors = record(source.selectors);
  const targetUrl = requiredString(source, "targetUrl");
  const expectedUrlPrefix = requiredString(source, "expectedUrlPrefix");
  try {
    new URL(targetUrl);
    new URL(expectedUrlPrefix);
  } catch {
    throw new ActuationError("CONFIG_INVALID", "targetUrl and expectedUrlPrefix must be absolute URLs.");
  }

  return {
    version: 1,
    browserMode,
    ...(cdpEndpoint === undefined ? {} : { cdpEndpoint }),
    destinationName: requiredString(source, "destinationName"),
    targetUrl,
    expectedUrlPrefix,
    profileDir: resolve(cwd, requiredString(source, "profileDir")),
    logDir: resolve(cwd, requiredString(source, "logDir")),
    prompt: requiredString(source, "prompt"),
    timeoutMs: positiveInteger(source, "timeoutMs"),
    postSendTimeoutMs: positiveInteger(source, "postSendTimeoutMs"),
    selectors: {
      sessionMarker: locator(selectors.sessionMarker, "sessionMarker"),
      destinationMarker: locator(selectors.destinationMarker, "destinationMarker"),
      promptInput: locator(selectors.promptInput, "promptInput"),
      sendButton: locator(selectors.sendButton, "sendButton")
    }
  };
}

export async function loadConfig(configPath: string): Promise<ActuatorConfig> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(configPath, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ActuationError("CONFIG_INVALID", `Unable to read configuration: ${message}`);
  }
  return validateConfig(parsed);
}
