import { describe, expect, it } from "vitest";
import { withStatusColumn } from "@/components/flight-timeline/types/flight-import.types";

describe("withStatusColumn", () => {
  it("adds STATUS after CHECK with default 'Normal' when the Excel has no Status column", () => {
    const { headers, rows } = withStatusColumn(["BAY", "REMARK", "CHECK"], [{ BAY: "1", REMARK: "", CHECK: "Scheduled" }]);
    expect(headers).toEqual(["BAY", "REMARK", "CHECK", "STATUS"]);
    expect(rows[0].STATUS).toBe("Normal");
  });

  it.each(["Status", "status", "STATUS"])("accepts a '%s' column, renames it to STATUS and moves it after CHECK", (header) => {
    const { headers, rows } = withStatusColumn([header, "CHECK", "BAY"], [{ [header]: " AOG ", CHECK: "Delayed", BAY: "" }]);
    expect(headers).toEqual(["CHECK", "STATUS", "BAY"]);
    expect(rows[0].STATUS).toBe("AOG");
    if (header !== "STATUS") expect(rows[0]).not.toHaveProperty(header);
  });

  it("defaults empty status cells to 'Normal' and keeps invalid values for validation", () => {
    const { rows } = withStatusColumn(["CHECK", "Status"], [{ CHECK: "", Status: "" }, { CHECK: "", Status: "Foo" }]);
    expect(rows.map((r) => r.STATUS)).toEqual(["Normal", "Foo"]);
  });

  it("appends STATUS last when there is no CHECK column", () => {
    expect(withStatusColumn(["BAY", "REMARK"], []).headers).toEqual(["BAY", "REMARK", "STATUS"]);
  });
});
