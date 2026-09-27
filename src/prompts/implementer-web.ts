import type { ImplementerEnvelopeFacts } from "./prompt-renderer-types.js";

export function renderImplementerWebEnvelope(
  facts: ImplementerEnvelopeFacts
): string {
  const prefix = [
    "DESTINATARIO: IMPLEMENTER_WEB",
    `REPOSITORIO: ${facts.repository}`,
    `WORK ITEM: #${facts.workItemNumber}`,
    `WORK ITEM REF: ${facts.workItemUrl}`,
    `AUTHORIZATION REF: ${facts.authorizationRef}`,
    `PAYLOAD SOURCE: ${facts.payloadSourceRef}`
  ].join("\n");

  return `${prefix}\n\n${facts.payloadText}`;
}
