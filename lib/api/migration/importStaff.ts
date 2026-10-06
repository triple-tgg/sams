import axiosConfig from "@/lib/axios.config";
import { getQAStaffList } from "@/lib/api/qa/staff-management";
import {
    parseAndSplitAircraftLicense,
    type SplitAircraftCombinationItem,
} from "@/lib/utils/aircraftLicenseSplitter";

// ── Request ─────────────────────────────────────────────────────────────────

export interface ImportStaffInfo {
    title: string;
    employeeId: string;
    fullNameTh: string;
    fullNameEn: string;
    joined: string;
    /** Resolved from the Position column against the position master. */
    positionId: number;
    /** Resolved from the Station column against the station master; BKK when blank. */
    stationId: number | null;
    idCardNo: string;
    nationality: string;
    dateOfBirth: string;
    placeOfBirth: string;
    phone: string;
    email: string;
    address: string;
}

/** Every child sheet repeats the staff identity alongside its own columns. */
interface StaffRef {
    employeeId: string;
    fullNameTh: string;
    fullNameEn: string;
}

export interface ImportAmelLicense extends StaffRef {
    licenseNumber: string;
    category: string;
    categoryId?: number;
    issuedDate: string;
    expiryDate: string;
}

export interface ImportAircraftLicense extends StaffRef {
    /** Resolved from the Aircraft License column against the licence master. */
    aircraftLicenseId: number;
}

export interface ImportPreviousTrainingRecord extends StaffRef {
    courseName: string;
    academyName: string;
    dateFrom: string;
    dateTo: string;
}

export interface ImportTrainingRecord extends StaffRef {
    courseCode: string;
    academyName: string;
    dateFrom: string;
    dateTo: string;
    validUntil: string;
}

export interface ImportWorkExperience extends StaffRef {
    company: string;
    jobTitle: string;
    dateFrom: string;
    dateTo: string;
    notes: string;
}

export interface ImportEducation extends StaffRef {
    degree: string;
    institution: string;
    fieldOfStudy: string;
    startYear: string;
    endYear: string;
}

export interface ImportStaffRequest {
    staffInfo: ImportStaffInfo[];
    amelLicense: ImportAmelLicense[];
    aircraftLicense: ImportAircraftLicense[];
    previousTrainingRecords: ImportPreviousTrainingRecord[];
    trainingRecords: ImportTrainingRecord[];
    workExperience: ImportWorkExperience[];
    education: ImportEducation[];
}

// ── Response ────────────────────────────────────────────────────────────────

// ── Parsed spreadsheet input ────────────────────────────────────────────────

export interface ParsedSheetRow {
    rowIndex: number;
    data: Record<string, string>;
}

export interface ParsedSheetInput {
    name: string;
    headers: string[];
    rows: ParsedSheetRow[];
}

/** Name → id, for the columns the sheet holds as text but the API wants as an id. */
export interface ImportStaffLookups {
    positions: Array<{ id: number; code?: string | null; name: string }>;
    stations?: Array<{ id: number; code?: string | null; name: string }>;
    aircraftLicenses?: Array<{ id: number; code?: string | null; name: string }>;
    aircraftCombinations?: Array<any>;
    aircraftRowMappings?: Record<number, SplitAircraftCombinationItem[]>;
    amelCategories?: Array<{ id: number; code?: string | null; name: string }>;
    courses?: Array<{ id?: number; courseCode: string; courseName: string }>;
}

/** Station used when a Staff Info row has no Station value (or the sheet has no Station column). */
export const DEFAULT_IMPORT_STATION = "BKK";

// ── Header and sheet matching ───────────────────────────────────────────────

/**
 * Reduce a header or sheet name to letters and digits.
 *
 * The real workbook carries trailing spaces ("Joined ", "Valid Until ") and
 * punctuation that varies between revisions ("Academy / Venue/By"), so exact
 * string matching on headers is too brittle to rely on.
 */
