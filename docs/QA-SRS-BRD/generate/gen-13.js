// SAMS-QA-SRS-13 — Risk & Impact Analysis
const H = require("./_helpers");

const sections = [
    ...H.coverPage({
        docNo: "SAMS-QA-SRS-13",
        docTitle: "Risk & Impact Analysis",
        subtitleText: "การวิเคราะห์ความเสี่ยงและผลกระทบ — โมดูล QA",
    }),

    H.h1("1. Risk Assessment Methodology"),
    H.h2("1.1 Risk Scoring Matrix"),
    H.makeTable(
        ["โอกาสเกิด \\ ผลกระทบ", "ต่ำ (1)", "ปานกลาง (2)", "สูง (3)", "วิกฤต (4)"],
        [
            ["น้อย (1)", "1 🟢", "2 🟢", "3 🟡", "4 🟡"],
            ["เป็นไปได้ (2)", "2 🟢", "4 🟡", "6 🟠", "8 🔴"],
            ["น่าจะเกิด (3)", "3 🟡", "6 🟠", "9 🔴", "12 🔴"],
            ["เกิดบ่อย (4)", "4 🟡", "8 🔴", "12 🔴", "16 🔴"],
        ]
    ),
    H.bullet("🟢 Low (1-2): ไม่ต้องดำเนินการพิเศษ"),
    H.bullet("🟡 Medium (3-4): ติดตาม, มี contingency plan"),
    H.bullet("🟠 High (6): ต้องมี mitigation plan ที่ชัดเจน"),
    H.bullet("🔴 Critical (8-16): ต้อง mitigate ทันที"),

    H.pageBreak(),

    H.h1("2. Risk Categories Overview"),
    H.diagramPlaceholder("Risk Categories Mind Map", "mindmap — Technical / Business / Operational / External"),

    H.pageBreak(),

    H.h1("3. Risk Register"),
    H.h2("3.1 Technical Risks"),
    H.makeTable(
        ["ID", "ความเสี่ยง", "โอกาส", "ผลกระทบ", "คะแนน", "Mitigation"],
        [
            ["TR-01", "Server outage / Downtime", "2", "4", "8 🔴", "HA + Auto failover + 99.5% SLA"],
            ["TR-02", "Database corruption / loss", "1", "4", "4 🟡", "Daily backup + offsite + restore drill"],
            ["TR-03", "Security breach (SQLi/XSS)", "2", "4", "8 🔴", "OWASP guidelines, security audit, WAF"],
            ["TR-04", "API performance degradation", "3", "3", "9 🔴", "Pagination, indexing, caching"],
            ["TR-05", "Email delivery failure (SMTP down)", "2", "2", "4 🟡", "Retry queue, fallback ใน Dashboard"],
            ["TR-06", "File storage full", "2", "3", "6 🟠", "Monitoring + alert + archival policy"],
            ["TR-07", "Browser incompatibility", "2", "2", "4 🟡", "Specify browsers, automated test"],
            ["TR-08", "Authorization token leak", "2", "4", "8 🔴", "Short-lived JWT + refresh + HTTPS"],
        ]
    ),

    H.h2("3.2 Business Risks"),
    H.makeTable(
        ["ID", "ความเสี่ยง", "โอกาส", "ผลกระทบ", "คะแนน", "Mitigation"],
        [
            ["BR-01", "CAAT/EASA audit ไม่ผ่าน", "1", "4", "4 🟡", "Audit log immutable, retention 5 ปี"],
            ["BR-02", "Authorization expiry ไม่แจ้งเตือน", "1", "4", "4 🟡", "Multi-channel alert: Dashboard + Email"],
            ["BR-03", "CRS Eligibility คำนวณผิด", "2", "4", "8 🔴", "Unit test + Manual override + Audit"],
            ["BR-04", "Data integrity ผิด (expiry > start)", "2", "3", "6 🟠", "DB constraint + UI/Server validation"],
            ["BR-05", "Customer ไม่พอใจ format report", "2", "2", "4 🟡", "Workshop + ปรับ template ก่อน Go-Live"],
            ["BR-06", "Compliance % แสดงผิด", "2", "3", "6 🟠", "Validation rules + Daily reconciliation"],
        ]
    ),

    H.h2("3.3 Operational Risks"),
    H.makeTable(
        ["ID", "ความเสี่ยง", "โอกาส", "ผลกระทบ", "คะแนน", "Mitigation"],
        [
            ["OR-01", "Migration data ผิดพลาด", "3", "4", "12 🔴", "Migration script + dry-run + validation"],
            ["OR-02", "User adoption ต่ำ", "2", "3", "6 🟠", "Training + super user + change mgmt"],
            ["OR-03", "Process จริงต่างจาก spec", "3", "3", "9 🔴", "Workshop, prototype review, phased"],
            ["OR-04", "Knowledge loss (key person leave)", "2", "3", "6 🟠", "Documentation + code review"],
            ["OR-05", "UAT user ไม่ active", "3", "3", "9 🔴", "เวลาชัดเจน + sign-off ทุก feature"],
            ["OR-06", "Bug ใน production กระทบ workflow", "2", "3", "6 🟠", "CI/CD + Smoke test + Rollback plan"],
        ]
    ),

    H.h2("3.4 External Risks"),
    H.makeTable(
        ["ID", "ความเสี่ยง", "โอกาส", "ผลกระทบ", "คะแนน", "Mitigation"],
        [
            ["ER-01", "CAAT regulation เปลี่ยน", "1", "3", "3 🟡", "Modular schema, Configuration-driven"],
            ["ER-02", "HR System API เปลี่ยน contract", "2", "2", "4 🟡", "Adapter pattern, API versioning"],
            ["ER-03", "3rd-party library security CVE", "3", "2", "6 🟠", "Snyk/Dependabot + regular update"],
            ["ER-04", "Power outage / Network failure", "1", "3", "3 🟡", "UPS, redundant network, offline cache"],
        ]
    ),

    H.pageBreak(),

    H.h1("4. Top 5 Critical Risks (คะแนน ≥ 9)"),

    H.h2("4.1 OR-01: Migration data ผิดพลาด (Score 12)"),
    H.bold("สถานการณ์: นำเข้าข้อมูลจาก Excel เก่า 5 ปีย้อนหลัง"),
    H.p("ผลกระทบ:"),
    H.bullet("Compliance % แสดงผิด → กระทบความน่าเชื่อถือ"),
    H.bullet("Authorization บางคนหายไป → CS ออก CRS ไม่ได้"),
    H.bullet("Audit ของ Authority ผ่านไม่ได้"),
    H.diagramPlaceholder("Migration Mitigation Flow", "flowchart LR — Profile → Script → Dry-run → Validate → Approve → Production"),

    H.h2("4.2 TR-04: API Performance Degradation (Score 9)"),
    H.bullet("Database indexing บน fields ที่ค้นหาบ่อย (employeeCode, expiryDate)"),
    H.bullet("Pagination แทนการ load ทั้งหมด"),
    H.bullet("React Query caching (staleTime, cacheTime)"),
    H.bullet("API response compression (gzip)"),
    H.bullet("Monitoring (P95 < 1s)"),

    H.h2("4.3 OR-03: Process จริงต่างจาก Spec (Score 9)"),
    H.bullet("Workshop กับผู้ใช้งานทุก role ก่อนเริ่ม dev"),
    H.bullet("Prototype review ทุก 2 สัปดาห์"),
    H.bullet("Phased rollout (Pilot กับ 1 แผนกก่อน)"),
    H.bullet("Feedback channel ที่ active"),

    H.h2("4.4 OR-05: UAT User ไม่ Active (Score 9)"),
    H.bullet("กำหนดเวลา UAT ชัดเจน + ส่งผู้แทน 100% time ในช่วง UAT"),
    H.bullet("UAT checklist ละเอียด (อยู่ใน SRS-11)"),
    H.bullet("Sign-off ต่อ feature, ไม่ใช่รวมท้าย"),
    H.bullet("Daily UAT standup"),

    H.h2("4.5 Security Risks (TR-01 / TR-03 / TR-08 / BR-03)"),
    H.bullet("Security audit ก่อน Go-Live"),
    H.bullet("OWASP Top 10 compliance"),
    H.bullet("Penetration test"),
    H.bullet("JWT short-lived + refresh token"),
    H.bullet("HTTPS enforced + HSTS"),

    H.pageBreak(),

    H.h1("5. Risk Heat Map"),
    H.diagramPlaceholder("Risk Heat Map (Likelihood × Impact)", "quadrantChart — แสดง risk แต่ละตัวบน Likelihood-Impact axes"),

    H.pageBreak(),

    H.h1("6. Impact Analysis"),
    H.h2("6.1 ผลกระทบจาก Critical Risk"),
    H.makeTable(
        ["Risk", "Impact ทางธุรกิจ", "Impact ทางการเงิน", "Impact ทางชื่อเสียง"],
        [
            ["OR-01 Migration", "CS ออก CRS ไม่ได้", "สูง — สูญเสียลูกค้า", "สูง — Audit fail"],
            ["TR-04 Performance", "User productivity ลดลง", "ปานกลาง — efficiency loss", "ต่ำ"],
            ["OR-03 Process Mismatch", "Re-development", "สูง — rework cost", "ปานกลาง"],
            ["TR-03 Security", "Data leak", "สูงมาก — fine + lawsuit", "สูงมาก"],
            ["BR-03 CRS Calc", "CS ที่ไม่มีสิทธิ์ออก CRS", "สูง — Authority sanction", "สูงมาก"],
        ]
    ),

    H.h2("6.2 Business Continuity"),
    H.diagramPlaceholder("Incident Response Flow", "flowchart TD — Incident → Classify → Escalate/Mitigate → Manual Fallback"),

    H.h2("6.3 Manual Fallback Plan"),
    H.p("หากระบบ down เกิน 4 ชั่วโมง ให้ใช้ Excel template สำรองที่เตรียมไว้:"),
    H.bullet("Auth_Manual_Backup.xlsx — บันทึก Authorization ชั่วคราว"),
    H.bullet("Training_Manual_Backup.xlsx — บันทึก Training ชั่วคราว"),
    H.bullet("เมื่อระบบกลับมา: Import data ผ่าน Bulk Import Tool (SRS-04 §FR-IMP-01)"),

    H.pageBreak(),

    H.h1("7. Risk Monitoring & Review"),
    H.h2("7.1 Risk Review Cadence"),
    H.makeTable(
        ["ระยะ", "ความถี่", "ผู้เข้าร่วม"],
        [
            ["Development", "ทุก 2 สัปดาห์ (sprint review)", "Dev Team + PM"],
            ["UAT", "ทุกสัปดาห์", "PM + QA Lead + Stakeholder"],
            ["Pre Go-Live", "ทุกวัน", "ทุกคน"],
            ["Post Go-Live (Month 1)", "ทุกสัปดาห์", "PM + Stakeholder"],
            ["Production Steady", "ทุกเดือน", "PM + Stakeholder"],
        ]
    ),

    H.h2("7.2 KPI ติดตามความเสี่ยง"),
    H.makeTable(
        ["KPI", "เป้าหมาย", "Trigger ทบทวน Risk"],
        [
            ["Uptime", "≥ 99.5%", "< 99% → ทบทวน TR-01"],
            ["API P95", "≤ 1s", "> 1.5s → ทบทวน TR-04"],
            ["Bug count (Production)", "≤ 5 / month", "> 10 → ทบทวน OR-06"],
            ["User active rate", "≥ 80%", "< 60% → ทบทวน OR-02"],
            ["Compliance % accuracy", "100%", "< 100% → ทบทวน BR-03/06"],
        ]
    ),

    H.h1("8. Risk Owner"),
    H.makeTable(
        ["Risk Category", "Primary Owner", "Backup"],
        [
            ["Technical (TR)", "CTO / Tech Lead", "Senior Developer"],
            ["Business (BR)", "QA Director", "QA Manager"],
            ["Operational (OR)", "Project Manager", "Business Analyst"],
            ["External (ER)", "Project Manager", "Architect"],
        ]
    ),

    H.spacer(),
    H.p("— จบเอกสาร SAMS-QA-SRS-13 —", { italics: true, color: "999999" }),
];

const doc = H.buildDoc({ docNo: "SAMS-QA-SRS-13", sections });
H.saveDoc(doc, __dirname + "/../13-Risk-Impact/SAMS-QA-SRS-13-Risk-Impact.docx");
