import type { GitHubReaderInput } from "./github-reader.js";
import {
  readIntegratedContext,
  summarizeIntegratedContext
} from "./github-context.js";

class CliInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CliInputError";
  }
}

function positiveInteger(value: string, flag: string): number {
  if (!/^[1-9][0-9]*$/.test(value)) {
    throw new CliInputError(`${flag} must be a positive integer.`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new CliInputError(`${flag} is outside the supported integer range.`);
  }
  return parsed;
}

function parseExplicitInput(args: string[]): GitHubReaderInput {
  let repository: string | undefined;
  let issue: number | undefined;
  let pr: number | undefined;

  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new CliInputError(`${flag ?? "argument"} requires an explicit value.`);
    }

    if (flag === "--repository") {
      if (repository !== undefined) throw new CliInputError("--repository may be supplied only once.");
      repository = value;
      continue;
    }
    if (flag === "--issue") {
      if (issue !== undefined) throw new CliInputError("--issue may be supplied only once.");
      issue = positiveInteger(value, "--issue");
      continue;
    }
    if (flag === "--pr") {
      if (pr !== undefined) throw new CliInputError("--pr may be supplied only once.");
      pr = positiveInteger(value, "--pr");
      continue;
    }

    throw new CliInputError(`Unknown argument: ${flag ?? "(missing)"}.`);
  }

  if (repository === undefined || repository.length === 0) {
    throw new CliInputError("--repository owner/name is required.");
  }
  if (issue === undefined) {
    throw new CliInputError("--issue is required.");
  }

  return {
    repository,
    workItemNumber: issue,
    ...(pr === undefined ? {} : { prNumber: pr })
  };
}

async function main(): Promise<void> {
  let input: GitHubReaderInput;
  try {
    input = parseExplicitInput(process.argv.slice(2));
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.log(JSON.stringify({
      result: "CONTEXT_BLOCKED",
      errorCode: "INVALID_INPUT",
      detail
    }, null, 2));
    process.exitCode = 2;
    return;
  }

  const result = await readIntegratedContext(input);
  console.log(JSON.stringify(summarizeIntegratedContext(input, result), null, 2));
  if (result.result !== "CONTEXT_READY") process.exitCode = 2;
}

void main();
