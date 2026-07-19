"use client";

// ──────────────────────────────────────────────────────────────
// TanStack Query hooks for the Aircraft & Engine master-data API.
// Pure HTTP functions and response normalization live in aircraftEngine.ts.
// ──────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  deleteCombination,
  deleteEngine,
  deleteSystemConfig,
  fetchAuthGroups,
  fetchCombinations,
  fetchEngines,
  fetchSystemConfigs,
  saveAuthGroupDraft,
  transitionAuthGroup,
  upsertCombination,
  upsertEngine,
  upsertSystemConfig,
  type AuthGroupTransition,
  type FetchAuthGroupsOptions,
} from "./aircraftEngine";
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
  authGroupsWith: (opts: FetchAuthGroupsOptions) => ["ae", "authGroups", opts] as const,
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
  return useQuery({ queryKey: aircraftEngineKeys.engines, queryFn: fetchEngines });
}
export function useUpsertEngine() {
  const emit = useEmitAndInvalidate();
  return useMutation({
    mutationFn: upsertEngine,
    onSuccess: (_result, input) => emit("engine_master", "upsert", input.engineCode),
  });
}
export function useDeleteEngine() {
  const emit = useEmitAndInvalidate();
  return useMutation({
    mutationFn: deleteEngine,
    onSuccess: (_r, engineCode) => emit("engine_master", "delete", engineCode),
  });
}

// ── aircraft_family ──
// The supplied API collection has no family endpoint. Build the read-only picker
// from family codes already present in combinations/system config.
export function useFamilies() {
  const qc = useQueryClient();
  return useQuery({
    queryKey: aircraftEngineKeys.families,
    queryFn: async () => {
      const [combinations, configs] = await Promise.all([
        qc.ensureQueryData({ queryKey: aircraftEngineKeys.combinations, queryFn: () => fetchCombinations() }),
        qc.ensureQueryData({ queryKey: aircraftEngineKeys.systemConfigs, queryFn: fetchSystemConfigs }),
      ]);
      const codes = new Set([
        ...combinations.map((item) => item.familyCode),
        ...configs.map((item) => item.familyCode),
      ]);
      return Array.from(codes)
        .sort((a, b) => a.localeCompare(b))
        .map((familyCode) => ({ familyCode, familyName: familyCode }));
    },
  });
}

// ── aircraft_engine_combination ──
export function useCombinations() {
  return useQuery({ queryKey: aircraftEngineKeys.combinations, queryFn: () => fetchCombinations() });
}
/** Point-in-time combinations for audit/QA (CR-3). Disabled until `asOf` is set. */
export function useCombinationsAsOf(asOf?: string) {
  return useQuery({
    queryKey: aircraftEngineKeys.combinationsAsOf(asOf ?? ""),
    queryFn: () => fetchCombinations(asOf),
    enabled: !!asOf,
  });
}
export function useUpsertCombination() {
  const emit = useEmitAndInvalidate();
  return useMutation({
    mutationFn: upsertCombination,
    onSuccess: (_result, input) => emit("aircraft_engine_combination", "upsert", input.id ?? "new"),
  });
}
export function useDeleteCombination() {
  const emit = useEmitAndInvalidate();
  return useMutation({
    mutationFn: deleteCombination,
    onSuccess: (_r, id) => emit("aircraft_engine_combination", "delete", id),
  });
}

// ── authorization_type_group ──
/** Admin/Master-Data read — every group, every status (no downstream gate). */
export function useAuthGroups() {
  return useQuery({ queryKey: aircraftEngineKeys.authGroups, queryFn: () => fetchAuthGroups() });
}
/** Point-in-time authorization groups for audit/QA. Disabled until `asOf` is set. */
export function useAuthGroupsAsOf(asOf?: string) {
  const opts: FetchAuthGroupsOptions = { asOf };
  return useQuery({
    queryKey: aircraftEngineKeys.authGroupsWith(opts),
    queryFn: () => fetchAuthGroups(opts),
    enabled: !!asOf,
  });
}
/** Customer-scoped admin read without the downstream published/complete gate. */
export function useAuthGroupsForCustomer(customerId?: number | null) {
  const opts: FetchAuthGroupsOptions = { customerId: customerId ?? null };
  return useQuery({
    queryKey: aircraftEngineKeys.authGroupsWith(opts),
    queryFn: () => fetchAuthGroups(opts),
    enabled: customerId != null,
  });
}
/**
 * Downstream read for other modules (M-03 / FM-CM-063). Returns only groups that
 * are PUBLISHED and complete (CR-1 gate), resolved for the given airline (CR-2).
 */
export function useDownstreamAuthGroups(customerId?: number | null) {
  const opts: FetchAuthGroupsOptions = { downstream: true, customerId: customerId ?? null };
  return useQuery({
    queryKey: aircraftEngineKeys.authGroupsWith(opts),
    queryFn: () => fetchAuthGroups(opts),
  });
}
export function useSaveAuthGroupDraft() {
  const emit = useEmitAndInvalidate();
  return useMutation({
    mutationFn: saveAuthGroupDraft,
    onSuccess: (_result, input) => emit("authorization_type_group", "upsert", input.groupId),
  });
}
export function useTransitionAuthGroup() {
  const emit = useEmitAndInvalidate();
  return useMutation({
    mutationFn: ({ groupId, action }: { groupId: string; action: AuthGroupTransition }) =>
      transitionAuthGroup(groupId, action),
    onSuccess: (_result, input) => emit("authorization_type_group", "upsert", input.groupId),
  });
}

// ── aircraft_system_config ──
export function useSystemConfigs() {
  return useQuery({ queryKey: aircraftEngineKeys.systemConfigs, queryFn: fetchSystemConfigs });
}
export function useUpsertSystemConfig() {
  const emit = useEmitAndInvalidate();
  return useMutation({
    mutationFn: upsertSystemConfig,
    onSuccess: (_result, input) => emit("aircraft_system_config", "upsert", input.icaoCode),
  });
}
export function useDeleteSystemConfig() {
  const emit = useEmitAndInvalidate();
  return useMutation({
    mutationFn: deleteSystemConfig,
    onSuccess: (_r, icaoCode) => emit("aircraft_system_config", "delete", icaoCode),
  });
}
