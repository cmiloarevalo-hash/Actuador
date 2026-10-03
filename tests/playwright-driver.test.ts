import test from "node:test";
import assert from "node:assert/strict";
import { PlaywrightPromptDeliveryDriver } from "../src/playwright-driver.js";
import { ActuationError, type ActuatorConfig } from "../src/types.js";

interface FakeNode {
  nodeType: number;
  nodeName: string;
  nodeValue?: string | null;
  childNodes: FakeNode[];
  tagName?: string;
  isContentEditable?: boolean;
  textContent?: string | null;
  value?: string;
}

interface EvaluateLocator {
  evaluate<R>(pageFunction: (element: HTMLElement) => R): Promise<R>;
}

interface SendLocator {
  first(): SendLocator;
  waitFor(options: { state: "visible"; timeout: number }): Promise<void>;
  count(): Promise<number>;
  isEnabled(): Promise<boolean>;
  click(options: { timeout: number }): Promise<void>;
}

const config: ActuatorConfig = {
  version: 1,
  destinationName: "test",
  targetUrl: "https://example.test/conversation",
  expectedUrlPrefix: "https://example.test/conversation",
  profileDir: "/tmp/profile",
  logDir: "/tmp/logs",
  browserChannel: "chrome",
  prompt: "unused",
  timeoutMs: 1000,
  postSendTimeoutMs: 1000,
  selectors: {
    sessionMarker: { strategy: "css", value: "#session" },
    destinationMarker: { strategy: "css", value: "#destination" },
    promptInput: { strategy: "css", value: "#input" },
    sendButton: { strategy: "css", value: "#send" }
  }
};

function text(value: string): FakeNode {
  return { nodeType: 3, nodeName: "#text", nodeValue: value, childNodes: [] };
}

function element(nodeName: string, ...childNodes: FakeNode[]): FakeNode {
  return { nodeType: 1, nodeName, tagName: nodeName, childNodes };
}

function paragraph(...childNodes: FakeNode[]): FakeNode {
  return element("P", ...childNodes);
}

function blankParagraph(): FakeNode {
  return paragraph(element("BR"));
}

function editable(...paragraphs: FakeNode[]): FakeNode {
  return {
    nodeType: 1,
    nodeName: "DIV",
    tagName: "DIV",
    isContentEditable: true,
    childNodes: paragraphs
  };
}

function driverFor(elementNode: FakeNode): PlaywrightPromptDeliveryDriver {
  const driver = new PlaywrightPromptDeliveryDriver(config);
  const locator: EvaluateLocator = {
    async evaluate<R>(pageFunction: (element: HTMLElement) => R): Promise<R> {
      return pageFunction(elementNode as unknown as HTMLElement);
    }
  };
  (driver as unknown as { promptInput: EvaluateLocator }).promptInput = locator;
  return driver;
}

function sendDriverFor(states: Array<{ count: number; enabled: boolean }>): {
  driver: PlaywrightPromptDeliveryDriver;
  readonly clicks: number;
} {
  let poll = 0;
  let clicks = 0;
  const locator: SendLocator = {
    first: () => locator,
    waitFor: async () => undefined,
    count: async () => states[Math.min(poll, states.length - 1)]?.count ?? 0,
    isEnabled: async () => states[Math.min(poll++, states.length - 1)]?.enabled ?? false,
    click: async () => { clicks += 1; }
  };
  const page = { locator: () => locator };
  const driver = new PlaywrightPromptDeliveryDriver({ ...config, timeoutMs: 100 });
  (driver as unknown as { page: typeof page }).page = page;
  return { driver, get clicks() { return clicks; } };
}

test("reads the exact four-paragraph real diagnostic probe with one blank line", async () => {
  const driver = driverFor(
    editable(
      paragraph(text("ACTUADOR_RB_LINE_1")),
      paragraph(text("ACTUADOR_RB_LINE_2")),
      blankParagraph(),
      paragraph(text("ACTUADOR_RB_LINE_4"))
    )
  );

  assert.equal(
    await driver.readPrompt(),
    "ACTUADOR_RB_LINE_1\nACTUADOR_RB_LINE_2\n\nACTUADOR_RB_LINE_4"
  );
});

