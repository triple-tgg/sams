// SAMS-QA-SRS-04 — Functional Requirements
const H = require("./_helpers");

const sections = [
    ...H.coverPage({
        docNo: "SAMS-QA-SRS-04",
        docTitle: "Functional Requirements",
        subtitleText: "ข้อกำหนดเชิงฟังก์ชัน — โมดูล QA",
    }),

    H.h1("1. ภาพรวม"),
    H.h2("1.1 หลักการอ้างอิง FR ID"),
    H.p("รูปแบบ: FR-<MODULE>-<NUM>  เช่น FR-AUTH-001"),
    H.h2("1.2 ระดับความสำคัญ"),
    H.makeTable(
        ["ระดับ", "คำอธิบาย"],
        [
            ["MUST", "ต้องมีก่อน Go-Live (Phase 1)"],
            ["SHOULD", "ควรมี (Phase 1-2)"],
            ["COULD", "มีก็ดี (Phase 2-3)"],
            ["WONT", "ไม่อยู่ในแผน"],
        ]
    ),
    H.h2("1.3 รายการ Sub-modules"),
    H.diagramPlaceholder("Sub-modules Map", "graph LR — Dashboard / Staff / Auth / Mon / Course / Sched / Cross-cutting"),

    H.pageBreak(),

    H.h1("2. FR-DASH: QA Dashboard"),
    H.h2("2.1 Use Cases"),
    H.diagramPlaceholder("Dashboard Use Cases", "graph LR — QM/CM → ดูภาพรวม / Drill-down"),
    H.h2("2.2 Functional Requirements"),
    H.makeTable(
        ["ID", "Description", "Priority"],
        [
            ["FR-DASH-001", "แสดง Total Staff count + Active/Inactive breakdown", "MUST"],
            ["FR-DASH-002", "แสดง Active Authorization count + รายละเอียดต่อสายการบิน", "MUST"],
            ["FR-DASH-003", "แสดง Expiring Soon counter (≤30/60/90 days)", "MUST"],
            ["FR-DASH-004", "แสดง Compliance % แยกตาม department/role", "MUST"],
            ["FR-DASH-005", "แสดง Upcoming Training Sessions (7 วันข้างหน้า)", "MUST"],
            ["FR-DASH-006", "แสดง Recent Activity (10 รายการล่าสุด)", "SHOULD"],
            ["FR-DASH-007", "แสดง Compliance trend chart (12 เดือนย้อนหลัง)", "SHOULD"],
            ["FR-DASH-008", "คลิก widget เพื่อ drill-down ไปหน้า detail", "MUST"],
            ["FR-DASH-009", "Auto-refresh ทุก 5 นาที", "SHOULD"],
            ["FR-DASH-010", "Filter dashboard ตาม customer airline", "COULD"],
        ]
    ),
    H.h2("2.3 Acceptance Criteria"),
    H.bullet("Dashboard load สำเร็จภายใน 3 วินาที"),
    H.bullet("แสดงข้อมูลตาม role (CS เห็นเฉพาะข้อมูลตนเอง)"),
    H.bullet("ตัวเลข match กับ Detail page เมื่อ drill-down"),

    H.pageBreak(),

    H.h1("3. FR-STAFF: Staff Management"),
    H.h2("3.1 Use Cases"),
    H.diagramPlaceholder("Staff Use Cases", "flowchart LR — QM/Inspector/CS → Search/View/Create/Edit/Bulk"),
    H.h2("3.2 Functional Requirements"),
    H.makeTable(
        ["ID", "Description", "Priority"],
        [
            ["FR-STAFF-001", "List staff พร้อม search (name, employeeCode, position)", "MUST"],
            ["FR-STAFF-002", "Filter ตาม department, employeeType, status", "MUST"],
            ["FR-STAFF-003", "View staff profile (5 tabs)", "MUST"],
            ["FR-STAFF-004", "Create new staff (form SAMS-FM-CM-036)", "MUST"],
            ["FR-STAFF-005", "Edit staff personal info", "MUST"],
            ["FR-STAFF-006", "Edit education records", "MUST"],
            ["FR-STAFF-007", "Edit work experience", "MUST"],
            ["FR-STAFF-008", "Edit license info (B1, B2, etc.)", "MUST"],
            ["FR-STAFF-009", "Upload profile photo (max 2MB)", "SHOULD"],
            ["FR-STAFF-010", "Mark staff as Resigned (with effective date)", "MUST"],
            ["FR-STAFF-011", "🆕 Bulk import staff from XLSX template", "SHOULD"],
            ["FR-STAFF-012", "🆕 Auto-archive resigned staff หลัง 90 วัน", "SHOULD"],
            ["FR-STAFF-013", "Print PDF (form SAMS-FM-CM-036)", "MUST"],
            ["FR-STAFF-014", "Logbook tab (SAMS-FM-CM-041)", "MUST"],
            ["FR-STAFF-015", "Print Logbook PDF", "MUST"],
            ["FR-STAFF-016", "CS Experience Summary (SAMS-FM-CM-062)", "SHOULD"],
        ]
    ),
    H.h2("3.3 Data Validation Rules"),
    H.makeTable(
        ["Field", "Rule"],
        [
            ["Employee Code", "Unique, alphanumeric+dash, 3-20 chars"],
            ["Name", "Required, 2-100 chars"],
            ["Email", "Valid email, unique"],
            ["Phone", "Format ตาม country code"],
            ["Hire Date", "≤ today"],
            ["License Expiry", "ต้อง > License Issue Date"],
        ]
    ),
    H.newDesign("FR-STAFF-011, 012 = ฟีเจอร์ใหม่ที่ยังไม่มีในโค้ด"),

    H.pageBreak(),

    H.h1("4. FR-AUTH: Authorization Management"),
    H.h2("4.1 Use Cases"),
    H.diagramPlaceholder("Authorization Approval Sequence", "sequenceDiagram — Manager creates Draft → Submit → Director approves → Notify"),

    H.h2("4.2 Functional Requirements"),
    H.h3("4.2.1 Authorization List & View"),
    H.makeTable(
        ["ID", "Description", "Priority"],
        [
            ["FR-AUTH-001", "List staff with auth summary (CS only)", "MUST"],
            ["FR-AUTH-002", "Filter ตาม customer airline (18 airlines)", "MUST"],
            ["FR-AUTH-003", "Search by staff name, authNumber", "MUST"],
            ["FR-AUTH-004", "Show CRS eligibility badge", "MUST"],
            ["FR-AUTH-005", "Color-coded status: active/expiring/expired/suspended", "MUST"],
            ["FR-AUTH-006", "Drawer: ดู authorization detail per customer", "MUST"],
        ]
    ),
    H.h3("4.2.2 Authorization Lifecycle"),
    H.makeTable(
        ["ID", "Description", "Priority"],
        [
            ["FR-AUTH-010", "🆕 Create authorization in Draft status", "MUST"],
            ["FR-AUTH-011", "🆕 Submit authorization for approval", "MUST"],
            ["FR-AUTH-012", "🆕 Approve/Reject with reason", "MUST"],
            ["FR-AUTH-013", "Manually mark as Active", "MUST"],
            ["FR-AUTH-014", "Suspend (with reason)", "MUST"],
            ["FR-AUTH-015", "Revoke (with reason)", "MUST"],
            ["FR-AUTH-016", "Renew (extend expiry)", "MUST"],
            ["FR-AUTH-017", "History timeline", "MUST"],
            ["FR-AUTH-018", "Customer auth ห้ามเกิน SAMS auth expiry", "MUST"],
            ["FR-AUTH-019", "ห้ามออก Customer auth ถ้า SAMS ไม่ active", "MUST"],
        ]
    ),
    H.h3("4.2.3 Authority Authorization (13 regulators)"),
    H.makeTable(
        ["ID", "Description", "Priority"],
        [
            ["FR-AUTH-020", "Track CAAT, EASA, FAA, CAAM, CAAP, etc.", "MUST"],
            ["FR-AUTH-021", "Link authority auth กับ customer auth", "SHOULD"],
        ]
    ),
    H.h3("4.2.4 CRS Eligibility"),
    H.makeTable(
        ["ID", "Description", "Priority"],
        [
            ["FR-AUTH-030", "คำนวณ CRS eligibility อัตโนมัติ", "MUST"],
            ["FR-AUTH-031", "แสดงเหตุผล Eligible/Not Eligible", "MUST"],
            ["FR-AUTH-032", "List CS ที่ eligible สำหรับ customer X", "MUST"],
        ]
    ),
    H.h3("4.2.5 Export"),
    H.makeTable(
        ["ID", "Description", "Priority"],
        [
            ["FR-AUTH-040", "Export multi-sheet XLSX (1 sheet/airline)", "MUST"],
            ["FR-AUTH-041", "Export PDF: Single staff auth summary", "MUST"],
            ["FR-AUTH-042", "🆕 Schedule auto-export รายเดือน", "COULD"],
        ]
    ),

    H.h2("4.3 Business Rules"),
    H.diagramPlaceholder("Authorization Issue Decision Tree", "flowchart TD — Check SAMS Active / Expiry / Mandatory Training"),

    H.pageBreak(),

    H.h1("5. FR-MON: Compliance Monitoring"),
    H.makeTable(
        ["ID", "Description", "Priority"],
        [
            ["FR-MON-001", "List staff พร้อม training compliance status", "MUST"],
            ["FR-MON-002", "Filter expiring training (≤30/60/90)", "MUST"],
            ["FR-MON-003", "Training matrix per staff (8 mandatory + 6 type)", "MUST"],
            ["FR-MON-004", "Highlight missing/expired", "MUST"],
            ["FR-MON-005", "Calendar view (FullCalendar)", "MUST"],
            ["FR-MON-006", "Send manual alert", "SHOULD"],
            ["FR-MON-007", "🆕 Daily scan + auto-email", "MUST"],
            ["FR-MON-008", "🆕 Configurable alert thresholds", "SHOULD"],
            ["FR-MON-009", "Export compliance report XLSX", "MUST"],
            ["FR-MON-010", "Export compliance certificate PDF", "SHOULD"],
        ]
    ),
    H.h2("5.2 Alert Logic"),
    H.diagramPlaceholder("Daily Alert Logic Flow", "flowchart LR — Daily Job → Scan → Threshold check → Red/Orange/Yellow → Notify"),

    H.pageBreak(),

    H.h1("6. FR-COURSE: Course Management"),
    H.makeTable(
        ["ID", "Description", "Priority"],
        [
            ["FR-COURSE-001", "List courses (33+) with search/filter", "MUST"],
            ["FR-COURSE-002", "Categorize: Mandatory / Aircraft Type / Specialized", "MUST"],
            ["FR-COURSE-003", "Course detail: code, name, validity, prerequisites", "MUST"],
            ["FR-COURSE-004", "Add new course", "MUST"],
            ["FR-COURSE-005", "Edit course (with effective date)", "MUST"],
            ["FR-COURSE-006", "Deactivate course (soft delete)", "MUST"],
            ["FR-COURSE-007", "Training Needs Matrix (SAMS-FM-CM-014)", "MUST"],
            ["FR-COURSE-008", "Bulk-update matrix (CSV import)", "SHOULD"],
            ["FR-COURSE-009", "Print Matrix PDF", "MUST"],
            ["FR-COURSE-010", "Track course version history", "SHOULD"],
        ]
    ),

    H.pageBreak(),

    H.h1("7. FR-SCHED: Training Scheduler"),
    H.makeTable(
        ["ID", "Description", "Priority"],
        [
            ["FR-SCHED-001", "Calendar view: monthly/weekly", "MUST"],
            ["FR-SCHED-002", "List view: filter by status/course/trainer", "MUST"],
            ["FR-SCHED-003", "Gantt view", "SHOULD"],
            ["FR-SCHED-004", "Create training session", "MUST"],
            ["FR-SCHED-005", "Enroll staff (single/bulk)", "MUST"],
            ["FR-SCHED-006", "Mark attendance", "MUST"],
            ["FR-SCHED-007", "Submit results (Pass/Fail/Score)", "MUST"],
            ["FR-SCHED-008", "🆕 QA Manager approve results", "MUST"],
            ["FR-SCHED-009", "Auto-update training record after approve", "MUST"],
            ["FR-SCHED-010", "Print Attendance Sheet PDF", "MUST"],
            ["FR-SCHED-011", "Cancel session + notify", "MUST"],
            ["FR-SCHED-012", "Reschedule session", "MUST"],
            ["FR-SCHED-013", "Trainer dashboard", "SHOULD"],
            ["FR-SCHED-014", "Self-enrollment portal (CS/AME)", "COULD"],
        ]
    ),

    H.pageBreak(),

    H.h1("8. Cross-cutting Functional Requirements"),
    H.h2("8.1 FR-AUDIT: Audit Log"),
    H.newDesign("Audit Log table เป็น NEW DESIGN — codebase ปัจจุบันยังไม่มี"),
    H.makeTable(
        ["ID", "Description", "Priority"],
        [
            ["FR-AUDIT-001", "บันทึกทุก critical action", "MUST"],
            ["FR-AUDIT-002", "บันทึก timestamp/userId/action/resource/before-after", "MUST"],
            ["FR-AUDIT-003", "Append-only (immutable)", "MUST"],
            ["FR-AUDIT-004", "Search/filter by user/date/resource", "MUST"],
            ["FR-AUDIT-005", "Export XLSX สำหรับ Authority", "MUST"],
            ["FR-AUDIT-006", "Retain ≥ 5 ปี", "MUST"],
        ]
    ),

    H.h2("8.2 FR-NOTIF: Notification System"),
    H.newDesign("Notification module เป็น NEW DESIGN"),
    H.makeTable(
        ["ID", "Description", "Priority"],
        [
            ["FR-NOTIF-001", "In-app notification (bell icon)", "MUST"],
            ["FR-NOTIF-002", "Email notification (SMTP)", "MUST"],
            ["FR-NOTIF-003", "User preferences", "SHOULD"],
            ["FR-NOTIF-004", "Email templates: Auth Approved/Rejected/Expiring/Expired", "MUST"],
            ["FR-NOTIF-005", "Email templates: Training Enrolled/Cancelled/Result", "MUST"],
            ["FR-NOTIF-006", "Email retry queue (3 retries)", "MUST"],
            ["FR-NOTIF-007", "Notification log", "SHOULD"],
        ]
    ),

    H.h2("8.3 FR-IMP: Bulk Import"),
    H.newDesign("Bulk Import เป็น NEW DESIGN"),
    H.makeTable(
        ["ID", "Description", "Priority"],
        [
            ["FR-IMP-001", "Import Staff (XLSX template)", "MUST"],
            ["FR-IMP-002", "Import Authorization (XLSX)", "MUST"],
            ["FR-IMP-003", "Import Training Records (XLSX)", "MUST"],
            ["FR-IMP-004", "Validation report ก่อน commit", "MUST"],
            ["FR-IMP-005", "Dry-run mode", "MUST"],
            ["FR-IMP-006", "Rollback on error", "MUST"],
            ["FR-IMP-007", "Download XLSX template", "MUST"],
        ]
    ),

    H.h2("8.4 FR-EXP: Export & Report"),
    H.makeTable(
        ["ID", "Description", "Priority"],
        [
            ["FR-EXP-001", "Multi-sheet XLSX (customer auth)", "MUST"],
            ["FR-EXP-002", "PDF (form templates)", "MUST"],
            ["FR-EXP-003", "Export filtered/searched only", "MUST"],
            ["FR-EXP-004", "🆕 Schedule auto-export", "COULD"],
        ]
    ),

    H.h2("8.5 FR-LOGIN: Authentication & Session"),
    H.makeTable(
        ["ID", "Description", "Priority"],
        [
            ["FR-LOGIN-001", "Login with username + password", "MUST"],
            ["FR-LOGIN-002", "JWT (30 min) + refresh token", "MUST"],
            ["FR-LOGIN-003", "Remember me (refresh 7 วัน)", "SHOULD"],
            ["FR-LOGIN-004", "Forgot password (email reset)", "MUST"],
            ["FR-LOGIN-005", "Lock account after 5 failed", "MUST"],
            ["FR-LOGIN-006", "Auto-logout 30 min idle", "MUST"],
            ["FR-LOGIN-007", "Multi-device login (allowed)", "SHOULD"],
        ]
    ),

    H.pageBreak(),

    H.h1("9. Use Case Diagram (Top Level)"),
    H.diagramPlaceholder("Top-Level Use Case Diagram", "graph TB — 5 actors × 11 use cases (with SoD relationships)"),

    H.pageBreak(),

    H.h1("10. Traceability Matrix"),
    H.makeTable(
        ["FR ID", "Source Document", "Section"],
        [
            ["FR-DASH-001 to 010", "Codebase + Workshop", "qa/dashboard/*"],
            ["FR-STAFF-001 to 016", "SAMS-FM-CM-036/041/062 + Codebase", "qa/staff/*"],
            ["FR-AUTH-001 to 042", "List of Customer Authorization + Codebase", "qa/authorization/*"],
            ["FR-MON-001 to 010", "Flowchart: Compliance Monitoring", "qa/monitoring/*"],
            ["FR-COURSE-001 to 010", "SAMS-FM-CM-014 + Codebase", "qa/course-management/*"],
            ["FR-SCHED-001 to 014", "Codebase + Workshop", "qa/training-scheduler/*"],
            ["FR-AUDIT-*", "🆕 NEW DESIGN", "—"],
            ["FR-NOTIF-*", "🆕 NEW DESIGN", "—"],
            ["FR-IMP-*", "🆕 NEW DESIGN", "—"],
        ]
    ),

    H.spacer(),
    H.p("— จบเอกสาร SAMS-QA-SRS-04 —", { italics: true, color: "999999" }),
];

const doc = H.buildDoc({ docNo: "SAMS-QA-SRS-04", sections });
H.saveDoc(doc, __dirname + "/../04-Functional-Requirements/SAMS-QA-SRS-04-Functional-Requirements.docx");
