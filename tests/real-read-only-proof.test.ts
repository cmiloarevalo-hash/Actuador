import test from "node:test";
import assert from "node:assert/strict";
import { runLocalContext } from "../src/local-context-entry.js";

const isAuthorizedProofRun =
  process.env.GITHUB_ACTIONS === "true" &&
  process.env.GITHUB_REF === "refs/heads/work-item-m2-3b-local-proof";

test("real read-only proof against explicit Actuador Issue and PR", {
  skip: !isAuthorizedProofRun
}, async () => {
  const evidence = await runLocalContext([
    "--repository", "cmiloarevalo-hash/Actuador",
    "--issue", "16",
    "--pr", "18"
  ]);

  assert.equal(evidence.result, "CONTEXT_READY");
  if (evidence.result !== "CONTEXT_READY") return;

  assert.equal(evidence.repository, "cmiloarevalo-hash/Actuador");
  assert.equal(evidence.workItemNumber, 16);
  assert.equal(evidence.prNumber, 18);
  assert.equal(evidence.readOnly, true);
  assert.equal(evidence.writeEffects, "NONE");
  assert.equal(evidence.revisionRef, process.env.GITHUB_SHA);
  assert.ok(evidence.contextRefCount >= 0);

  const serialized = JSON.stringify(evidence);
  assert.equal(serialized.includes('"body"'), false);
  assert.equal(serialized.includes('"comments"'), false);

  console.log(`SAFE_EVIDENCE ${serialized}`);
});
