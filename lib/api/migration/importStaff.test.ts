import { describe, it, expect } from "vitest";
import {
    normalizePersonName,
    collectStaffInfoNames,
    buildStaffNameReference,
    findNameMismatches,
    normalizeEmployeeId,
    collectStaffInfoEmployeeIds,
    findUnknownEmployeeIds,
    normalizeKey,
    sectionForSheet,
    buildLookupIndex,
    buildImportStaffPayload,
    countImportStaffPayloadRows,
    parseImportStaffValidation,
    resolveValidationRowErrors,
    parseImportStaffResult,
    summarizePayloadByEmployee,
    type ParsedSheetInput,
    type ImportStaffLookups,
} from "./importStaff";

const LOOKUPS: ImportStaffLookups = {
    positions: [
        { id: 7, code: "LAE", name: "Licensed Aircraft Engineer" },
        { id: 8, code: "MECH", name: "Mechanic" },
    ],
    aircraftLicenses: [
        { id: 21, code: "TB9", name: "SOCATA TB-9" },
        { id: 22, code: "B777", name: "Boeing 777" },
    ],
    amelCategories: [
        { id: 1, code: "B1.1", name: "Aeroplane Turbine" },
        { id: 5, code: "B2", name: "Avionics" },
    ],
    courses: [
        { id: 101, courseCode: "HF-01", courseName: "Human Factors" },
        { id: 102, courseCode: "SMS-01", courseName: "Safety Management System" },
    ],
};

const sheet = (name: string, headers: string[], rows: string[][]): ParsedSheetInput => ({
    name,
    headers,
    rows: rows.map((values, i) => ({
        rowIndex: i + 1,
        data: headers.reduce((acc, h, idx) => ({ ...acc, [h]: values[idx] ?? "" }), {}),
    })),
});

describe("normalizeKey", () => {
    // The real workbook headers carry trailing spaces and mixed punctuation.
    it("strips case, spaces and punctuation", () => {
        expect(normalizeKey("Joined ")).toBe("joined");
        expect(normalizeKey("Academy / Venue/By ")).toBe("academyvenueby");
        expect(normalizeKey("Full Name (Thai)")).toBe("fullnamethai");
        expect(normalizeKey("Thai ID Card No.")).toBe("thaiidcardno");
    });
});

describe("sectionForSheet", () => {
    it("maps every sheet in the workbook to its payload section", () => {
        expect(sectionForSheet("Staff Info")).toBe("staffInfo");
        expect(sectionForSheet("AMEL License")).toBe("amelLicense");
        expect(sectionForSheet("Aircraft License")).toBe("aircraftLicense");
        expect(sectionForSheet("Previous Training Records")).toBe("previousTrainingRecords");
        expect(sectionForSheet("Training Records")).toBe("trainingRecords");
        expect(sectionForSheet("Work Experience")).toBe("workExperience");
        expect(sectionForSheet("Education")).toBe("education");
    });

    // "Previous Training Records" must not fall into trainingRecords.
    it("keeps the two training sheets apart", () => {
        expect(sectionForSheet("Previous Training Records")).not.toBe("trainingRecords");
    });

    it("ignores a sheet it does not recognise", () => {
        expect(sectionForSheet("Notes")).toBeNull();
    });
});

describe("buildLookupIndex", () => {
    it("matches on either the name or the code", () => {
        const index = buildLookupIndex(LOOKUPS.aircraftLicenses);
        expect(index.get(normalizeKey("SOCATA TB-9"))).toBe(21);
        expect(index.get(normalizeKey("tb9"))).toBe(21);
    });
});

