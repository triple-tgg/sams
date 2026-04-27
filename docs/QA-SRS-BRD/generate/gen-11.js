// SAMS-QA-SRS-11 — Testing & Acceptance Criteria
const H = require("./_helpers");

const sections = [
    ...H.coverPage({
        docNo: "SAMS-QA-SRS-11",
        docTitle: "Testing & Acceptance Criteria",
        subtitleText: "แผนการทดสอบและเกณฑ์การยอมรับ — โมดูล QA",
    }),

    H.h1("1. Testing Strategy"),
    H.h2("1.1 Test Pyramid"),
    H.diagramPlaceholder("Test Pyramid", "graph TD — Unit (70%) → Integration (20%) → E2E (10%)"),

    H.h2("1.2 Test Levels"),
    H.makeTable(
        ["Level", "Coverage", "Tools"],
        [
            ["Unit Test", "≥ 70%", "Vitest + React Testing Library"],
            ["Integration", "API + Component flows", "Vitest + MSW"],
            ["E2E", "Critical user journeys", "Playwright"],
            ["UAT", "All MUST features", "Manual + Test scripts"],
            ["Performance", "NFR targets", "k6 / Lighthouse"],
            ["Security", "OWASP Top 10", "OWASP ZAP / Snyk"],
            ["Accessibility", "WCAG 2.1 AA", "axe DevTools / Manual"],
        ]
    ),

    H.h2("1.3 Test Environments"),
    H.diagramPlaceholder("Test Environments Flow", "graph LR — Dev → CI → UAT → Staging → Production"),

    H.pageBreak(),

    H.h1("2. Test Coverage Requirements"),
    H.h2("2.1 Code Coverage Target"),
    H.makeTable(
        ["Type", "Target", "Mandatory"],
        [
            ["Statement", "≥ 70%", "✅"],
            ["Branch", "≥ 65%", "✅"],
            ["Function", "≥ 75%", "✅"],
            ["Line", "≥ 70%", "✅"],
        ]
    ),

    H.h2("2.2 Critical Code (≥90% Coverage)"),
    H.diagramPlaceholder("Critical Modules Map", "graph LR — Auth/CRS/State Machine/Permission/Audit/Email Worker"),

    H.pageBreak(),

    H.h1("3. Test Cases by Module"),
    H.h2("3.1 Test Case ID Format"),
    H.p("รูปแบบ: TC-<MODULE>-<NUM>  เช่น TC-AUTH-001"),
    H.h2("3.2 Test Case Template"),
    H.makeTable(
        ["Field", "คำอธิบาย"],
        [
            ["ID", "Unique"],
            ["Title", "ชื่อ test case"],
            ["Linked FR", "FR-XXX-NNN"],
            ["Pre-condition", "สถานะเริ่มต้น"],
            ["Steps", "ขั้นตอนทดสอบ"],
            ["Expected", "ผลที่คาดหวัง"],
            ["Priority", "P0 (Critical) / P1 (High) / P2 (Medium) / P3 (Low)"],
        ]
    ),

    H.pageBreak(),

    H.h1("4. TC-LOGIN: Login Test Cases"),
    H.makeTable(
        ["ID", "Title", "Steps", "Expected", "Pri"],
        [
            ["TC-LOGIN-001", "Valid login", "Enter valid → Submit", "Redirect to Dashboard, JWT in localStorage", "P0"],
            ["TC-LOGIN-002", "Wrong password", "Wrong password 1 time", "Show error", "P0"],
            ["TC-LOGIN-003", "Lock after 5 fails", "Wrong 5 times", "Account locked 30 min", "P0"],
            ["TC-LOGIN-004", "Refresh token", "Wait 31 min → API call", "Auto-refresh, success", "P1"],
            ["TC-LOGIN-005", "Forgot password", "Email reset flow", "Email link sent", "P1"],
            ["TC-LOGIN-006", "Disabled user", "Login disabled user", "Account disabled message", "P0"],
            ["TC-LOGIN-007", "Rate limit", "6 attempts < 5 min", "429 Too Many Requests", "P1"],
        ]
    ),

    H.pageBreak(),

    H.h1("5. TC-STAFF: Staff Management Test Cases"),
    H.makeTable(
        ["ID", "Title", "Linked FR", "Expected", "Pri"],
        [
            ["TC-STAFF-001", "List staff with search", "FR-STAFF-001", "List shows John*", "P0"],
            ["TC-STAFF-002", "Filter by department", "FR-STAFF-002", "List shows LM only", "P1"],
            ["TC-STAFF-003", "View staff detail", "FR-STAFF-003", "All 5 tabs accessible", "P0"],
            ["TC-STAFF-004", "Create new staff", "FR-STAFF-004", "New staff in list, audit logged", "P0"],
            ["TC-STAFF-005", "Edit personal info", "FR-STAFF-005", "Name updated, audit", "P0"],
            ["TC-STAFF-006", "Add education", "FR-STAFF-006", "New edu record displayed", "P1"],
            ["TC-STAFF-007", "Resign staff", "FR-STAFF-010", "Status=resigned, all auths suspended", "P0"],
            ["TC-STAFF-008", "Bulk import valid", "FR-STAFF-011", "All imported, success report", "P1"],
            ["TC-STAFF-009", "Bulk import invalid", "FR-STAFF-011", "Validation report, no commit", "P0"],
            ["TC-STAFF-010", "Print PDF", "FR-STAFF-013", "PDF (SAMS-FM-CM-036)", "P1"],
            ["TC-STAFF-011", "Auto-archive 90d", "FR-STAFF-012", "Status=archived", "P2"],
        ]
    ),

    H.pageBreak(),

    H.h1("6. TC-AUTH: Authorization Test Cases"),
    H.makeTable(
        ["ID", "Title", "Expected", "Pri"],
        [
            ["TC-AUTH-001", "List authorizations", "Staff list with auth matrix", "P0"],
            ["TC-AUTH-002", "Filter by customer", "Show only TG-related", "P0"],
            ["TC-AUTH-003", "CRS Eligible — both active", "Badge: ✅ Eligible", "P0"],
            ["TC-AUTH-004", "CRS Not Eligible — SAMS expired", "❌ Not Eligible + Reason", "P0"],
            ["TC-AUTH-005", "Create auth as Draft", "Status=Draft", "P0"],
            ["TC-AUTH-006", "Submit for approval", "Status=Submitted, Director notified", "P0"],
            ["TC-AUTH-007", "Approve", "Status=Active, CS emailed", "P0"],
            ["TC-AUTH-008", "Reject with reason", "Status=Draft, creator notified", "P0"],
            ["TC-AUTH-009", "Validate Customer expiry > SAMS", "Validation error", "P0"],
            ["TC-AUTH-010", "Reject Customer w/o SAMS", "Block + error", "P0"],
            ["TC-AUTH-011", "Suspend auth", "Status=Suspended, audit log", "P0"],
            ["TC-AUTH-012", "Renew auth", "New expiry, Active", "P0"],
            ["TC-AUTH-013", "History timeline", "All state changes shown", "P1"],
            ["TC-AUTH-014", "Export multi-sheet XLSX", "XLSX with 18 sheets", "P0"],
            ["TC-AUTH-015", "Print Auth PDF", "Single PDF cert", "P1"],
            ["TC-AUTH-016", "SoD: can't approve own", "Block + warning", "P0"],
        ]
    ),

    H.pageBreak(),

    H.h1("7. TC-MON: Monitoring Test Cases"),
    H.makeTable(
        ["ID", "Title", "Linked FR", "Expected", "Pri"],
        [
            ["TC-MON-001", "Compliance overview", "FR-MON-001", "Show compliance %", "P0"],
            ["TC-MON-002", "Filter expiring ≤30d", "FR-MON-002", "Only ≤30d shown", "P0"],
            ["TC-MON-003", "Training matrix per staff", "FR-MON-003", "8 mandatory + 6 type", "P0"],
            ["TC-MON-004", "Calendar view", "FR-MON-005", "Show training events", "P1"],
            ["TC-MON-005", "Daily expiry job", "FR-MON-007", "Email queue populated", "P0"],
            ["TC-MON-006", "Export compliance", "FR-MON-009", "XLSX with all staff", "P0"],
        ]
    ),

    H.h1("8. TC-COURSE: Course Management"),
    H.makeTable(
        ["ID", "Title", "Expected", "Pri"],
        [
            ["TC-COURSE-001", "List courses", "33+ courses shown", "P0"],
            ["TC-COURSE-002", "Add course", "New course in list", "P0"],
            ["TC-COURSE-003", "Edit validity", "Updated + recalc compliance", "P1"],
            ["TC-COURSE-004", "View Training Matrix", "Show role × course matrix", "P0"],
            ["TC-COURSE-005", "Update Matrix cell", "Auto-update compliance", "P0"],
            ["TC-COURSE-006", "Print Matrix PDF", "PDF (SAMS-FM-CM-014)", "P1"],
        ]
    ),

    H.h1("9. TC-SCHED: Scheduler"),
    H.makeTable(
        ["ID", "Title", "Expected", "Pri"],
        [
            ["TC-SCHED-001", "Create session", "Session in calendar", "P0"],
            ["TC-SCHED-002", "Enroll staff bulk", "All enrolled + emails", "P0"],
            ["TC-SCHED-003", "Mark attendance", "Saved", "P0"],
            ["TC-SCHED-004", "Submit results", "Pending approval", "P0"],
            ["TC-SCHED-005", "Approve results", "Records saved + emails", "P0"],
            ["TC-SCHED-006", "Cancel session", "Cancelled, all enrolled notified", "P0"],
            ["TC-SCHED-007", "Reschedule", "Notification to enrolled", "P1"],
            ["TC-SCHED-008", "Print Attendance", "PDF generated", "P1"],
        ]
    ),

    H.h1("10. TC-DASH: Dashboard"),
    H.makeTable(
        ["ID", "Title", "Expected", "Pri"],
        [
            ["TC-DASH-001", "KPI widgets load", "4 KPI widgets shown", "P0"],
            ["TC-DASH-002", "Drill-down expiring", "Navigate to filtered list", "P1"],
            ["TC-DASH-003", "Trend chart", "12-month line chart", "P1"],
            ["TC-DASH-004", "Auto-refresh", "Data refreshed after 5 min", "P2"],
            ["TC-DASH-005", "Role-based view (CS)", "Show only own data", "P0"],
        ]
    ),

    H.pageBreak(),

    H.h1("11. TC-NFR: Non-Functional Test Cases"),
    H.makeTable(
        ["ID", "Type", "Title", "Target"],
        [
            ["TC-NFR-PERF-001", "Performance", "Page load ≤ 3s", "P95"],
            ["TC-NFR-PERF-002", "Performance", "API P95 ≤ 1s", "P95"],
            ["TC-NFR-PERF-003", "Performance", "Search 5,000 staff ≤ 2s", "Manual"],
            ["TC-NFR-PERF-004", "Performance", "Concurrent 200 users", "Load test"],
            ["TC-NFR-PERF-005", "Performance", "Export XLSX 10,000 ≤ 30s", "Manual"],
            ["TC-NFR-SEC-001", "Security", "SQL Injection", "Block"],
            ["TC-NFR-SEC-002", "Security", "XSS", "Sanitize"],
            ["TC-NFR-SEC-003", "Security", "CSRF", "Token check"],
            ["TC-NFR-SEC-004", "Security", "Lock after 5 fails", "✅"],
            ["TC-NFR-SEC-005", "Security", "JWT expired → 401", "✅"],
            ["TC-NFR-A11Y-001", "A11y", "Keyboard navigation", "Pass"],
            ["TC-NFR-A11Y-002", "A11y", "Color contrast 4.5:1", "Pass"],
            ["TC-NFR-A11Y-003", "A11y", "Screen reader", "Pass"],
            ["TC-NFR-COMPAT-001", "Compatibility", "Chrome 110+", "Pass"],
            ["TC-NFR-COMPAT-002", "Compatibility", "Edge 110+", "Pass"],
            ["TC-NFR-COMPAT-003", "Compatibility", "Firefox 110+", "Pass"],
            ["TC-NFR-COMPAT-004", "Compatibility", "Safari 16+", "Pass"],
            ["TC-NFR-I18N-001", "i18n", "Switch th/en/ar", "All UI translated"],
            ["TC-NFR-I18N-002", "i18n", "RTL layout (ar)", "Layout mirrored"],
        ]
    ),

    H.pageBreak(),

    H.h1("12. UAT Plan"),
    H.h2("12.1 UAT Scope"),
    H.diagramPlaceholder("UAT Scope Map", "graph LR — Critical Workflows / Reports / Compliance / Integration"),

    H.h2("12.2 UAT Schedule"),
    H.makeTable(
        ["Week", "Activities"],
        [
            ["W1", "Smoke test + Critical workflows"],
            ["W2", "Each module: detailed UAT"],
            ["W2 (parallel)", "Performance + Security testing"],
            ["W3 (buffer)", "Bug fix + Re-test"],
        ]
    ),

    H.h2("12.3 UAT Test Scripts"),
    H.makeTable(
        ["Role", "Script Count", "Time/script"],
        [
            ["QA Manager", "12 scripts", "~30 min"],
            ["Trainer", "8 scripts", "~30 min"],
            ["CM Officer", "6 scripts", "~30 min"],
            ["Inspector", "4 scripts", "~20 min"],
            ["CS (Self-service)", "3 scripts", "~15 min"],
            ["Admin", "5 scripts", "~30 min"],
        ]
    ),

    H.h2("12.4 UAT Sign-off Criteria"),
    H.makeTable(
        ["Criterion", "Threshold"],
        [
            ["P0 test pass rate", "100%"],
            ["P1 test pass rate", "≥ 95%"],
            ["P2 test pass rate", "≥ 90%"],
            ["P3 test pass rate", "≥ 80%"],
            ["Critical bugs open", "0"],
            ["Major bugs open", "≤ 3 (with workaround)"],
            ["User satisfaction", "≥ 4.0 / 5.0"],
        ]
    ),

    H.pageBreak(),

    H.h1("13. Acceptance Criteria (Module-level)"),
    H.makeTable(
        ["Module", "Acceptance Criteria"],
        [
            ["Login/Auth", "Login/Logout/Refresh/Reset password ทุก scenario pass"],
            ["Staff", "CRUD + Bulk Import + Print PDF ใช้งานได้"],
            ["Authorization", "Lifecycle (Draft → Active) + CRS calc + Multi-export"],
            ["Monitoring", "Compliance % accurate + Auto-alert"],
            ["Course Mgmt", "Catalog + Matrix + Print ใช้งานได้"],
            ["Scheduler", "Create/Enroll/Attendance/Result + Print"],
            ["Dashboard", "All KPIs accurate + Drill-down"],
            ["Notification", "Email delivery + In-app shown"],
            ["Audit Log", "All critical actions logged + Export"],
            ["RBAC", "Role-based menu/action restriction"],
        ]
    ),

    H.h1("14. Bug Severity & SLA"),
    H.makeTable(
        ["Severity", "คำอธิบาย", "Fix SLA", "Block Go-Live?"],
        [
            ["Critical (S1)", "ระบบ down / Data loss / Security", "< 4 ชม.", "✅ Yes"],
            ["Major (S2)", "Critical workflow broken", "< 1 day", "✅ Yes"],
            ["Medium (S3)", "Non-critical / Workaround มี", "< 1 week", "⚠️ Depends"],
            ["Minor (S4)", "UI/cosmetic / Typo", "< 2 weeks", "❌ No"],
        ]
    ),

    H.h1("15. Test Reporting"),
    H.h2("15.1 Daily UAT Report"),
    H.bullet("Date / Module / Tests Run / Pass / Fail / Blocked"),
    H.bullet("Bugs found by severity (S1/S2/S3/S4)"),

    H.h2("15.2 Final Test Report (Pre Go-Live)"),
    H.makeTable(
        ["Section", "รายละเอียด"],
        [
            ["Test Coverage Summary", "Unit/Integration/E2E %"],
            ["Test Pass/Fail Stats", "per module"],
            ["Open Bugs", "by severity"],
            ["Performance Test Results", "NFR targets vs actual"],
            ["Security Audit Result", "OWASP findings"],
            ["UAT Sign-off", "per stakeholder"],
            ["Go/No-Go Recommendation", "✅ / ⚠️ / ❌"],
        ]
    ),

    H.spacer(),
    H.p("— จบเอกสาร SAMS-QA-SRS-11 —", { italics: true, color: "999999" }),
];

const doc = H.buildDoc({ docNo: "SAMS-QA-SRS-11", sections });
H.saveDoc(doc, __dirname + "/../11-Testing-Acceptance/SAMS-QA-SRS-11-Testing-Acceptance.docx");
