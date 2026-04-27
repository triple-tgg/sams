// SAMS-QA-SRS-12 — Implementation Plan
const H = require("./_helpers");

const sections = [
    ...H.coverPage({
        docNo: "SAMS-QA-SRS-12",
        docTitle: "Implementation Plan",
        subtitleText: "แผนการพัฒนาและการนำไปใช้งาน — โมดูล QA",
    }),

    H.h1("1. Project Overview"),
    H.h2("1.1 Phasing Strategy"),
    H.diagramPlaceholder("3-Phase Roadmap", "graph LR — Phase 1 (3mo) → Phase 2 (3mo) → Phase 3 (TBD)"),
    H.h2("1.2 Phase Scope Summary"),
    H.makeTable(
        ["Phase", "ระยะเวลา", "Scope", "Go-Live"],
        [
            ["Phase 1: Core MVP", "3 เดือน", "Staff/Auth/Monitor/Dashboard + RBAC + Audit + Notification", "M+3"],
            ["Phase 2: Enhancement", "3 เดือน", "Course Mgmt + Scheduler advanced + CAAT + Reports", "M+6"],
            ["Phase 3: Advanced", "TBD", "Mobile + Customer API + AI + Multi-tenant", "TBD"],
        ]
    ),

    H.pageBreak(),

    H.h1("2. Phase 1 Plan (3 เดือน)"),
    H.h2("2.1 Phase 1 Timeline"),
    H.diagramPlaceholder("Phase 1 Gantt Chart", "gantt — Setup/Backend/Frontend/Test/Deploy across 13 weeks"),

    H.h2("2.2 Phase 1 Deliverables"),
    H.makeTable(
        ["Deliverable", "Owner", "Due"],
        [
            ["Requirements workshop minutes", "PM", "Week 2"],
            ["API contract (OpenAPI spec)", "Architect", "Week 4"],
            ["Database migration scripts", "Backend", "Week 6"],
            ["Working Staff module", "FE+BE", "Week 8"],
            ["Working Authorization module", "FE+BE", "Week 10"],
            ["Working Dashboard", "FE+BE", "Week 11"],
            ["RBAC + Audit + Notification", "FE+BE", "Week 11"],
            ["UAT package + scripts", "QA", "Week 11"],
            ["Production deployment", "DevOps", "Week 13"],
        ]
    ),

    H.h2("2.3 Phase 1 Sprint Breakdown"),
    H.makeTable(
        ["Sprint", "Focus", "Critical Output"],
        [
            ["Sprint 1 (W1-2)", "Setup + Workshop", "Requirements doc, environment ready"],
            ["Sprint 2 (W3-4)", "Architecture + DB schema", "ER + Migration script"],
            ["Sprint 3 (W5-6)", "Auth + RBAC", "Login + permission middleware"],
            ["Sprint 4 (W7-8)", "Staff Module", "Full CRUD working"],
            ["Sprint 5 (W9-10)", "Authorization Module", "Lifecycle + CRS calc"],
            ["Sprint 6 (W11-12)", "Monitoring + Dashboard + Polish", "Auto-alerts, audit, reports"],
            ["UAT/Deploy (W13)", "UAT, fix, deploy", "Production live"],
        ]
    ),

    H.pageBreak(),

    H.h1("3. Team Structure"),
    H.h2("3.1 Phase 1 Team"),
    H.diagramPlaceholder("Team Org Chart", "graph TB — PM/BA/Architect → FE/BE/QA/DevOps"),

    H.h2("3.2 Roles & Responsibilities"),
    H.makeTable(
        ["Role", "Count", "Responsibilities"],
        [
            ["Project Manager", "1", "Schedule, risk, communication"],
            ["Business Analyst", "1", "Requirements, workflow, UAT facilitation"],
            ["Architect / Tech Lead", "1", "Architecture, code review"],
            ["Frontend Developer", "2", "UI, integration"],
            ["Backend Developer", "2", "API, database, services"],
            ["QA Engineer", "1", "Test plan, automation, manual UAT"],
            ["DevOps Engineer", "0.5 (shared)", "CI/CD, deployment"],
            ["UX Designer", "0.5 (shared)", "Wireframes, design review"],
        ]
    ),

    H.h2("3.3 RACI Matrix"),
    H.makeTable(
        ["Activity", "PM", "BA", "Arch", "FE", "BE", "QA", "DevOps", "Stakeholder"],
        [
            ["Requirements gathering", "A", "R", "C", "I", "I", "I", "I", "C"],
            ["Architecture design", "I", "C", "R", "C", "C", "C", "C", "I"],
            ["API contract", "I", "C", "A", "C", "R", "C", "I", "I"],
            ["Frontend dev", "I", "I", "C", "R", "C", "C", "I", "I"],
            ["Backend dev", "I", "I", "C", "C", "R", "C", "I", "I"],
            ["Unit/Integration test", "I", "I", "I", "R", "R", "C", "I", "I"],
            ["UAT", "C", "A", "I", "I", "I", "R", "I", "C"],
            ["Deployment", "A", "I", "C", "C", "C", "C", "R", "I"],
        ]
    ),
    H.note("R=Responsible, A=Accountable, C=Consulted, I=Informed"),

    H.pageBreak(),

    H.h1("4. Phase 2 Plan (3 เดือน, M+3 ถึง M+6)"),
    H.h2("4.1 Phase 2 Scope"),
    H.diagramPlaceholder("Phase 2 Scope Map", "graph LR — Course/Scheduler/CAAT/Reports/Self-Service/MFA"),

    H.h2("4.2 Phase 2 Timeline"),
    H.diagramPlaceholder("Phase 2 Gantt Chart", "gantt — Course/Scheduler/Integration/MFA across 12 weeks"),

    H.h1("5. Phase 3 Plan (TBD)"),
    H.makeTable(
        ["Feature", "Trigger Condition"],
        [
            ["Mobile Native App", "User feedback ขอ + budget approve"],
            ["Customer Webhook API", "Customer airline พร้อมรับ"],
            ["AI Competency Prediction", "Data 2+ ปีพร้อม + business case"],
            ["Multi-tenant", "มี MRO อื่นต้องการใช้"],
        ]
    ),

    H.pageBreak(),

    H.h1("6. Migration Strategy"),
    H.h2("6.1 Data Migration Plan"),
    H.diagramPlaceholder("Migration Flow", "flowchart TD — Profiling → Script → Dry-run → UAT → Production → Validation"),

    H.h2("6.2 Migration Checklist"),
    H.makeTable(
        ["Item", "Owner", "Status"],
        [
            ["Excel data profiling", "BA", "Pre-Sprint 5"],
            ["Migration script ready", "BE", "Sprint 6"],
            ["Staging environment loaded", "DevOps", "Sprint 6"],
            ["Dry-run executed", "BE+QA", "Sprint 7 (W11)"],
            ["Validation report reviewed", "BA+QA", "Sprint 7 (W11)"],
            ["UAT users approve", "Stakeholder", "Sprint 8 (W12)"],
            ["Production migration scheduled", "DevOps", "Sprint 8 (W12)"],
            ["Cut-over plan documented", "PM", "Sprint 8 (W12)"],
            ["Rollback plan tested", "DevOps", "Sprint 8 (W12)"],
        ]
    ),

    H.pageBreak(),

    H.h1("7. Cut-over & Go-Live Plan"),
    H.h2("7.1 Go-Live Day Timeline (Saturday)"),
    H.makeTable(
        ["เวลา", "Activity", "Owner", "Duration"],
        [
            ["22:00 (Fri)", "Notification ส่ง user", "PM", "—"],
            ["22:00", "Final Excel export from old system", "BA", "2 ชม."],
            ["00:00 (Sat)", "Database migration start", "BE+DevOps", "4 ชม."],
            ["04:00", "Validation report", "QA", "1 ชม."],
            ["05:00", "Smoke test on production", "QA+BA", "2 ชม."],
            ["07:00", "Manager approval", "PM", "1 ชม."],
            ["08:00", "Open system to users", "DevOps", "30 min"],
            ["08:00 - 18:00", "Hypercare onsite (Day 1)", "All", "—"],
        ]
    ),

    H.h2("7.2 Rollback Triggers"),
    H.makeTable(
        ["Condition", "Action"],
        [
            ["Migration validation fail (>1% error)", "Stop, investigate, restore backup"],
            ["Critical bug in Smoke test", "Rollback, fix in QA env, retry"],
            ["Performance < target (>5x slower)", "Rollback, performance tuning"],
            ["Security incident detected", "Rollback immediately"],
        ]
    ),

    H.h2("7.3 Hypercare (2 weeks post Go-Live)"),
    H.diagramPlaceholder("Hypercare Phases", "graph LR — Go-Live → Week 1 (on-site daily) → Week 2 (standby) → Normal Support"),

    H.pageBreak(),

    H.h1("8. Resource & Cost Estimation"),
    H.h2("8.1 Effort Estimation (Phase 1)"),
    H.makeTable(
        ["Role", "Person-weeks"],
        [
            ["PM", "13"],
            ["BA", "10"],
            ["Architect", "8"],
            ["Frontend Dev (× 2)", "24"],
            ["Backend Dev (× 2)", "24"],
            ["QA Engineer", "8"],
            ["DevOps (shared)", "4"],
            ["UX Designer (shared)", "4"],
            ["Total", "95 person-weeks"],
        ]
    ),
    H.h2("8.2 Infrastructure Cost"),
    H.bullet("Production servers (FE × 2, BE × 2)"),
    H.bullet("Database (Primary + backup)"),
    H.bullet("File storage (100 GB initial)"),
    H.bullet("Monitoring tools"),
    H.bullet("Email service (10K/month)"),
    H.bullet("SSL certificate"),
    H.note("ตัวเลขอ้างอิงในเอกสารสัญญา"),

    H.pageBreak(),

    H.h1("9. Communication Plan"),
    H.h2("9.1 Communication Cadence"),
    H.makeTable(
        ["Meeting", "Frequency", "Audience", "Duration"],
        [
            ["Daily Standup", "Daily", "Dev team", "15 min"],
            ["Sprint Planning", "Bi-weekly", "Dev + BA + PM", "2 hr"],
            ["Sprint Review", "Bi-weekly", "Dev + BA + PM + Stakeholder", "1 hr"],
            ["Sprint Retro", "Bi-weekly", "Dev + PM", "1 hr"],
            ["Stakeholder Update", "Weekly", "PM + Stakeholder", "30 min"],
            ["Steering Committee", "Monthly", "PM + Sponsors", "1 hr"],
            ["Architecture Review", "Bi-weekly", "Architect + Tech leads", "1 hr"],
        ]
    ),
    H.h2("9.2 Communication Channels"),
    H.makeTable(
        ["Channel", "Use"],
        [
            ["Slack/Teams", "Day-to-day chat"],
            ["Jira/Trello", "Task tracking"],
            ["Confluence", "Documentation"],
            ["Email", "Formal sign-off"],
            ["Video call", "Meetings"],
        ]
    ),

    H.h2("9.3 Escalation Path"),
    H.diagramPlaceholder("Escalation Flow", "graph TD — Dev → Architect/PM → Steering → Sponsor"),

    H.pageBreak(),

    H.h1("10. Risk Management Plan"),
    H.note("รายละเอียด Risk เต็มอยู่ใน SRS-13"),
    H.h2("10.1 Risk Mitigation Calendar"),
    H.makeTable(
        ["Sprint", "Risk Focus", "Action"],
        [
            ["Sprint 1-2", "Process mismatch (OR-03)", "Workshop + prototype review"],
            ["Sprint 3-4", "Performance (TR-04)", "Database design review"],
            ["Sprint 5-6", "Migration risk (OR-01)", "Data profiling + dry-run prep"],
            ["Sprint 7-8", "UAT engagement (OR-05)", "Stakeholder commitment"],
            ["Pre Go-Live", "Security (TR-03)", "Pen-test + security audit"],
        ]
    ),

    H.h2("10.2 Contingency Buffer"),
    H.makeTable(
        ["Phase", "Plan", "Buffer"],
        [
            ["Phase 1", "12 weeks", "+2 weeks (16% buffer)"],
            ["Phase 2", "12 weeks", "+2 weeks"],
            ["Migration", "1 weekend", "+1 weekend rollback option"],
        ]
    ),

    H.pageBreak(),

    H.h1("11. Quality Gates"),
    H.h2("11.1 Sprint-level Gates"),
    H.makeTable(
        ["Gate", "Criteria"],
        [
            ["Definition of Ready (DOR)", "Story has acceptance criteria + estimated"],
            ["Definition of Done (DOD)", "Code + Test + Code review + Deploy to Dev"],
            ["Sprint Review", "Demo to PM/Stakeholder, accept or backlog"],
        ]
    ),
    H.h2("11.2 Phase Gate (Pre Go-Live)"),
    H.makeTable(
        ["Criterion", "Threshold"],
        [
            ["All P0/P1 features delivered", "100%"],
            ["Code coverage", "≥ 70%"],
            ["All P0 test cases pass", "100%"],
            ["Security audit", "No Critical findings"],
            ["Performance test", "All NFR met"],
            ["UAT sign-off", "All key stakeholders"],
            ["Documentation", "Complete (architecture, API, runbook)"],
            ["Migration tested", "Dry-run + validation pass"],
        ]
    ),

    H.pageBreak(),

    H.h1("12. Training & Change Management"),
    H.h2("12.1 User Training Plan"),
    H.makeTable(
        ["Audience", "Format", "Duration", "Materials"],
        [
            ["QA Manager", "Workshop + hands-on", "4 hours", "User manual + recorded session"],
            ["Trainer", "Workshop + hands-on", "3 hours", "User manual + recorded session"],
            ["CM Officer", "Workshop + hands-on", "3 hours", "User manual + recorded session"],
            ["Inspector", "Brief + self-study", "1 hour", "User manual"],
            ["CS / AME", "Brief", "30 min", "Quick guide"],
            ["Admin", "Workshop + hands-on", "4 hours", "Admin guide"],
        ]
    ),
    H.h2("12.2 Change Management"),
    H.diagramPlaceholder("ADKAR Model Flow", "graph LR — Awareness → Desire → Knowledge → Ability → Reinforcement"),

    H.h1("13. Post Go-Live Support"),
    H.h2("13.1 Support Tiers"),
    H.makeTable(
        ["Tier", "Description", "SLA"],
        [
            ["Tier 1", "User questions, basic troubleshooting", "< 4 hours"],
            ["Tier 2", "Bug reproduction, configuration", "< 1 day"],
            ["Tier 3", "Code fixes, deep investigation", "< 1 week (Major)"],
        ]
    ),
    H.h2("13.2 Continuous Improvement"),
    H.makeTable(
        ["Activity", "Frequency"],
        [
            ["User feedback survey", "Quarterly"],
            ["Performance review", "Monthly"],
            ["Security review", "Quarterly"],
            ["Feature backlog grooming", "Monthly"],
            ["Stakeholder business review", "Quarterly"],
        ]
    ),

    H.pageBreak(),

    H.h1("14. Critical Path Summary"),
    H.diagramPlaceholder("Critical Path Diagram", "graph LR — Workshop → DB+Auth → Auth Module → Migration → UAT → Go-Live"),
    H.note("Critical path = ลำดับนี้ห้าม slip; กิจกรรมอื่น parallel ได้"),

    H.h1("15. Success Criteria"),
    H.h2("15.1 Phase 1 Success Criteria"),
    H.makeTable(
        ["Criterion", "Target"],
        [
            ["✅ All P0 features delivered", "100%"],
            ["✅ All P1 features delivered", "≥ 95%"],
            ["✅ UAT sign-off obtained", "All stakeholders"],
            ["✅ User adoption (active rate)", "≥ 80% by Day 30"],
            ["✅ Compliance % accuracy", "100% match Excel baseline"],
            ["✅ System uptime (post Go-Live)", "≥ 99.5%"],
            ["✅ User satisfaction", "≥ 4.0 / 5.0"],
            ["✅ Critical bugs in production", "0"],
        ]
    ),
    H.h2("15.2 Long-term Success Metrics (M+6)"),
    H.makeTable(
        ["Metric", "Baseline", "Target M+6"],
        [
            ["CM Officer time on expiry checks", "2-3 days/month", "< 4 hours/month"],
            ["Authorization processing time", "1-2 days", "< 1 hour"],
            ["Compliance % data accuracy", "unknown", "100%"],
            ["Audit prep time", "2 weeks", "2 days"],
            ["User satisfaction", "n/a", "≥ 4.5 / 5.0"],
        ]
    ),

    H.spacer(),
    H.p("— จบเอกสาร SAMS-QA-SRS-12 —", { italics: true, color: "999999" }),
    H.p("สร้างโดย Triple-T Development Team | SAMS QA Module SRS/BRD v1.0", { italics: true, color: "999999" }),
];

const doc = H.buildDoc({ docNo: "SAMS-QA-SRS-12", sections });
H.saveDoc(doc, __dirname + "/../12-Implementation-Plan/SAMS-QA-SRS-12-Implementation-Plan.docx");