describe("buildImportStaffPayload", () => {
    it("maps the staff info sheet, resolving the position to an id", () => {
        const sheets = [
            sheet(
                "Staff Info",
                ["Employee ID", "Full Name (Thai)", "Full Name (English)", "Joined ", "Position",
                 "Department", "Thai ID Card No.", "Nationality", "Date of Birth", "Place of Birth",
                 "Phone", "Email", "Address"],
                [["0068", "นายเดชา", "Mr. Decha", "01/04/1991", "Mechanic", "Line", "3240300021758",
                  "Thai", "26/06/1964", "Pathum Thani", "081-934-8507", "d@x.com", "Bangkok"]]
            ),
        ];
        const { payload, warnings } = buildImportStaffPayload(sheets, LOOKUPS);

        expect(payload.staffInfo).toHaveLength(1);
        expect(payload.staffInfo[0]).toMatchObject({
            employeeId: "0068",
            fullNameTh: "นายเดชา",
            fullNameEn: "Mr. Decha",
            joined: "01/04/1991",
            positionId: 8,
            idCardNo: "3240300021758",
            dateOfBirth: "26/06/1964",
            phone: "081-934-8507",
        });
        expect(warnings).toEqual([]);
    });

    it("warns and sends 0 when the position is not in the master", () => {
        const sheets = [
            sheet("Staff Info", ["Employee ID", "Position"], [["0068", "Chief Wizard"]]),
        ];
        const { payload, warnings } = buildImportStaffPayload(sheets, LOOKUPS);
        expect(payload.staffInfo[0].positionId).toBe(0);
        expect(warnings[0]).toContain("Chief Wizard");
    });

    describe("station", () => {
        const withStations: ImportStaffLookups = {
            ...LOOKUPS,
            stations: [
                { id: 1, code: "BKK", name: "Suvarnabhumi" },
                { id: 2, code: "HKT", name: "Phuket" },
            ],
        };

        it("resolves the Station column to an id", () => {
            const sheets = [sheet("Staff Info", ["Employee ID", "Station"], [["0068", "HKT"]])];
            const { payload, warnings } = buildImportStaffPayload(sheets, withStations);
            expect(payload.staffInfo[0].stationId).toBe(2);
            expect(warnings).toEqual([]);
        });

        it("defaults to BKK when the Station cell is blank or the column is missing", () => {
            const sheets = [
                sheet("Staff Info", ["Employee ID", "Station"], [["0068", ""]]),
                sheet("Staff", ["Employee ID"], [["0069"]]),
            ];
            const { payload } = buildImportStaffPayload(sheets, withStations);
            expect(payload.staffInfo.map((s) => s.stationId)).toEqual([1, 1]);
        });

        it("warns and sends null when the station is not in the master", () => {
            const sheets = [sheet("Staff Info", ["Employee ID", "Station"], [["0068", "XXX"]])];
            const { payload, warnings } = buildImportStaffPayload(sheets, withStations);
            expect(payload.staffInfo[0].stationId).toBeNull();
            expect(warnings[0]).toContain("XXX");
        });

        it("still drops a staff info row that only has the default station", () => {
            const sheets = [sheet("Staff Info", ["Employee ID", "Station"], [["", "BKK"]])];
            const { payload } = buildImportStaffPayload(sheets, withStations);
            expect(payload.staffInfo).toHaveLength(0);
        });
    });

    it("resolves the AMEL category name or code to an id", () => {
        const sheets = [
            sheet("AMEL License",
                ["Employee ID", "Full Name (Thai)", "Full Name (English)", "AMEL License Number", "Category", "Issued Date", "Expiry Date"],
                [["0068", "นายเดชา", "Mr. Decha", "AMEL-001", "Aeroplane Turbine", "01/01/2020", "01/01/2025"],
                 ["0068", "นายเดชา", "Mr. Decha", "AMEL-002", "B2", "01/01/2020", "01/01/2025"],
                 ["0068", "นายเดชา", "Mr. Decha", "AMEL-003", "Unknown Cat", "01/01/2020", "01/01/2025"]]),
        ];
        const { payload, warnings } = buildImportStaffPayload(sheets, LOOKUPS);
        expect(payload.amelLicense).toHaveLength(3);
        expect(payload.amelLicense[0].categoryId).toBe(1);
        expect(payload.amelLicense[0].category).toBe("1");
        expect(payload.amelLicense[1].categoryId).toBe(5);
        expect(payload.amelLicense[1].category).toBe("5");
        expect(payload.amelLicense[2].categoryId).toBe(0);
        expect(warnings[0]).toContain("Unknown Cat");
    });

    it("resolves the aircraft licence name to an id", () => {
        const sheets = [
            sheet("Aircraft License",
                ["Employee ID", "Full Name (Thai)", "Full Name (English)", "Aircraft License"],
                [["0068", "นายเดชา", "Mr. Decha", "SOCATA TB-9"],
                 ["0068", "นายเดชา", "Mr. Decha", "Cessna 172"]]),
        ];
        const { payload, warnings } = buildImportStaffPayload(sheets, LOOKUPS);
        expect(payload.aircraftLicense).toHaveLength(2);
        expect(payload.aircraftLicense[0].aircraftLicenseId).toBe(21);
        expect(payload.aircraftLicense[1].aircraftLicenseId).toBe(0);
        expect(warnings[0]).toContain("Cessna 172");
    });

    it("splits grouped aircraft licence into multiple records when combinations are provided", () => {
        const sheets = [
            sheet("Aircraft License",
                ["Employee ID", "Full Name (Thai)", "Full Name (English)", "Aircraft License"],
                [["0068", "นายเดชา", "Mr. Decha", "Boeing 737-600/700(CFM56)"]]),
        ];
        const lookupsWithCombinations: ImportStaffLookups = {
            ...LOOKUPS,
            aircraftCombinations: [
                { id: 101, familyCode: "B737", series: "600", engineCode: "CFM56", displayLabel: "B737-600 (CFM56)" },
                { id: 102, familyCode: "B737", series: "700", engineCode: "CFM56", displayLabel: "B737-700 (CFM56)" },
            ],
        };
        const { payload } = buildImportStaffPayload(sheets, lookupsWithCombinations);
        expect(payload.aircraftLicense).toHaveLength(2);
        expect(payload.aircraftLicense[0]).toMatchObject({
            employeeId: "0068",
            fullNameTh: "นายเดชา",
            fullNameEn: "Mr. Decha",
            aircraftLicenseId: 101,
        });
        expect(payload.aircraftLicense[1]).toMatchObject({
            employeeId: "0068",
            fullNameTh: "นายเดชา",
            fullNameEn: "Mr. Decha",
            aircraftLicenseId: 102,
        });
    });

    it("uses modal pre-resolved aircraftRowMappings when provided", () => {
        const sheets = [
            sheet("Aircraft License",
                ["Employee ID", "Full Name (Thai)", "Full Name (English)", "Aircraft License"],
                [["0068", "นายเดชา", "Mr. Decha", "Custom License Group"]]),
        ];
        const lookupsWithMappings: ImportStaffLookups = {
            ...LOOKUPS,
            aircraftRowMappings: {
                1: [
                    { id: "c1", originalText: "B777-200", combinationId: 301, displayLabel: "B777-200 (GE90)", matched: true },
                    { id: "c2", originalText: "B777-300", combinationId: 302, displayLabel: "B777-300 (GE90)", matched: true },
                    { id: "c3", originalText: "B777-300ER", combinationId: 303, displayLabel: "B777-300ER (GE90)", matched: true },
                ],
            },
        };
        const { payload } = buildImportStaffPayload(sheets, lookupsWithMappings);
        expect(payload.aircraftLicense).toHaveLength(3);
        expect(payload.aircraftLicense.map((r) => r.aircraftLicenseId)).toEqual([301, 302, 303]);
    });

    it("reads the training sheet headers the workbook actually uses", () => {
        const sheets = [
            sheet("Training Records",
                ["Employee ID", "Full Name (Thai)", "Full Name (English)", "Training Course",
                 "Academy / Venue/By ", "Date From", "Date To", "Valid Until "],
                [["0068", "นายเดชา", "Mr. Decha", "B777-200/300 License", "Thai Airways",
                  "01/09/2006", "01/01/2007", "Never"]]),
        ];
        const { payload } = buildImportStaffPayload(sheets, LOOKUPS);
        expect(payload.trainingRecords[0]).toMatchObject({
            courseCode: "B777-200/300 License",
            academyName: "Thai Airways",
            dateFrom: "01/09/2006",
            dateTo: "01/01/2007",
            validUntil: "Never",
        });
    });

    it("resolves course name to its master courseCode when known", () => {
        const sheets = [
            sheet("Training Records",
                ["Employee ID", "Full Name (Thai)", "Full Name (English)", "Course Code", "Date From"],
                [["0068", "นายเดชา", "Mr. Decha", "Human Factors", "01/09/2020"],
                 ["0068", "นายเดชา", "Mr. Decha", "SMS-01", "01/09/2021"]]),
        ];
        const { payload } = buildImportStaffPayload(sheets, LOOKUPS);
        expect(payload.trainingRecords[0].courseCode).toBe("HF-01");
        expect(payload.trainingRecords[1].courseCode).toBe("SMS-01");
    });

    // The Work Experience sheet labels its start column "Date", not "Date From".
    it("accepts either Date or Date From on the work experience sheet", () => {
        const sheets = [
            sheet("Work Experience",
                ["Employee ID", "Employer / Company", "Position / Title", "Date", "Date To", "Notes"],
                [["0068", "Thai Airways", "Licensed Aircraft Engineer", "Apr-1991", "May-2024", "left"]]),
        ];
        const { payload } = buildImportStaffPayload(sheets, LOOKUPS);
        expect(payload.workExperience[0]).toMatchObject({
            company: "Thai Airways",
            jobTitle: "Licensed Aircraft Engineer",
            dateFrom: "Apr-1991",
            dateTo: "May-2024",
            notes: "left",
        });
    });

    it("maps the education sheet including its trailing-space header", () => {
        const sheets = [
            sheet("Education",
                ["Employee ID", "Degree", "Institution/University/College ", "Field of Study",
                 "Start Year", "End Year"],
                [["0068", "Diploma", "Air Technical Training Schools", "Airborne", "1983", "1985"]]),
        ];
        const { payload } = buildImportStaffPayload(sheets, LOOKUPS);
        expect(payload.education[0]).toMatchObject({
            degree: "Diploma",
            institution: "Air Technical Training Schools",
            fieldOfStudy: "Airborne",
            startYear: "1983",
            endYear: "1985",
        });
    });

    // The preview lets a user add a blank row; it must not reach the API.
    it("drops rows that carry no data of their own", () => {
        const sheets = [
            sheet("Education",
                ["Employee ID", "Full Name (Thai)", "Degree", "Field of Study"],
                [["0068", "นายเดชา", "Diploma", "Airborne"],
                 ["0068", "นายเดชา", "", ""],
                 ["", "", "", ""]]),
        ];
        const { payload } = buildImportStaffPayload(sheets, LOOKUPS);
        expect(payload.education).toHaveLength(1);
    });

    it("ignores sheets that are not part of the import", () => {
        const sheets = [sheet("Random Notes", ["Anything"], [["x"]])];
        const { payload } = buildImportStaffPayload(sheets, LOOKUPS);
        expect(countImportStaffPayloadRows(payload)).toBe(0);
    });

    it("always returns every section, even when the workbook omits some", () => {
        const { payload } = buildImportStaffPayload([], LOOKUPS);
        expect(Object.keys(payload).sort()).toEqual([
            "aircraftLicense", "amelLicense", "education", "previousTrainingRecords",
            "staffInfo", "trainingRecords", "workExperience",
        ]);
    });
});

