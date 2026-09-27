import process from "node:process";
import { resolve } from "node:path";
import { executePromptDelivery } from "./actuation-core.js";
import { loadConfig } from "./config.js";
import { writeOperationalLog } from "./logger.js";
import { PlaywrightPromptDeliveryDriver } from "./playwright-driver.js";
import { ActuationError, type ActuationOutcome, type ActuatorConfig } from "./types.js";

async function recordOutcome(config: ActuatorConfig, outcome: ActuationOutcome): Promise<void> {
  try {
    await writeOperationalLog(config.logDir, config.destinationName, outcome);
  } catch {
    console.error(JSON.stringify({
      destination: config.destinationName,
      ...outcome,
      operationalErrorCode: "LOG_WRITE_FAILED"
    }));
    process.exitCode = 1;
    return;
  }

  console.log(JSON.stringify({ destination: config.destinationName, ...outcome }));
  process.exitCode = outcome.result === "SUCCESS" ? 0 : 1;
}

async function main(): Promise<void> {
  const configPath = resolve(process.env.ACTUATOR_CONFIG ?? "config/actuator.config.json");

  let config: ActuatorConfig;
  try {
    config = await loadConfig(configPath);
  } catch (error) {
    const outcome: ActuationOutcome = {
      result: "FAILED_BEFORE_SEND",
      errorCode: error instanceof ActuationError ? error.code : "UNEXPECTED_ERROR"
    };
    const fallbackLogDir = resolve(".actuador/logs");
    await writeOperationalLog(fallbackLogDir, "configuration", outcome).catch(() => undefined);
    console.error(JSON.stringify(outcome));
    process.exitCode = 1;
    return;
  }

  const driver = new PlaywrightPromptDeliveryDriver(config);
  const outcome = await executePromptDelivery(driver, config);
  await recordOutcome(config, outcome);
}

await main();