export function normalizeKey(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Read the first column present out of a row, by normalized header name. */
export function pickColumn(
    row: Record<string, string>,
    normalizedByHeader: Map<string, string>,
    candidates: string[]
): string {
    for (const candidate of candidates) {
        const header = normalizedByHeader.get(candidate);
        if (header === undefined) continue;
        const value = row[header];
        if (value !== undefined && value !== null && String(value).trim() !== "") {
            return String(value).trim();
        }
    }
    return "";
}

function indexHeaders(headers: string[]): Map<string, string> {
    const map = new Map<string, string>();
    for (const header of headers) {
        const key = normalizeKey(header);
        if (!map.has(key)) map.set(key, header);
    }
    return map;
}

/** Sheet name → the payload section it feeds. */
const SHEET_SECTIONS: Record<string, keyof ImportStaffRequest> = {
    staffinfo: "staffInfo",
    staff: "staffInfo",
    amellicense: "amelLicense",
    amel: "amelLicense",
    aircraftlicense: "aircraftLicense",
    previoustrainingrecords: "previousTrainingRecords",
    previoustraining: "previousTrainingRecords",
    trainingrecords: "trainingRecords",
    training: "trainingRecords",
    workexperience: "workExperience",
    education: "education",
};

export function sectionForSheet(sheetName: string): keyof ImportStaffRequest | null {
    return SHEET_SECTIONS[normalizeKey(sheetName)] ?? null;
}

// ── Lookups ─────────────────────────────────────────────────────────────────

/** Index master rows by both name and code, so either spelling in the sheet resolves. */
export function buildLookupIndex(
    rows: Array<{ id: number; code?: string | null; name: string }> = []
): Map<string, number> {
    const index = new Map<string, number>();
    for (const row of rows || []) {
        for (const label of [row.name, row.code, String(row.id)]) {
            const key = normalizeKey(String(label ?? ""));
            if (!key || index.has(key)) continue;
            index.set(key, row.id);
        }
    }
    return index;
}

// ── Mapping ─────────────────────────────────────────────────────────────────

const EMPTY_PAYLOAD = (): ImportStaffRequest => ({
    staffInfo: [],
    amelLicense: [],
    aircraftLicense: [],
    previousTrainingRecords: [],
    trainingRecords: [],
    workExperience: [],
    education: [],
});

/** Where one payload entry came from in the workbook. */
export interface ImportSourceRow {
    sheetName: string;
    rowIndex: number;
}

export type ImportPayloadSources = { [K in keyof ImportStaffRequest]: ImportSourceRow[] };

export interface ImportStaffPayloadResult {
    payload: ImportStaffRequest;
    /** Values the sheet carried that could not be matched to master data. */
    warnings: string[];
    /**
     * The sheet row behind each payload entry, index for index. Blank rows are
     * dropped and an aircraft row can split into several entries, so a payload
     * position is not a sheet row number; this is how to translate back.
     */
    sources: ImportPayloadSources;
}

/**
 * Turn the parsed workbook into the import-staff request body.
 *
 * Dates are passed through as the modal formatted them (DD/MM/YYYY) because
 * every date field on this endpoint is a string. Rows where every mapped
 * column is blank are dropped, so the blank row the preview lets you add does
 * not reach the API.
 */
export function buildImportStaffPayload(
    sheets: ParsedSheetInput[],
    lookups: ImportStaffLookups
): ImportStaffPayloadResult {
    const payload = EMPTY_PAYLOAD();
    const warnings: string[] = [];
    const sources: ImportPayloadSources = {
        staffInfo: [],
        amelLicense: [],
        aircraftLicense: [],
        previousTrainingRecords: [],
        trainingRecords: [],
        workExperience: [],
        education: [],
    };

    const positionIndex = buildLookupIndex(lookups.positions);
    const stationIndex = buildLookupIndex(lookups.stations ?? []);
    const licenceIndex = buildLookupIndex(lookups.aircraftLicenses ?? []);
    const categoryIndex = buildLookupIndex(lookups.amelCategories ?? []);
    const courseIndex = new Map<string, string>();
    if (lookups.courses) {
        for (const c of lookups.courses) {
            for (const label of [
                c.courseCode,
                c.courseName,
                `${c.courseCode} - ${c.courseName}`,
                `${c.courseCode} — ${c.courseName}`,
                `${c.courseCode} ${c.courseName}`,
                String(c.id),
            ]) {
                const key = normalizeKey(String(label ?? ""));
                if (!key || courseIndex.has(key)) continue;
                courseIndex.set(key, c.courseCode);
            }
        }
    }

    /** True when the row carries nothing of its own beyond the staff identity. */
    const isEmptyRecord = (record: object, skip: string[] = []) =>
        Object.entries(record).every(
            ([key, value]) => skip.includes(key) || value === "" || value === 0
        );

    for (const sheet of sheets) {
        const section = sectionForSheet(sheet.name);
        if (!section) continue;

        const headers = indexHeaders(sheet.headers);
        const get = (row: Record<string, string>, candidates: string[]) =>
            pickColumn(row, headers, candidates);

        for (const { rowIndex, data } of sheet.rows) {
            const add = <K extends keyof ImportStaffRequest>(key: K, entry: ImportStaffRequest[K][number]) => {
                (payload[key] as Array<ImportStaffRequest[K][number]>).push(entry);
                sources[key].push({ sheetName: sheet.name, rowIndex });
            };
            const ref: StaffRef = {
                employeeId: get(data, ["employeeid"]),
                fullNameTh: get(data, ["fullnamethai", "fullnameth"]),
                fullNameEn: get(data, ["fullnameenglish", "fullnameen"]),
            };

            if (section === "staffInfo") {
                const positionName = get(data, ["position"]);
                let positionId = 0;
                if (positionName) {
                    const matched = positionIndex.get(normalizeKey(positionName));
                    if (matched) positionId = matched;
                    else warnings.push(`${sheet.name} row ${rowIndex}: position "${positionName}" is not in the position master`);
                }

                const stationName = get(data, ["station"]) || DEFAULT_IMPORT_STATION;
                const stationId = stationIndex.get(normalizeKey(stationName)) ?? null;
                if (stationId === null && lookups.stations) {
                    warnings.push(`${sheet.name} row ${rowIndex}: station "${stationName}" is not in the station master`);
                }

                const entry: ImportStaffInfo = {
                    ...ref,
                    title: get(data, ["title"]),
                    joined: get(data, ["joined", "joineddate"]),
                    positionId,
                    stationId,
                    idCardNo: get(data, ["thaiidcardno", "idcardno"]),
                    nationality: get(data, ["nationality"]),
                    dateOfBirth: get(data, ["dateofbirth", "dob"]),
                    placeOfBirth: get(data, ["placeofbirth"]),
                    phone: get(data, ["phone"]),
                    email: get(data, ["email"]),
                    address: get(data, ["address"]),
                };
                // stationId always has the BKK default, so it says nothing about whether the row is blank.
                if (!isEmptyRecord(entry, ["stationId"])) add("staffInfo", entry);
                continue;
            }

            if (section === "amelLicense") {
                const categoryName = get(data, ["category"]);
                let categoryId = 0;
                if (categoryName) {
                    const matched = categoryIndex.get(normalizeKey(categoryName));
                    if (matched) {
                        categoryId = matched;
                    } else if (/^\d+$/.test(categoryName) && (lookups.amelCategories ?? []).some(c => c.id === Number(categoryName))) {
                        categoryId = Number(categoryName);
                    } else {
                        warnings.push(`${sheet.name} row ${rowIndex}: category "${categoryName}" is not in the AMEL category master`);
                    }
                }

                const entry: ImportAmelLicense = {
                    ...ref,
                    licenseNumber: get(data, ["amellicensenumber", "licensenumber"]),
                    category: categoryId > 0 ? String(categoryId) : categoryName,
                    categoryId,
                    issuedDate: get(data, ["issueddate"]),
                    expiryDate: get(data, ["expirydate"]),
                };
                if (!isEmptyRecord(entry, ["employeeId", "fullNameTh", "fullNameEn"])) {
                    add("amelLicense", entry);
                }
                continue;
            }

            if (section === "aircraftLicense") {
                const licenceName = get(data, ["aircraftlicense"]);
                if (!licenceName) continue;

                // 1. If pre-resolved combinations mapping is provided for this row
                const customMappings = lookups.aircraftRowMappings?.[rowIndex];
                if (customMappings && customMappings.length > 0) {
                    for (const item of customMappings) {
                        if (item.combinationId) {
                            add("aircraftLicense", {
                                ...ref,
                                aircraftLicenseId: item.combinationId,
                            });
                        }
                    }
                    continue;
                }

                // 2. If combinations master was provided, split and map
                if (lookups.aircraftCombinations && lookups.aircraftCombinations.length > 0) {
                    const splitItems = parseAndSplitAircraftLicense(licenceName, lookups.aircraftCombinations);
                    if (splitItems.length > 0) {
                        let anyAdded = false;
                        for (const item of splitItems) {
                            if (item.combinationId) {
                                anyAdded = true;
                                add("aircraftLicense", {
                                    ...ref,
                                    aircraftLicenseId: item.combinationId,
                                });
                            }
                        }
                        if (!anyAdded) {
                            warnings.push(`${sheet.name} row ${rowIndex}: aircraft licence "${licenceName}" could not be matched to any combination`);
                        }
                        continue;
                    }
                }

                // 3. Fallback: legacy single lookup match
                const matched = licenceIndex.get(normalizeKey(licenceName));
                if (!matched) {
                    warnings.push(`${sheet.name} row ${rowIndex}: aircraft licence "${licenceName}" is not in the licence master`);
                }
                add("aircraftLicense", { ...ref, aircraftLicenseId: matched ?? 0 });
                continue;
            }

            if (section === "previousTrainingRecords") {
                const entry: ImportPreviousTrainingRecord = {
                    ...ref,
                    courseName: get(data, ["coursename"]),
                    academyName: get(data, ["academyvenueby", "academy", "academyname"]),
                    dateFrom: get(data, ["datefrom", "date"]),
                    dateTo: get(data, ["dateto"]),
                };
                if (!isEmptyRecord(entry, ["employeeId", "fullNameTh", "fullNameEn"])) {
                    add("previousTrainingRecords", entry);
                }
                continue;
            }

            if (section === "trainingRecords") {
                const rawCourse = get(data, ["coursecode", "trainingcourse", "coursename"]);
                const matchedCode = courseIndex.get(normalizeKey(rawCourse));
                const entry: ImportTrainingRecord = {
                    ...ref,
                    courseCode: matchedCode || rawCourse,
                    academyName: get(data, ["academyvenueby", "academy", "academyname"]),
                    dateFrom: get(data, ["datefrom", "date"]),
                    dateTo: get(data, ["dateto"]),
                    validUntil: get(data, ["validuntil", "validto"]),
                };
                if (!isEmptyRecord(entry, ["employeeId", "fullNameTh", "fullNameEn"])) {
                    add("trainingRecords", entry);
                }
                continue;
            }

            if (section === "workExperience") {
                const entry: ImportWorkExperience = {
                    ...ref,
                    company: get(data, ["employercompany", "company", "employer"]),
                    jobTitle: get(data, ["positiontitle", "jobtitle", "position"]),
                    dateFrom: get(data, ["datefrom", "date"]),
                    dateTo: get(data, ["dateto"]),
                    notes: get(data, ["notes", "note"]),
                };
                if (!isEmptyRecord(entry, ["employeeId", "fullNameTh", "fullNameEn"])) {
                    add("workExperience", entry);
                }
                continue;
            }

            if (section === "education") {
                const entry: ImportEducation = {
                    ...ref,
                    degree: get(data, ["degree"]),
                    institution: get(data, ["institutionuniversitycollege", "institution", "university"]),
                    fieldOfStudy: get(data, ["fieldofstudy"]),
                    startYear: get(data, ["startyear"]),
                    endYear: get(data, ["endyear"]),
                };
                if (!isEmptyRecord(entry, ["employeeId", "fullNameTh", "fullNameEn"])) {
                    add("education", entry);
                }
            }
        }
    }

    return { payload, warnings, sources };
}

/** Row counts per section, for the confirmation line before sending. */
export function countImportStaffPayloadRows(payload: ImportStaffRequest): number {
    return Object.values(payload).reduce((sum, rows) => sum + rows.length, 0);
}

// ── Employee id checks ──────────────────────────────────────────────────────

/**
 * Normalize an employee id for comparison.
 *
 * Ids are compared case-insensitively, and an all-digit id has its leading
 * zeros dropped: Excel turns a text "0068" into the number 68 as soon as
 * someone retypes the cell, and both spellings mean the same person.
 */
export function normalizeEmployeeId(value: string | null | undefined): string {
    const trimmed = (value ?? "").trim().toUpperCase();
    if (!trimmed) return "";
    return /^\d+$/.test(trimmed) ? String(Number(trimmed)) : trimmed;
}

/** Employee ids the Staff Info sheet declares, normalized. */
export function collectStaffInfoEmployeeIds(sheets: ParsedSheetInput[]): Set<string> {
    const ids = new Set<string>();
    for (const sheet of sheets) {
        if (sectionForSheet(sheet.name) !== "staffInfo") continue;
        const headers = new Map<string, string>();
        for (const header of sheet.headers) {
            const key = normalizeKey(header);
            if (!headers.has(key)) headers.set(key, header);
        }
        for (const { data } of sheet.rows) {
            const id = normalizeEmployeeId(pickColumn(data, headers, ["employeeid"]));
            if (id) ids.add(id);
        }
    }
    return ids;
}

/** The names a staff member is known by. */
export interface StaffNameRef {
    fullNameTh: string;
    fullNameEn: string;
}

const NAME_TITLES = [
    "นางสาว", "นาง", "นาย", "ดร.", "ดร",
    "mr.", "mrs.", "ms.", "miss", "mr", "mrs", "ms", "dr.", "dr",
];

/**
 * Normalize a person's name for comparison.
 *
 * Titles and every space are dropped, so "Mr. Decha Prasert-Amporn" and
 * "decha prasert-amporn" compare equal. The sheets and the staff master do not
 * agree on whether a title belongs in the name field, and a spacing difference
 * is never what makes two rows a different person.
 */
export function normalizePersonName(value: string | null | undefined): string {
    let name = (value ?? "").trim().toLowerCase();
    if (!name) return "";
    for (const title of NAME_TITLES) {
        if (name.startsWith(title)) {
            name = name.slice(title.length);
            break;
        }
    }
    return name.replace(/[\s.]/g, "");
}

/** Names declared in the Staff Info sheet, keyed by normalized employee id. */
export function collectStaffInfoNames(sheets: ParsedSheetInput[]): Map<string, StaffNameRef> {
    const byId = new Map<string, StaffNameRef>();
    for (const sheet of sheets) {
        if (sectionForSheet(sheet.name) !== "staffInfo") continue;
        const headers = new Map<string, string>();
        for (const header of sheet.headers) {
            const key = normalizeKey(header);
            if (!headers.has(key)) headers.set(key, header);
        }
        for (const { data } of sheet.rows) {
            const id = normalizeEmployeeId(pickColumn(data, headers, ["employeeid"]));
            if (!id || byId.has(id)) continue;
            byId.set(id, {
                fullNameTh: pickColumn(data, headers, ["fullnamethai", "fullnameth"]),
                fullNameEn: pickColumn(data, headers, ["fullnameenglish", "fullnameen"]),
            });
        }
    }
    return byId;
}

/**
 * Merge the names the workbook declares with the ones already on file.
 *
 * The Staff Info sheet wins: when the workbook carries a staff member, it is
 * the one saying what their name should become.
 */
export function buildStaffNameReference(
    sheets: ParsedSheetInput[],
    systemNames: ReadonlyMap<string, StaffNameRef>
): Map<string, StaffNameRef> {
    const merged = new Map<string, StaffNameRef>(systemNames);
    for (const [id, names] of collectStaffInfoNames(sheets)) {
        merged.set(id, names);
    }
    return merged;
}

export interface NameMismatchIssue {
    sheetName: string;
    section: keyof ImportStaffRequest;
    rowIndex: number;
    employeeId: string;
    column: "fullNameTh" | "fullNameEn";
    value: string;
    expected: string;
}

export interface UnknownEmployeeIdIssue {
    sheetName: string;
    section: keyof ImportStaffRequest;
    rowIndex: number;
    employeeId: string;
}

/** The sheets whose rows must point at a staff member that exists. */
const CHILD_SECTIONS: ReadonlyArray<keyof ImportStaffRequest> = [
    "amelLicense",
    "aircraftLicense",
    "previousTrainingRecords",
    "trainingRecords",
    "workExperience",
    "education",
];

/**
 * Find child-sheet rows whose Employee ID is neither declared in Staff Info
 * nor already in the system.
 *
 * Such a row has nothing to attach to: the import would either fail or, worse,
 * silently drop the record. Rows with no Employee ID at all are left alone —
 * blank rows are handled by the payload mapping, not here.
 */
export function findUnknownEmployeeIds(
    sheets: ParsedSheetInput[],
    knownInSystem: ReadonlySet<string>
): UnknownEmployeeIdIssue[] {
    const declared = collectStaffInfoEmployeeIds(sheets);
    const issues: UnknownEmployeeIdIssue[] = [];

    for (const sheet of sheets) {
        const section = sectionForSheet(sheet.name);
        if (!section || !CHILD_SECTIONS.includes(section)) continue;

        const headers = new Map<string, string>();
        for (const header of sheet.headers) {
            const key = normalizeKey(header);
            if (!headers.has(key)) headers.set(key, header);
        }

        for (const { rowIndex, data } of sheet.rows) {
            const raw = pickColumn(data, headers, ["employeeid"]);
            const id = normalizeEmployeeId(raw);
            if (!id) continue;
            if (declared.has(id) || knownInSystem.has(id)) continue;
            issues.push({ sheetName: sheet.name, section, rowIndex, employeeId: raw });
        }
    }

    return issues;
}

/**
 * Find child-sheet rows whose name columns disagree with the staff the row's
 * Employee ID points at.
 *
 * A disagreement usually means the row was pasted against the wrong person, so
 * it is worth stopping. A blank name is not reported: it carries no claim that
 * could be wrong, and the import identifies staff by Employee ID anyway.
 */
export function findNameMismatches(
    sheets: ParsedSheetInput[],
    reference: ReadonlyMap<string, StaffNameRef>
): NameMismatchIssue[] {
    const issues: NameMismatchIssue[] = [];

    for (const sheet of sheets) {
        const section = sectionForSheet(sheet.name);
        if (!section || !CHILD_SECTIONS.includes(section)) continue;

        const headers = new Map<string, string>();
        for (const header of sheet.headers) {
            const key = normalizeKey(header);
            if (!headers.has(key)) headers.set(key, header);
        }

        for (const { rowIndex, data } of sheet.rows) {
            const rawId = pickColumn(data, headers, ["employeeid"]);
            const id = normalizeEmployeeId(rawId);
            if (!id) continue;

            const expected = reference.get(id);
            if (!expected) continue; // the id itself is already reported as unknown

            const columns = [
                { column: "fullNameTh" as const, keys: ["fullnamethai", "fullnameth"], expect: expected.fullNameTh },
                { column: "fullNameEn" as const, keys: ["fullnameenglish", "fullnameen"], expect: expected.fullNameEn },
            ];

            for (const { column, keys, expect } of columns) {
                const value = pickColumn(data, headers, keys);
                if (!value || !expect) continue;
                if (normalizePersonName(value) === normalizePersonName(expect)) continue;
                issues.push({ sheetName: sheet.name, section, rowIndex, employeeId: rawId, column, value, expected: expect });
            }
        }
    }

    return issues;
}

// ── API ─────────────────────────────────────────────────────────────────────

/** Counts per section, summed over every staff member in the import. */
export interface ImportStaffCounts {
    amelLicense: number;
    aircraftLicense: number;
    previousTraining: number;
    trainingRecords: number;
    workExperience: number;
    education: number;
}

export interface ImportStaffResultStaff {
    employeeId: string;
    staffId: number | null;
    name: string;
    isNewStaff: boolean | null;
    /** This staff member's own counts, when the API sent any. */
    counts: ImportStaffCounts | null;
    isError: boolean;
    error: string;
}

/** The import endpoint's answer, read into one shape whatever form `responseData` takes. */
export interface ImportStaffResult {
    success: boolean;
    message: string;
    staff: ImportStaffResultStaff[];
    newCount: number;
    updatedCount: number;
    failedCount: number;
    /** Null when the API sent no counts at all, so the UI can leave them out rather than show zeros. */
    counts: ImportStaffCounts | null;
    warnings: string[];
    errors: string[];
    rowErrors: ImportValidationRowError[];
}

const COUNT_KEYS: Record<keyof ImportStaffCounts, string[]> = {
    amelLicense: ["amelLicenseCount", "amelLicense", "amelCount"],
    aircraftLicense: ["aircraftLicenseCount", "aircraftLicense", "aircraftCount"],
    previousTraining: ["previousTrainingCount", "previousTrainingRecordCount", "previousTrainingRecords"],
    trainingRecords: ["trainingRecordCount", "trainingRecordsCount", "trainingRecords"],
    workExperience: ["workExperienceCount", "workExperience"],
    education: ["educationCount", "education"],
};

/** A count field may be a number, or the list of rows itself. */
function readCount(o: Record<string, any>, keys: string[]): number | null {
    for (const key of keys) {
        const v = o[key];
        if (typeof v === "number" && Number.isFinite(v)) return v;
        if (Array.isArray(v)) return v.length;
        if (typeof v === "string" && /^\d+$/.test(v.trim())) return Number(v);
    }
    return null;
}

function looksLikeStaff(o: unknown): o is Record<string, any> {
    if (!o || typeof o !== "object" || Array.isArray(o)) return false;
    const r = o as Record<string, any>;
    return r.employeeId !== undefined || r.staffId !== undefined || r.isNewStaff !== undefined;
}

/**
 * Read the import endpoint's body.
 *
 * `responseData` has been a single staff summary and may also be a list of
 * them, or an object wrapping such a list; all three are accepted. A failure
 * is an `error` string, `flagPass: false`, or row errors in `validateList`.
 */
export function parseImportStaffResult(body: unknown): ImportStaffResult {
    const data = (body ?? {}) as Record<string, any>;
    const rd = data.responseData;
    const inner: Record<string, any> = rd && typeof rd === "object" && !Array.isArray(rd) ? rd : {};

    // The staff list may sit under any key of the wrapper; take the first array that holds staff summaries.
    const listKey = Object.keys(inner).find(
        (k) => Array.isArray(inner[k]) && inner[k].some(looksLikeStaff)
    );
    const rawStaff: unknown[] = Array.isArray(rd)
        ? rd
        : listKey
            ? inner[listKey]
            : looksLikeStaff(rd)
                ? [rd]
                : [];
    const staffObjs = rawStaff.filter(looksLikeStaff);
    const isWrapper = !looksLikeStaff(rd) && !Array.isArray(rd);

    const readCounts = (o: Record<string, any>): ImportStaffCounts | null => {
        let out: ImportStaffCounts | null = null;
        for (const key of Object.keys(COUNT_KEYS) as Array<keyof ImportStaffCounts>) {
            const value = readCount(o, COUNT_KEYS[key]);
            if (value === null) continue;
            out = out ?? { amelLicense: 0, aircraftLicense: 0, previousTraining: 0, trainingRecords: 0, workExperience: 0, education: 0 };
            out[key] = value;
        }
        return out;
    };

    const staff: ImportStaffResultStaff[] = staffObjs.map((o) => {
        const error = collectIssues(o.error ?? o.errorMessage).join("; ");
        return {
            employeeId: String(o.employeeId ?? ""),
            staffId: typeof o.staffId === "number" ? o.staffId : o.staffId ? Number(o.staffId) || null : null,
            name: String(o.fullNameEn ?? o.fullNameTh ?? o.name ?? ""),
            isNewStaff: typeof o.isNewStaff === "boolean" ? o.isNewStaff : null,
            counts: readCounts(o),
            isError: o.isError === true || Boolean(error),
            error,
        };
    });

    // Totals: the wrapper's own counts when it has them, else the sum over staff that imported.
    let counts: ImportStaffCounts | null = isWrapper ? readCounts(inner) : null;
    if (!counts) {
        for (const st of staff) {
            if (st.isError || !st.counts) continue;
            counts = counts ?? { amelLicense: 0, aircraftLicense: 0, previousTraining: 0, trainingRecords: 0, workExperience: 0, education: 0 };
            for (const key of Object.keys(st.counts) as Array<keyof ImportStaffCounts>) {
                counts[key] += st.counts[key];
            }
        }
    }

    const failedCount = staff.filter((s) => s.isError).length;
    const newFromFlags = staff.filter((s) => !s.isError && s.isNewStaff === true).length;
    const updatedFromFlags = staff.filter((s) => !s.isError && s.isNewStaff === false).length;
    const newCount = readCount(inner, ["newStaffCount", "newCount", "createdCount", "inserted", "insertCount"]) ?? newFromFlags;
    const updatedCount = readCount(inner, ["updatedStaffCount", "updatedCount", "updateCount", "updated"]) ?? updatedFromFlags;

    const warnings = Array.from(
        new Set([
            // When responseData is itself the staff summary, its warnings are read per staff below.
            ...(looksLikeStaff(rd) ? [] : collectIssues(inner.warnings)),
            ...collectIssues(data.warnings),
            ...staffObjs.flatMap((o) => {
                const lines = collectIssues(o.warnings);
                return o.employeeId ? lines.map((w) => `Employee ID ${o.employeeId}: ${w}`) : lines;
            }),
        ])
    );
    const errors = Array.from(new Set([...collectIssues(inner.errors), ...collectIssues(data.errors), ...collectIssues(data.error)]));
    const rowErrors = collectRowErrors(inner.validateList ?? data.validateList);
    const flag = inner.flagPass ?? data.flagPass;
    // Staff that failed on their own are reported in the summary; the import only fails outright when none went in.
    const allStaffFailed = staff.length > 0 && failedCount === staff.length;

    return {
        success: flag !== false && errors.length === 0 && rowErrors.length === 0 && !allStaffFailed,
        message: String(data.message ?? ""),
        staff,
        newCount,
        updatedCount,
        failedCount,
        counts,
        warnings,
        errors,
        rowErrors,
    };
}

/** What the request carried for one staff member, to set the API's counts against. */
export interface SentStaffSummary {
    name: string;
    counts: ImportStaffCounts;
}

/** Rows sent per staff member, keyed by normalized employee id. */
export function summarizePayloadByEmployee(payload: ImportStaffRequest): Map<string, SentStaffSummary> {
    const out = new Map<string, SentStaffSummary>();
    const entry = (employeeId: string) => {
        const id = normalizeEmployeeId(employeeId);
        let e = out.get(id);
        if (!e) {
            e = {
                name: "",
                counts: { amelLicense: 0, aircraftLicense: 0, previousTraining: 0, trainingRecords: 0, workExperience: 0, education: 0 },
            };
            out.set(id, e);
        }
        return e;
    };
    for (const row of payload.staffInfo) {
        const e = entry(row.employeeId);
        e.name = e.name || row.fullNameEn || row.fullNameTh;
    }
    const sections: Array<[keyof ImportStaffRequest, keyof ImportStaffCounts]> = [
        ["amelLicense", "amelLicense"],
        ["aircraftLicense", "aircraftLicense"],
        ["previousTrainingRecords", "previousTraining"],
        ["trainingRecords", "trainingRecords"],
        ["workExperience", "workExperience"],
        ["education", "education"],
    ];
    for (const [section, key] of sections) {
        for (const row of payload[section]) entry(row.employeeId).counts[key]++;
    }
    return out;
}

/**
 * POST /migration/import-staff
 *
 * Resolves with the parsed result, success or not, when the API answered with
 * a body (a 4xx included), so row errors can be placed on the sheet. Throws
 * only when there is nothing to read.
 */
export const importStaff = async (
    body: ImportStaffRequest
): Promise<ImportStaffResult> => {
    try {
        const res = await axiosConfig.post("/migration/import-staff", body);
        return parseImportStaffResult(res.data);
    } catch (error: any) {
        const status = error?.response?.status;
        const data = error?.response?.data;
        if (status >= 400 && status < 500 && data && typeof data === "object") {
            const result = parseImportStaffResult(data);
            if (result.errors.length === 0 && result.rowErrors.length === 0) {
                result.errors.push(result.message || `Import failed (HTTP ${status})`);
            }
            result.success = false;
            return result;
        }
        console.error("Error importing staff:", error);
        throw new Error(
            error?.response?.data?.error ||
                error?.response?.data?.message ||
                "Failed to import staff"
        );
    }
};

// ── Validate ────────────────────────────────────────────────────────────────

/** One row the validate endpoint rejected; `rowId` is the 1-based position in that section of the payload. */
export interface ImportValidationRowError {
    section: keyof ImportStaffRequest;
    rowId: number;
    employeeId: string;
    statusText: string;
}

export interface ImportStaffValidationResult {
    isValid: boolean;
    message: string;
    /** Errors not tied to a row. */
    errors: string[];
    rowErrors: ImportValidationRowError[];
    warnings: string[];
}

const PAYLOAD_SECTIONS: ReadonlyArray<keyof ImportStaffRequest> = [
    "staffInfo",
    "amelLicense",
    "aircraftLicense",
    "previousTrainingRecords",
    "trainingRecords",
    "workExperience",
    "education",
];

/**
 * Read `validateList`: a list of `{ section: [{ rowId, employeeId, statusText }] }`
 * objects (a single object is accepted too).
 */
function collectRowErrors(validateList: unknown): ImportValidationRowError[] {
    const groups = Array.isArray(validateList) ? validateList : validateList ? [validateList] : [];
    const out: ImportValidationRowError[] = [];
    for (const group of groups) {
        if (!group || typeof group !== "object") continue;
        for (const section of PAYLOAD_SECTIONS) {
            const items = (group as Record<string, unknown>)[section];
            if (!Array.isArray(items)) continue;
            for (const item of items) {
                if (!item || typeof item !== "object") continue;
                const o = item as Record<string, unknown>;
                out.push({
                    section,
                    rowId: Number(o.rowId ?? o.rowIndex ?? o.row ?? 0),
                    employeeId: String(o.employeeId ?? ""),
                    statusText: String(o.statusText ?? o.message ?? o.error ?? "Invalid data").trim(),
                });
            }
        }
    }
    return out;
}

/** A server row error placed back on the sheet row it came from. */
export interface ResolvedValidationRowError {
    sheetName: string;
    rowIndex: number;
    employeeId: string;
    statusText: string;
}

/**
 * Translate the endpoint's payload positions into sheet rows.
 *
 * Errors whose position is outside the payload that was sent cannot be placed
 * on a row, so they come back as plain text instead of being dropped.
 */
export function resolveValidationRowErrors(
    rowErrors: ImportValidationRowError[],
    sources: ImportPayloadSources
): { resolved: ResolvedValidationRowError[]; unresolved: string[] } {
    const resolved: ResolvedValidationRowError[] = [];
    const unresolved: string[] = [];
    for (const err of rowErrors) {
        const source = sources[err.section]?.[err.rowId - 1];
        if (source) {
            resolved.push({ ...source, employeeId: err.employeeId, statusText: err.statusText });
        } else {
            const who = err.employeeId ? ` · Employee ID ${err.employeeId}` : "";
            unresolved.push(`${err.section} row ${err.rowId}${who}: ${err.statusText}`);
        }
    }
    return { resolved, unresolved };
}

/** Turn one error/warning entry into a line of text, whether the API sends a string or an object. */
function describeIssue(item: unknown): string {
    if (item === null || item === undefined) return "";
    if (typeof item !== "object") return String(item).trim();

    const o = item as Record<string, unknown>;
    const text = String(o.message ?? o.error ?? o.description ?? o.reason ?? "").trim();
    const where = [
        o.sheet ?? o.sheetName ?? o.section,
        o.row !== undefined ? `row ${o.row}` : o.rowIndex !== undefined ? `row ${o.rowIndex}` : undefined,
        o.employeeId !== undefined ? `Employee ID ${o.employeeId}` : undefined,
        o.field ?? o.column,
    ]
        .filter((part) => part !== undefined && part !== null && String(part).trim() !== "")
        .join(" · ");

    if (text && where) return `${where}: ${text}`;
    return text || where || JSON.stringify(item);
}

/** Flatten a list, or an ASP.NET-style `{ field: [messages] }` map, into lines of text. */
function collectIssues(source: unknown): string[] {
    if (!source) return [];
    if (typeof source === "string") return source.trim() ? [source.trim()] : [];
    if (Array.isArray(source)) return source.map(describeIssue).filter(Boolean);
    if (typeof source === "object") {
        return Object.entries(source as Record<string, unknown>).flatMap(([key, value]) =>
            (Array.isArray(value) ? value : [value])
                .map(describeIssue)
                .filter(Boolean)
                .map((text) => `${key}: ${text}`)
        );
    }
    return [];
}

/**
 * Read the validate endpoint's body into one shape.
 *
 * Errors may sit at the top level or under `responseData`, as strings, as
 * objects, or as a field → messages map; a top-level `error` string counts as
 * an error too. The data passes only when the API says `flagPass: true` and
 * reports no errors: a missing flag is a fail, since Import is gated on it.
 */
export function parseImportStaffValidation(body: unknown): ImportStaffValidationResult {
    const data = (body ?? {}) as Record<string, any>;
    const inner = (data.responseData ?? {}) as Record<string, any>;

    const errors = [
        ...collectIssues(inner.errors),
        ...collectIssues(data.errors),
        ...collectIssues(data.error),
    ];
    const warnings = [...collectIssues(inner.warnings), ...collectIssues(data.warnings)];

    const rowErrors = collectRowErrors(inner.validateList ?? data.validateList);

    const flagPass = (inner.flagPass ?? data.flagPass) === true;
    const isValid = flagPass && errors.length === 0 && rowErrors.length === 0;

    return {
        isValid,
        message: String(data.message ?? data.title ?? ""),
        errors: Array.from(new Set(errors)),
        rowErrors,
        warnings: Array.from(new Set(warnings)),
    };
}

/**
 * POST /migration/import-staff-validate
 *
 * A 4xx carrying a body is a validation answer, not a failure: it is parsed
 * like a 200 so the rows it rejects can be shown. Only a network error or a
 * response with no body throws.
 */
export const validateImportStaff = async (
    body: ImportStaffRequest
): Promise<ImportStaffValidationResult> => {
    try {
        const res = await axiosConfig.post("/migration/import-staff-validate", body);
        return parseImportStaffValidation(res.data);
    } catch (error: any) {
        const status = error?.response?.status;
        const data = error?.response?.data;
        if (status >= 400 && status < 500 && data && typeof data === "object") {
            const result = parseImportStaffValidation(data);
            if (result.errors.length === 0) {
                result.errors.push(result.message || `Validation failed (HTTP ${status})`);
            }
            result.isValid = false;
            return result;
        }
        console.error("Error validating staff import:", error);
        throw new Error(data?.error || data?.message || "Failed to validate staff import");
    }
};

/**
 * Read every staff member already in the system, indexed by employee id.
 *
 * Paged in full: a partial list would flag existing staff as unknown and block
 * a legitimate import.
 */
export async function fetchKnownStaffIndex(
    pageSize = 500,
    maxPages = 40
): Promise<Map<string, StaffNameRef>> {
    const byId = new Map<string, StaffNameRef>();
    let collected = 0;

    for (let page = 1; page <= maxPages; page++) {
        const res = await getQAStaffList({
            sortBy: "",
            sortDirection: "",
            name: "",
            employeeId: "",
            positionId: 0,
            departmentId: 0,
            staffstypeId: 0,
            isActive: true,
            page,
            perPage: pageSize,
        });

        const batch = res.responseData ?? [];
        for (const staff of batch) {
            const id = normalizeEmployeeId(staff.employeeId);
            if (!id || byId.has(id)) continue;
            byId.set(id, {
                fullNameTh: staff.name ?? "",
                fullNameEn: staff.fullNameEn ?? "",
            });
        }
        collected += batch.length;

        const total = res.total ?? res.totalAll ?? collected;
        if (batch.length === 0 || collected >= total) break;
    }

    return byId;
}
