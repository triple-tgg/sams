// SAMS-QA-SRS-08 — UI/UX Design
const H = require("./_helpers");

const sections = [
    ...H.coverPage({
        docNo: "SAMS-QA-SRS-08",
        docTitle: "UI/UX Design",
        subtitleText: "การออกแบบส่วนติดต่อผู้ใช้ — โมดูล QA",
    }),

    H.h1("1. Design Principles"),
    H.h2("1.1 หลักการออกแบบ"),
    H.makeTable(
        ["หลักการ", "คำอธิบาย"],
        [
            ["Clarity over Cleverness", "ใช้คำที่ผู้ใช้เข้าใจง่าย"],
            ["Consistency", "Pattern เดียวกันทั่วระบบ"],
            ["Feedback", "ทุก action มี response ที่ชัดเจน"],
            ["Progressive Disclosure", "แสดงข้อมูลที่จำเป็นก่อน, รายละเอียดอยู่ใน drawer/modal"],
            ["Mobile-First (responsive)", "ออกแบบให้ใช้งานได้ทุกขนาดจอ"],
            ["Accessibility", "WCAG 2.1 AA"],
        ]
    ),
    H.h2("1.2 Brand Identity"),
    H.diagramPlaceholder("Brand Identity Map", "graph LR — Colors / Fonts / Spacing"),

    H.pageBreak(),

    H.h1("2. Layout Structure"),
    H.h2("2.1 Global Layout (Authenticated)"),
    H.diagramPlaceholder("Global Layout Diagram", "graph TB — Sidebar + TopHeader + Main + Footer"),

    H.h2("2.2 Layout Anatomy (Desktop)"),
    H.diagramPlaceholder("Desktop Layout Wireframe", "ASCII wireframe — Sidebar 256px + Header 64px + Main + Footer"),

    H.h2("2.3 Responsive Breakpoints"),
    H.makeTable(
        ["Breakpoint", "Behavior"],
        [
            ["Desktop (≥1280px)", "Sidebar expanded + full content"],
            ["Laptop (1024-1279px)", "Sidebar collapsible (icon only)"],
            ["Tablet (768-1023px)", "Sidebar overlay drawer"],
            ["Mobile (<768px)", "Bottom navigation, single column"],
        ]
    ),

    H.pageBreak(),

    H.h1("3. Sub-module Screen Maps"),
    H.diagramPlaceholder("QA Module Sitemap", "graph LR — QA → 6 sub-modules → detail screens"),

    H.pageBreak(),

    H.h1("4. Screen Designs (Wireframes)"),
    H.h2("4.1 QA Dashboard"),
    H.diagramPlaceholder("Dashboard Wireframe", "Wireframe — 4 KPI cards + Trend chart + Alerts + Upcoming sessions"),

    H.h2("4.2 Staff List"),
    H.diagramPlaceholder("Staff List Wireframe", "Wireframe — Search/Filter/New/Export + Data table + Pagination"),

    H.h2("4.3 Staff Detail (5 Tabs)"),
    H.diagramPlaceholder("Staff Detail Wireframe", "Wireframe — Avatar + Info + 5 tabs (Profile/Education/Experience/Training/Logbook)"),

    H.h2("4.4 Authorization List"),
    H.diagramPlaceholder("Authorization List Wireframe", "Wireframe — Multi-customer matrix + CRS column"),

    H.h2("4.5 Authorization Drawer (Detail)"),
    H.diagramPlaceholder("Auth Drawer Wireframe", "Wireframe — CRS badge + SAMS section + Customer sections + History"),

    H.h2("4.6 Training Scheduler — Calendar View"),
    H.diagramPlaceholder("Scheduler Calendar Wireframe", "Wireframe — Calendar/List/Gantt tabs + monthly grid + new session button"),

    H.h2("4.7 Monitoring — Compliance View"),
    H.diagramPlaceholder("Monitoring Compliance Wireframe", "Wireframe — Summary + Filter + Compliance matrix table"),

    H.pageBreak(),

    H.h1("5. Component Library"),
    H.h2("5.1 Atomic Components (Shadcn/Radix)"),
    H.makeTable(
        ["Component", "Purpose"],
        [
            ["Button", "Primary/Secondary/Ghost/Destructive"],
            ["Input", "Text/Email/Password/Number/Search"],
            ["Select / Combobox", "Dropdown / Searchable dropdown"],
            ["Date Picker", "Single date / Date range"],
            ["Modal / Dialog", "Confirmations, forms"],
            ["Drawer / Sheet", "Side panel for details"],
            ["Toast", "Notifications"],
            ["Tabs", "Tab navigation"],
            ["Card / Table / Pagination", "Content & data display"],
            ["Badge / Avatar / Skeleton / Alert", "Indicators"],
        ]
    ),
    H.h2("5.2 Composite Components (SAMS-specific)"),
    H.makeTable(
        ["Component", "Purpose"],
        [
            ["<StatusBadge>", "สี/icon ตาม authorization status"],
            ["<ExpiryBadge>", "แสดง countdown (≤30/60/90)"],
            ["<CRSBadge>", "Eligible/Not Eligible"],
            ["<StaffSelect>", "Combobox + filter"],
            ["<AirlineFilter>", "Multi-select 18 airlines"],
            ["<RoleGate>", "Conditional render by role"],
            ["<DataTable>", "Server-side pagination + sort + filter"],
            ["<FormBuilder>", "React Hook Form + Zod wrapper"],
        ]
    ),

    H.pageBreak(),

    H.h1("6. User Flows"),
    H.h2("6.1 Login Flow"),
    H.diagramPlaceholder("Login Flow", "flowchart LR — Open → Login → Validate → Dashboard / Lock"),

    H.h2("6.2 Authorization Approval Flow"),
    H.diagramPlaceholder("Approval Flow", "flowchart TD — QM creates → Submit → Director Approve/Reject → Notify"),

    H.h2("6.3 Training Enrollment Flow (Self-Service)"),
    H.diagramPlaceholder("Self-Enrollment Flow", "flowchart LR — CS Login → Browse → Enroll → Email Receipt → Reminder"),

    H.pageBreak(),

    H.h1("7. Visual Design Tokens"),
    H.h2("7.1 Color Palette"),
    H.makeTable(
        ["Color", "Hex", "Use"],
        [
            ["Primary 900", "#1a3c6e", "Headers, key actions"],
            ["Primary 600", "#2563eb", "Links, secondary buttons"],
            ["Primary 50", "#eff6ff", "Hover backgrounds"],
            ["Success", "#10b981", "Active, success"],
            ["Warning", "#f59e0b", "Expiring, warning"],
            ["Danger", "#ef4444", "Expired, error"],
            ["Neutral 900", "#1f2937", "Body text"],
            ["Neutral 500", "#6b7280", "Muted text"],
            ["Neutral 100", "#f3f4f6", "Card backgrounds"],
            ["White", "#ffffff", "Page background"],
        ]
    ),

    H.h2("7.2 Typography"),
    H.makeTable(
        ["Style", "Font", "Size", "Weight"],
        [
            ["Display", "Inter / Sarabun", "36px", "Bold"],
            ["H1", "Inter / Sarabun", "28px", "Bold"],
            ["H2", "Inter / Sarabun", "22px", "Semibold"],
            ["H3", "Inter / Sarabun", "18px", "Semibold"],
            ["Body", "Inter / Sarabun", "14px", "Regular"],
            ["Small", "Inter / Sarabun", "12px", "Regular"],
            ["Code", "JetBrains Mono", "13px", "Regular"],
        ]
    ),

    H.h2("7.3 Spacing Scale (Tailwind)"),
    H.makeTable(
        ["Token", "Pixel", "Use"],
        [
            ["1", "4px", "Tight icon spacing"],
            ["2", "8px", "Component padding"],
            ["4", "16px", "Card padding"],
            ["6", "24px", "Section spacing"],
            ["8", "32px", "Page padding"],
            ["12", "48px", "Large gaps"],
        ]
    ),

    H.h2("7.4 Iconography"),
    H.p("ใช้ Lucide Icons (consistent set, open source)"),
    H.makeTable(
        ["Icon", "Use"],
        [
            ["Shield", "QA / Authorization"],
            ["User / Users", "Staff"],
            ["BookOpen", "Course"],
            ["Calendar", "Schedule"],
            ["AlertCircle", "Warning"],
            ["CheckCircle", "Success"],
            ["XCircle", "Error"],
            ["Bell", "Notification"],
            ["Settings", "Admin"],
        ]
    ),

    H.pageBreak(),

    H.h1("8. Empty States, Errors, Loading"),
    H.h2("8.1 Empty State"),
    H.bullet("Icon (📭), Title (\"No data found\"), CTA (Add new)"),

    H.h2("8.2 Loading State"),
    H.makeTable(
        ["Type", "Pattern"],
        [
            ["Initial Page Load", "Full-page skeleton"],
            ["Table Refresh", "Row skeletons (5 rows)"],
            ["Button Action", "Spinner inside button"],
            ["Inline", "Inline spinner ข้าง field"],
        ]
    ),

    H.h2("8.3 Error State"),
    H.bullet("Icon (❌), Error message, [Retry] button, [Contact Support] link"),

    H.h2("8.4 Success Toast"),
    H.bullet("Icon (✅), Title, Detail (e.g. \"John Doe (TG-AUTH-0034)\"), close button"),

    H.pageBreak(),

    H.h1("9. Accessibility (WCAG 2.1 AA)"),
    H.h2("9.1 Checklist"),
    H.makeTable(
        ["Item", "ระดับ"],
        [
            ["Keyboard navigation (Tab, Enter, Escape)", "AA"],
            ["Focus visible (clear outline)", "AA"],
            ["Color contrast ≥ 4.5:1 (text)", "AA"],
            ["Color contrast ≥ 3:1 (UI elements)", "AA"],
            ["Don't rely solely on color (use icons + text)", "AA"],
            ["ARIA labels for icon-only buttons", "AA"],
            ["Screen reader compatible", "AA"],
            ["Skip to main content link", "AA"],
            ["Form labels (visible + ARIA)", "AA"],
            ["Error announcements (ARIA live region)", "AA"],
        ]
    ),
    H.h2("9.2 Test Tools"),
    H.bullet("axe DevTools"),
    H.bullet("Lighthouse Accessibility audit"),
    H.bullet("Manual screen reader testing (NVDA / VoiceOver)"),
    H.bullet("Keyboard-only navigation test"),

    H.pageBreak(),

    H.h1("10. Localization (i18n)"),
    H.h2("10.1 Supported Languages"),
    H.makeTable(
        ["Locale", "Direction", "Default?"],
        [
            ["th (ไทย)", "LTR", "✅ Default"],
            ["en (English)", "LTR", "—"],
            ["ar (العربية)", "RTL", "—"],
        ]
    ),
    H.h2("10.2 Localized Elements"),
    H.diagramPlaceholder("i18n Localized Elements", "graph TB — Lang switch → UI strings / Date / Number / RTL layout"),

    H.h1("11. Print/PDF Layouts"),
    H.makeTable(
        ["Form", "Source"],
        [
            ["Staff Profile", "SAMS-FM-CM-036"],
            ["Logbook", "SAMS-FM-CM-041"],
            ["CS Experience Summary", "SAMS-FM-CM-062"],
            ["Training Matrix", "SAMS-FM-CM-014"],
            ["Authorization Certificate", "(custom template)"],
            ["Attendance Sheet", "(custom template)"],
        ]
    ),
    H.note("Print layout ใช้ separate CSS (@media print) — hide sidebar, header, action buttons"),

    H.spacer(),
    H.p("— จบเอกสาร SAMS-QA-SRS-08 —", { italics: true, color: "999999" }),
];

const doc = H.buildDoc({ docNo: "SAMS-QA-SRS-08", sections });
H.saveDoc(doc, __dirname + "/../08-UI-UX-Design/SAMS-QA-SRS-08-UI-UX-Design.docx");