test("reads a single-line contenteditable paragraph exactly", async () => {
  const driver = driverFor(editable(paragraph(text("single line"))));
  assert.equal(await driver.readPrompt(), "single line");
});

test("reads an empty editor represented by a sole BR paragraph as empty", async () => {
  const driver = driverFor(editable(blankParagraph()));
  assert.equal(await driver.readPrompt(), "");
});

test("preserves a leading blank line", async () => {
  const driver = driverFor(editable(blankParagraph(), paragraph(text("line"))));
  assert.equal(await driver.readPrompt(), "\nline");
});

test("preserves a trailing blank line", async () => {
  const driver = driverFor(editable(paragraph(text("line")), blankParagraph()));
  assert.equal(await driver.readPrompt(), "line\n");
});

test("preserves consecutive blank lines", async () => {
  const driver = driverFor(
    editable(
      paragraph(text("before")),
      blankParagraph(),
      blankParagraph(),
      paragraph(text("after"))
    )
  );
  assert.equal(await driver.readPrompt(), "before\n\n\nafter");
});

test("preserves spaces exactly without trimming or whitespace collapse", async () => {
  const driver = driverFor(
    editable(
      paragraph(text("  leading  and   internal  ")),
      paragraph(text("\tsecond\tline  "))
    )
  );
  assert.equal(
    await driver.readPrompt(),
    "  leading  and   internal  \n\tsecond\tline  "
  );
});

test("fails closed on unsupported nested or alternate rich contenteditable DOM", async () => {
  const nested = driverFor(
    editable(paragraph(text("plain"), element("SPAN", text("rich"))))
  );
  await assert.rejects(nested.readPrompt(), (error: unknown) => {
    assert.ok(error instanceof ActuationError);
    assert.equal(error.code, "UNSUPPORTED_CONTENTEDITABLE_STRUCTURE");
    return true;
  });

  const alternateRoot = driverFor(
    editable(element("DIV", text("alternate")))
  );
  await assert.rejects(alternateRoot.readPrompt(), (error: unknown) => {
    assert.ok(error instanceof ActuationError);
    assert.equal(error.code, "UNSUPPORTED_CONTENTEDITABLE_STRUCTURE");
    return true;
  });
});

test("preserves HTML input .value behavior unchanged", async () => {
  const driver = driverFor({
    nodeType: 1,
    nodeName: "INPUT",
    tagName: "INPUT",
    value: "input  value\nkept as value",
    childNodes: []
  });
  assert.equal(await driver.readPrompt(), "input  value\nkept as value");
});

test("preserves HTML textarea .value behavior unchanged", async () => {
  const driver = driverFor({
    nodeType: 1,
    nodeName: "TEXTAREA",
    tagName: "TEXTAREA",
    value: "first\n\nthird  ",
    childNodes: []
  });
  assert.equal(await driver.readPrompt(), "first\n\nthird  ");
});

test("waits for a disabled Send control to become enabled", async () => {
  const { driver } = sendDriverFor([
    { count: 1, enabled: false },
    { count: 1, enabled: false },
    { count: 1, enabled: true }
  ]);

  await driver.locateSendControl();
  await driver.sendPrompt();
});

test("fails closed when Send remains disabled", async () => {
  const { driver } = sendDriverFor([{ count: 1, enabled: false }]);

  await assert.rejects(driver.locateSendControl(), (error: unknown) => {
    assert.ok(error instanceof ActuationError);
    assert.equal(error.code, "SEND_CONTROL_NOT_READY");
    return true;
  });
});

test("Send readiness never clicks the control", async () => {
  const result = sendDriverFor([{ count: 1, enabled: false }, { count: 1, enabled: true }]);

  await result.driver.locateSendControl();
  assert.equal(result.clicks, 0);
});

test("accepts an already enabled Send control without regression", async () => {
  const { driver } = sendDriverFor([{ count: 1, enabled: true }]);

  await driver.locateSendControl();
});

test("fails closed when Send becomes ambiguous during readiness", async () => {
  const { driver } = sendDriverFor([{ count: 1, enabled: false }, { count: 2, enabled: false }]);

  await assert.rejects(driver.locateSendControl(), (error: unknown) => {
    assert.ok(error instanceof ActuationError);
    assert.equal(error.code, "SEND_CONTROL_NOT_READY");
    return true;
  });
});
