// ──────────────────────────────────────────────────────────────
// CR-5 — cache-invalidation event `aircraft_engine.updated`.
//
// Transport decision: the app already invalidates the react-query cache on every
// master-data write, so THAT is the in-app delivery mechanism — we do not add a
// message queue or a second event bus. This module gives that signal a typed,
// unit-testable PAYLOAD (which table, which record, which action) plus a thin
// subscribe hook, so a non-react consumer (or a test) can react to the same event
// without depending on react-query internals.
//
// Consumers are NOT implemented here (out of scope per CR-5) — this only
// guarantees the event fires, with the right payload, on every write.
// ──────────────────────────────────────────────────────────────

import type { QueryClient } from "@tanstack/react-query";

export const AIRCRAFT_ENGINE_UPDATED = "aircraft_engine.updated" as const;

/** The four master-data tables a write can touch. */
export type AircraftEngineTable =
  | "engine_master"
  | "aircraft_family"
  | "aircraft_engine_combination"
  | "authorization_type_group"
  | "aircraft_system_config";

export type AircraftEngineWriteAction = "upsert" | "delete";

export interface AircraftEngineUpdatedPayload {
  table: AircraftEngineTable;
  recordId: string | number;
  action: AircraftEngineWriteAction;
}

export interface AircraftEngineUpdatedEvent extends AircraftEngineUpdatedPayload {
  type: typeof AIRCRAFT_ENGINE_UPDATED;
  /** ISO-8601 UTC instant the event was emitted. */
  emittedAtUtc: string;
}

/** Pure builder — no side effects, so it is trivially unit-testable. */
export function buildAircraftEngineUpdatedEvent(
  payload: AircraftEngineUpdatedPayload,
  emittedAtUtc: string = new Date().toISOString(),
): AircraftEngineUpdatedEvent {
  return { type: AIRCRAFT_ENGINE_UPDATED, emittedAtUtc, ...payload };
}

type Listener = (event: AircraftEngineUpdatedEvent) => void;
const listeners = new Set<Listener>();

/** Subscribe to `aircraft_engine.updated`. Returns an unsubscribe function. */
export function onAircraftEngineUpdated(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Emit `aircraft_engine.updated`. Notifies in-memory subscribers and, when a
 * QueryClient is supplied, invalidates the master-data cache — the primary in-app
 * transport (the ["ae"] key tree feeds every tab + the data-quality banner).
 */
export function emitAircraftEngineUpdated(
  payload: AircraftEngineUpdatedPayload,
  qc?: QueryClient,
): AircraftEngineUpdatedEvent {
  const event = buildAircraftEngineUpdatedEvent(payload);
  qc?.invalidateQueries({ queryKey: ["ae"] });
  for (const l of listeners) l(event);
  return event;
}