describe("normalizeEmployeeId", () => {
    it("ignores case and surrounding whitespace", () => {
        expect(normalizeEmployeeId("  ab-12 ")).toBe("AB-12");
    });

    // Excel turns a text "0068" into the number 68 the moment a cell is retyped.
    it("treats an all-digit id as the same with or without leading zeros", () => {
        expect(normalizeEmployeeId("0068")).toBe("68");
        expect(normalizeEmployeeId("68")).toBe("68");
    });

    it("leaves leading zeros alone when the id is not all digits", () => {
        expect(normalizeEmployeeId("0068A")).toBe("0068A");
    });

    it("treats missing values as empty", () => {
        expect(normalizeEmployeeId(null)).toBe("");
        expect(normalizeEmployeeId(undefined)).toBe("");
        expect(normalizeEmployeeId("   ")).toBe("");
    });
});

describe("collectStaffInfoEmployeeIds", () => {
    it("reads the ids the Staff Info sheet declares", () => {
        const sheets = [
            sheet("Staff Info", ["Employee ID", "Full Name (Thai)"], [["0068", "ก"], ["70", "ข"]]),
            sheet("Education", ["Employee ID", "Degree"], [["999", "Diploma"]]),
        ];
        expect(collectStaffInfoEmployeeIds(sheets)).toEqual(new Set(["68", "70"]));
    });

    it("returns nothing when the workbook has no Staff Info sheet", () => {
        const sheets = [sheet("Education", ["Employee ID", "Degree"], [["1", "Diploma"]])];
        expect(collectStaffInfoEmployeeIds(sheets).size).toBe(0);
    });
});

