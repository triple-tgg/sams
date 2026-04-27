# SAMS-QA-SRS-06 — System Architecture
## ระบบ SAMS: โมดูล Quality Assurance (QA)

| รายการ | รายละเอียด |
|---|---|
| **Document No.** | SAMS-QA-SRS-06 |
| **Module** | Quality Assurance (QA) |
| **เวอร์ชัน** | 1.0 |
| **วันที่จัดทำ** | 2026-04-27 |
| **จัดทำโดย** | Triple-T Development Team |

---

## Revision History

| เวอร์ชัน | วันที่ | ผู้จัดทำ | รายละเอียด |
|---|---|---|---|
| 1.0 | 2026-04-27 | Triple-T Dev | ร่างแรก |

---

## 1. Architecture Overview

### 1.1 High-Level Architecture (3-Tier)

```mermaid
graph TB
    subgraph CLIENT["Client Tier"]
        BROWSER[Browser<br/>Chrome/Edge/Firefox/Safari]
    end
    
    subgraph APP["Application Tier"]
        NEXT[Next.js 16<br/>App Router + RSC]
        API[.NET REST API]
        WORKER[🆕 Background Worker<br/>Daily Jobs / Email Queue]
    end
    
    subgraph DATA["Data Tier"]
        DB[(RDBMS<br/>Production DB)]
        FILE[File Storage<br/>flight-storage.sams.aero]
        CACHE[Redis Cache<br/>Phase 2]
    end
    
    subgraph EXT["External Services"]
        SMTP[SMTP Server]
        HR[HR System API]
    end
    
    BROWSER -->|HTTPS| NEXT
    NEXT -->|REST/JSON| API
    API --> DB
    API --> FILE
    WORKER --> DB
    WORKER --> SMTP
    NEXT -.future.-> CACHE
    API --> HR
    
    style WORKER fill:#dcfce7
    style CACHE fill:#fef3c7
```

### 1.2 Architecture Principles

| หลักการ | คำอธิบาย |
|---|---|
| **Separation of Concerns** | UI / Business / Data ชัดเจน |
| **Stateless Frontend** | ไม่เก็บ session ที่ Frontend (ยกเว้น JWT ใน localStorage) |
| **API-First** | ทุก feature เริ่มจาก API contract |
| **Defense in Depth** | Auth ที่ Frontend + Backend + DB |
| **Single Responsibility** | แต่ละ component ทำหน้าที่เดียว |
| **Progressive Enhancement** | RSC + Client Component แบ่งบทบาทชัดเจน |

---

## 2. Frontend Architecture

### 2.1 Frontend Stack

```mermaid
graph TD
    NEXT[Next.js 16 App Router]
    NEXT --> RSC[React Server Components]
    NEXT --> CC[Client Components]
    NEXT --> ROUTE[File-based Routing]
    
    CC --> SHADCN[Shadcn/UI Components]
    CC --> RADIX[Radix UI Primitives]
    CC --> TW[TailwindCSS 4]
    
    RSC --> FETCH[Server Fetch]
    CC --> RQ[React Query<br/>TanStack v5]
    CC --> REDUX[Redux Toolkit<br/>Auth State]
    
    RQ --> API[Backend API]
    REDUX --> LS[localStorage]
```

### 2.2 Folder Structure

```
/home/user/sams/
├── app/[locale]/
│   ├── (protected)/
│   │   ├── qa/
│   │   │   ├── dashboard/
│   │   │   ├── staff/
│   │   │   │   ├── [id]/
│   │   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   ├── authorization/
│   │   │   ├── monitoring/
│   │   │   ├── course-management/
│   │   │   └── training-scheduler/
│   ├── (auth)/
│   └── layout.tsx
├── components/
│   ├── ui/              # Shadcn primitives
│   ├── partials/        # Sidebar, Header
│   └── auth/            # withAuth, RoleGate
├── lib/
│   ├── api/
│   │   ├── client.ts    # Axios instance
│   │   ├── hooks/       # React Query hooks
│   │   └── services/    # API services
│   └── store/           # Redux store
└── messages/            # i18n: th.json, en.json, ar.json
```

### 2.3 Component Hierarchy (QA Module)

