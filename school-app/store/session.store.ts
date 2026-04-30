import { RequestContext } from "@edu/shared/types/core";

let currentSession: RequestContext | null = null;

export function setSession(session: RequestContext | null): void {
  currentSession = session;
}

export function getSession(): RequestContext | null {
  return currentSession;
}