describe("findUnknownEmployeeIds", () => {
    const childSheets = () => [
        sheet("AMEL License", ["Employee ID", "AMEL License Number"], [["0068", "1275"]]),
        sheet("Aircraft License", ["Employee ID", "Aircraft License"], [["70", "A320"]]),
        sheet("Education", ["Employee ID", "Degree"], [["999", "Diploma"]]),
    ];

    it("accepts a row whose staff is declared in Staff Info", () => {
        const sheets = [
            sheet("Staff Info", ["Employee ID"], [["68"], ["70"], ["999"]]),
            ...childSheets(),
        ];
        expect(findUnknownEmployeeIds(sheets, new Set())).toEqual([]);
    });

    it("accepts a row whose staff already exists in the system", () => {
        const sheets = childSheets();
        expect(findUnknownEmployeeIds(sheets, new Set(["68", "70", "999"]))).toEqual([]);
    });

    it("flags a row that is in neither place", () => {
        const sheets = [sheet("Staff Info", ["Employee ID"], [["68"]]), ...childSheets()];
        const issues = findUnknownEmployeeIds(sheets, new Set(["70"]));
        expect(issues).toHaveLength(1);
        expect(issues[0]).toMatchObject({
            sheetName: "Education",
            section: "education",
            rowIndex: 1,
            employeeId: "999",
        });
    });

    it("matches across the leading-zero spellings", () => {
        const sheets = [
            sheet("Staff Info", ["Employee ID"], [["68"]]),
            sheet("Education", ["Employee ID", "Degree"], [["0068", "Diploma"]]),
        ];
        expect(findUnknownEmployeeIds(sheets, new Set())).toEqual([]);
    });

    // Blank rows are dropped by the payload mapping, not reported as errors.
    it("leaves rows with no Employee ID alone", () => {
        const sheets = [sheet("Education", ["Employee ID", "Degree"], [["", "Diploma"], ["  ", ""]])];
        expect(findUnknownEmployeeIds(sheets, new Set())).toEqual([]);
    });

    it("does not check the Staff Info sheet against itself", () => {
        const sheets = [sheet("Staff Info", ["Employee ID"], [["12345"]])];
        expect(findUnknownEmployeeIds(sheets, new Set())).toEqual([]);
    });

    it("reports every offending row across all six child sheets", () => {
        const sheets = [
            sheet("Staff Info", ["Employee ID"], [["1"]]),
            sheet("AMEL License", ["Employee ID"], [["9"]]),
            sheet("Aircraft License", ["Employee ID"], [["9"]]),
            sheet("Previous Training Records", ["Employee ID"], [["9"]]),
            sheet("Training Records", ["Employee ID"], [["9"]]),
            sheet("Work Experience", ["Employee ID"], [["9"]]),
            sheet("Education", ["Employee ID"], [["9"]]),
        ];
        const issues = findUnknownEmployeeIds(sheets, new Set());
        expect(issues).toHaveLength(6);
        expect(issues.map((i) => i.section)).toEqual([
            "amelLicense", "aircraftLicense", "previousTrainingRecords",
            "trainingRecords", "workExperience", "education",
        ]);
    });
});

