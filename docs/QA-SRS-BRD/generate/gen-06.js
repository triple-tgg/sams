// SAMS-QA-SRS-06 — System Architecture
const H = require("./_helpers");

const sections = [
    ...H.coverPage({
        docNo: "SAMS-QA-SRS-06",
        docTitle: "System Architecture",
        subtitleText: "สถาปัตยกรรมระบบ — โมดูล QA",
    }),

    H.h1("1. Architecture Overview"),
    H.h2("1.1 High-Level Architecture (3-Tier)"),
    H.diagramPlaceholder("3-Tier Architecture Block Diagram", "graph TB — Browser / Next.js+API+Worker / DB+File+Cache / SMTP+HR"),

    H.h2("1.2 Architecture Principles"),
    H.makeTable(
        ["หลักการ", "คำอธิบาย"],
        [
            ["Separation of Concerns", "UI / Business / Data ชัดเจน"],
            ["Stateless Frontend", "ไม่เก็บ session ที่ Frontend (ยกเว้น JWT)"],
            ["API-First", "ทุก feature เริ่มจาก API contract"],
            ["Defense in Depth", "Auth ที่ Frontend + Backend + DB"],
            ["Single Responsibility", "แต่ละ component ทำหน้าที่เดียว"],
            ["Progressive Enhancement", "RSC + Client Component แบ่งบทบาทชัดเจน"],
        ]
    ),

    H.pageBreak(),

    H.h1("2. Frontend Architecture"),
    H.h2("2.1 Frontend Stack"),
    H.diagramPlaceholder("Frontend Stack Tree", "graph TD — Next.js → RSC/CC + Routing + UI + State"),

    H.h2("2.2 Folder Structure"),
    H.bullet("app/[locale]/(protected)/qa/{dashboard, staff, authorization, monitoring, course-management, training-scheduler}"),
    H.bullet("components/{ui, partials, auth}"),
    H.bullet("lib/api/{client, hooks, services}"),
    H.bullet("lib/store/ — Redux store"),
    H.bullet("messages/ — i18n: th.json, en.json, ar.json"),

    H.h2("2.3 Component Hierarchy (QA Module)"),
    H.diagramPlaceholder("QA Module Component Tree", "graph TD — Layout → withAuth → QA Layout → 6 sub-pages → Detail tabs"),

    H.h2("2.4 State Management Strategy"),
    H.makeTable(
        ["State Type", "Tool", "ตัวอย่าง"],
        [
            ["Server State", "React Query (TanStack v5)", "Staff list, Auth records"],
            ["Auth State", "Redux Toolkit + persist", "User info, JWT token"],
            ["UI State", "useState / useReducer", "Modal, form draft"],
            ["URL State", "Next.js searchParams", "Filters, pagination"],
            ["Form State", "React Hook Form + Zod", "Validation, submission"],
            ["Theme", "next-themes", "Light/Dark mode"],
            ["Locale", "next-intl", "th/en/ar switching"],
        ]
    ),

    H.pageBreak(),

    H.h1("3. Backend Architecture"),
    H.note("Backend จัดการโดยทีมแยก — ส่วนนี้สรุปจาก Frontend perspective"),
    H.h2("3.1 Backend Stack (.NET API)"),
    H.diagramPlaceholder("Backend Service Diagram", "graph TB — LB → API instances → Auth/Staff/Auth-QA/Training/Notif/Audit Services → DB/SMTP/Queue"),

    H.h2("3.2 API Layers"),
    H.diagramPlaceholder("API Middleware Pipeline", "graph LR — Request → CORS → Auth → RBAC → Audit → Controller → Service → Repository → DB"),

    H.h2("3.3 API Design Principles"),
    H.makeTable(
        ["หลักการ", "รายละเอียด"],
        [
            ["REST", "URL = resource, HTTP method = action"],
            ["JSON", "Request/Response body"],
            ["Versioning", "/api/v1/..."],
            ["Pagination", "?page=1&size=50"],
            ["Filtering", "?status=active&customer=TG"],
            ["Sorting", "?sort=expiryDate&order=asc"],
            ["Error Format", "{ code, message, details }"],
        ]
    ),

    H.pageBreak(),

    H.h1("4. Data Architecture"),
    H.h2("4.1 Data Layer Components"),
    H.diagramPlaceholder("Data Layer Architecture", "graph TB — App → ORM → Pool → Primary/Replica + File API → Object Storage + Cache"),

    H.h2("4.2 Data Storage Strategy"),
    H.makeTable(
        ["Data Type", "Storage", "Reason"],
        [
            ["Transactional", "RDBMS", "ACID, relations"],
            ["Audit Logs", "RDBMS (append-only)", "Immutable, queryable"],
            ["Files (Avatar/Cert/License)", "Object Storage", "Large blobs"],
            ["Generated Reports (PDF/XLSX)", "Object Storage (temp 7d)", "Async generation"],
            ["Session/Cache (Phase 2)", "Redis", "Fast access"],
            ["Email Queue (NEW)", "DB queue table", "Reliable retry"],
        ]
    ),

    H.h2("4.3 Database Type Selection"),
    H.makeTable(
        ["Module", "Primary Storage", "Schema Style"],
        [
            ["Staff", "RDBMS", "Normalized (3NF)"],
            ["Authorization", "RDBMS", "Normalized + JSON for scope"],
            ["Training Records", "RDBMS", "Normalized + JSON for course-data"],
            ["Audit Log", "RDBMS", "Append-only flat table"],
            ["File Metadata", "RDBMS", "URL reference only"],
            ["File Content", "Object Storage", "Direct upload via signed URL"],
        ]
    ),
    H.note("รายละเอียด schema เต็มอยู่ใน SRS-07 (Data Design)"),

    H.pageBreak(),

    H.h1("5. Integration Architecture"),
    H.h2("5.1 Internal Integration"),
    H.diagramPlaceholder("Internal Integration Map", "graph LR — QA → Auth/Master/HR/File/Notif/Audit"),

    H.h2("5.2 External Integration"),
    H.diagramPlaceholder("External Integration Map", "graph LR — QA → SMTP, CAAT (P2), Customer Systems (P3)"),
    H.note("รายละเอียดเต็มอยู่ใน SRS-09 (Integration & Interface)"),

    H.pageBreak(),

    H.h1("6. Deployment Architecture"),
    H.h2("6.1 Environment Topology"),
    H.diagramPlaceholder("Dev/UAT/Prod Topology", "graph TB — DEV → UAT → PROD with LB and DB replicas"),

    H.h2("6.2 Deployment Pipeline"),
    H.diagramPlaceholder("CI/CD Pipeline", "flowchart LR — Push → Lint → Test → Build → Scan → Deploy Dev → UAT (manual) → Prod (manual)"),

    H.h2("6.3 Infrastructure Requirements"),
    H.makeTable(
        ["Environment", "Frontend", "Backend", "DB"],
        [
            ["Dev", "1 instance, 2 vCPU, 4 GB", "1 instance", "Shared dev DB"],
            ["UAT", "1 instance, 2 vCPU, 4 GB", "1 instance", "Dedicated UAT DB"],
            ["Prod", "2 instances, 4 vCPU, 8 GB ea.", "2 instances", "HA Primary + Replica"],
        ]
    ),

    H.pageBreak(),

    H.h1("7. Security Architecture"),
    H.h2("7.1 Defense in Depth"),
    H.diagramPlaceholder("Defense-in-Depth Layers", "graph TB — User → WAF → LB+TLS → FE → API MW → Service → DB Auth"),

    H.h2("7.2 Auth Flow"),
    H.diagramPlaceholder("Login + JWT Refresh Sequence", "sequenceDiagram — Login → JWT/Refresh → API call → JWT verify → RBAC → Refresh"),

    H.pageBreak(),

    H.h1("8. Background Jobs Architecture"),
    H.newDesign("Background Jobs ทั้งหมดเป็น NEW DESIGN — ยังไม่มีในโค้ดปัจจุบัน"),
    H.h2("8.1 Scheduled Jobs"),
    H.diagramPlaceholder("Scheduled Jobs Map", "graph TB — Scheduler → 5 jobs at different times"),
    H.makeTable(
        ["Job", "ความถี่", "หน้าที่"],
        [
            ["Scan Expiry", "Daily 06:00", "Find expired/expiring → trigger alerts"],
            ["Email Digest", "Daily 23:00", "Roll-up alerts to Manager"],
            ["Session Cleanup", "Weekly Sun 02:00", "Delete expired sessions"],
            ["Compliance Report", "Monthly 1st", "Auto-generate + email"],
            ["Staff Archive", "Daily 04:00", "Archive resigned > 90 days"],
        ]
    ),

    H.h2("8.2 Email Queue Architecture"),
    H.diagramPlaceholder("Email Queue Flow", "flowchart LR — Enqueue → Queue → Worker → SMTP → Mark sent / Retry 3 times → Failed"),

    H.pageBreak(),

    H.h1("9. Monitoring & Observability"),
    H.diagramPlaceholder("Observability Stack", "graph TB — App → Logs/Metrics/Traces → ELK/Prometheus/OTel → Alert → On-call"),
    H.makeTable(
        ["Layer", "Tool (Recommended)", "Purpose"],
        [
            ["Log Aggregation", "ELK / Grafana Loki", "Centralized log search"],
            ["Metrics", "Prometheus + Grafana", "Performance monitoring"],
            ["Distributed Tracing", "OpenTelemetry", "Request flow"],
            ["Error Tracking", "Sentry", "FE/BE errors"],
            ["Synthetic Monitoring", "UptimeRobot / Datadog", "Up/Down detection"],
            ["RUM", "Datadog RUM / New Relic", "Real user metrics"],
        ]
    ),

    H.h1("10. Decision Records"),
    H.makeTable(
        ["Decision", "เลือก", "เหตุผล"],
        [
            ["Frontend Framework", "Next.js 16 (App Router)", "RSC + SSR + ecosystem"],
            ["State Management", "React Query + Redux", "Server vs auth state แยก"],
            ["UI Components", "Shadcn + Radix", "Customizable + accessible"],
            ["Styling", "TailwindCSS 4", "Utility-first + design system"],
            ["Authentication", "JWT (existing)", "สอดคล้อง Backend"],
            ["Database", "RDBMS", "ACID + relations + reporting"],
            ["File Storage", "Object Storage", "Scalable + cost-effective"],
            ["Background Jobs (NEW)", "Hangfire (.NET) / cron", "Reliable scheduling"],
        ]
    ),

    H.spacer(),
    H.p("— จบเอกสาร SAMS-QA-SRS-06 —", { italics: true, color: "999999" }),
];

const doc = H.buildDoc({ docNo: "SAMS-QA-SRS-06", sections });
H.saveDoc(doc, __dirname + "/../06-System-Architecture/SAMS-QA-SRS-06-System-Architecture.docx");
