import {
  LocalContextInputError,
  runLocalContext
} from "./local-context-entry.js";

async function main(): Promise<void> {
  try {
    const evidence = await runLocalContext(process.argv.slice(2));
    console.log(JSON.stringify(evidence, null, 2));
    if (evidence.result !== "CONTEXT_READY") {
      process.exitCode = 2;
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.log(JSON.stringify({
      result: "CONTEXT_BLOCKED",
      errorCode: error instanceof LocalContextInputError ? "INVALID_INPUT" : "ENTRY_POINT_ERROR",
      detail,
      readOnly: true,
      writeEffects: "NONE"
    }, null, 2));
    process.exitCode = 2;
  }
}

void main();
