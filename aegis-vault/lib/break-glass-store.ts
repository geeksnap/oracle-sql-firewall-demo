import type { FirewallViolation } from "./types";

const MAX_BREAK_GLASS = 50;
const store: FirewallViolation[] = [];

export function pushBreakGlassViolation(violation: FirewallViolation): void {
  store.unshift(violation);
  if (store.length > MAX_BREAK_GLASS) {
    store.length = MAX_BREAK_GLASS;
  }
}

export function listBreakGlassViolations(): FirewallViolation[] {
  return [...store];
}

/** Ordered merge without collapsing rows that share an id. */
export function mergeWithBreakGlassViolations(
  dbViolations: FirewallViolation[],
  limit: number,
): FirewallViolation[] {
  return [...listBreakGlassViolations(), ...dbViolations]
    .sort(
      (a, b) =>
        new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
    )
    .slice(0, limit);
}
