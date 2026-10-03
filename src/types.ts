export type TechnicalResult = "SUCCESS" | "FAILED_BEFORE_SEND" | "UNCERTAIN_AFTER_SEND";

export type LocatorSpec =
  | { strategy: "role"; role: string; name: string }
  | { strategy: "label"; value: string }
  | { strategy: "placeholder"; value: string }
  | { strategy: "css"; value: string };

export interface ActuatorConfig {
  version: 1;
  browserMode: "managed" | "cdp";
  cdpEndpoint?: string;
  destinationName: string;
  targetUrl: string;
  expectedUrlPrefix: string;
  profileDir: string;
  logDir: string;
  prompt: string;
  timeoutMs: number;
  postSendTimeoutMs: number;
  selectors: {
    sessionMarker: LocatorSpec;
    destinationMarker: LocatorSpec;
    promptInput: LocatorSpec;
    sendButton: LocatorSpec;
  };
}

export interface ActuationOutcome {
  result: TechnicalResult;
  errorCode?: string;
  detail?: string;
}

export interface PromptDeliveryDriver {
  openActor(): Promise<void>;
  checkSession(): Promise<void>;
  focusConversation(): Promise<void>;
  locatePromptInput(): Promise<void>;
  insertPrompt(prompt: string): Promise<void>;
  readPrompt(): Promise<string>;
  locateSendControl(): Promise<void>;
  sendPrompt(): Promise<void>;
  confirmSend(prompt: string): Promise<void>;
  close(): Promise<void>;
}

export class ActuationError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "ActuationError";
  }
}