describe("normalizePersonName", () => {
    it("ignores case, spacing and dots", () => {
        expect(normalizePersonName("Decha  Prasert-Amporn")).toBe("decha prasert-amporn".replace(/\s/g, ""));
    });

    // The sheets and the staff master disagree about whether a title belongs
    // in the name field.
    it("drops a leading title in either language", () => {
        expect(normalizePersonName("Mr. Decha Prasert-Amporn")).toBe(
            normalizePersonName("Decha Prasert-Amporn")
        );
        expect(normalizePersonName("นายเดชา ประเสริฐอัมพร")).toBe(
            normalizePersonName("เดชา ประเสริฐอัมพร")
        );
        expect(normalizePersonName("นางสาวมาลี ใจดี")).toBe(normalizePersonName("มาลี ใจดี"));
    });

    it("treats missing values as empty", () => {
        expect(normalizePersonName(null)).toBe("");
        expect(normalizePersonName("  ")).toBe("");
    });
});

describe("collectStaffInfoNames", () => {
    it("keys the declared names by employee id", () => {
        const sheets = [
            sheet("Staff Info",
                ["Employee ID", "Full Name (Thai)", "Full Name (English)"],
                [["0068", "นายเดชา", "Mr. Decha"]]),
        ];
        expect(collectStaffInfoNames(sheets).get("68")).toEqual({
            fullNameTh: "นายเดชา",
            fullNameEn: "Mr. Decha",
        });
    });
});