```mermaid
graph TD
    LAYOUT[App Layout<br/>Sidebar + Header + Locale]
    LAYOUT --> AUTH_GUARD[withAuth HOC]
    AUTH_GUARD --> QA_LAYOUT[QA Layout]
    QA_LAYOUT --> DASH[Dashboard Page]
    QA_LAYOUT --> STAFF_PAGE[Staff List Page]
    QA_LAYOUT --> AUTH_PAGE[Authorization Page]
    QA_LAYOUT --> MON_PAGE[Monitoring Page]
    QA_LAYOUT --> COURSE_PAGE[Course Mgmt Page]
    QA_LAYOUT --> SCHED_PAGE[Scheduler Page]
    
    STAFF_PAGE --> STAFF_DETAIL[Staff Detail Page]
    STAFF_DETAIL --> TABS[5 Tabs:<br/>Profile/Education/Experience/Training/Logbook]
```

### 2.4 State Management Strategy

| State Type | Tool | ตัวอย่าง |
|---|---|---|
| **Server State** | React Query (TanStack v5) | Staff list, Auth records, Training data |
| **Auth State** | Redux Toolkit + persist | User info, JWT token |
| **UI State** | useState / useReducer | Modal open/close, form draft |
| **URL State** | Next.js searchParams | Filters, pagination, tab selection |
| **Form State** | React Hook Form + Zod | Form validation, submission |
| **Theme** | next-themes | Light/Dark mode |
| **Locale** | next-intl | th/en/ar switching |

---

## 3. Backend Architecture

### 3.1 Backend Stack (.NET API)

> **หมายเหตุ**: Backend จัดการโดยทีมแยก — ส่วนนี้สรุปจาก Frontend perspective

```mermaid
graph TB
    LB[Load Balancer]
    LB --> API1[API Instance 1]
    LB --> API2[API Instance 2]
    
    API1 & API2 --> AUTH_SVC[Auth Service]
    API1 & API2 --> STAFF_SVC[Staff Service]
    API1 & API2 --> AUTH_QA[Authorization Service]
    API1 & API2 --> TRAINING_SVC[Training Service]
    API1 & API2 --> NOTIF[🆕 Notification Service]
    API1 & API2 --> AUDIT[🆕 Audit Service]
    
    AUTH_SVC & STAFF_SVC & AUTH_QA & TRAINING_SVC --> DB[(Database)]
    NOTIF --> SMTP[SMTP]
    NOTIF --> QUEUE[(Email Queue)]
    AUDIT --> AUDIT_DB[(Audit Log<br/>append-only)]
```

### 3.2 API Layers

```mermaid
graph LR
    REQ[HTTP Request] --> MW1[Middleware:<br/>CORS]
    MW1 --> MW2[Middleware:<br/>Auth - JWT verify]
    MW2 --> MW3[Middleware:<br/>RBAC check]
    MW3 --> MW4[Middleware:<br/>Audit log]
    MW4 --> CTRL[Controller]
    CTRL --> SVC[Service Layer]
    SVC --> REPO[Repository Layer]
    REPO --> DB[(Database)]
    SVC --> EXT[External Services]
```

### 3.3 API Design Principles

| หลักการ | รายละเอียด |
|---|---|
| **REST** | URL = resource, HTTP method = action |
| **JSON** | Request/Response body |
| **Versioning** | `/api/v1/...` |
| **Pagination** | `?page=1&size=50` |
| **Filtering** | `?status=active&customer=TG` |
| **Sorting** | `?sort=expiryDate&order=asc` |
| **Error Format** | `{ "code": "...", "message": "...", "details": [...] }` |

---

## 4. Data Architecture

### 4.1 Data Layer Components

```mermaid
graph TB
    APP[Application] --> ORM[ORM Layer]
    ORM --> POOL[Connection Pool]
    POOL --> PRIMARY[(Primary DB<br/>Read/Write)]
    POOL -.Phase 2.-> REPLICA[(Read Replica<br/>Reports only)]
    
    APP --> FILE_API[File API]
    FILE_API --> S3[Object Storage<br/>flight-storage.sams.aero]
    
    APP --> CACHE_LAYER[Cache Layer]
    CACHE_LAYER -.Phase 2.-> REDIS[(Redis)]
```

### 4.2 Data Storage Strategy

| Data Type | Storage | Reason |
|---|---|---|
| Transactional (Staff, Auth, Training) | RDBMS | ACID, relations |
| Audit Logs | RDBMS (append-only table) | Immutable, queryable |
| Files (Avatar, Certificate, License) | Object Storage | Large blobs |
| Generated Reports (PDF/XLSX) | Object Storage (temp 7d) | Async generation |
| Session / Cache (Phase 2) | Redis | Fast access |
| Email Queue (NEW) | DB queue table | Reliable retry |

### 4.3 Database Type Selection

