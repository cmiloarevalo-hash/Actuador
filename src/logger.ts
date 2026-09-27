import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { ActuationOutcome } from "./types.js";

export async function writeOperationalLog(
  logDir: string,
  destination: string,
  outcome: ActuationOutcome,
  timestamp = new Date()
): Promise<void> {
  await mkdir(logDir, { recursive: true });
  const day = timestamp.toISOString().slice(0, 10);
  const entry = {
    timestamp: timestamp.toISOString(),
    destination,
    result: outcome.result,
    ...(outcome.errorCode ? { errorCode: outcome.errorCode } : {})
  };
  await appendFile(join(logDir, `actuation-${day}.jsonl`), `${JSON.stringify(entry)}\n`, "utf8");
}