describe("buildStaffNameReference", () => {
    // The workbook is the one saying what the name should become.
    it("lets the Staff Info sheet win over the system", () => {
        const sheets = [
            sheet("Staff Info", ["Employee ID", "Full Name (English)"], [["68", "New Name"]]),
        ];
        const system = new Map([["68", { fullNameTh: "เก่า", fullNameEn: "Old Name" }]]);
        expect(buildStaffNameReference(sheets, system).get("68")?.fullNameEn).toBe("New Name");
    });

    it("keeps system entries the workbook does not mention", () => {
        const system = new Map([["77", { fullNameTh: "สมชาย", fullNameEn: "Somchai" }]]);
        expect(buildStaffNameReference([], system).get("77")?.fullNameEn).toBe("Somchai");
    });
});

describe("findNameMismatches", () => {
    const reference = new Map([
        ["68", { fullNameTh: "นายเดชา ประเสริฐอัมพร", fullNameEn: "Mr. Decha Prasert-Amporn" }],
    ]);

    const child = (rows: string[][]) =>
        sheet("Education", ["Employee ID", "Full Name (Thai)", "Full Name (English)", "Degree"], rows);

    it("accepts a row whose names agree", () => {
        const sheets = [child([["0068", "นายเดชา ประเสริฐอัมพร", "Mr. Decha Prasert-Amporn", "Dip"]])];
        expect(findNameMismatches(sheets, reference)).toEqual([]);
    });

    it("accepts names that differ only by title or spacing", () => {
        const sheets = [child([["68", "เดชา ประเสริฐอัมพร", "Decha  Prasert-Amporn", "Dip"]])];
        expect(findNameMismatches(sheets, reference)).toEqual([]);
    });

    it("flags a Thai name belonging to someone else", () => {
        const sheets = [child([["68", "นายสมชาย ใจดี", "Mr. Decha Prasert-Amporn", "Dip"]])];
        const issues = findNameMismatches(sheets, reference);
        expect(issues).toHaveLength(1);
        expect(issues[0]).toMatchObject({
            column: "fullNameTh",
            rowIndex: 1,
            employeeId: "68",
            value: "นายสมชาย ใจดี",
        });
    });

    it("flags an English name belonging to someone else", () => {
        const sheets = [child([["68", "นายเดชา ประเสริฐอัมพร", "Mr. Somchai Jaidee", "Dip"]])];
        const issues = findNameMismatches(sheets, reference);
        expect(issues).toHaveLength(1);
        expect(issues[0].column).toBe("fullNameEn");
    });

    it("flags both columns when both disagree", () => {
        const sheets = [child([["68", "นายสมชาย", "Mr. Somchai", "Dip"]])];
        expect(findNameMismatches(sheets, reference).map((i) => i.column)).toEqual([
            "fullNameTh",
            "fullNameEn",
        ]);
    });

    // A blank cell makes no claim that could be wrong.
    it("stays quiet on a blank name", () => {
        const sheets = [child([["68", "", "", "Dip"]])];
        expect(findNameMismatches(sheets, reference)).toEqual([]);
    });

    // That row is already reported by the Employee ID check.
    it("stays quiet when the employee id is unknown", () => {
        const sheets = [child([["999", "ใครก็ไม่รู้", "Nobody", "Dip"]])];
        expect(findNameMismatches(sheets, reference)).toEqual([]);
    });

    it("does not check the Staff Info sheet against itself", () => {
        const sheets = [
            sheet("Staff Info", ["Employee ID", "Full Name (English)"], [["68", "Totally Different"]]),
        ];
        expect(findNameMismatches(sheets, reference)).toEqual([]);
    });
});

