// SAMS-QA-SRS-03 — User & Role Definition
const H = require("./_helpers");

const sections = [
    ...H.coverPage({
        docNo: "SAMS-QA-SRS-03",
        docTitle: "User & Role Definition",
        subtitleText: "นิยามผู้ใช้และสิทธิ์การเข้าถึง — โมดูล QA",
    }),

    H.newDesign("RBAC สำหรับ QA Module เป็นการออกแบบใหม่ทั้งหมด — codebase ปัจจุบันยังไม่มี role enforcement"),

    H.h1("1. ภาพรวมระบบ Role"),
    H.h2("1.1 หลักการออกแบบ"),
    H.diagramPlaceholder("RBAC Concept Map", "graph TB — User → Role → Permission → Resources/Actions"),
    H.h2("1.2 หลักการ"),
    H.makeTable(
        ["หลักการ", "คำอธิบาย"],
        [
            ["Least Privilege", "ผู้ใช้มีสิทธิ์เฉพาะที่จำเป็นต่อการทำงาน"],
            ["Separation of Duties", "ผู้สร้างไม่ใช่ผู้อนุมัติ"],
            ["Role-Based", "กำหนดสิทธิ์ที่ Role ไม่ใช่รายบุคคล"],
            ["Auditable", "ทุก action บันทึก userId + timestamp"],
            ["Scoped Access", "บาง role ดูเฉพาะข้อมูลของตนเอง (CS)"],
        ]
    ),

    H.pageBreak(),

    H.h1("2. Role Definitions"),
    H.h2("2.1 รายการ Role (8 Roles)"),
    H.makeTable(
        ["Role Code", "Role Name", "คำอธิบาย", "จำนวนคนคาดการณ์"],
        [
            ["QA_DIRECTOR", "QA Director", "ผู้อำนวยการ QA", "1-2"],
            ["QA_MANAGER", "QA Manager", "ผู้จัดการ QA", "2-5"],
            ["CM_OFFICER", "Compliance Monitoring Officer", "เจ้าหน้าที่ติดตาม compliance", "3-8"],
            ["TRAINER", "Trainer / Instructor", "ผู้ฝึกอบรม", "5-15"],
            ["QA_INSPECTOR", "QA Inspector", "ผู้ตรวจสอบ", "5-10"],
            ["CERTIFYING_STAFF", "Certifying Staff (CS)", "ช่างซ่อมบำรุงที่ออก CRS ได้", "200-500"],
            ["AME_STAFF", "AME Staff", "ช่างซ่อมบำรุงทั่วไป", "500-1500"],
            ["SYSTEM_ADMIN", "System Administrator", "ผู้ดูแลระบบ", "1-3"],
        ]
    ),
    H.h2("2.2 Role Hierarchy"),
    H.diagramPlaceholder("Role Hierarchy", "graph TD — Admin / Director → Manager → CM/Trainer / Inspector / CS → AME"),

    H.h2("2.3 รายละเอียดแต่ละ Role"),

    H.h3("2.3.1 QA_DIRECTOR"),
    H.bullet("หน้าที่: กำกับดูแลภาพรวม, อนุมัติ Authorization ระดับสูง, ตรวจรายงาน"),
    H.bullet("Critical Actions: Approve high-tier authorizations, View audit logs"),

    H.h3("2.3.2 QA_MANAGER"),
    H.bullet("หน้าที่: อนุมัติ Authorization, จัดการ Course Catalog, อนุมัติ Training Records"),
    H.bullet("Critical Actions: Approve Authorization, Approve Training, Manage Master Data"),

    H.h3("2.3.3 CM_OFFICER"),
    H.bullet("หน้าที่: ติดตามวันหมดอายุ, สร้างรายงาน, ส่ง alert"),
    H.bullet("Critical Actions: Trigger alerts, Generate compliance reports"),

    H.h3("2.3.4 TRAINER"),
    H.bullet("หน้าที่: สร้าง Training Session, บันทึกผลอบรม, Submit เพื่ออนุมัติ"),
    H.bullet("Critical Actions: Submit training results (ต้อง QA Manager approve)"),

    H.h3("2.3.5 QA_INSPECTOR"),
    H.bullet("หน้าที่: ตรวจสอบความถูกต้องของ records (Read-only)"),
    H.bullet("Critical Actions: Flag inconsistencies, Comment on records"),

    H.h3("2.3.6 CERTIFYING_STAFF (CS)"),
    H.bullet("หน้าที่: ใช้ระบบดูสถานะของตนเอง, ลงทะเบียนอบรม"),
    H.bullet("Scope: Own data only"),

    H.h3("2.3.7 AME_STAFF"),
    H.bullet("หน้าที่: ดูข้อมูลของตนเอง, ลงทะเบียนอบรม"),
    H.bullet("Scope: Own data only"),

    H.h3("2.3.8 SYSTEM_ADMIN"),
    H.bullet("หน้าที่: จัดการ users, roles, permissions, master data"),
    H.bullet("Critical Actions: Create/disable users, Reset passwords, Modify roles"),

    H.pageBreak(),

    H.h1("3. Permission Matrix"),
    H.h2("3.1 Permission Codes"),
    H.makeTable(
        ["Action Code", "คำอธิบาย"],
        [
            ["VIEW_OWN", "ดูข้อมูลของตนเอง"],
            ["VIEW_TEAM", "ดูข้อมูลของทีม/แผนก"],
            ["VIEW_ALL", "ดูข้อมูลทั้งหมด"],
            ["CREATE", "สร้างใหม่"],
            ["EDIT", "แก้ไข (ก่อน approve)"],
            ["EDIT_APPROVED", "แก้ไขหลัง approve (สร้าง amendment)"],
            ["DELETE", "ลบ (soft delete)"],
            ["SUBMIT", "ส่งเพื่ออนุมัติ"],
            ["APPROVE", "อนุมัติ"],
            ["REJECT", "ปฏิเสธ"],
            ["EXPORT", "Export PDF/XLSX"],
            ["IMPORT", "Bulk import"],
            ["AUDIT_VIEW", "ดู Audit log"],
        ]
    ),

    H.h2("3.2 Staff Module"),
    H.makeTable(
        ["Action", "DIR", "MGR", "CM", "TR", "INSP", "CS", "AME", "ADMIN"],
        [
            ["View Own", "✅", "✅", "✅", "✅", "✅", "✅", "✅", "✅"],
            ["View All", "✅", "✅", "✅", "✅", "✅", "❌", "❌", "✅"],
            ["Create", "❌", "✅", "❌", "❌", "❌", "❌", "❌", "✅"],
            ["Edit", "❌", "✅", "❌", "❌", "❌", "Own", "Own", "✅"],
            ["Delete", "❌", "❌", "❌", "❌", "❌", "❌", "❌", "✅"],
            ["Export", "✅", "✅", "✅", "❌", "✅", "❌", "❌", "✅"],
            ["Import", "❌", "✅", "❌", "❌", "❌", "❌", "❌", "✅"],
        ]
    ),

    H.h2("3.3 Authorization Module"),
    H.makeTable(
        ["Action", "DIR", "MGR", "CM", "TR", "INSP", "CS", "AME", "ADMIN"],
        [
            ["View Own", "✅", "✅", "✅", "✅", "✅", "✅", "❌", "✅"],
            ["View All", "✅", "✅", "✅", "❌", "✅", "❌", "❌", "✅"],
            ["Create (Draft)", "❌", "✅", "❌", "❌", "❌", "❌", "❌", "❌"],
            ["Submit", "❌", "✅", "❌", "❌", "❌", "❌", "❌", "❌"],
            ["Approve", "✅", "✅*", "❌", "❌", "❌", "❌", "❌", "❌"],
            ["Reject", "✅", "✅", "❌", "❌", "❌", "❌", "❌", "❌"],
            ["Suspend", "✅", "✅", "❌", "❌", "❌", "❌", "❌", "❌"],
            ["Revoke", "✅", "❌", "❌", "❌", "❌", "❌", "❌", "❌"],
            ["Renew", "❌", "✅", "✅", "❌", "❌", "❌", "❌", "❌"],
            ["Export", "✅", "✅", "✅", "❌", "✅", "Own", "❌", "✅"],
        ]
    ),
    H.note("✅* = QA_MANAGER อนุมัติได้สำหรับ Auth ที่ตนเองไม่ได้สร้าง (Separation of Duties)"),

    H.h2("3.4 Training Module"),
    H.makeTable(
        ["Action", "DIR", "MGR", "CM", "TR", "INSP", "CS", "AME", "ADMIN"],
        [
            ["View Own", "✅", "✅", "✅", "✅", "✅", "✅", "✅", "✅"],
            ["View All", "✅", "✅", "✅", "✅", "✅", "❌", "❌", "✅"],
            ["Create Session", "❌", "✅", "❌", "✅", "❌", "❌", "❌", "❌"],
            ["Edit Session", "❌", "✅", "❌", "Own", "❌", "❌", "❌", "❌"],
            ["Cancel Session", "❌", "✅", "❌", "Own", "❌", "❌", "❌", "❌"],
            ["Enroll Self", "❌", "❌", "❌", "❌", "❌", "✅", "✅", "❌"],
            ["Enroll Others", "❌", "✅", "❌", "✅", "❌", "❌", "❌", "❌"],
            ["Mark Attendance", "❌", "❌", "❌", "Own", "❌", "❌", "❌", "❌"],
            ["Submit Result", "❌", "❌", "❌", "Own", "❌", "❌", "❌", "❌"],
            ["Approve Result", "✅", "✅", "❌", "❌", "❌", "❌", "❌", "❌"],
            ["Edit Approved", "❌", "❌", "❌", "❌", "❌", "❌", "❌", "❌"],
        ]
    ),

    H.h2("3.5 Course Management"),
    H.makeTable(
        ["Action", "DIR", "MGR", "CM", "TR", "INSP", "CS", "AME", "ADMIN"],
        [
            ["View Catalog", "✅", "✅", "✅", "✅", "✅", "✅", "✅", "✅"],
            ["Create Course", "❌", "✅", "❌", "❌", "❌", "❌", "❌", "✅"],
            ["Edit Course", "❌", "✅", "❌", "❌", "❌", "❌", "❌", "✅"],
            ["Manage Matrix", "❌", "✅", "❌", "❌", "❌", "❌", "❌", "✅"],
        ]
    ),

    H.h2("3.6 Monitoring & Dashboard"),
    H.makeTable(
        ["Action", "DIR", "MGR", "CM", "TR", "INSP", "CS", "AME", "ADMIN"],
        [
            ["View QA Dashboard", "✅", "✅", "✅", "Limited", "✅", "❌", "❌", "✅"],
            ["View Self Dashboard", "❌", "❌", "❌", "❌", "❌", "✅", "✅", "❌"],
            ["Generate Reports", "✅", "✅", "✅", "❌", "✅", "❌", "❌", "✅"],
            ["Schedule Reports", "❌", "✅", "✅", "❌", "❌", "❌", "❌", "✅"],
            ["View Audit Log", "✅", "Limited", "❌", "❌", "❌", "❌", "❌", "✅"],
        ]
    ),

    H.h2("3.7 System Admin"),
    H.makeTable(
        ["Action", "DIR", "MGR", "CM", "TR", "INSP", "CS", "AME", "ADMIN"],
        [
            ["Manage Users", "❌", "❌", "❌", "❌", "❌", "❌", "❌", "✅"],
            ["Reset Password", "❌", "❌", "❌", "❌", "❌", "❌", "❌", "✅"],
            ["Manage Roles", "❌", "❌", "❌", "❌", "❌", "❌", "❌", "✅"],
            ["System Settings", "❌", "❌", "❌", "❌", "❌", "❌", "❌", "✅"],
            ["Backup/Restore", "❌", "❌", "❌", "❌", "❌", "❌", "❌", "✅"],
        ]
    ),

    H.pageBreak(),

    H.h1("4. Special Rules"),

    H.h2("4.1 Self-Service Scope (CS, AME)"),
    H.bullet("ดูได้เฉพาะ Profile, Training Records, Authorization Status, Upcoming Sessions ของตนเอง"),
    H.bullet("ไม่เห็นข้อมูลของพนักงานคนอื่น"),
    H.bullet("ไม่เห็น Dashboard รวม"),

    H.h2("4.2 Separation of Duties"),
    H.diagramPlaceholder("Separation of Duties Flow", "flowchart LR — Manager A สร้าง → Manager B/Director อนุมัติ"),
    H.note("ผู้สร้าง Authorization ไม่สามารถ approve Authorization ของตนเองได้"),

    H.h2("4.3 Time-Sensitive Permissions"),
    H.makeTable(
        ["สถานการณ์", "กฎ"],
        [
            ["Staff resigned", "Auto-suspend ทุก permission ภายใน 24 ชม."],
            ["Account inactive 90 วัน", "Auto-disable account"],
            ["Failed login 5 ครั้ง", "Lock account 30 นาที"],
            ["QA Manager on leave", "Delegate approval ให้ QA Director ชั่วคราว"],
        ]
    ),

    H.h2("4.4 Audit Required Actions"),
    H.bullet("Authorization: Create, Submit, Approve, Reject, Suspend, Revoke, Renew"),
    H.bullet("Training Result: Submit, Approve, Reject, Edit Approved"),
    H.bullet("Staff: Create, Resign, Reactivate"),
    H.bullet("User Account: Create, Modify role, Disable"),
    H.bullet("Master Data: Add/Edit Course, Modify Training Matrix"),

    H.pageBreak(),

    H.h1("5. Onboarding & Offboarding"),
    H.h2("5.1 User Onboarding"),
    H.diagramPlaceholder("User Onboarding Sequence", "sequenceDiagram — HR → Admin → SAMS create → Welcome email → First login + reset password"),

    H.h2("5.2 User Offboarding"),
    H.diagramPlaceholder("User Offboarding Sequence", "sequenceDiagram — HR → Admin → Suspend → Disable → Archive (90 วัน)"),

    H.pageBreak(),

    H.h1("6. UI/UX Implications"),
    H.h2("6.1 Role-Based Menu Visibility"),
    H.diagramPlaceholder("Role-Based Menu Map", "graph LR — Login → Role check → Different menus per role"),

    H.h2("6.2 Action Buttons Conditional Rendering"),
    H.makeTable(
        ["Component", "ตัวอย่าง"],
        [
            ["<RoleGate role=\"QA_MANAGER\">", "Wrap component, render เฉพาะ role ที่กำหนด"],
            ["usePermission('AUTH_APPROVE')", "Hook ตรวจ permission"],
            ["<PermissionAlert>", "แสดงข้อความเมื่อไม่มีสิทธิ์"],
        ]
    ),

    H.h2("6.3 Empty State for Restricted Pages"),
    H.p("หาก user ไม่มีสิทธิ์เข้าหน้านั้น → แสดง:"),
    H.bullet("🔒 Access Denied"),
    H.bullet("ข้อความ: \"คุณไม่มีสิทธิ์เข้าถึงหน้านี้\""),
    H.bullet("ปุ่ม: Back to Dashboard"),

    H.pageBreak(),

    H.h1("7. Implementation Notes"),
    H.h2("7.1 Database Schema (Preview)"),
    H.note("รายละเอียดเต็มอยู่ใน SRS-07 (Data Design)"),
    H.diagramPlaceholder("RBAC ER Diagram", "erDiagram — USER ↔ USER_ROLE ↔ ROLE ↔ ROLE_PERMISSION ↔ PERMISSION"),

    H.h2("7.2 Implementation Stack"),
    H.makeTable(
        ["Layer", "เทคโนโลยี"],
        [
            ["Auth Provider", "JWT (existing)"],
            ["Role Storage", "RBAC Database tables (NEW)"],
            ["Permission Check (Frontend)", "Custom hook usePermission()"],
            ["Permission Check (Backend)", "Middleware ที่ตรวจ JWT claims"],
            ["Audit Log", "Append-only table (NEW — ดู SRS-07)"],
        ]
    ),

    H.spacer(),
    H.p("— จบเอกสาร SAMS-QA-SRS-03 —", { italics: true, color: "999999" }),
];

const doc = H.buildDoc({ docNo: "SAMS-QA-SRS-03", sections });
H.saveDoc(doc, __dirname + "/../03-User-Role-Definition/SAMS-QA-SRS-03-User-Role-Definition.docx");
