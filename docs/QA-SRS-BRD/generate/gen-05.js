// SAMS-QA-SRS-05 — Non-Functional Requirements
const H = require("./_helpers");

const sections = [
    ...H.coverPage({
        docNo: "SAMS-QA-SRS-05",
        docTitle: "Non-Functional Requirements",
        subtitleText: "ข้อกำหนดที่ไม่ใช่เชิงฟังก์ชัน — โมดูล QA",
    }),

    H.h1("1. หมวดหมู่ NFR"),
    H.diagramPlaceholder("NFR Categories Mind Map", "mindmap — Performance/Security/Availability/Scalability/Usability/Compat/Maint/Compliance/i18n"),

    H.pageBreak(),

    H.h1("2. NFR-PERF: Performance"),
    H.makeTable(
        ["ID", "ข้อกำหนด", "เป้าหมาย", "วิธีวัด"],
        [
            ["NFR-PERF-001", "Page initial load (P95)", "≤ 3 วินาที", "Lighthouse / RUM"],
            ["NFR-PERF-002", "API response (P95)", "≤ 1 วินาที", "APM"],
            ["NFR-PERF-003", "API response (P99)", "≤ 3 วินาที", "APM"],
            ["NFR-PERF-004", "Dashboard load with full widgets", "≤ 5 วินาที", "Manual + RUM"],
            ["NFR-PERF-005", "Search with 5,000 staff", "≤ 2 วินาที", "Manual + APM"],
            ["NFR-PERF-006", "Export XLSX (10,000 records)", "≤ 30 วินาที", "Manual"],
            ["NFR-PERF-007", "Print PDF (single)", "≤ 5 วินาที", "Manual"],
            ["NFR-PERF-008", "Concurrent users", "200", "Load test"],
            ["NFR-PERF-009", "FCP", "≤ 1.8 วินาที", "Lighthouse"],
            ["NFR-PERF-010", "LCP", "≤ 2.5 วินาที", "Lighthouse"],
            ["NFR-PERF-011", "CLS", "≤ 0.1", "Lighthouse"],
            ["NFR-PERF-012", "TTI", "≤ 3.8 วินาที", "Lighthouse"],
        ]
    ),
    H.h2("2.1 Performance Strategy"),
    H.diagramPlaceholder("Performance Strategy Map", "graph LR — Caching/Pagination/CDN/Compression/Lazy/Indexing"),

    H.pageBreak(),

    H.h1("3. NFR-SEC: Security"),
    H.h2("3.1 Authentication & Authorization"),
    H.makeTable(
        ["ID", "ข้อกำหนด"],
        [
            ["NFR-SEC-001", "JWT token expiry ≤ 30 นาที"],
            ["NFR-SEC-002", "Refresh token expiry ≤ 7 วัน"],
            ["NFR-SEC-003", "Password: ≥ 8 ตัว, mixed case + digit + symbol"],
            ["NFR-SEC-004", "Password hashing: bcrypt (cost ≥ 12)"],
            ["NFR-SEC-005", "Lock account หลัง failed login 5 ครั้ง (30 นาที)"],
            ["NFR-SEC-006", "Force change password ทุก 90 วัน"],
            ["NFR-SEC-007", "ห้าม reuse password 5 รหัสล่าสุด"],
            ["NFR-SEC-008", "All API endpoints ต้อง authenticate"],
        ]
    ),

    H.h2("3.2 Data Security"),
    H.makeTable(
        ["ID", "ข้อกำหนด"],
        [
            ["NFR-SEC-010", "HTTPS only (HSTS enforced)"],
            ["NFR-SEC-011", "TLS ≥ 1.2"],
            ["NFR-SEC-012", "Encrypt PII at rest (AES-256)"],
            ["NFR-SEC-013", "Sensitive fields masked ใน UI"],
            ["NFR-SEC-014", "Secure cookie flags (HttpOnly/Secure/SameSite)"],
            ["NFR-SEC-015", "CSP headers configured"],
        ]
    ),

    H.h2("3.3 OWASP Top 10 Coverage"),
    H.diagramPlaceholder("OWASP Top 10 Mitigation Map", "graph TB — A01-A10 พร้อม mitigation"),
    H.makeTable(
        ["ID", "OWASP", "Mitigation"],
        [
            ["NFR-SEC-020", "A01 Broken Access Control", "RBAC middleware, JWT claims, scope check"],
            ["NFR-SEC-021", "A02 Crypto Failures", "TLS 1.2+, bcrypt, AES-256"],
            ["NFR-SEC-022", "A03 Injection", "Parameterized queries, input validation"],
            ["NFR-SEC-023", "A04 Insecure Design", "Threat modeling"],
            ["NFR-SEC-024", "A05 Misconfiguration", "Security headers, hardening"],
            ["NFR-SEC-025", "A06 Vulnerable Components", "Dependabot + Snyk weekly"],
            ["NFR-SEC-026", "A07 Auth Failures", "Strong password + lockout + MFA (Phase 2)"],
            ["NFR-SEC-027", "A08 Software Integrity", "Signed releases, SRI"],
            ["NFR-SEC-028", "A09 Logging Failures", "Audit log + retention"],
            ["NFR-SEC-029", "A10 SSRF", "URL validation, allowlist"],
        ]
    ),

    H.h2("3.4 Audit & Compliance"),
    H.makeTable(
        ["ID", "ข้อกำหนด"],
        [
            ["NFR-SEC-030", "บันทึกทุก login attempt"],
            ["NFR-SEC-031", "บันทึกทุก critical action"],
            ["NFR-SEC-032", "Audit retention ≥ 5 ปี"],
            ["NFR-SEC-033", "Audit log immutable (append-only)"],
            ["NFR-SEC-034", "Pen-test ก่อน Go-Live"],
        ]
    ),

    H.pageBreak(),

    H.h1("4. NFR-AVAIL: Availability & Reliability"),
    H.makeTable(
        ["ID", "ข้อกำหนด", "เป้าหมาย"],
        [
            ["NFR-AVAIL-001", "System uptime", "≥ 99.5% (~3.5 ชม. downtime/เดือน)"],
            ["NFR-AVAIL-002", "RTO", "≤ 4 ชั่วโมง"],
            ["NFR-AVAIL-003", "RPO", "≤ 1 ชั่วโมง"],
            ["NFR-AVAIL-004", "DB backup", "Daily full + Hourly incremental"],
            ["NFR-AVAIL-005", "Backup retention", "30 วัน online, 5 ปี cold"],
            ["NFR-AVAIL-006", "DR site (Phase 2)", "Read-replica ใน region อื่น"],
            ["NFR-AVAIL-007", "Maintenance window", "เสาร์-อาทิตย์ 22:00-04:00"],
        ]
    ),
    H.h2("4.1 Backup Strategy"),
    H.diagramPlaceholder("Backup Strategy Flow", "flowchart LR — Production DB → Local → Onsite → Offsite → Archive"),

    H.pageBreak(),

    H.h1("5. NFR-SCALE: Scalability"),
    H.makeTable(
        ["ID", "ข้อกำหนด", "เป้าหมาย"],
        [
            ["NFR-SCALE-001", "Staff รองรับ", "5,000 ใน 5 ปี"],
            ["NFR-SCALE-002", "Authorization records", "50,000 ใน 5 ปี"],
            ["NFR-SCALE-003", "Training records", "1,250,000 ใน 5 ปี"],
            ["NFR-SCALE-004", "Concurrent users", "200 (peak)"],
            ["NFR-SCALE-005", "API requests/sec", "500 RPS"],
            ["NFR-SCALE-006", "Horizontal scaling", "Frontend stateless"],
            ["NFR-SCALE-007", "Database scaling", "Read replica (Phase 2)"],
            ["NFR-SCALE-008", "File storage growth", "100 GB / ปี"],
        ]
    ),

    H.pageBreak(),

    H.h1("6. NFR-USAB: Usability"),
    H.makeTable(
        ["ID", "ข้อกำหนด"],
        [
            ["NFR-USAB-001", "เรียนรู้ได้ภายใน 2 ชั่วโมง training"],
            ["NFR-USAB-002", "Common task ≤ 3 clicks"],
            ["NFR-USAB-003", "Error message ภาษาไทยที่เข้าใจได้"],
            ["NFR-USAB-004", "Loading indicator > 1 วินาที"],
            ["NFR-USAB-005", "Confirmation dialog สำหรับ destructive action"],
            ["NFR-USAB-006", "Undo/Edit สำหรับ approval (กลับ Draft)"],
            ["NFR-USAB-007", "Keyboard shortcut (Phase 2)"],
            ["NFR-USAB-008", "WCAG 2.1 Level AA"],
            ["NFR-USAB-009", "Color contrast ≥ 4.5:1"],
            ["NFR-USAB-010", "Screen reader compatible (ARIA)"],
            ["NFR-USAB-011", "Tooltip บน button/icon ที่ไม่ชัดเจน"],
        ]
    ),
    H.h2("6.1 Responsive Design"),
    H.makeTable(
        ["Device", "Min Width", "Layout"],
        [
            ["Desktop", "1280px+", "Full sidebar + content"],
            ["Laptop", "1024-1279px", "Compact sidebar + content"],
            ["Tablet", "768-1023px", "Collapsible sidebar"],
            ["Mobile", "< 768px", "Bottom nav (limited)"],
        ]
    ),
    H.note("Phase 1 prioritize Desktop/Laptop. Mobile = best-effort"),

    H.pageBreak(),

    H.h1("7. NFR-COMPAT: Compatibility"),
    H.h2("7.1 Browser Support"),
    H.makeTable(
        ["Browser", "Min Version", "Support Level"],
        [
            ["Chrome", "110+", "✅ Full"],
            ["Edge", "110+", "✅ Full"],
            ["Firefox", "110+", "✅ Full"],
            ["Safari", "16+", "✅ Full"],
            ["IE 11", "—", "❌ Not supported"],
            ["Mobile Chrome", "Latest", "⚠️ Best-effort"],
            ["Mobile Safari", "Latest", "⚠️ Best-effort"],
        ]
    ),
    H.h2("7.2 OS Support"),
    H.makeTable(
        ["OS", "Status"],
        [
            ["Windows 10/11", "✅ Tested"],
            ["macOS 12+", "✅ Tested"],
            ["Linux (Chrome)", "✅ Tested"],
            ["iOS 15+", "⚠️ Best-effort"],
            ["Android 10+", "⚠️ Best-effort"],
        ]
    ),

    H.pageBreak(),

    H.h1("8. NFR-MAINT: Maintainability"),
    H.makeTable(
        ["ID", "ข้อกำหนด"],
        [
            ["NFR-MAINT-001", "Code coverage ≥ 70% (unit)"],
            ["NFR-MAINT-002", "E2E test cover critical journeys"],
            ["NFR-MAINT-003", "TypeScript strict mode"],
            ["NFR-MAINT-004", "ESLint + Prettier ใน CI"],
            ["NFR-MAINT-005", "Conventional commit messages"],
            ["NFR-MAINT-006", "Semantic versioning"],
            ["NFR-MAINT-007", "API versioning (/api/v1)"],
            ["NFR-MAINT-008", "Documentation (README/API/Architecture)"],
            ["NFR-MAINT-009", "Structured JSON logs"],
            ["NFR-MAINT-010", "APM + error tracking"],
        ]
    ),

    H.pageBreak(),

    H.h1("9. NFR-COMP: Compliance"),
    H.h2("9.1 Aviation Regulation"),
    H.makeTable(
        ["ID", "ข้อกำหนด"],
        [
            ["NFR-COMP-001", "CAAT Part-145 compliant"],
            ["NFR-COMP-002", "EASA Part-145 compliant"],
            ["NFR-COMP-003", "Audit trail immutable + ≥ 5 ปี"],
            ["NFR-COMP-004", "Form templates ตรง Authority"],
        ]
    ),
    H.h2("9.2 Data Protection (PDPA)"),
    H.makeTable(
        ["ID", "ข้อกำหนด"],
        [
            ["NFR-COMP-010", "ขอ consent สำหรับ personal data"],
            ["NFR-COMP-011", "Right to access — download ข้อมูลตนเอง"],
            ["NFR-COMP-012", "Right to be forgotten — process ลบข้อมูล"],
            ["NFR-COMP-013", "Data Processing Record"],
            ["NFR-COMP-014", "Breach notification ≤ 72 ชม."],
        ]
    ),

    H.pageBreak(),

    H.h1("10. NFR-I18N: Internationalization"),
    H.makeTable(
        ["ID", "ข้อกำหนด"],
        [
            ["NFR-I18N-001", "ภาษาไทย (เริ่มต้น)"],
            ["NFR-I18N-002", "ภาษาอังกฤษ"],
            ["NFR-I18N-003", "ภาษาอาหรับ (RTL) — สำหรับ MEA airlines"],
            ["NFR-I18N-004", "Date format: ตามภาษา (พ.ศ./ค.ศ.)"],
            ["NFR-I18N-005", "Number format: ตาม locale"],
            ["NFR-I18N-006", "Time zone: Asia/Bangkok + UTC toggle"],
            ["NFR-I18N-007", "Currency display (Phase 2)"],
        ]
    ),
    H.diagramPlaceholder("Language Switcher UI", "graph LR — User → Switcher → TH/EN/AR (RTL)"),

    H.pageBreak(),

    H.h1("11. NFR Verification Methods"),
    H.makeTable(
        ["NFR Category", "Verification Method"],
        [
            ["Performance", "Load test (k6/JMeter) + Lighthouse + APM"],
            ["Security", "Pen-test + SAST + DAST + Code review"],
            ["Availability", "Synthetic monitoring + Uptime tracker"],
            ["Scalability", "Load test scenarios"],
            ["Usability", "User testing + UAT + Heatmap"],
            ["Compatibility", "Browser matrix testing"],
            ["Maintainability", "Code metrics (Sonar) + Coverage"],
            ["Compliance", "Audit checklist + Authority sign-off"],
            ["i18n", "Manual test + Pseudo-localization"],
        ]
    ),

    H.h1("12. SLA Summary"),
    H.makeTable(
        ["Metric", "Target", "Penalty"],
        [
            ["Uptime", "99.5%/month", "Credit ตามสัญญา"],
            ["API P95 latency", "< 1 sec", "Investigate > 1.5s"],
            ["Critical bug fix", "≤ 4 ชม.", "—"],
            ["Major bug fix", "≤ 1 day", "—"],
            ["Minor bug fix", "≤ 1 week", "—"],
            ["Support response", "< 30 min (business hrs)", "—"],
        ]
    ),

    H.spacer(),
    H.p("— จบเอกสาร SAMS-QA-SRS-05 —", { italics: true, color: "999999" }),
];

const doc = H.buildDoc({ docNo: "SAMS-QA-SRS-05", sections });
H.saveDoc(doc, __dirname + "/../05-Non-Functional-Requirements/SAMS-QA-SRS-05-NFR.docx");