describe("parseImportStaffValidation", () => {
    it("passes when flagPass is true and there are no errors", () => {
        const r = parseImportStaffValidation({ message: "ok", responseData: { flagPass: true, warnings: ["w1"] }, error: "" });
        expect(r.isValid).toBe(true);
        expect(r.errors).toEqual([]);
        expect(r.warnings).toEqual(["w1"]);
    });

    it("reads string and object errors under responseData", () => {
        const r = parseImportStaffValidation({
            responseData: {
                flagPass: false,
                errors: ["plain", { sheet: "AMEL License", row: 3, employeeId: "0022", message: "category not found" }],
            },
        });
        expect(r.isValid).toBe(false);
        expect(r.errors).toEqual(["plain", "AMEL License · row 3 · Employee ID 0022: category not found"]);
    });

    it("counts a top-level error string as an error even with HTTP 200", () => {
        const r = parseImportStaffValidation({ message: "error", responseData: null, error: "Employee 0099 not found" });
        expect(r.isValid).toBe(false);
        expect(r.errors).toEqual(["Employee 0099 not found"]);
    });

    it("flattens an ASP.NET field map", () => {
        const r = parseImportStaffValidation({ title: "One or more validation errors occurred.", errors: { "staffInfo[0].email": ["Invalid email"] } });
        expect(r.isValid).toBe(false);
        expect(r.errors).toEqual(["staffInfo[0].email: Invalid email"]);
    });

    it("reads flagPass at the top level", () => {
        expect(parseImportStaffValidation({ flagPass: true, responseData: null, error: "" }).isValid).toBe(true);
    });

    it("fails when flagPass is missing, even with no errors", () => {
        expect(parseImportStaffValidation({ message: "ok", responseData: {} }).isValid).toBe(false);
    });

    it("fails when flagPass is true but errors are present", () => {
        const r = parseImportStaffValidation({ responseData: { flagPass: true, errors: ["x"] } });
        expect(r.isValid).toBe(false);
    });
});

describe("validateList row errors", () => {
    const body = {
        message: "success",
        responseData: {
            flagPass: false,
            validateList: [
                {
                    staffInfo: [],
                    amelLicense: [],
                    trainingRecords: [
                        { rowId: 1, employeeId: "0012", statusText: "รูปแบบวันที่ DateFrom ไม่ถูกต้อง" },
                        { rowId: 3, employeeId: "0012", statusText: "bad course" },
                    ],
                },
            ],
        },
        error: "",
    };

    it("reads row errors per section and fails the result", () => {
        const r = parseImportStaffValidation(body);
        expect(r.isValid).toBe(false);
        expect(r.errors).toEqual([]);
        expect(r.rowErrors).toEqual([
            { section: "trainingRecords", rowId: 1, employeeId: "0012", statusText: "รูปแบบวันที่ DateFrom ไม่ถูกต้อง" },
            { section: "trainingRecords", rowId: 3, employeeId: "0012", statusText: "bad course" },
        ]);
    });

    it("maps payload positions back to sheet rows, skipping dropped blank rows", () => {
        const sheets: ParsedSheetInput[] = [
            {
                name: "Training Records",
                headers: ["Employee ID", "Course Code", "Date From"],
                rows: [
                    { rowIndex: 1, data: { "Employee ID": "0012", "Course Code": "C1", "Date From": "x" } },
                    { rowIndex: 2, data: { "Employee ID": "", "Course Code": "", "Date From": "" } },
                    { rowIndex: 3, data: { "Employee ID": "0012", "Course Code": "C2", "Date From": "y" } },
                    { rowIndex: 4, data: { "Employee ID": "0012", "Course Code": "C3", "Date From": "z" } },
                ],
            },
        ];
        const { sources } = buildImportStaffPayload(sheets, LOOKUPS);
        expect(sources.trainingRecords.map((s) => s.rowIndex)).toEqual([1, 3, 4]);

        const { resolved, unresolved } = resolveValidationRowErrors(
            [
                ...parseImportStaffValidation(body).rowErrors,
                { section: "trainingRecords", rowId: 9, employeeId: "0012", statusText: "gone" },
            ],
            sources
        );
        expect(resolved).toEqual([
            { sheetName: "Training Records", rowIndex: 1, employeeId: "0012", statusText: "รูปแบบวันที่ DateFrom ไม่ถูกต้อง" },
            { sheetName: "Training Records", rowIndex: 4, employeeId: "0012", statusText: "bad course" },
        ]);
        expect(unresolved).toEqual(["trainingRecords row 9 · Employee ID 0012: gone"]);
    });
});

