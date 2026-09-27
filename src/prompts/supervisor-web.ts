import type { SupervisorEnvelopeFacts } from "./prompt-renderer-types.js";

export const PROJECT_ALIGNMENT_CHECK_SUFFIX = `PROJECT_ALIGNMENT_CHECK

Verify only from GitHub/Workflow:
- active Work Item + parent Milestone still trace to the product objective;
- no material process/infrastructure drift has accumulated;
- no material scope creep is present.

Persist exactly one result in GitHub/Workflow:
ALIGNED | HOLD | HUMAN_REVIEW_REQUIRED`;

export function renderSupervisorWebEnvelope(
  facts: SupervisorEnvelopeFacts
): string {
  const prefix = [
    "DESTINATARIO: SUPERVISOR_WEB",
    `REPOSITORIO: ${facts.repository}`,
    `WORK ITEM: #${facts.workItemNumber}`,
    `WORK ITEM REF: ${facts.workItemUrl}`,
    `PR: #${facts.prNumber}`,
    `PR REF: ${facts.prUrl}`,
    `EXPECTED REVISION: ${facts.expectedRevision}`,
    `AUTHORIZATION REF: ${facts.authorizationRef}`,
    `PAYLOAD SOURCE: ${facts.payloadSourceRef}`
  ].join("\n");

  return `${prefix}\n\n${facts.payloadText}\n\n${PROJECT_ALIGNMENT_CHECK_SUFFIX}`;
}
