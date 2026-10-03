import { chromium, type Browser, type BrowserContext, type Locator, type Page } from "playwright-core";
import type { ActuatorConfig, LocatorSpec, PromptDeliveryDriver } from "./types.js";
import { ActuationError } from "./types.js";

export class PlaywrightPromptDeliveryDriver implements PromptDeliveryDriver {
  private context: BrowserContext | undefined;
  private browser: Browser | undefined;
  private page: Page | undefined;
  private promptInput: Locator | undefined;
  private sendControl: Locator | undefined;
  private sendUsed = false;

  constructor(private readonly config: ActuatorConfig) {}

  async openActor(): Promise<void> {
    try {
      if (this.config.browserMode === "cdp") {
        this.browser = await chromium.connectOverCDP(this.config.cdpEndpoint!);
        const contexts = this.browser.contexts();
        if (contexts.length !== 1 || contexts[0] === undefined || contexts[0].pages().length !== 1) {
          throw new ActuationError("CDP_SESSION_AMBIGUOUS", "CDP must expose exactly one context with exactly one page.");
        }
        this.context = contexts[0];
        const page = this.context.pages()[0];
        if (!page) {
          throw new ActuationError("CDP_SESSION_AMBIGUOUS", "CDP page disappeared during session validation.");
        }
        this.page = page;
      } else {
        this.context = await chromium.launchPersistentContext(this.config.profileDir, {
          headless: false
        });
        this.page = this.context.pages()[0] ?? (await this.context.newPage());
      }
      await this.page.goto(this.config.targetUrl, {
        waitUntil: "domcontentloaded",
        timeout: this.config.timeoutMs
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const code = /profile|user data|singleton|already in use/i.test(message)
        ? "PROFILE_LOCKED"
        : "BROWSER_OPEN_FAILED";
      if (error instanceof ActuationError) {
        throw error;
      }
      throw new ActuationError(code, message);
    }
  }

  async checkSession(): Promise<void> {
    await this.requireSingleVisible(this.config.selectors.sessionMarker, "SESSION_INVALID");
  }

  async focusConversation(): Promise<void> {
    const page = this.requirePage();
    if (!page.url().startsWith(this.config.expectedUrlPrefix)) {
      throw new ActuationError(
        "WRONG_DESTINATION",
        `Current URL does not match configured destination prefix: ${page.url()}`
      );
    }
    await this.requireSingleVisible(this.config.selectors.destinationMarker, "WRONG_DESTINATION");
  }

  async locatePromptInput(): Promise<void> {
    this.promptInput = await this.requireSingleVisible(this.config.selectors.promptInput, "INPUT_NOT_FOUND");
  }

  async insertPrompt(prompt: string): Promise<void> {
    const input = this.requirePromptInput();
    try {
      await input.fill(prompt, { timeout: this.config.timeoutMs });
    } catch (error) {
      throw new ActuationError("INPUT_NOT_READY", this.message(error));
    }
  }

  async readPrompt(): Promise<string> {
    const input = this.requirePromptInput();
    const result = await input.evaluate((element) => {
      if (element.tagName === "INPUT") {
        return { kind: "ok" as const, value: (element as HTMLInputElement).value };
      }
      if (element.tagName === "TEXTAREA") {
        return { kind: "ok" as const, value: (element as HTMLTextAreaElement).value };
      }

      const htmlElement = element as HTMLElement;
      if (!htmlElement.isContentEditable) {
        return { kind: "ok" as const, value: element.textContent ?? "" };
      }

      const unsupported = (detail: string) => ({
        kind: "unsupported" as const,
        detail
      });
      const paragraphs = Array.from(element.childNodes);
      if (paragraphs.length === 0) {
        return unsupported("Contenteditable prompt root has no direct paragraph children.");
      }

      const lines: string[] = [];
      for (let paragraphIndex = 0; paragraphIndex < paragraphs.length; paragraphIndex += 1) {
        const paragraph = paragraphs[paragraphIndex];
        if (paragraph === undefined || paragraph.nodeType !== 1 || paragraph.nodeName !== "P") {
          return unsupported(
            `Contenteditable prompt root child ${paragraphIndex} is not a direct P element.`
          );
        }

        const children = Array.from(paragraph.childNodes);
        if (
          children.length === 1 &&
          children[0]?.nodeType === 1 &&
          children[0].nodeName === "BR"
        ) {
          lines.push("");
          continue;
        }
        if (children.length === 0) {
          return unsupported(
            `Contenteditable prompt paragraph ${paragraphIndex} is empty without a sole BR placeholder.`
          );
        }

        let text = "";
        for (let childIndex = 0; childIndex < children.length; childIndex += 1) {
          const child = children[childIndex];
          if (child === undefined || child.nodeType !== 3 || child.nodeValue === null) {
            return unsupported(
              `Contenteditable prompt paragraph ${paragraphIndex} child ${childIndex} is not a text node.`
            );
          }
          text += child.nodeValue;
        }
        if (text.length === 0) {
          return unsupported(
            `Contenteditable prompt paragraph ${paragraphIndex} has empty text instead of a sole BR placeholder.`
          );
        }
        lines.push(text);
      }

      return { kind: "ok" as const, value: lines.join("\n") };
    });

    if (result.kind === "unsupported") {
      throw new ActuationError("UNSUPPORTED_CONTENTEDITABLE_STRUCTURE", result.detail);
    }
    return result.value;
  }

  async locateSendControl(): Promise<void> {
    const control = await this.requireSingleVisible(this.config.selectors.sendButton, "SEND_CONTROL_NOT_FOUND");
    if (!(await control.isEnabled())) {
      throw new ActuationError("SEND_CONTROL_NOT_READY", "Send control is not enabled.");
    }
    this.sendControl = control;
  }

  async sendPrompt(): Promise<void> {
    if (this.sendUsed) {
      throw new ActuationError("DUPLICATE_SEND_BLOCKED", "Send was already attempted for this execution.");
    }
    const control = this.sendControl;
    if (!control) {
      throw new ActuationError("SEND_CONTROL_NOT_FOUND", "Send control was not prepared.");
    }

    this.sendUsed = true;
    await control.click({ timeout: this.config.timeoutMs });
  }

  async confirmSend(prompt: string): Promise<void> {
    const deadline = Date.now() + this.config.postSendTimeoutMs;
    while (Date.now() < deadline) {
      if ((await this.readPrompt()) !== prompt) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new ActuationError(
      "POST_SEND_UNCONFIRMED",
      "The prompt remained in the input after the single Send action; delivery is uncertain."
    );
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    } else {
      await this.context?.close();
    }
    this.browser = undefined;
    this.context = undefined;
    this.page = undefined;
    this.promptInput = undefined;
    this.sendControl = undefined;
  }

  private requirePage(): Page {
    if (!this.page) {
      throw new ActuationError("PAGE_NOT_READY", "Browser page is not available.");
    }
    return this.page;
  }

  private requirePromptInput(): Locator {
    if (!this.promptInput) {
      throw new ActuationError("INPUT_NOT_FOUND", "Prompt input was not prepared.");
    }
    return this.promptInput;
  }

  private async requireSingleVisible(spec: LocatorSpec, code: string): Promise<Locator> {
    const locator = this.locatorFor(spec);
    try {
      await locator.first().waitFor({ state: "visible", timeout: this.config.timeoutMs });
      const count = await locator.count();
      if (count !== 1) {
        throw new ActuationError(code, `Expected exactly one matching element, found ${count}.`);
      }
      return locator;
    } catch (error) {
      if (error instanceof ActuationError) {
        throw error;
      }
      throw new ActuationError(code, this.message(error));
    }
  }

  private locatorFor(spec: LocatorSpec): Locator {
    const page = this.requirePage();
    switch (spec.strategy) {
      case "role":
        return page.getByRole(spec.role as never, { name: spec.name, exact: true });
      case "label":
        return page.getByLabel(spec.value, { exact: true });
      case "placeholder":
        return page.getByPlaceholder(spec.value, { exact: true });
      case "css":
        return page.locator(spec.value);
    }
  }

  private message(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
