// SAMS-QA-SRS-02 — Business Process
const H = require("./_helpers");

const sections = [
    ...H.coverPage({
        docNo: "SAMS-QA-SRS-02",
        docTitle: "Business Process",
        subtitleText: "กระบวนการธุรกิจ As-Is / To-Be — โมดูล QA",
    }),

    H.h1("1. ภาพรวมกระบวนการธุรกิจ"),
    H.p("QA Module ครอบคลุมกระบวนการธุรกิจหลัก 6 กระบวนการที่เชื่อมโยงกัน:"),
    H.diagramPlaceholder("Business Process Map", "graph TB — Staff → Training → Auth → Recurrent → Compliance → Reporting"),
    H.makeTable(
        ["#", "กระบวนการ", "ผู้รับผิดชอบ", "วัตถุประสงค์"],
        [
            ["1", "Staff Onboarding", "HR + QA Manager", "บันทึกพนักงานใหม่เข้าระบบ"],
            ["2", "Initial Training", "Trainer", "ฝึกอบรมพื้นฐานก่อนออก Authorization"],
            ["3", "Authorization Issuance", "QA Manager", "ออก Authorization ให้ Certifying Staff"],
            ["4", "Recurrent Training", "Trainer", "Refresher training ตามรอบเวลา"],
            ["5", "Compliance Monitoring", "CM Officer", "ติดตามวันหมดอายุ + แจ้งเตือน"],
            ["6", "Reporting & Audit", "QA Manager", "สร้างรายงานสำหรับ Authority"],
        ]
    ),

    H.pageBreak(),

    H.h1("2. As-Is Process: กระบวนการปัจจุบัน"),
    H.h2("2.1 เครื่องมือที่ใช้อยู่"),
    H.diagramPlaceholder("Current Tools Map", "graph LR — Excel + Email + Paper + Shared Drive"),
    H.bullet("Excel Spreadsheet — หลายไฟล์ แยกตามหัวข้อ"),
    H.bullet("Email — แจ้งเตือนด้วยตัวเอง"),
    H.bullet("Paper Forms — เซ็นชื่ออนุมัติ"),
    H.bullet("Shared Drive — เก็บไฟล์ปนกัน"),

    H.h2("2.2 As-Is: Authorization Issuance"),
    H.diagramPlaceholder("As-Is Authorization Flow (Sequence)", "sequenceDiagram — CS→TR→XLS→QM→Print→Sign"),
    H.p("ปัญหา: ไม่มี audit trail, ไม่มี link ระหว่างไฟล์ Excel"),

    H.h2("2.3 As-Is: Compliance Monitoring"),
    H.diagramPlaceholder("As-Is Compliance Check Flow", "flowchart TD — เปิด Excel ทุกไฟล์ → ตรวจทีละแถว → mark สีแดง → email"),

    H.pageBreak(),

    H.h1("3. Pain Points"),
    H.h2("3.1 ปัญหาหลักที่พบ"),
    H.makeTable(
        ["#", "ปัญหา", "ผลกระทบ", "ความรุนแรง"],
        [
            ["P1", "ตรวจวันหมดอายุด้วยมือ ใช้เวลามาก", "CM Officer ใช้เวลา 2-3 วัน/เดือน", "🔴 สูง"],
            ["P2", "ไม่มี alert อัตโนมัติเมื่อใกล้หมดอายุ", "พลาดวันหมดอายุ → CS ออก CRS ไม่ได้", "🔴 สูง"],
            ["P3", "ข้อมูลกระจายในหลายไฟล์ Excel", "ข้อมูลขัดแย้งกัน, version control ยาก", "🟡 ปานกลาง"],
            ["P4", "ไม่มี audit trail", "ตรวจสอบย้อนหลังไม่ได้, audit ลำบาก", "🔴 สูง"],
            ["P5", "ไม่รองรับ multi-customer concurrent", "18 สายการบินต้องเปิดทีละไฟล์", "🟡 ปานกลาง"],
            ["P6", "CRS eligibility ต้องคำนวณเอง", "เกิด human error ได้สูง", "🔴 สูง"],
            ["P7", "Report ต้องสร้างเอง ทุกครั้ง", "ใช้เวลาในการเตรียม audit นาน", "🟡 ปานกลาง"],
            ["P8", "ไม่มี role-based access", "ทุกคนเห็นทุกอย่าง — risk ข้อมูลรั่ว", "🔴 สูง"],
        ]
    ),
    H.h2("3.2 Root Cause Analysis"),
    H.diagramPlaceholder("Root Cause Tree", "graph LR — Excel ไม่ใช่ DB / ไม่มี automation / ไม่มี integration"),

    H.pageBreak(),

    H.h1("4. To-Be Process: กระบวนการใหม่"),
    H.h2("4.1 หลักการออกแบบ"),
    H.makeTable(
        ["หลักการ", "คำอธิบาย"],
        [
            ["Single Source of Truth", "ข้อมูลทั้งหมดอยู่ใน DB เดียว, มี link ระหว่างกัน"],
            ["Automation First", "Automate alert, calculation, reporting"],
            ["Role-Based Access", "จำกัดสิทธิ์ตามตำแหน่ง"],
            ["Audit Trail", "บันทึกทุกการเปลี่ยนแปลง พร้อม timestamp + user"],
            ["Real-time Dashboard", "ผู้บริหารเห็นภาพรวมทันที"],
        ]
    ),
    H.h2("4.2 To-Be: Authorization Issuance"),
    H.diagramPlaceholder("To-Be Authorization Flow (Sequence)", "sequenceDiagram — Training→AutoCheck→Draft→Submit→Approve→Notify"),
    H.newDesign("Approval workflow (Draft → Submitted → Active) + Audit log อัตโนมัติทุกขั้นตอน"),

    H.h2("4.3 To-Be: Compliance Monitoring"),
    H.diagramPlaceholder("To-Be Compliance Auto-Check", "flowchart TD — Daily Job 06:00 → Scan → Alert <30d → Email + Dashboard"),
    H.newDesign("Daily scheduled job + Email notification + Dashboard counter อัตโนมัติ"),

    H.pageBreak(),

    H.h1("5. Process Flow แต่ละ Sub-module"),

    H.h2("5.1 Staff Management Flow"),
    H.diagramPlaceholder("Staff Lifecycle State Diagram", "stateDiagram — NewStaff → Active → OnLeave/Resigned → Archived"),
    H.newDesign("Auto-archive staff ที่ลาออกเกิน 90 วัน (Data Retention Policy)"),

    H.h2("5.2 Authorization Lifecycle"),
    H.diagramPlaceholder("Authorization State Diagram", "stateDiagram — Draft→Submitted→Active→Expiring→Expired→Renew/Revoked"),
    H.newDesign("Approval Workflow ใหม่: Draft → Submitted → Active (เดิมไม่มี state Submitted/Rejected)"),

    H.h2("5.3 Training Compliance Flow"),
    H.diagramPlaceholder("Training Compliance Daily Check", "flowchart LR — Daily Scan → Check Expiry/Required → OK/Alert/Schedule"),

    H.h2("5.4 Course Management Flow"),
    H.diagramPlaceholder("Course Management Flow", "flowchart TD — Add Course → Matrix → Bind to Role → Trainer creates session"),

    H.h2("5.5 Training Scheduler Flow"),
    H.diagramPlaceholder("Training Session Lifecycle", "sequenceDiagram — Create→Open→Enroll→Conduct→Result→AutoUpdate"),

    H.h2("5.6 QA Dashboard"),
    H.diagramPlaceholder("Dashboard Aggregation Flow", "graph LR — DB → Aggregate → Widgets (filter by Role)"),

    H.pageBreak(),

    H.h1("6. Cross-Process Dependencies"),
    H.h2("6.1 Data Flow ระหว่าง Sub-modules"),
    H.diagramPlaceholder("Module Dependency Graph", "graph TB — Staff/Course → Scheduler → Auth → Monitoring → Dashboard"),

    H.h2("6.2 Trigger Events"),
    H.makeTable(
        ["Trigger", "ผลกระทบต่อ Module"],
        [
            ["Staff ลาออก", "→ Suspend ทุก Authorization → Cancel pending Training"],
            ["Training ผ่าน", "→ Update Compliance % → Trigger Authorization eligibility check"],
            ["Authorization Active", "→ Update Dashboard counter → Email confirmation"],
            ["Authorization Expiring (30d)", "→ Alert → Suggest renewal training"],
            ["Course เพิ่มใน Matrix", "→ Re-evaluate compliance ของ staff ที่เกี่ยวข้อง"],
            ["Customer เพิ่มใหม่", "→ Generate Customer Auth template"],
        ]
    ),

    H.h2("6.3 Business Rules ที่ระบบต้อง Enforce"),
    H.newDesign("กฎเหล่านี้ปัจจุบันใช้ความจำของ QA Manager — ระบบใหม่จะ enforce อัตโนมัติ"),
    H.makeTable(
        ["Rule ID", "กฎ"],
        [
            ["BR-01", "CS ต้องมี SAMS Auth ที่ Active ก่อนจึงออก Customer Auth ได้"],
            ["BR-02", "Customer Auth ต้องไม่ extend เกิน SAMS Auth expiry"],
            ["BR-03", "CRS Eligibility = SAMS Active + ≥1 Customer Active + Mandatory Training ครบ"],
            ["BR-04", "Staff ที่ลาออกแล้ว → Auto-suspend ทุก Authorization"],
            ["BR-05", "Training expiry ≤ 30 days → Auto-alert CS + Trainer + QA Manager"],
            ["BR-06", "ห้ามแก้ไข Training Record ที่ approved แล้ว ต้องสร้าง Amendment record"],
        ]
    ),

    H.spacer(),
    H.p("— จบเอกสาร SAMS-QA-SRS-02 —", { italics: true, color: "999999" }),
];

const doc = H.buildDoc({ docNo: "SAMS-QA-SRS-02", sections });
H.saveDoc(doc, __dirname + "/../02-Business-Process/SAMS-QA-SRS-02-Business-Process.docx");
