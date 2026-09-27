import type { ActuationOutcome, ActuatorConfig, PromptDeliveryDriver } from "./types.js";
import { ActuationError } from "./types.js";

function errorCode(error: unknown): string {
  return error instanceof ActuationError ? error.code : "UNEXPECTED_ERROR";
}

function errorDetail(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function executePromptDelivery(
  driver: PromptDeliveryDriver,
  config: ActuatorConfig
): Promise<ActuationOutcome> {
  let sendAttempted = false;
  let outcome: ActuationOutcome;

  try {
    await driver.openActor();
    await driver.checkSession();
    await driver.focusConversation();
    await driver.locatePromptInput();
    await driver.insertPrompt(config.prompt);

    const insertedPrompt = await driver.readPrompt();
    if (insertedPrompt !== config.prompt) {
      throw new ActuationError("PROMPT_MISMATCH", "Inserted prompt does not exactly match the configured prompt.");
    }

    await driver.locateSendControl();

    sendAttempted = true;
    await driver.sendPrompt();
    await driver.confirmSend(config.prompt);

    outcome = { result: "SUCCESS" };
  } catch (error) {
    outcome = {
      result: sendAttempted ? "UNCERTAIN_AFTER_SEND" : "FAILED_BEFORE_SEND",
      errorCode: errorCode(error),
      detail: errorDetail(error)
    };
  } finally {
    try {
      await driver.close();
    } catch (error) {
      if (outcome!.result === "SUCCESS") {
        outcome = {
          result: "UNCERTAIN_AFTER_SEND",
          errorCode: "CLOSE_FAILED_AFTER_SEND",
          detail: errorDetail(error)
        };
      }
    }
  }

  return outcome!;
}
