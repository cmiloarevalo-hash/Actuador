import process from "node:process";
import { GITHUB_API_VERSION, readGithubContext, type GithubContextInput } from "./github-context.js";

function usage(): never {
  throw new Error("Usage: github:read -- --repository owner/name --work-item <number> [--pr <number>]");
}

function positiveInteger(value: string | undefined, flag: string): number {
  if (value === undefined || !/^\d+$/.test(value)) throw new Error(`${flag} must be a positive integer.`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error(`${flag} must be a positive integer.`);
  return parsed;
}

function parseArgs(args: string[]): GithubContextInput {
  let repository: string | undefined;
  let workItemNumber: number | undefined;
  let prNumber: number | null = null;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--repository") repository = args[++index];
    else if (arg === "--work-item") workItemNumber = positiveInteger(args[++index], "--work-item");
    else if (arg === "--pr") prNumber = positiveInteger(args[++index], "--pr");
    else usage();
  }

  if (!repository || workItemNumber === undefined) usage();
  return { repository, workItemNumber, prNumber };
}

async function main(): Promise<void> {
  try {
    const input = parseArgs(process.argv.slice(2));
    const result = await readGithubContext(input);
    if (result.result !== "CONTEXT_READY") {
      console.error(JSON.stringify({ ...result, apiVersion: GITHUB_API_VERSION }));
      process.exitCode = 1;
      return;
    }

    console.log(JSON.stringify({
      result: result.result,
      repository: result.context.repository,
      workItemNumber: result.context.workItem.number,
      prNumber: result.context.pr?.number ?? null,
      revisionRef: result.context.revisionRef,
      workItemComments: result.context.workItem.comments.length,
      prComments: result.context.pr?.comments.length ?? 0,
      retrievedAt: result.context.retrievedAt,
      apiVersion: GITHUB_API_VERSION
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ result: "CONTEXT_BLOCKED", errorCode: "INVALID_CLI_INPUT", detail: message, apiVersion: GITHUB_API_VERSION }));
    process.exitCode = 1;
  }
}

await main();
