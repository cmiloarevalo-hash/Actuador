import type { ActuationTargetActor } from "./actuation-request-validator.js";

export function recipientBootstrapProtocol(
  actor: ActuationTargetActor
): string {
  const other =
    actor === "IMPLEMENTER_WEB" ? "SUPERVISOR_WEB" : "IMPLEMENTER_WEB";

  return [
    `ROL_WEB: ${actor}`,
    `Si un mensaje comienza con DESTINATARIO: ${other}:`,
    "- no ejecute la actuación;",
    "- no reinterprete el mensaje;",
    "- responda exactamente:",
    "DESTINATARIO_INCORRECTO",
    "Este chat no corresponde al destinatario indicado.",
    "No ejecutaré la actuación.",
    "Respete el Workflow y reenvíe sólo mediante una nueva actuación autorizada."
  ].join("\n");
}
