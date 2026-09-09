import { describe, it, expect } from "vitest";
import {
  normalizeCourseCode,
  buildCourseCodeIndex,
  buildImportCoursePayload,
  summarizeImportPlan,
  type ImportCourseSourceRow,
} from "./import-courses";

const row = (over: Partial<ImportCourseSourceRow> = {}): ImportCourseSourceRow => ({
  courseCode: "QA-101",
  courseName: "Safety Management",
  courseCategory: "Mandatory",
  courseType: "Initial",
  recurrenceIntervalYears: null,
  ...over,
});

describe("normalizeCourseCode", () => {
  it("ignores case and surrounding whitespace", () => {
    expect(normalizeCourseCode("  qa-101 ")).toBe("QA-101");
    expect(normalizeCourseCode("QA-101")).toBe("QA-101");
  });

  it("collapses inner whitespace", () => {
    expect(normalizeCourseCode("QA  101")).toBe("QA 101");
  });

  it("treats missing values as empty", () => {
    expect(normalizeCourseCode(null)).toBe("");
    expect(normalizeCourseCode(undefined)).toBe("");
  });
});

describe("buildCourseCodeIndex", () => {
  it("indexes existing courses by normalized code", () => {
    const index = buildCourseCodeIndex([
      { id: 7, courseCode: "QA-101" },
      { id: 9, courseCode: " sms-200 " },
    ]);
    expect(index.get("QA-101")).toBe(7);
    expect(index.get("SMS-200")).toBe(9);
  });

  it("keeps the first course when a code repeats", () => {
    const index = buildCourseCodeIndex([
      { id: 7, courseCode: "QA-101" },
      { id: 8, courseCode: "qa-101" },
    ]);
    expect(index.get("QA-101")).toBe(7);
  });

  it("skips courses with a blank code", () => {
    const index = buildCourseCodeIndex([{ id: 3, courseCode: "  " }]);
    expect(index.size).toBe(0);
  });
});

describe("buildImportCoursePayload", () => {
  it("carries the existing id so a known code updates instead of duplicating", () => {
    const index = buildCourseCodeIndex([{ id: 42, courseCode: "QA-101" }]);
    const [item] = buildImportCoursePayload([row({ courseCode: " qa-101 " })], index);
    expect(item.id).toBe(42);
    expect(item.courseCode).toBe("qa-101");
  });

  it("sends id 0 for a code that is not in the system yet", () => {
    const [item] = buildImportCoursePayload([row({ courseCode: "NEW-1" })], new Map());
    expect(item.id).toBe(0);
  });

  it("maps duration and syllabus to their own fields, leaving the note alone", () => {
    const [item] = buildImportCoursePayload(
      [row({ courseDuration: "3 days", courseSyllabus: "Module A", additionalNote: "internal" })],
      new Map()
    );
    expect(item.duration).toBe("3 days");
    expect(item.syllabus).toBe("Module A");
    expect(item.additionalNote).toBe("internal");
  });

  it("keeps the recurrence interval only for a recurrent course", () => {
    const [recurrent] = buildImportCoursePayload(
      [row({ courseType: "Recurrent", recurrenceIntervalYears: 2 })],
      new Map()
    );
    expect(recurrent.courseType).toBe("Recurrent");
    expect(recurrent.recurrenceIntervalYears).toBe(2);

    const [initial] = buildImportCoursePayload(
      [row({ courseType: "Initial", recurrenceIntervalYears: 3 })],
      new Map()
    );
    expect(initial.courseType).toBe("Initial");
    expect(initial.recurrenceIntervalYears).toBeNull();
  });

  it("recognises a recurrent course from a loosely spelled type", () => {
    const [item] = buildImportCoursePayload(
      [row({ courseType: " recurring ", recurrenceIntervalYears: 1 })],
      new Map()
    );
    expect(item.courseType).toBe("Recurrent");
    expect(item.recurrenceIntervalYears).toBe(1);
  });

  it("defaults the optional text fields to empty strings", () => {
    const [item] = buildImportCoursePayload([row()], new Map());
    expect(item.additionalNote).toBe("");
    expect(item.courseObjective).toBe("");
    expect(item.duration).toBe("");
    expect(item.syllabus).toBe("");
    expect(item.aircraftEngineCombinationIds).toEqual([]);
  });

  // An import that soft-deletes everything it imports would be pointless, and
  // every other upsert payload in this codebase sends false for a live record.
  it("marks imported courses as live, not deleted", () => {
    const [item] = buildImportCoursePayload([row()], new Map());
    expect(item.isdelete).toBe(false);
  });
});

describe("summarizeImportPlan", () => {
  it("counts creates and updates from the resolved ids", () => {
    const index = buildCourseCodeIndex([{ id: 42, courseCode: "QA-101" }]);
    const items = buildImportCoursePayload(
      [row({ courseCode: "QA-101" }), row({ courseCode: "NEW-1" }), row({ courseCode: "NEW-2" })],
      index
    );
    expect(summarizeImportPlan(items)).toEqual({ createCount: 2, updateCount: 1 });
  });
});