| Module | Primary Storage | Schema Style |
|---|---|---|
| Staff | RDBMS | Normalized (3NF) |
| Authorization | RDBMS | Normalized + JSON for flexible scope |
| Training Records | RDBMS | Normalized + JSON for course-specific data |
| Audit Log | RDBMS | Append-only flat table |
| File Metadata | RDBMS | URL reference only |
| File Content | Object Storage | Direct upload via signed URL |

> **รายละเอียด schema เต็มอยู่ใน SRS-07 (Data Design)**

---

## 5. Integration Architecture

### 5.1 Internal Integration

```mermaid
graph LR
    QA[QA Module API]
    QA -->|JWT verify| AUTH[Auth Service]
    QA -->|Get customer/course| MASTER[Master Data API]
    QA -->|Sync employee| HR[HR System API]
    QA -->|Upload/Download| FILE[File Storage API]
    QA -->|Send notification| NOTIF[🆕 Notification Service]
    QA -->|Log all writes| AUDIT[🆕 Audit Service]
```

### 5.2 External Integration

```mermaid
graph LR
    QA[QA Module]
    QA -->|SMTP| EMAIL[Email Server]
    QA -.Phase 2.->|REST| CAAT[CAAT Portal]
    QA -.Phase 3.->|Webhook| CUSTOMERS[Customer Airline Systems]
```

> **รายละเอียดเต็มอยู่ใน SRS-09 (Integration & Interface)**

---

## 6. Deployment Architecture

### 6.1 Environment Topology

```mermaid
graph TB
    subgraph DEV["Development"]
        DEV_FE[Frontend Dev<br/>Local + Hot Reload]
        DEV_BE[Backend Dev<br/>Mock or Dev API]
        DEV_DB[(Dev DB)]
    end
    
    subgraph UAT["UAT / Staging"]
        UAT_FE[Frontend UAT]
        UAT_BE[Backend UAT]
        UAT_DB[(UAT DB<br/>Anonymized prod data)]
    end
    
    subgraph PROD["Production"]
        LB[Load Balancer]
        FE_NODES[Frontend × 2]
        BE_NODES[Backend × 2]
        PROD_DB[(Production DB<br/>HA + Backup)]
        FILE_STORE[Object Storage]
    end
    
    DEV --> UAT --> PROD
```

### 6.2 Deployment Pipeline

```mermaid
flowchart LR
    DEV[Developer Push] --> CI[CI Pipeline]
    CI --> LINT[Lint + Type Check]
    LINT --> TEST[Unit + Integration Test]
    TEST --> BUILD[Build]
    BUILD --> SCAN[Security Scan<br/>SAST + Dependency]
    SCAN --> DEPLOY_DEV[Auto Deploy Dev]
    DEPLOY_DEV --> APPROVE_UAT{Manual Approve}
    APPROVE_UAT --> DEPLOY_UAT[Deploy UAT]
    DEPLOY_UAT --> UAT_TEST[UAT Testing]
    UAT_TEST --> APPROVE_PROD{Manual Approve}
    APPROVE_PROD --> DEPLOY_PROD[Deploy Production]
    DEPLOY_PROD --> SMOKE[Smoke Test]
    SMOKE --> MONITOR[Monitor]
```

### 6.3 Infrastructure Requirements

| Environment | Frontend | Backend | DB |
|---|---|---|---|
| **Dev** | 1 instance, 2 vCPU, 4 GB RAM | 1 instance | Shared dev DB |
| **UAT** | 1 instance, 2 vCPU, 4 GB RAM | 1 instance | Dedicated UAT DB |
| **Prod** | 2 instances, 4 vCPU, 8 GB RAM each | 2 instances | HA Primary + Replica |

---

## 7. Security Architecture

### 7.1 Defense in Depth

```mermaid
graph TB
    USER[User]
    USER --> WAF[Web Application Firewall]
    WAF --> LB[Load Balancer + TLS]
    LB --> FE[Frontend<br/>Auth check + RoleGate]
    FE --> API_MW[API Middleware<br/>JWT + RBAC + Rate limit]
    API_MW --> SVC[Service<br/>Business rules]
    SVC --> DB_AUTH[DB Auth<br/>Connection pool credentials]
    DB_AUTH --> DB[(DB)]
    
    style WAF fill:#fee2e2
    style API_MW fill:#fef3c7
    style DB_AUTH fill:#dbeafe
```

