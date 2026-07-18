import { describe, it, expect, vi } from "vitest";
import {
  AIRCRAFT_ENGINE_UPDATED,
  buildAircraftEngineUpdatedEvent,
  emitAircraftEngineUpdated,
  onAircraftEngineUpdated,
} from "./aircraftEngine.events";

describe("CR-5 aircraft_engine.updated event", () => {
  it("builds a typed payload with table / recordId / action", () => {
    const e = buildAircraftEngineUpdatedEvent(
      { table: "authorization_type_group", recordId: "AG-737MAX", action: "upsert" },
      "2026-07-18T00:00:00.000Z",
    );
    expect(e).toEqual({
      type: AIRCRAFT_ENGINE_UPDATED,
      emittedAtUtc: "2026-07-18T00:00:00.000Z",
      table: "authorization_type_group",
      recordId: "AG-737MAX",
      action: "upsert",
    });
  });

  it("notifies subscribers and returns the event", () => {
    const seen: any[] = [];
    const off = onAircraftEngineUpdated((e) => seen.push(e));
    const returned = emitAircraftEngineUpdated({ table: "engine_master", recordId: "CFM56", action: "delete" });
    off();
    expect(seen).toHaveLength(1);
    expect(seen[0].table).toBe("engine_master");
    expect(seen[0].recordId).toBe("CFM56");
    expect(seen[0].action).toBe("delete");
    expect(returned.type).toBe(AIRCRAFT_ENGINE_UPDATED);
  });

  it("invalidates the master-data cache via the QueryClient transport", () => {
    const qc = { invalidateQueries: vi.fn() } as any;
    emitAircraftEngineUpdated({ table: "aircraft_engine_combination", recordId: 12, action: "upsert" }, qc);
    expect(qc.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["ae"] });
  });

  it("unsubscribed listeners stop receiving events", () => {
    const fn = vi.fn();
    const off = onAircraftEngineUpdated(fn);
    off();
    emitAircraftEngineUpdated({ table: "aircraft_family", recordId: "A320", action: "upsert" });
    expect(fn).not.toHaveBeenCalled();
  });

  it("carries the action for every write kind on the four tables", () => {
    const seen: string[] = [];
    const off = onAircraftEngineUpdated((e) => seen.push(`${e.table}:${e.action}`));
    emitAircraftEngineUpdated({ table: "engine_master", recordId: "X", action: "upsert" });
    emitAircraftEngineUpdated({ table: "aircraft_engine_combination", recordId: 1, action: "delete" });
    emitAircraftEngineUpdated({ table: "authorization_type_group", recordId: "AG-1", action: "upsert" });
    emitAircraftEngineUpdated({ table: "aircraft_system_config", recordId: "A320", action: "delete" });
    off();
    expect(seen).toEqual([
      "engine_master:upsert",
      "aircraft_engine_combination:delete",
      "authorization_type_group:upsert",
      "aircraft_system_config:delete",
    ]);
  });
});
