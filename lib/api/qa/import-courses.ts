import axiosConfig from "@/lib/axios.config";
import { getCourseList, type CourseData } from "@/lib/api/qa/course";

// ── Types ───────────────────────────────────────────────────────────────────

/** One row of the POST /migration/import-courses body. */
export interface ImportCourseItem {
  /** 0 creates a new course. A real id updates that course. */
  id: number;
  courseCode: string;
  courseName: string;
  /** Category name as text, not an id — the endpoint resolves it server-side. */
  courseCategory: string;
  courseType: string;
  recurrenceIntervalYears: number | null;
  additionalNote: string;
  courseObjective: string;
  duration: string;
  syllabus: string;
  aircraftEngineCombinationIds: number[];
  isdelete: boolean;
}

export interface ImportCoursesSummary {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export interface ImportCoursesResponse {
  message: string;
  responseData: ImportCoursesSummary;
  error: string;
}

/** The subset of a parsed spreadsheet row this module needs. */
export interface ImportCourseSourceRow {
  courseCode: string;
  courseName: string;
  courseCategory: string;
  courseType: string;
  recurrenceIntervalYears: number | null;
  additionalNote?: string;
  courseObjective?: string;
  courseDuration?: string;
  courseSyllabus?: string;
  aircraftEngineCombinationIds?: number[];
}

// ── Pure helpers ────────────────────────────────────────────────────────────

/**
 * Course codes are compared case- and whitespace-insensitively, because
 * spreadsheets routinely carry "  qa-101 " for a stored "QA-101".
 */
export function normalizeCourseCode(code: string | null | undefined): string {
  return (code ?? "").trim().replace(/\s+/g, " ").toUpperCase();
}

/**
 * Index existing courses by normalized code so an import row can be matched to
 * the course it should update. On duplicate codes the first one wins, which
 * keeps the mapping deterministic rather than dependent on page order.
 */
export function buildCourseCodeIndex(
  courses: Array<Pick<CourseData, "id" | "courseCode">>
): Map<string, number> {
  const index = new Map<string, number>();
  for (const course of courses) {
    const key = normalizeCourseCode(course.courseCode);
    if (!key || index.has(key)) continue;
    index.set(key, course.id);
  }
  return index;
}

/**
 * Map parsed rows onto the import payload.
 *
 * A row whose code already exists carries that course's id, so the endpoint
 * updates it. Everything else goes out with id 0 to be created.
 *
 * `isdelete` is sent as false: this endpoint upserts, and every other
 * create/update payload in this codebase uses false for a live record. The
 * published example shows true, which would soft-delete each imported course.
 */
export function buildImportCoursePayload(
  rows: ImportCourseSourceRow[],
  existingIdByCode: Map<string, number>
): ImportCourseItem[] {
  return rows.map((row) => {
    const isRecurrent = row.courseType?.trim().toLowerCase().includes("recur");
    return {
      id: existingIdByCode.get(normalizeCourseCode(row.courseCode)) ?? 0,
      courseCode: row.courseCode.trim(),
      courseName: row.courseName.trim(),
      courseCategory: row.courseCategory.trim(),
      courseType: isRecurrent ? "Recurrent" : "Initial",
      // Only a recurrent course carries an interval.
      recurrenceIntervalYears: isRecurrent ? row.recurrenceIntervalYears ?? null : null,
      additionalNote: row.additionalNote?.trim() ?? "",
      courseObjective: row.courseObjective?.trim() ?? "",
      duration: row.courseDuration?.trim() ?? "",
      syllabus: row.courseSyllabus?.trim() ?? "",
      aircraftEngineCombinationIds: row.aircraftEngineCombinationIds ?? [],
      isdelete: false,
    };
  });
}

/** Split rows by whether they will create or update, for the preview counts. */
export function summarizeImportPlan(items: ImportCourseItem[]): {
  createCount: number;
  updateCount: number;
} {
  let createCount = 0;
  let updateCount = 0;
  for (const item of items) {
    if (item.id > 0) updateCount++;
    else createCount++;
  }
  return { createCount, updateCount };
}

// ── API ─────────────────────────────────────────────────────────────────────

/**
 * Read every existing course and index it by code.
 *
 * Paged deliberately: a partial list would hand id 0 to courses that already
 * exist, turning updates into duplicate creates.
 */
export async function fetchCourseCodeIndex(
  pageSize = 500,
  maxPages = 40
): Promise<Map<string, number>> {
  const collected: Array<Pick<CourseData, "id" | "courseCode">> = [];

  for (let page = 1; page <= maxPages; page++) {
    const res = await getCourseList({
      categoryId: null,
      courseName: "",
      courseDepartmentRequirementId: null,
      page,
      perPage: pageSize,
    });

    const batch = res.responseData ?? [];
    collected.push(...batch);

    const total = res.total ?? res.totalAll ?? collected.length;
    if (batch.length === 0 || collected.length >= total) break;
  }

  return buildCourseCodeIndex(collected);
}

/** POST /migration/import-courses */
export const importCourses = async (
  items: ImportCourseItem[]
): Promise<ImportCoursesResponse> => {
  try {
    const res = await axiosConfig.post("/migration/import-courses", items);
    return res.data as ImportCoursesResponse;
  } catch (error: any) {
    console.error("Error importing courses:", error);
    throw new Error(
      error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to import courses"
    );
  }
};
