import process from "node:process";
import { resolve } from "node:path";
import { executePromptDelivery } from "./actuation-core.js";
import { loadConfig } from "./config.js";
import { writeOperationalLog } from "./logger.js";
import { PlaywrightPromptDeliveryDriver } from "./playwright-driver.js";
import { ActuationError, type ActuationOutcome } from "./types.js";

async function main(): Promise<void> {
  const configPath = resolve(process.env.ACTUATOR_CONFIG ?? "config/actuator.config.json");

  try {
    const config = await loadConfig(configPath);
    const driver = new PlaywrightPromptDeliveryDriver(config);
    const outcome = await executePromptDelivery(driver, config);
    await writeOperationalLog(config.logDir, config.destinationName, outcome);
    console.log(JSON.stringify({ destination: config.destinationName, ...outcome }));
    process.exitCode = outcome.result === "SUCCESS" ? 0 : 1;
  } catch (error) {
    const outcome: ActuationOutcome = {
      result: "FAILED_BEFORE_SEND",
      errorCode: error instanceof ActuationError ? error.code : "UNEXPECTED_ERROR"
    };
    const fallbackLogDir = resolve(".actuador/logs");
    await writeOperationalLog(fallbackLogDir, "configuration", outcome).catch(() => undefined);
    console.error(JSON.stringify(outcome));
    process.exitCode = 1;
  }
}

await main();
