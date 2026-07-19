import axiosConfig from "@/lib/axios.config";
import type {
  AircraftEngineCombination,
  AircraftSystemConfig,
  AuthorizationTypeGroup,
  ClassicNeo,
  CompletenessStatus,
  EngineMaster,
  ReviewStatus,
} from "./aircraftEngine.types";

type UnknownRecord = Record<string, unknown>;

export interface CombinationInput {
  id?: number;
  familyCode: string;
  series: string;
  engineCode: string;
}

export interface FetchAuthGroupsOptions {
  asOf?: string;
  downstream?: boolean;
  customerId?: number | null;
}

export interface AuthGroupInput {
  groupId: string;
  groupLabel: string;
  memberCombinationIds: number[];
  customerId?: number | null;
}

export type AuthGroupTransition = "SUBMIT" | "PUBLISH" | "REJECT";

export interface SystemConfigInput {
  icaoCode: string;
  familyCode: string;
  modelVariant: string;
  classicNeo: ClassicNeo;
  engineCount: number;
  generatorCount: number;
  hydraulicCount: number;
  hasApu: boolean;
  isNew: boolean;
}

export type EngineInput = Pick<EngineMaster, "engineCode" | "engineName" | "manufacturer" | "notes">;

export class AircraftEngineApiError extends Error {
  constructor(
    message: string,
    public readonly code = "API_ERROR",
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "AircraftEngineApiError";
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function valueAt(record: UnknownRecord, ...keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

function stringAt(record: UnknownRecord, keys: string[], fallback = ""): string {
  const value = valueAt(record, ...keys);
  return value == null ? fallback : String(value);
}

function numberAt(record: UnknownRecord, keys: string[], fallback = 0): number {
  const value = Number(valueAt(record, ...keys));
  return Number.isFinite(value) ? value : fallback;
}

function booleanAt(record: UnknownRecord, keys: string[], fallback = false): boolean {
  const value = valueAt(record, ...keys);
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  if (typeof value === "number") return value !== 0;
  return fallback;
}

function optionalStringAt(record: UnknownRecord, keys: string[]): string | undefined {
  const value = valueAt(record, ...keys);
  return value == null || value === "" ? undefined : String(value);
}

function nullableStringAt(record: UnknownRecord, keys: string[]): string | null {
  const value = valueAt(record, ...keys);
  return value == null || value === "" ? null : String(value);
}

function nullableNumberAt(record: UnknownRecord, keys: string[]): number | null {
  const raw = valueAt(record, ...keys);
  if (raw === null || raw === undefined || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function assertNoEnvelopeError(raw: unknown): unknown {
  if (!isRecord(raw)) return raw;
  const error = valueAt(raw, "error", "Error");
  if (typeof error === "string" && error.trim()) {
    throw new AircraftEngineApiError(error.trim());
  }
  if (error && isRecord(error)) {
    const message = stringAt(error, ["message", "Message"], "Aircraft-Engine API request failed");
    throw new AircraftEngineApiError(message);
  }
  const message = stringAt(raw, ["message", "Message"]);
  const responseData = valueAt(raw, "responseData", "ResponseData");
  if (/^(error|failed|failure)$/i.test(message.trim()) && responseData == null) {
    throw new AircraftEngineApiError("Aircraft-Engine API request failed");
  }
  return Object.prototype.hasOwnProperty.call(raw, "responseData")
    ? raw.responseData
    : Object.prototype.hasOwnProperty.call(raw, "ResponseData")
      ? raw.ResponseData
      : raw;
}

function extractList(raw: unknown, resource: string): UnknownRecord[] {
  const payload = assertNoEnvelopeError(raw);
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (isRecord(payload)) {
    for (const key of ["items", "list", "data", "results", "responseData"]) {
      const value = payload[key];
      if (Array.isArray(value)) return value.filter(isRecord);
    }
  }
  throw new AircraftEngineApiError(
    `Invalid ${resource} response: expected an array`,
    "INVALID_RESPONSE",
  );
}

function updatedBy(record: UnknownRecord): string {
  return stringAt(record, ["updatedBy", "updatedby", "updated_by", "createdBy", "createdby"]);
}

function updatedAtUtc(record: UnknownRecord): string {
  return stringAt(record, [
    "updatedAtUtc", "updatedAt", "updateddate", "updatedDate", "updated_at_utc",
    "createddate", "createdDate",
  ]);
}

function normalizeReviewStatus(value: unknown): ReviewStatus {
  const status = String(value ?? "DRAFT").toUpperCase().replaceAll("-", "_").replaceAll(" ", "_");
  return status === "IN_REVIEW" || status === "PUBLISHED" ? status : "DRAFT";
}

function normalizeCompletenessStatus(value: unknown, memberCount: number): CompletenessStatus {
  const status = String(value ?? "").toLowerCase();
  if (status === "complete" || status === "incomplete" || status === "draft") return status;
  // Fail closed: a non-empty group without an explicit backend status must not
  // be presented as downstream-ready.
  return memberCount === 0 ? "draft" : "incomplete";
}

function numberList(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (isRecord(item)) return numberAt(item, ["combinationId", "id"], Number.NaN);
      return Number(item);
    })
    .filter(Number.isFinite);
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (isRecord(item)) return stringAt(item, ["engineName", "name", "label"]);
      return String(item ?? "");
    })
    .filter(Boolean);
}

export function normalizeEngine(record: UnknownRecord): EngineMaster {
  const engineCode = stringAt(record, ["engineCode", "engine_code", "code"]);
  if (!engineCode) throw new AircraftEngineApiError("Engine response is missing engineCode", "INVALID_RESPONSE");
  return {
    engineCode,
    engineName: stringAt(record, ["engineName", "engine_name", "name"], engineCode),
    manufacturer: stringAt(record, ["manufacturer"]),
    notes: stringAt(record, ["notes", "description"]),
    updatedBy: updatedBy(record),
    updatedAtUtc: updatedAtUtc(record),
  };
}

export function normalizeCombination(record: UnknownRecord): AircraftEngineCombination {
  const id = numberAt(record, ["id", "combinationId"], Number.NaN);
  const familyCode = stringAt(record, ["familyCode", "family_code"]);
  const engineCode = stringAt(record, ["engineCode", "engine_code"]);
  if (!Number.isFinite(id) || !familyCode || !engineCode) {
    throw new AircraftEngineApiError("Combination response is missing id, familyCode, or engineCode", "INVALID_RESPONSE");
  }
  const series = stringAt(record, ["series"]);
  return {
    id,
    familyCode,
    series,
    engineCode,
    displayLabel: stringAt(
      record,
      ["displayLabel", "display_label"],
      `${series ? `${familyCode}-${series}` : familyCode} (${engineCode})`,
    ),
    validFrom: stringAt(record, ["validFrom", "validFromUtc", "valid_from"], updatedAtUtc(record)),
    validTo: nullableStringAt(record, ["validTo", "validToUtc", "valid_to"]),
    updatedBy: updatedBy(record),
    updatedAtUtc: updatedAtUtc(record),
  };
}

export function normalizeAuthGroup(record: UnknownRecord): AuthorizationTypeGroup {
  const groupId = stringAt(record, ["groupId", "group_id", "id"]);
  if (!groupId) throw new AircraftEngineApiError("Authorization group response is missing groupId", "INVALID_RESPONSE");
  const memberCombinationIds = numberList(valueAt(record, "memberCombinationIds", "members", "memberIds"));
  return {
    groupId,
    groupLabel: stringAt(record, ["groupLabel", "group_label", "name"], groupId),
    memberCombinationIds,
    reviewStatus: normalizeReviewStatus(valueAt(record, "reviewStatus", "review_status")),
    completenessStatus: normalizeCompletenessStatus(
      valueAt(record, "completenessStatus", "completeness_status"),
      memberCombinationIds.length,
    ),
    engineListCached: stringList(valueAt(record, "engineListCached", "engine_list_cached", "engines")),
    customerId: nullableNumberAt(record, ["customerId", "customer_id"]),
    incompleteSinceUtc: nullableStringAt(record, ["incompleteSinceUtc", "incomplete_since_utc"]),
    legacyEngineLabels: stringList(valueAt(record, "legacyEngineLabels", "legacy_engine_labels")),
    submittedBy: optionalStringAt(record, ["submittedBy", "submitted_by"]),
    submittedAtUtc: optionalStringAt(record, ["submittedAtUtc", "submitted_at_utc"]),
    reviewedBy: optionalStringAt(record, ["reviewedBy", "reviewed_by"]),
    publishedBy: optionalStringAt(record, ["publishedBy", "published_by"]),
    publishedAtUtc: optionalStringAt(record, ["publishedAtUtc", "published_at_utc"]),
    updatedBy: updatedBy(record),
    updatedAtUtc: updatedAtUtc(record),
  };
}

export function normalizeSystemConfig(record: UnknownRecord): AircraftSystemConfig {
  const icaoCode = stringAt(record, ["icaoCode", "icao_code"]);
  const familyCode = stringAt(record, ["familyCode", "family_code"]);
  if (!icaoCode || !familyCode) {
    throw new AircraftEngineApiError("System config response is missing icaoCode or familyCode", "INVALID_RESPONSE");
  }
  const classicNeoValue = stringAt(record, ["classicNeo", "classic_neo"], "CLASSIC").toUpperCase();
  return {
    icaoCode,
    familyCode,
    modelVariant: stringAt(record, ["modelVariant", "model_variant"]),
    classicNeo: (classicNeoValue === "NEO" ? "NEO" : "CLASSIC") as ClassicNeo,
    engineCount: numberAt(record, ["engineCount", "engine_count"]),
    generatorCount: numberAt(record, ["generatorCount", "generator_count"]),
    hydraulicCount: numberAt(record, ["hydraulicCount", "hydraulic_count"]),
    hasApu: booleanAt(record, ["hasApu", "has_apu"]),
    legacyEngineLabel: optionalStringAt(record, ["legacyEngineLabel", "legacy_engine_label"]),
    updatedBy: updatedBy(record),
    updatedAtUtc: updatedAtUtc(record),
  };
}

function normalizeRequestError(error: unknown, fallback: string): AircraftEngineApiError {
  if (error instanceof AircraftEngineApiError) return error;
  const response = isRecord(error) && isRecord(error.response) ? error.response : undefined;
  const data = response && isRecord(response.data) ? response.data : undefined;
  const status = response ? Number(response.status) : undefined;
  const backendMessage = data
    ? stringAt(data, ["error", "message", "title"], fallback)
    : error instanceof Error ? error.message : fallback;
  const normalized = backendMessage.toUpperCase();
  const code = status === 409 || normalized.includes("DUPLICATE")
    ? "DUPLICATE"
    : normalized.includes("REFERENCE") || normalized.includes("IN USE")
      ? "REFERENCED"
      : status === 404 ? "NOT_FOUND" : "API_ERROR";
  return new AircraftEngineApiError(code === "API_ERROR" ? backendMessage : code, code, { cause: error });
}

async function writeRequest(request: () => Promise<{ data: unknown }>, fallback: string): Promise<void> {
  try {
    const response = await request();
    assertNoEnvelopeError(response.data);
  } catch (error) {
    throw normalizeRequestError(error, fallback);
  }
}

export async function fetchEngines(): Promise<EngineMaster[]> {
  try {
    const response = await axiosConfig.get("/master/engine");
    return extractList(response.data, "engine").map(normalizeEngine);
  } catch (error) {
    throw normalizeRequestError(error, "Failed to fetch engines");
  }
}

export async function upsertEngine(input: EngineInput): Promise<void> {
  await writeRequest(() => axiosConfig.post("/master/engine", input), "Failed to save engine");
}

export async function deleteEngine(engineCode: string): Promise<void> {
  await writeRequest(
    () => axiosConfig.delete(`/master/engine/${encodeURIComponent(engineCode)}`),
    "Failed to delete engine",
  );
}

export async function fetchCombinations(asOf?: string): Promise<AircraftEngineCombination[]> {
  try {
    const response = await axiosConfig.get(
      "/master/aircraft-engine-combination",
      asOf ? { params: { asOf } } : undefined,
    );
    return extractList(response.data, "aircraft-engine combination").map(normalizeCombination);
  } catch (error) {
    throw normalizeRequestError(error, "Failed to fetch aircraft-engine combinations");
  }
}

export async function upsertCombination(input: CombinationInput): Promise<void> {
  const body = input.id == null
    ? { familyCode: input.familyCode, series: input.series, engineCode: input.engineCode }
    : input;
  await writeRequest(
    () => axiosConfig.post("/master/aircraft-engine-combination", body),
    "Failed to save aircraft-engine combination",
  );
}

export async function deleteCombination(id: number): Promise<void> {
  await writeRequest(
    () => axiosConfig.delete(`/master/aircraft-engine-combination/${id}`),
    "Failed to delete aircraft-engine combination",
  );
}

export async function fetchAuthGroups(
  options: FetchAuthGroupsOptions = {},
): Promise<AuthorizationTypeGroup[]> {
  try {
    const params: Record<string, string | number | boolean> = {};
    if (options.asOf) params.asOf = options.asOf;
    if (options.downstream !== undefined) params.downstream = options.downstream;
    if (options.customerId != null) params.customerId = options.customerId;
    const response = await axiosConfig.get(
      "/master/authorization-group",
      Object.keys(params).length ? { params } : undefined,
    );
    return extractList(response.data, "authorization group").map(normalizeAuthGroup);
  } catch (error) {
    throw normalizeRequestError(error, "Failed to fetch authorization groups");
  }
}

export async function saveAuthGroupDraft(input: AuthGroupInput): Promise<void> {
  await writeRequest(
    () => axiosConfig.post("/master/authorization-group/draft", {
      groupId: input.groupId,
      groupLabel: input.groupLabel,
      memberCombinationIds: input.memberCombinationIds,
      customerId: input.customerId ?? null,
    }),
    "Failed to save authorization group draft",
  );
}

export async function transitionAuthGroup(groupId: string, action: AuthGroupTransition): Promise<void> {
  await writeRequest(
    () => axiosConfig.post(
      `/master/authorization-group/${encodeURIComponent(groupId)}/transition`,
      { action },
    ),
    "Failed to transition authorization group",
  );
}

export async function fetchSystemConfigs(): Promise<AircraftSystemConfig[]> {
  try {
    const response = await axiosConfig.get("/master/aircraft-system-config");
    return extractList(response.data, "aircraft system config").map(normalizeSystemConfig);
  } catch (error) {
    throw normalizeRequestError(error, "Failed to fetch aircraft system configs");
  }
}

export async function upsertSystemConfig(input: SystemConfigInput): Promise<void> {
  await writeRequest(
    () => axiosConfig.post("/master/aircraft-system-config", input),
    "Failed to save aircraft system config",
  );
}

export async function deleteSystemConfig(icaoCode: string): Promise<void> {
  await writeRequest(
    () => axiosConfig.delete(`/master/aircraft-system-config/${encodeURIComponent(icaoCode)}`),
    "Failed to delete aircraft system config",
  );
}