describe("parseImportStaffResult", () => {
    it("reads the original single-staff summary", () => {
        const r = parseImportStaffResult({
            message: "success",
            error: "",
            responseData: {
                staffId: 5, employeeId: "0022", isNewStaff: false,
                amelLicenseCount: 3, aircraftLicenseCount: 1, previousTrainingCount: 120,
                trainingRecordCount: 30, workExperienceCount: 2, educationCount: 1, warnings: ["w"],
            },
        });
        expect(r.success).toBe(true);
        expect(r.staff).toEqual([
            {
                employeeId: "0022", staffId: 5, name: "", isNewStaff: false,
                counts: { amelLicense: 3, aircraftLicense: 1, previousTraining: 120, trainingRecords: 30, workExperience: 2, education: 1 },
                isError: false, error: "",
            },
        ]);
        expect(r.counts).toEqual({ amelLicense: 3, aircraftLicense: 1, previousTraining: 120, trainingRecords: 30, workExperience: 2, education: 1 });
        expect(r.updatedCount).toBe(1);
        expect(r.warnings).toEqual(["Employee ID 0022: w"]);
    });

    it("sums counts over a list of staff", () => {
        const r = parseImportStaffResult({
            responseData: [
                { employeeId: "0012", isNewStaff: true, amelLicenseCount: 2, educationCount: 1 },
                { employeeId: "0022", isNewStaff: false, amelLicenseCount: 3, educationCount: 0 },
            ],
        });
        expect(r.staff.map((s) => s.employeeId)).toEqual(["0012", "0022"]);
        expect(r.newCount).toBe(1);
        expect(r.updatedCount).toBe(1);
        expect(r.counts?.amelLicense).toBe(5);
        expect(r.counts?.education).toBe(1);
    });

    it("leaves counts null when the API sends none", () => {
        const r = parseImportStaffResult({ message: "success", responseData: {} });
        expect(r.success).toBe(true);
        expect(r.staff).toEqual([]);
        expect(r.counts).toBeNull();
    });

    it("fails on flagPass false with row errors", () => {
        const r = parseImportStaffResult({
            responseData: { flagPass: false, validateList: [{ trainingRecords: [{ rowId: 2, employeeId: "0012", statusText: "bad" }] }] },
        });
        expect(r.success).toBe(false);
        expect(r.rowErrors).toHaveLength(1);
    });

    it("fails on HTTP 200 with an error string", () => {
        expect(parseImportStaffResult({ message: "error", error: "boom", responseData: null }).success).toBe(false);
    });
});

describe("parseImportStaffResult with the live item shape", () => {
    const item = (over: Record<string, unknown>) => ({
        staffId: 162, employeeId: "0022", isNewStaff: false,
        amelLicenseCount: 3, aircraftLicenseCount: 1, previousTrainingCount: 132, trainingRecordCount: 0,
        workExperienceCount: 3, educationCount: 1, error: null, isError: false, ...over,
    });

    it("finds the list under an unknown wrapper key and sums successful staff", () => {
        const r = parseImportStaffResult({
            message: "success",
            responseData: { importStaffList: [item({}), item({ staffId: 170, employeeId: "0012", isNewStaff: true, amelLicenseCount: 2 })] },
        });
        expect(r.success).toBe(true);
        expect(r.staff.map((s) => s.employeeId)).toEqual(["0022", "0012"]);
        expect(r.newCount).toBe(1);
        expect(r.updatedCount).toBe(1);
        expect(r.failedCount).toBe(0);
        expect(r.counts?.amelLicense).toBe(5);
        expect(r.counts?.previousTraining).toBe(264);
    });

    it("reports a failed staff member without failing the whole import", () => {
        const r = parseImportStaffResult({
            responseData: { list: [item({}), item({ employeeId: "0099", isError: true, error: "Position not found" })] },
        });
        expect(r.success).toBe(true);
        expect(r.failedCount).toBe(1);
        expect(r.staff[1]).toMatchObject({ employeeId: "0099", isError: true, error: "Position not found" });
        expect(r.counts?.amelLicense).toBe(3);
    });

    it("fails when every staff member failed", () => {
        const r = parseImportStaffResult({ responseData: [item({ isError: true, error: "boom" })] });
        expect(r.success).toBe(false);
    });
});

describe("summarizePayloadByEmployee", () => {
    it("counts rows per staff, matching ids across zero-padding", () => {
        const ref = (employeeId: string) => ({ employeeId, fullNameTh: "", fullNameEn: "" });
        const m = summarizePayloadByEmployee({
            staffInfo: [{ ...ref("0022"), fullNameEn: "Chalong Siri" } as any],
            amelLicense: [ref("0022"), ref("22")] as any,
            aircraftLicense: [],
            previousTrainingRecords: [ref("0012")] as any,
            trainingRecords: [],
            workExperience: [],
            education: [],
        });
        expect(m.get("22")).toEqual({
            name: "Chalong Siri",
            counts: { amelLicense: 2, aircraftLicense: 0, previousTraining: 0, trainingRecords: 0, workExperience: 0, education: 0 },
        });
        expect(m.get("12")?.counts.previousTraining).toBe(1);
    });
});