### 7.2 Auth Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as Backend
    participant DB as Database
    
    U->>FE: Username + Password
    FE->>BE: POST /api/v1/auth/login
    BE->>DB: Verify credentials (bcrypt)
    DB-->>BE: User + Role
    BE->>BE: Generate JWT (30min) + Refresh (7d)
    BE-->>FE: Tokens + User profile
    FE->>FE: Store in Redux + localStorage
    
    Note over U,DB: Subsequent API calls
    
    U->>FE: Action (e.g. View Staff)
    FE->>BE: GET /api/v1/staff (Authorization: Bearer)
    BE->>BE: Verify JWT
    BE->>BE: Check RBAC
    BE->>DB: Query
    DB-->>BE: Data
    BE-->>FE: Response
    FE-->>U: Render
    
    Note over U,DB: Token refresh
    
    FE->>FE: JWT expired (~30min)
    FE->>BE: POST /api/v1/auth/refresh
    BE-->>FE: New JWT
```

---

## 8. Background Jobs Architecture

> 🆕 **[NEW DESIGN]** ส่วนนี้เป็นการออกแบบใหม่ทั้งหมด

### 8.1 Scheduled Jobs

```mermaid
graph TB
    SCHED[Scheduler<br/>cron / hangfire]
    SCHED --> J1[Daily 06:00<br/>Scan Expiring Auth/Training]
    SCHED --> J2[Daily 23:00<br/>Email Digest]
    SCHED --> J3[Weekly Sun 02:00<br/>Cleanup expired sessions]
    SCHED --> J4[Monthly 1st 00:00<br/>Compliance Report]
    SCHED --> J5[Daily 04:00<br/>Auto-archive resigned staff > 90d]
```

| Job | ความถี่ | หน้าที่ |
|---|---|---|
| Scan Expiry | Daily 06:00 | Find expired/expiring → trigger alerts |
| Email Digest | Daily 23:00 | Roll-up alerts to Manager email |
| Session Cleanup | Weekly Sun 02:00 | Delete expired sessions |
| Compliance Report | Monthly 1st | Auto-generate + email |
| Staff Archive | Daily 04:00 | Archive resigned staff > 90 days |

### 8.2 Email Queue Architecture

```mermaid
flowchart LR
    APP[App] --> ENQUEUE[Enqueue Email]
    ENQUEUE --> QUEUE[(Email Queue<br/>DB table)]
    QUEUE --> WORKER[Worker]
    WORKER --> SMTP[SMTP]
    SMTP -->|Success| MARK_OK[Mark Sent]
    SMTP -->|Fail| RETRY{Retry < 3?}
    RETRY -->|Yes| WAIT[Wait 5/15/60 min]
    WAIT --> WORKER
    RETRY -->|No| MARK_FAIL[Mark Failed + Alert Admin]
```

---

## 9. Monitoring & Observability

```mermaid
graph TB
    APP[Application]
    APP --> LOGS[Structured Logs<br/>JSON]
    APP --> METRICS[Metrics<br/>Prometheus-compatible]
    APP --> TRACES[Distributed Traces<br/>OpenTelemetry]
    
    LOGS --> SIEM[Log Aggregator<br/>ELK / Loki]
    METRICS --> APM[APM<br/>Grafana / Datadog]
    TRACES --> APM
    
    APM --> ALERT[Alert Manager]
    SIEM --> ALERT
    ALERT --> ONCALL[📞 On-Call Engineer]
```

### 9.1 Observability Stack

| Layer | Tool (Recommended) | Purpose |
|---|---|---|
| Log Aggregation | ELK / Grafana Loki | Centralized log search |
| Metrics | Prometheus + Grafana | Performance monitoring |
| Distributed Tracing | OpenTelemetry | Request flow across services |
| Error Tracking | Sentry | Frontend/Backend errors |
| Synthetic Monitoring | UptimeRobot / Datadog Synthetics | Up/Down detection |
| RUM | Datadog RUM / New Relic Browser | Real user metrics |

---

## 10. Decision Records

| Decision | เลือก | เหตุผล |
|---|---|---|
| Frontend Framework | Next.js 16 (App Router) | RSC + SSR + ecosystem |
| State Management | React Query + Redux | Server vs auth state แยก |
| UI Components | Shadcn + Radix | Customizable + accessible |
| Styling | TailwindCSS 4 | Utility-first + design system |
| Authentication | JWT (existing) | สอดคล้องกับ Backend |
| Database | RDBMS | ACID + relations + reporting |
| File Storage | Object Storage | Scalable + cost-effective |
| Background Jobs (NEW) | Hangfire (.NET) / cron | Reliable scheduling |

---

*— จบเอกสาร SAMS-QA-SRS-06 —*
