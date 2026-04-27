// SAMS-QA-SRS-09 — Integration & Interface
const H = require("./_helpers");

const sections = [
    ...H.coverPage({
        docNo: "SAMS-QA-SRS-09",
        docTitle: "Integration & Interface",
        subtitleText: "การเชื่อมต่อกับระบบอื่น + REST API Spec — โมดูล QA",
    }),

    H.h1("1. Integration Overview"),
    H.h2("1.1 Integration Map"),
    H.diagramPlaceholder("Integration Map", "graph TB — QA (FE/BE/Worker) ↔ Internal (Auth/Master/File) + External (SMTP/HR/CAAT/Customer APIs)"),
    H.h2("1.2 Integration Inventory"),
    H.makeTable(
        ["ID", "Integration", "ประเภท", "Phase"],
        [
            ["INT-01", "Auth Service (JWT)", "Internal", "1"],
            ["INT-02", "Master Data API", "Internal", "1"],
            ["INT-03", "File Storage API", "Internal", "1"],
            ["INT-04", "SMTP Email Service", "External", "1"],
            ["INT-05", "HR System (Employee Sync)", "External", "1"],
            ["INT-06", "CAAT Portal", "External", "2"],
            ["INT-07", "Customer Airline APIs (Webhook)", "External", "3"],
        ]
    ),

    H.pageBreak(),

    H.h1("2. Backend REST API Specification"),
    H.newDesign("API endpoints ทั้งหมดของ QA module ปัจจุบันยังเป็น mock data — ส่วนนี้คือ spec ที่ Backend ต้อง implement"),

    H.h2("2.1 API Conventions"),
    H.makeTable(
        ["รายการ", "Convention"],
        [
            ["Base URL", "https://api.sams.aero/api/v1"],
            ["Auth", "Authorization: Bearer <JWT>"],
            ["Content-Type", "application/json"],
            ["Charset", "UTF-8"],
            ["Date Format", "ISO 8601"],
            ["Locale", "Accept-Language: th-TH | en-US | ar-SA"],
        ]
    ),

    H.h2("2.2 Standard Response Format"),
    H.bullet("Success: { data: {...}, meta: { page, size, total } }"),
    H.bullet("Error: { error: { code, message, details: [{ field, message }] } }"),

    H.h2("2.3 HTTP Status Codes"),
    H.makeTable(
        ["Code", "ใช้เมื่อ"],
        [
            ["200 OK", "Success (GET)"],
            ["201 Created", "Created (POST)"],
            ["204 No Content", "Deleted"],
            ["400 Bad Request", "Validation error"],
            ["401 Unauthorized", "JWT invalid/expired"],
            ["403 Forbidden", "Insufficient permission"],
            ["404 Not Found", "Resource not exists"],
            ["409 Conflict", "Duplicate / state conflict"],
            ["422 Unprocessable Entity", "Business rule violation"],
            ["500 Internal Server Error", "Server error"],
        ]
    ),

    H.h2("2.4 Auth Endpoints"),
    H.makeTable(
        ["Method", "Path", "Description"],
        [
            ["POST", "/auth/login", "Login → JWT + Refresh"],
            ["POST", "/auth/refresh", "Refresh JWT"],
            ["POST", "/auth/logout", "Logout"],
            ["POST", "/auth/forgot-password", "ส่ง email reset link"],
            ["POST", "/auth/reset-password", "Reset password ด้วย token"],
        ]
    ),

    H.h2("2.5 Staff Endpoints"),
    H.makeTable(
        ["Method", "Path", "Description"],
        [
            ["GET", "/staff", "List (paginate, filter)"],
            ["GET", "/staff/{id}", "Get detail"],
            ["POST", "/staff", "Create new"],
            ["PATCH", "/staff/{id}", "Update"],
            ["POST", "/staff/{id}/resign", "Mark as resigned"],
            ["GET/POST/PATCH/DELETE", "/staff/{id}/education", "Manage education"],
            ["GET/POST/...", "/staff/{id}/experience", "Manage experience"],
            ["POST", "/staff/import", "Bulk import (XLSX)"],
            ["GET", "/staff/import/template", "Download template"],
            ["GET", "/staff/{id}/profile.pdf", "Generate PDF"],
        ]
    ),

    H.h2("2.6 Authorization Endpoints"),
    H.makeTable(
        ["Method", "Path", "Description"],
        [
            ["GET", "/authorizations", "List with filter"],
            ["GET", "/authorizations/{id}", "Get detail"],
            ["POST", "/authorizations", "Create draft"],
            ["PATCH", "/authorizations/{id}", "Update draft"],
            ["POST", "/authorizations/{id}/submit", "Submit for approval"],
            ["POST", "/authorizations/{id}/approve", "Approve"],
            ["POST", "/authorizations/{id}/reject", "Reject"],
            ["POST", "/authorizations/{id}/suspend", "Suspend"],
            ["POST", "/authorizations/{id}/revoke", "Revoke"],
            ["POST", "/authorizations/{id}/renew", "Renew"],
            ["GET", "/authorizations/{id}/history", "History timeline"],
            ["GET", "/staff/{id}/crs-eligibility", "Calculate CRS eligibility"],
            ["GET", "/authorizations/expiring", "List expiring soon"],
            ["GET", "/authorizations/export.xlsx", "Multi-sheet export"],
            ["GET", "/authorizations/{id}/certificate.pdf", "Generate cert PDF"],
        ]
    ),

    H.h2("2.7 Course Management Endpoints"),
    H.makeTable(
        ["Method", "Path", "Description"],
        [
            ["GET", "/courses", "List courses"],
            ["GET", "/courses/{id}", "Get course"],
            ["POST", "/courses", "Create course"],
            ["PATCH", "/courses/{id}", "Update"],
            ["POST", "/courses/{id}/deactivate", "Soft delete"],
            ["GET", "/courses/matrix", "Get Training Needs Matrix"],
            ["PUT", "/courses/matrix", "Update matrix"],
            ["GET", "/courses/matrix.pdf", "Print matrix PDF"],
        ]
    ),

    H.h2("2.8 Training Scheduler Endpoints"),
    H.makeTable(
        ["Method", "Path", "Description"],
        [
            ["GET", "/training-sessions", "List (filter date/status)"],
            ["GET", "/training-sessions/{id}", "Get detail"],
            ["POST", "/training-sessions", "Create session"],
            ["PATCH", "/training-sessions/{id}", "Update"],
            ["POST", "/training-sessions/{id}/cancel", "Cancel"],
            ["POST", "/training-sessions/{id}/enroll", "Enroll (single/bulk)"],
            ["DELETE", "/training-sessions/{id}/enroll/{staffId}", "Withdraw"],
            ["POST", "/training-sessions/{id}/attendance", "Mark attendance"],
            ["POST", "/training-sessions/{id}/results", "Submit results"],
            ["POST", "/training-results/{id}/approve", "Approve result"],
            ["GET", "/training-sessions/{id}/attendance.pdf", "Print PDF"],
        ]
    ),

    H.h2("2.9 Monitoring Endpoints"),
    H.makeTable(
        ["Method", "Path", "Description"],
        [
            ["GET", "/monitoring/compliance", "Get overall compliance"],
            ["GET", "/monitoring/staff/{id}/training-matrix", "Per-staff training status"],
            ["GET", "/monitoring/expiring", "Aggregate expiring counters"],
            ["GET", "/monitoring/calendar", "Calendar events"],
            ["GET", "/monitoring/report.xlsx", "Compliance XLSX"],
        ]
    ),

    H.h2("2.10 Dashboard Endpoints"),
    H.makeTable(
        ["Method", "Path", "Description"],
        [
            ["GET", "/dashboard/qa-summary", "Aggregated KPIs"],
            ["GET", "/dashboard/recent-activity", "Recent audit log"],
            ["GET", "/dashboard/upcoming", "Next 7 days events"],
            ["GET", "/dashboard/trend", "12-month compliance trend"],
        ]
    ),

    H.h2("2.11 Notification Endpoints"),
    H.makeTable(
        ["Method", "Path", "Description"],
        [
            ["GET", "/notifications", "My notifications"],
            ["PATCH", "/notifications/{id}/read", "Mark as read"],
            ["PATCH", "/notifications/read-all", "Mark all read"],
        ]
    ),

    H.h2("2.12 Audit Log Endpoints (Admin only)"),
    H.makeTable(
        ["Method", "Path", "Description"],
        [
            ["GET", "/audit-logs", "Search audit logs"],
            ["GET", "/audit-logs/export.xlsx", "Export for authority"],
        ]
    ),

    H.pageBreak(),

    H.h1("3. Internal Integration"),
    H.h2("3.1 INT-01: Auth Service"),
    H.diagramPlaceholder("Auth Service Sequence", "sequenceDiagram — FE → QA API → Auth Service (verify JWT) → Check RBAC → Response"),
    H.makeTable(
        ["Spec", "รายละเอียด"],
        [
            ["Protocol", "REST/HTTPS"],
            ["Auth", "JWT (validated at QA API)"],
            ["Token expiry", "30 min"],
            ["Refresh", "via /auth/refresh"],
        ]
    ),

    H.h2("3.2 INT-02: Master Data API"),
    H.makeTable(
        ["Endpoint", "Purpose"],
        [
            ["GET /master/customer-airlines", "List 18 airlines"],
            ["GET /master/authorities", "List 13 regulators"],
            ["GET /master/departments", "List departments"],
            ["GET /master/aircraft-types", "List aircraft types"],
        ]
    ),

    H.h2("3.3 INT-03: File Storage API"),
    H.diagramPlaceholder("File Upload Sequence", "sequenceDiagram — FE → QA API request signed URL → File Storage signed PUT → FE direct upload → Update profile"),
    H.makeTable(
        ["Spec", "รายละเอียด"],
        [
            ["Storage", "S3-compatible object storage"],
            ["Bucket", "flight-storage.sams.aero"],
            ["Max file size", "10 MB (image), 50 MB (document)"],
            ["Allowed types", "jpg, png, pdf, xlsx"],
            ["Signed URL expiry", "5 min upload, 1 hr download"],
            ["Virus scan", "Required ก่อน accept"],
        ]
    ),

    H.pageBreak(),

    H.h1("4. External Integration"),
    H.h2("4.1 INT-04: SMTP Email Service"),
    H.newDesign("Email service เป็น NEW DESIGN — codebase ปัจจุบันยังไม่ส่ง email"),
    H.diagramPlaceholder("Email Queue Flow", "sequenceDiagram — App → Queue → Worker → SMTP → User"),
    H.makeTable(
        ["Spec", "รายละเอียด"],
        [
            ["Protocol", "SMTP (TLS)"],
            ["Auth", "Username + Password"],
            ["Port", "587 (STARTTLS)"],
            ["Daily limit", "10,000 emails"],
            ["Retry policy", "3 retries (5/15/60 min)"],
            ["Bounce handling", "Track + alert admin"],
            ["Templates", "HTML + Text fallback"],
        ]
    ),
    H.h3("Email Templates"),
    H.makeTable(
        ["Code", "Trigger", "Recipients"],
        [
            ["auth_approved", "Authorization approved", "CS staff"],
            ["auth_rejected", "Authorization rejected", "Creator"],
            ["auth_expiring", "Auth expiring ≤30d", "CS + QM"],
            ["auth_expired", "Auth expired", "CS + QM"],
            ["training_enrolled", "Enrolled in session", "Staff"],
            ["training_cancelled", "Session cancelled", "Enrolled staff"],
            ["training_result", "Result approved", "Staff"],
            ["password_reset", "Forgot password", "User"],
            ["welcome", "New user", "New user"],
            ["monthly_digest", "Monthly compliance", "QM/Director"],
        ]
    ),

    H.h2("4.2 INT-05: HR System Sync"),
    H.diagramPlaceholder("HR Sync Daily Flow", "flowchart LR — HR API pull → Compare → Create/Update/Resign → Audit"),
    H.makeTable(
        ["Spec", "รายละเอียด"],
        [
            ["Protocol", "REST/HTTPS pull"],
            ["Frequency", "Daily 02:00"],
            ["Auth", "OAuth 2.0 (TBD)"],
            ["Data Sync", "employee code, name, dept, position, hire/resign"],
            ["Conflict", "HR is source of truth"],
        ]
    ),

    H.h2("4.3 INT-06: CAAT Portal (Phase 2)"),
    H.newDesign("CAAT Portal integration เป็น Phase 2"),
    H.diagramPlaceholder("CAAT Submit Sequence", "sequenceDiagram — QA → CAAT POST /reports/compliance → Reference No"),
    H.makeTable(
        ["Spec", "รายละเอียด"],
        [
            ["Protocol", "REST/HTTPS"],
            ["Auth", "API Key (TBD)"],
            ["Data", "Aggregated compliance % per customer"],
            ["Frequency", "Monthly"],
        ]
    ),
    H.note("CAAT Portal API spec ยังไม่ finalize — จะ confirm ใน Phase 2"),

    H.h2("4.4 INT-07: Customer Airline APIs (Phase 3)"),
    H.makeTable(
        ["Customer", "Integration Type"],
        [
            ["TG (Thai Airways)", "Webhook for auth events"],
            ["MH (Malaysia Airlines)", "Pull API for compliance"],
            ["...", "TBD per customer"],
        ]
    ),

    H.pageBreak(),

    H.h1("5. Data Exchange Formats"),
    H.h2("5.1 XLSX Template (Bulk Import)"),
    H.h3("Staff Import Template"),
    H.makeTable(
        ["Column", "Required", "Format", "Example"],
        [
            ["EmployeeCode", "✅", "string", "E001"],
            ["FirstName", "✅", "string", "John"],
            ["LastName", "✅", "string", "Doe"],
            ["DateOfBirth", "✅", "YYYY-MM-DD", "1985-06-15"],
            ["Email", "✅", "email", "john@sams.aero"],
            ["Department", "✅", "string", "Line Maintenance"],
            ["Position", "✅", "string", "Certifying Staff"],
            ["PositionGroup", "✅", "CS/AME/Trainer", "CS"],
            ["License", "optional", "B1/B2/B1+B2", "B1"],
            ["LicenseExpiryDate", "optional", "YYYY-MM-DD", "2030-01-01"],
            ["HireDate", "✅", "YYYY-MM-DD", "2020-02-01"],
        ]
    ),

    H.h3("Authorization Import Template"),
    H.makeTable(
        ["Column", "Required", "Format"],
        [
            ["EmployeeCode", "✅", "string"],
            ["AuthType", "✅", "SAMS/Customer/Authority"],
            ["CustomerCode / AuthorityCode", "*", "string"],
            ["AuthNumber", "✅", "string"],
            ["License", "optional", "B1/B2"],
            ["IssueDate", "✅", "YYYY-MM-DD"],
            ["ExpiryDate", "✅", "YYYY-MM-DD"],
            ["Scope", "optional", "comma-separated"],
        ]
    ),

    H.h2("5.2 Multi-Sheet Export Format"),
    H.bullet("Sheet \"Summary\" — Overall stats"),
    H.bullet("Sheet \"TG\" — Thai Airways auths"),
    H.bullet("Sheet \"MH\" — Malaysia Airlines auths"),
    H.bullet("Sheet \"...\" — (one sheet per airline)"),
    H.bullet("Sheet \"Authority\" — Authority auths"),

    H.h2("5.3 PDF Output Standards"),
    H.makeTable(
        ["Form", "Page Size", "Orientation"],
        [
            ["Staff Profile", "A4", "Portrait"],
            ["Logbook", "A4", "Landscape"],
            ["Training Matrix", "A3", "Landscape"],
            ["Attendance Sheet", "A4", "Portrait"],
            ["Authorization Cert", "A4", "Portrait"],
            ["CS Experience", "A4", "Portrait"],
        ]
    ),

    H.pageBreak(),

    H.h1("6. API Versioning Strategy"),
    H.diagramPlaceholder("Version Lifecycle", "graph LR — v1 (Current) → 6mo overlap → v2 (Next) → Sunset"),
    H.makeTable(
        ["Strategy", "รายละเอียด"],
        [
            ["URL versioning", "/api/v1/..."],
            ["Breaking changes", "New major version"],
            ["Backwards compat", "Maintain v1 ≥ 6 เดือน หลัง v2"],
            ["Deprecation header", "Sunset: <date>"],
        ]
    ),

    H.h1("7. Rate Limiting & Throttling"),
    H.makeTable(
        ["Endpoint Group", "Limit"],
        [
            ["Login", "5 attempts / 5 min / IP"],
            ["Read API", "1,000 requests / hour / user"],
            ["Write API", "200 requests / hour / user"],
            ["Export", "10 / hour / user"],
            ["Bulk Import", "5 / day / user"],
        ]
    ),
    H.note("Rate limit response: 429 Too Many Requests + Retry-After header"),

    H.pageBreak(),

    H.h1("8. Webhook Specification (Phase 3)"),
    H.newDesign("Outgoing webhooks เป็น Phase 3"),
    H.makeTable(
        ["Event", "Payload"],
        [
            ["authorization.created", "{ staffId, customerId, authNumber, expiry }"],
            ["authorization.expired", "{ staffId, customerId, authNumber }"],
            ["authorization.suspended", "{ staffId, customerId, reason }"],
            ["training.completed", "{ staffId, courseCode, expiry }"],
        ]
    ),
    H.makeTable(
        ["Spec", "รายละเอียด"],
        [
            ["Protocol", "HTTPS POST"],
            ["Format", "JSON"],
            ["Signature", "HMAC-SHA256 in X-SAMS-Signature header"],
            ["Retry", "5 retries (1/5/15/60/240 min)"],
            ["Timeout", "10 seconds"],
        ]
    ),

    H.h1("9. Health Check & Monitoring Endpoints"),
    H.makeTable(
        ["Method", "Path", "Purpose"],
        [
            ["GET", "/health", "Basic liveness check"],
            ["GET", "/health/ready", "Readiness (DB + dependencies)"],
            ["GET", "/health/live", "Liveness (process alive)"],
            ["GET", "/metrics", "Prometheus-compatible metrics"],
        ]
    ),
    H.p("Sample Response (/health/ready):"),
    H.bullet("status: ok / degraded / down"),
    H.bullet("checks: { database, fileStorage, smtp, hrApi }"),
    H.bullet("timestamp: ISO 8601"),

    H.spacer(),
    H.p("— จบเอกสาร SAMS-QA-SRS-09 —", { italics: true, color: "999999" }),
];

const doc = H.buildDoc({ docNo: "SAMS-QA-SRS-09", sections });
H.saveDoc(doc, __dirname + "/../09-Integration-Interface/SAMS-QA-SRS-09-Integration-Interface.docx");
