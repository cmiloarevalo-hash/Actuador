import { resolve } from "node:path";
import type { ActuationTargetActor } from "./actuation-request-validator.js";
import type { ActuatorConfig } from "./types.js";

export type ActorMap<T> = {
  IMPLEMENTER_WEB: T;
  SUPERVISOR_WEB: T;
};

export interface ActorSourceRoute {
  authorActor: ActuationTargetActor;
  recipientActor: ActuationTargetActor;
  mailboxRef: string;
}

export interface WebActorDestination {
  actor: ActuationTargetActor;
  visibleMarkerActor: ActuationTargetActor;
  driverConfig: Omit<ActuatorConfig, "prompt">;
}

export interface ControlledHandoffRoutingConfig {
  sourceRoutes: ActorMap<ActorSourceRoute>;
  destinations: ActorMap<WebActorDestination>;
}

export function promptStoreDirectory(
  recipient: ActuationTargetActor,
  cwd: string
): string {
  return resolve(
    cwd,
    ".actuador",
    "handoff",
    recipient === "IMPLEMENTER_WEB" ? "implementer-web" : "supervisor-web"
  );
}

export function payloadSourceMatchesRoute(
  sourceRef: string,
  route: ActorSourceRoute
): boolean {
  try {
    const source = new URL(sourceRef);
    const mailbox = new URL(route.mailboxRef);

    return (
      source.protocol === "https:" &&
      source.hostname === "github.com" &&
      source.username === "" &&
      source.password === "" &&
      source.port === "" &&
      source.search === "" &&
      /^#issuecomment-\d+$/.test(source.hash) &&
      mailbox.protocol === "https:" &&
      mailbox.hostname === "github.com" &&
      mailbox.username === "" &&
      mailbox.password === "" &&
      mailbox.port === "" &&
      mailbox.search === "" &&
      mailbox.hash === "" &&
      source.origin === mailbox.origin &&
      source.pathname === mailbox.pathname
    );
  } catch {
    return false;
  }
}
