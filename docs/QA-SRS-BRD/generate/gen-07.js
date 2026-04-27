// SAMS-QA-SRS-07 — Data Design
const H = require("./_helpers");

const sections = [
    ...H.coverPage({
        docNo: "SAMS-QA-SRS-07",
        docTitle: "Data Design",
        subtitleText: "การออกแบบข้อมูล (ER Diagram + Schema) — โมดูล QA",
    }),

    H.h1("1. Conceptual Data Model"),
    H.h2("1.1 Entity Overview"),
    H.diagramPlaceholder("Top-Level ER Diagram", "erDiagram — USER/ROLE/STAFF/AUTH/TRAINING/COURSE/AUDIT relationships"),

    H.h2("1.2 หลัก Entity (15+ Entities)"),
    H.makeTable(
        ["Entity", "คำอธิบาย", "NEW?"],
        [
            ["USER", "บัญชีผู้ใช้ระบบ", "🆕 NEW"],
            ["ROLE", "บทบาท", "🆕 NEW"],
            ["PERMISSION", "สิทธิ์", "🆕 NEW"],
            ["USER_ROLE / ROLE_PERMISSION", "Mapping tables", "🆕 NEW"],
            ["STAFF", "พนักงาน", "Existing"],
            ["EDUCATION / WORK_EXPERIENCE", "ประวัติการศึกษา/ทำงาน", "Existing"],
            ["AUTHORIZATION", "การอนุญาต", "Existing"],
            ["AUTH_HISTORY", "ประวัติ Authorization", "🆕 NEW"],
            ["TRAINING_RECORD", "ผลการอบรม", "Existing"],
            ["TRAINING_SESSION", "ตารางอบรม", "Existing"],
            ["COURSE / COURSE_REQUIREMENT", "หลักสูตร + Matrix", "Existing"],
            ["LOGBOOK", "บันทึกการทำงาน", "Existing"],
            ["CUSTOMER_AIRLINE / AUTHORITY", "Master data", "Existing"],
            ["DEPARTMENT", "แผนก", "Existing"],
            ["AUDIT_LOG", "บันทึกการเปลี่ยนแปลง", "🆕 NEW"],
            ["NOTIFICATION", "การแจ้งเตือน", "🆕 NEW"],
            ["EMAIL_QUEUE", "คิวส่ง email", "🆕 NEW"],
        ]
    ),

    H.pageBreak(),

    H.h1("2. Logical Data Model — Core Tables"),
    H.h2("2.1 STAFF Table"),
    H.diagramPlaceholder("STAFF Schema", "erDiagram STAFF { id PK, employee_code UK, name, dept_id FK, position, license, hire/resign_date, status, photo_url, created/updated }"),

    H.h2("2.2 AUTHORIZATION Table"),
    H.diagramPlaceholder("AUTHORIZATION Schema", "erDiagram AUTHORIZATION { id PK, staff_id FK, auth_type, customer_id, authority_id, auth_number UK, license, scope JSON, status, issued_by, approved_by NEW, remarks, rejection_reason NEW }"),

    H.h2("2.3 AUTH_HISTORY Table"),
    H.newDesign("AUTH_HISTORY = NEW DESIGN — บันทึกทุกการเปลี่ยน status ของ Authorization"),
    H.diagramPlaceholder("AUTH_HISTORY Schema", "erDiagram AUTH_HISTORY { id PK, authorization_id FK, from_status, to_status, changed_by, changed_at, reason, snapshot JSON }"),

    H.h2("2.4 TRAINING_RECORD Table"),
    H.diagramPlaceholder("TRAINING_RECORD Schema", "erDiagram TRAINING_RECORD { id PK, staff_id FK, course_id FK, session_id FK, training_date, expiry_date, score, result, status, certificate_url, trainer_id, approved_by NEW }"),

    H.h2("2.5 COURSE & MATRIX"),
    H.diagramPlaceholder("COURSE + COURSE_REQUIREMENT", "erDiagram COURSE { id, code, name, category, validity_months, is_active } / COURSE_REQUIREMENT { id, course_id, role_id, position_group, aircraft_type, is_mandatory }"),

    H.h2("2.6 TRAINING_SESSION"),
    H.diagramPlaceholder("TRAINING_SESSION + SESSION_ENROLLMENT", "erDiagram SESSION + ENROLLMENT mapping"),

    H.pageBreak(),

    H.h1("3. RBAC Tables"),
    H.newDesign("RBAC tables (USER, ROLE, PERMISSION + mapping) เป็น NEW DESIGN ทั้งหมด"),
    H.h2("3.1 USER, ROLE, PERMISSION"),
    H.diagramPlaceholder("RBAC ER Diagram", "erDiagram USER ↔ USER_ROLE ↔ ROLE ↔ ROLE_PERMISSION ↔ PERMISSION"),

    H.pageBreak(),

    H.h1("4. Audit & Notification Tables"),
    H.newDesign("AUDIT_LOG, NOTIFICATION, EMAIL_QUEUE = NEW DESIGN"),
    H.h2("4.1 AUDIT_LOG (Append-only)"),
    H.diagramPlaceholder("AUDIT_LOG Schema", "erDiagram AUDIT_LOG { id PK, timestamp, user_id, action, resource_type, resource_id, before_data JSON, after_data JSON, ip, user_agent }"),
    H.note("Append-only — ห้าม UPDATE/DELETE"),

    H.h2("4.2 NOTIFICATION & EMAIL_QUEUE"),
    H.diagramPlaceholder("NOTIFICATION + EMAIL_QUEUE", "erDiagram NOTIFICATION { id, user_id, type, title, message, link, is_read, created_at } / EMAIL_QUEUE { id, to_email, subject, body, template_code, status, retry_count, scheduled_at, sent_at }"),

    H.pageBreak(),

    H.h1("5. Customer Airlines & Authorities"),
    H.h2("5.1 CUSTOMER_AIRLINE (18 records)"),
    H.diagramPlaceholder("CUSTOMER_AIRLINE Schema", "erDiagram CUSTOMER_AIRLINE { id, code UK, name, country, brand_color, logo_url, regulator, is_active }"),
    H.makeTable(
        ["code", "name", "country", "regulator"],
        [
            ["TG", "Thai Airways", "TH", "CAAT"],
            ["MH", "Malaysia Airlines", "MY", "CAAM"],
            ["PR", "Philippine Airlines", "PH", "CAAP"],
            ["EK", "Emirates", "AE", "GCAA"],
            ["QF", "Qantas", "AU", "CASA"],
        ]
    ),

    H.h2("5.2 AUTHORITY (13 records)"),
    H.diagramPlaceholder("AUTHORITY Schema", "erDiagram AUTHORITY { id PK, code UK, name, country, website }"),

    H.pageBreak(),

    H.h1("6. Indexing Strategy"),
    H.h2("6.1 Primary Indexes"),
    H.makeTable(
        ["Table", "Index", "Reason"],
        [
            ["STAFF", "(employee_code) UNIQUE", "Lookup by code"],
            ["STAFF", "(department_id)", "Filter by dept"],
            ["STAFF", "(status)", "Filter active"],
            ["AUTHORIZATION", "(staff_id)", "Get staff's auths"],
            ["AUTHORIZATION", "(customer_airline_id, status)", "Compliance reporting"],
            ["AUTHORIZATION", "(expiry_date)", "Expiry scan"],
            ["AUTHORIZATION", "(status, expiry_date)", "Expiring filter"],
            ["TRAINING_RECORD", "(staff_id, course_id)", "Get latest training"],
            ["TRAINING_RECORD", "(expiry_date)", "Expiry scan"],
            ["AUDIT_LOG", "(timestamp DESC)", "Recent activities"],
            ["AUDIT_LOG", "(user_id, timestamp)", "User activity"],
            ["AUDIT_LOG", "(resource_type, resource_id)", "Resource history"],
            ["EMAIL_QUEUE", "(status, scheduled_at)", "Worker pickup"],
        ]
    ),
    H.h2("6.2 Composite/Specialized"),
    H.makeTable(
        ["Index", "Use Case"],
        [
            ["(staff_id, status, expiry_date) on AUTHORIZATION", "CS list with expiry filter"],
            ["(course_id, training_date DESC) on TRAINING_RECORD", "Latest training per course"],
            ["Full-text on STAFF.first_name + last_name", "Search"],
        ]
    ),

    H.pageBreak(),

    H.h1("7. Data Flow Diagrams"),
    H.h2("7.1 Authorization Lifecycle Data Flow"),
    H.diagramPlaceholder("Auth Lifecycle Data Flow", "flowchart TD — Create Draft → Submit → Approve, with INSERT to AUTH/HISTORY/NOTIF/EMAIL/AUDIT"),

    H.h2("7.2 Daily Expiry Scan Data Flow"),
    H.diagramPlaceholder("Expiry Scan Data Flow", "flowchart LR — Cron 06:00 → SELECT expiring → UPDATE → INSERT NOTIF/EMAIL/AUDIT"),

    H.h2("7.3 CRS Eligibility Calculation"),
    H.diagramPlaceholder("CRS Eligibility Logic", "flowchart TD — Frontend → API → Query SAMS+Customer auths → Calc → Return Eligible/Not"),

    H.pageBreak(),

    H.h1("8. Data Migration Strategy"),
    H.h2("8.1 Migration Sources"),
    H.diagramPlaceholder("Migration Sources Map", "graph LR — Excel + HR API + Master XLSX → Staging → Validate → Production"),

    H.h2("8.2 Migration Order"),
    H.makeTable(
        ["Step", "Entity", "เหตุผล"],
        [
            ["1", "DEPARTMENT, COURSE, CUSTOMER_AIRLINE, AUTHORITY", "Master data ก่อน"],
            ["2", "ROLE, PERMISSION, ROLE_PERMISSION", "RBAC config"],
            ["3", "STAFF", "ต้องมีก่อน entity อื่น"],
            ["4", "USER + USER_ROLE", "Link to STAFF"],
            ["5", "EDUCATION, WORK_EXPERIENCE, LOGBOOK", "Staff details"],
            ["6", "TRAINING_RECORD", "ต้องมี STAFF + COURSE"],
            ["7", "AUTHORIZATION", "ต้องมี STAFF + CUSTOMER + AUTHORITY"],
            ["8", "AUTH_HISTORY", "บันทึกย้อนหลังจาก timestamp"],
        ]
    ),

    H.pageBreak(),

    H.h1("9. Data Retention & Archival"),
    H.newDesign("Retention Policy เป็น NEW DESIGN"),
    H.h2("9.1 Retention Policy"),
    H.makeTable(
        ["Entity", "Active Retention", "Archive Retention", "Total"],
        [
            ["STAFF (active)", "Forever", "—", "Forever"],
            ["STAFF (resigned)", "90 วัน", "5 ปี", "5 ปี + 90 วัน"],
            ["AUTHORIZATION", "Active period", "5 ปีหลัง expire", "Active + 5 ปี"],
            ["TRAINING_RECORD", "Active period", "5 ปีหลัง expire", "Active + 5 ปี"],
            ["AUDIT_LOG", "Forever", "—", "Forever (≥ 5 ปี)"],
            ["LOGBOOK", "Forever", "—", "Forever"],
            ["USER (resigned)", "Disabled", "Forever", "Forever (audit)"],
            ["EMAIL_QUEUE (sent)", "30 วัน", "—", "30 วัน"],
            ["NOTIFICATION (read)", "90 วัน", "—", "90 วัน"],
            ["TRAINING_SESSION (completed)", "1 ปี", "5 ปี", "6 ปี"],
        ]
    ),

    H.h2("9.2 Archival Process"),
    H.diagramPlaceholder("Archival Daily Job", "flowchart LR — Daily 04:00 → Scan retention → Move to ARCHIVE_* → Compress + offsite"),

    H.pageBreak(),

    H.h1("10. Data Validation Rules"),
    H.h2("10.1 Field-Level Validation"),
    H.makeTable(
        ["Field", "Rule"],
        [
            ["STAFF.employee_code", "Unique, regex ^[A-Z0-9-]{3,20}$"],
            ["STAFF.email", "Valid email, unique"],
            ["STAFF.national_id", "Encrypted, 13 digits (TH)"],
            ["AUTHORIZATION.expiry_date", "> issue_date"],
            ["AUTHORIZATION.expiry_date (Customer)", "≤ SAMS auth expiry"],
            ["TRAINING_RECORD.expiry_date", "> training_date"],
            ["COURSE.validity_months", "> 0, ≤ 60"],
            ["USER.password_hash", "bcrypt format check"],
            ["EMAIL_QUEUE.to_email", "Valid email"],
        ]
    ),

    H.h2("10.2 Business Rule Constraints (DB-level)"),
    H.bullet("Customer auth expiry ≤ SAMS auth expiry (CHECK constraint)"),
    H.bullet("Soft delete only (deleted_at IS NULL filter)"),
    H.bullet("Foreign key constraints with ON DELETE RESTRICT"),

    H.pageBreak(),

    H.h1("11. Sample Data Volumes"),
    H.makeTable(
        ["Table", "Year 1", "Year 5", "Year 10"],
        [
            ["STAFF", "2,000", "5,000", "8,000"],
            ["AUTHORIZATION", "10,000", "50,000", "100,000"],
            ["AUTH_HISTORY", "30,000", "200,000", "500,000"],
            ["TRAINING_RECORD", "100,000", "1,250,000", "3,000,000"],
            ["TRAINING_SESSION", "5,000", "25,000", "50,000"],
            ["AUDIT_LOG", "500,000", "5,000,000", "15,000,000"],
            ["EMAIL_QUEUE", "50,000/year", "(rolling 30d)", "(rolling 30d)"],
            ["NOTIFICATION", "100,000/year", "(rolling 90d)", "(rolling 90d)"],
        ]
    ),
    H.note("Database size estimated: ~50 GB at Year 5 (with audit logs being largest)"),

    H.spacer(),
    H.p("— จบเอกสาร SAMS-QA-SRS-07 —", { italics: true, color: "999999" }),
];

const doc = H.buildDoc({ docNo: "SAMS-QA-SRS-07", sections });
H.saveDoc(doc, __dirname + "/../07-Data-Design/SAMS-QA-SRS-07-Data-Design.docx");
