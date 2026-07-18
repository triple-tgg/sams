"use client";

// ──────────────────────────────────────────────────────────────
// TanStack Query hooks for the Aircraft & Engine master data.
//
// These follow the same shape as the other master-data hooks
// (see aircraft-types/aircraftTypes.hooks.ts). Today every mutationFn/queryFn
// calls the in-memory mock in aircraftEngine.mock.ts.
//
// SWAP POINT — when the backend ships, replace each mock call with axiosConfig, e.g.
//   queryFn: () => axiosConfig.get("/master/AircraftEngineCombinations").then(r => r.data.responseData)
//   mutationFn: (d) => (d.id ? axiosConfig.put(...) : axiosConfig.post(...)).then(r => r.data)
// The component layer and query keys stay unchanged.
//
// NOTE: queryFns are wrapped in arrows so react-query's QueryFunctionContext is
// never passed through as an `asOf` / options argument to the mock.
// ──────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import * as mock from "./aircraftEngine.mock";
import type { EngineMaster } from "./aircraftEngine.types";
import {
  emitAircraftEngineUpdated,
  type AircraftEngineTable,
  type AircraftEngineWriteAction,
} from "./aircraftEngine.events";

export const aircraftEngineKeys = {
  engines: ["ae", "engines"] as const,
  families: ["ae", "families"] as const,
  combinations: ["ae", "combinations"] as const,
  /** Point-in-time combination reads (CR-3). */
  combinationsAsOf: (asOf: string) => ["ae", "combinations", "asOf", asOf] as const,
  authGroups: ["ae", "authGroups"] as const,
  /** Parameterised auth-group reads (CR-3 asOf, CR-1 downstream gate, CR-2 customer). */
  authGroupsWith: (opts: mock.FetchAuthGroupsOptions) => ["ae", "authGroups", opts] as const,
  systemConfigs: ["ae", "systemConfigs"] as const,
};

/**
 * Invalidate every dataset that data-quality findings derive from AND emit the
 * `aircraft_engine.updated` event (CR-5) so any other module that caches master
 * data can drop its copy. Query invalidation is the in-app transport for the event.
 */
function emitAndInvalidate(
  qc: QueryClient,
  table: AircraftEngineTable,
  action: AircraftEngineWriteAction,
  recordId: string | number,
) {
  emitAircraftEngineUpdated({ table, recordId, action }, qc);
}

function useEmitAndInvalidate() {
  const qc = useQueryClient();
  return (table: AircraftEngineTable, action: AircraftEngineWriteAction, recordId: string | number) =>
    emitAndInvalidate(qc, table, action, recordId);
}

// ── engine_master ──
export function useEngines() {
  return useQuery({ queryKey: aircraftEngineKeys.engines, queryFn: () => mock.fetchEngines() });
}
export function useUpsertEngine() {
  const emit = useEmitAndInvalidate();
  return useMutation({
    mutationFn: (data: EngineMaster) => mock.upsertEngine(data),
    onSuccess: (rec) => emit("engine_master", "upsert", rec.engineCode),
  });
}
export function useDeleteEngine() {
  const emit = useEmitAndInvalidate();
  return useMutation({
    mutationFn: (engineCode: string) => mock.deleteEngine(engineCode),
    onSuccess: (_r, engineCode) => emit("engine_master", "delete", engineCode),
  });
}

// ── aircraft_family ──
export function useFamilies() {
  return useQuery({ queryKey: aircraftEngineKeys.families, queryFn: () => mock.fetchFamilies() });
}
export function useAddFamily() {
  const emit = useEmitAndInvalidate();
  return useMutation({
    mutationFn: (data: { familyCode: string; familyName: string }) => mock.addFamily(data),
    onSuccess: (rec) => emit("aircraft_family", "upsert", rec.familyCode),
  });
}

// ── aircraft_engine_combination ──
export function useCombinations() {
  return useQuery({ queryKey: aircraftEngineKeys.combinations, queryFn: () => mock.fetchCombinations() });
}
/** Point-in-time combinations for audit/QA (CR-3). Disabled until `asOf` is set. */
export function useCombinationsAsOf(asOf?: string) {
  return useQuery({
    queryKey: aircraftEngineKeys.combinationsAsOf(asOf ?? ""),
    queryFn: () => mock.fetchCombinations(asOf),
    enabled: !!asOf,
  });
}
export function useUpsertCombination() {
  const emit = useEmitAndInvalidate();
  return useMutation({
    mutationFn: (data: mock.CombinationInput) => mock.upsertCombination(data),
    onSuccess: (rec) => emit("aircraft_engine_combination", "upsert", rec.id),
  });
}
export function useDeleteCombination() {
  const emit = useEmitAndInvalidate();
  return useMutation({
    mutationFn: (id: number) => mock.deleteCombination(id),
    onSuccess: (_r, id) => emit("aircraft_engine_combination", "delete", id),
  });
}

// ── authorization_type_group ──
/** Admin/Master-Data read — every group, every status (no downstream gate). */
export function useAuthGroups() {
  return useQuery({ queryKey: aircraftEngineKeys.authGroups, queryFn: () => mock.fetchAuthGroups() });
}
/**
 * Downstream read for other modules (M-03 / FM-CM-063). Returns only groups that
 * are PUBLISHED and complete (CR-1 gate), resolved for the given airline (CR-2).
 */
export function useDownstreamAuthGroups(customerId?: number | null) {
  const opts: mock.FetchAuthGroupsOptions = { downstream: true, customerId: customerId ?? null };
  return useQuery({
    queryKey: aircraftEngineKeys.authGroupsWith(opts),
    queryFn: () => mock.fetchAuthGroups(opts),
  });
}
export function useSaveAuthGroupDraft() {
  const emit = useEmitAndInvalidate();
  return useMutation({
    mutationFn: (data: mock.AuthGroupInput) => mock.saveAuthGroupDraft(data),
    onSuccess: (rec) => emit("authorization_type_group", "upsert", rec.groupId),
  });
}
export function useTransitionAuthGroup() {
  const emit = useEmitAndInvalidate();
  return useMutation({
    mutationFn: ({ groupId, action }: { groupId: string; action: mock.AuthGroupTransition }) =>
      mock.transitionAuthGroup(groupId, action),
    onSuccess: (rec) => emit("authorization_type_group", "upsert", rec.groupId),
  });
}

// ── aircraft_system_config ──
export function useSystemConfigs() {
  return useQuery({ queryKey: aircraftEngineKeys.systemConfigs, queryFn: () => mock.fetchSystemConfigs() });
}
export function useUpsertSystemConfig() {
  const emit = useEmitAndInvalidate();
  return useMutation({
    mutationFn: (data: mock.SystemConfigInput) => mock.upsertSystemConfig(data),
    onSuccess: (rec) => emit("aircraft_system_config", "upsert", rec.icaoCode),
  });
}
export function useDeleteSystemConfig() {
  const emit = useEmitAndInvalidate();
  return useMutation({
    mutationFn: (icaoCode: string) => mock.deleteSystemConfig(icaoCode),
    onSuccess: (_r, icaoCode) => emit("aircraft_system_config", "delete", icaoCode),
  });
}

// Synchronous reference checks (used before opening delete confirmations).
export const checkEngineReferences = mock.checkEngineReferences;
export const checkCombinationReferences = mock.checkCombinationReferences;
