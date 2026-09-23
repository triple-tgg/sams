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

/** The endpoint imports one staff member per call. */
export interface ImportStaffSummary {
    staffId: number;
    employeeId: string;
    isNewStaff: boolean;
    amelLicenseCount: number;
    aircraftLicenseCount: number;
    previousTrainingCount: number;
    trainingRecordCount: number;
    workExperienceCount: number;
    educationCount: number;
    warnings: string[];
}

export interface ImportStaffResponse {
    message: string;
    responseData: ImportStaffSummary;
    error: string;
}

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
    aircraftLicenses?: Array<{ id: number; code?: string | null; name: string }>;
    aircraftCombinations?: Array<any>;
    aircraftRowMappings?: Record<number, SplitAircraftCombinationItem[]>;
    amelCategories?: Array<{ id: number; code?: string | null; name: string }>;
    courses?: Array<{ id?: number; courseCode: string; courseName: string }>;
}

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

export interface ImportStaffPayloadResult {
    payload: ImportStaffRequest;
    /** Values the sheet carried that could not be matched to master data. */
    warnings: string[];
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

    const positionIndex = buildLookupIndex(lookups.positions);
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

                const entry: ImportStaffInfo = {
                    ...ref,
                    title: get(data, ["title"]),
                    joined: get(data, ["joined", "joineddate"]),
                    positionId,
                    idCardNo: get(data, ["thaiidcardno", "idcardno"]),
                    nationality: get(data, ["nationality"]),
                    dateOfBirth: get(data, ["dateofbirth", "dob"]),
                    placeOfBirth: get(data, ["placeofbirth"]),
                    phone: get(data, ["phone"]),
                    email: get(data, ["email"]),
                    address: get(data, ["address"]),
                };
                if (!isEmptyRecord(entry)) payload.staffInfo.push(entry);
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
                    payload.amelLicense.push(entry);
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
                            payload.aircraftLicense.push({
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
                                payload.aircraftLicense.push({
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
                payload.aircraftLicense.push({ ...ref, aircraftLicenseId: matched ?? 0 });
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
                    payload.previousTrainingRecords.push(entry);
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
                    payload.trainingRecords.push(entry);
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
                    payload.workExperience.push(entry);
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
                    payload.education.push(entry);
                }
            }
        }
    }

    return { payload, warnings };
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

/** POST /migration/import-staff */
export const importStaff = async (
    body: ImportStaffRequest
): Promise<ImportStaffResponse> => {
    try {
        const res = await axiosConfig.post("/migration/import-staff", body);
        return res.data as ImportStaffResponse;
    } catch (error: any) {
        console.error("Error importing staff:", error);
        throw new Error(
            error?.response?.data?.error ||
                error?.response?.data?.message ||
                "Failed to import staff"
        );
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
