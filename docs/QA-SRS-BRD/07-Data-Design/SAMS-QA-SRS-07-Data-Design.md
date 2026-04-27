# SAMS-QA-SRS-07 — Data Design
## ระบบ SAMS: โมดูล Quality Assurance (QA)

| รายการ | รายละเอียด |
|---|---|
| **Document No.** | SAMS-QA-SRS-07 |
| **Module** | Quality Assurance (QA) |
| **เวอร์ชัน** | 1.0 |
| **วันที่จัดทำ** | 2026-04-27 |

---

## Revision History

| เวอร์ชัน | วันที่ | ผู้จัดทำ | รายละเอียด |
|---|---|---|---|
| 1.0 | 2026-04-27 | Triple-T Dev | ร่างแรก |

---

## 1. Conceptual Data Model

### 1.1 Entity Overview

```mermaid
erDiagram
    USER ||--o{ USER_ROLE : has
    USER }|--|| STAFF : "linked-to"
    USER_ROLE }o--|| ROLE : refers
    ROLE ||--o{ ROLE_PERMISSION : grants
    ROLE_PERMISSION }o--|| PERMISSION : refers
    
    STAFF ||--o{ EDUCATION : has
    STAFF ||--o{ WORK_EXPERIENCE : has
    STAFF ||--o{ TRAINING_RECORD : has
    STAFF ||--o{ AUTHORIZATION : has
    STAFF ||--o{ LOGBOOK : has
    STAFF }o--|| DEPARTMENT : belongs-to
    
    AUTHORIZATION }o--|| AUTH_TYPE : is-of
    AUTHORIZATION }o--o| CUSTOMER_AIRLINE : "for"
    AUTHORIZATION }o--o| AUTHORITY : "issued-by"
    AUTHORIZATION ||--o{ AUTH_HISTORY : tracks
    
    TRAINING_RECORD }o--|| COURSE : "of"
    TRAINING_RECORD }o--|| TRAINING_SESSION : "from"
    TRAINING_SESSION }o--|| COURSE : teaches
    TRAINING_SESSION }o--|| STAFF : "trainer"
    
    COURSE ||--o{ COURSE_REQUIREMENT : "matrix"
    COURSE_REQUIREMENT }o--|| ROLE : "required-for"
    
    AUDIT_LOG }o--|| USER : "by"
    NOTIFICATION }o--|| USER : "for"
```

### 1.2 หลัก Entity (15 Entities)

| Entity | คำอธิบาย | NEW? |
|---|---|---|
| USER | บัญชีผู้ใช้ระบบ | 🆕 NEW |
| ROLE | บทบาท | 🆕 NEW |
| PERMISSION | สิทธิ์ | 🆕 NEW |
| USER_ROLE | mapping table | 🆕 NEW |
| ROLE_PERMISSION | mapping table | 🆕 NEW |
| STAFF | พนักงาน | Existing |
| EDUCATION | ประวัติการศึกษา | Existing |
| WORK_EXPERIENCE | ประวัติทำงาน | Existing |
| AUTHORIZATION | การอนุญาต | Existing |
| AUTH_HISTORY | ประวัติ Authorization | 🆕 NEW |
| TRAINING_RECORD | ผลการอบรม | Existing |
| TRAINING_SESSION | ตารางอบรม | Existing |
| COURSE | หลักสูตร | Existing |
| COURSE_REQUIREMENT | Training Matrix | Existing |
| LOGBOOK | บันทึกการทำงาน | Existing |
| CUSTOMER_AIRLINE | สายการบินลูกค้า | Existing |
| AUTHORITY | หน่วยงานกำกับ | Existing |
| DEPARTMENT | แผนก | Existing |
| AUDIT_LOG | บันทึกการเปลี่ยนแปลง | 🆕 NEW |
| NOTIFICATION | การแจ้งเตือน | 🆕 NEW |
| EMAIL_QUEUE | คิวส่ง email | 🆕 NEW |

---

## 2. Logical Data Model — Core Tables

### 2.1 STAFF Table

```mermaid
erDiagram
    STAFF {
        bigint id PK
        string employee_code UK "Unique"
        string title "Mr/Ms/Mrs"
        string first_name
        string last_name
        string nick_name
        date date_of_birth
        string gender
        string national_id "encrypted"
        string passport_no "encrypted"
        string phone "encrypted"
        string email
        string address
        bigint department_id FK
        string position
        string position_group "CS / AME / Trainer"
        string license "B1/B2/B1+B2"
        date license_issue_date
        date license_expiry_date
        date hire_date
        date resign_date
        string status "active/leave/resigned/archived"
        string photo_url
        bigint created_by FK
        datetime created_at
        bigint updated_by FK
        datetime updated_at
    }
```

### 2.2 AUTHORIZATION Table

```mermaid
erDiagram
    AUTHORIZATION {
        bigint id PK
        bigint staff_id FK
        string auth_type "SAMS / Customer / Authority"
        bigint customer_airline_id FK "nullable"
        bigint authority_id FK "nullable"
        string auth_number UK
        string license "B1/B2"
        date initial_issue_date
        date issue_date
        date expiry_date
        json scope "[B737 NG, B737 MAX]"
        string status "draft/submitted/active/expiring/expired/suspended/revoked/rejected"
        bigint issued_by FK
        bigint approved_by FK "nullable, NEW"
        datetime approved_at "nullable, NEW"
        text remarks
        text rejection_reason "NEW"
        datetime created_at
        bigint created_by FK
        datetime updated_at
    }
```

### 2.3 AUTH_HISTORY Table 🆕

```mermaid
erDiagram
    AUTH_HISTORY {
        bigint id PK
        bigint authorization_id FK
        string from_status
        string to_status
        bigint changed_by FK
        datetime changed_at
        text reason
        json snapshot "complete row at time of change"
    }
```

> 🆕 **[NEW DESIGN]** — บันทึกทุกการเปลี่ยน status ของ Authorization เพื่อ audit

### 2.4 TRAINING_RECORD Table

```mermaid
erDiagram
    TRAINING_RECORD {
        bigint id PK
        bigint staff_id FK
        bigint course_id FK
        bigint training_session_id FK "nullable"
        date training_date
        date expiry_date
        decimal score "nullable"
        string result "pass/fail/incomplete"
        string status "pending_approval/approved/rejected"
        string certificate_url "nullable"
        bigint trainer_id FK "nullable"
        bigint approved_by FK "NEW"
        datetime approved_at "NEW"
        datetime created_at
        datetime updated_at
    }
```

### 2.5 COURSE & MATRIX

```mermaid
erDiagram
    COURSE {
        bigint id PK
        string code UK
        string name
        string category "mandatory/aircraft-type/specialized"
        int validity_months "เช่น 24"
        text description
        text prerequisites
        boolean is_active
        datetime created_at
    }
    
    COURSE_REQUIREMENT {
        bigint id PK
        bigint course_id FK
        bigint role_id FK "nullable"
        string position_group "nullable"
        string aircraft_type "nullable"
        boolean is_mandatory
    }
    
    COURSE ||--o{ COURSE_REQUIREMENT : "matrix"
```

### 2.6 TRAINING_SESSION

```mermaid
erDiagram
    TRAINING_SESSION {
        bigint id PK
        bigint course_id FK
        bigint trainer_id FK
        date start_date
        date end_date
        time start_time
        time end_time
        string location
        int capacity
        string status "scheduled/ongoing/completed/cancelled"
        text notes
        datetime created_at
    }
    
    SESSION_ENROLLMENT {
        bigint id PK
        bigint session_id FK
        bigint staff_id FK
        string status "enrolled/attended/absent/withdrawn"
        datetime enrolled_at
        boolean attendance_marked
    }
    
    TRAINING_SESSION ||--o{ SESSION_ENROLLMENT : has
```

---

## 3. RBAC Tables 🆕

### 3.1 USER, ROLE, PERMISSION

```mermaid
erDiagram
    USER {
        bigint id PK
        string username UK
        string email UK
        string password_hash
        bigint staff_id FK "nullable"
        string status "active/inactive/locked"
        datetime last_login
        int failed_attempts
        datetime locked_until
        datetime password_changed_at
        datetime created_at
    }
    
    ROLE {
        bigint id PK
        string code UK "QA_MANAGER, etc."
        string name
        text description
        boolean is_active
    }
    
    PERMISSION {
        bigint id PK
        string resource "STAFF, AUTH, TRAINING"
        string action "VIEW/CREATE/EDIT/APPROVE"
        string scope "OWN/TEAM/ALL"
    }
    
    USER_ROLE {
        bigint id PK
        bigint user_id FK
        bigint role_id FK
        datetime assigned_at
        bigint assigned_by FK
    }
    
    ROLE_PERMISSION {
        bigint id PK
        bigint role_id FK
        bigint permission_id FK
    }
    
    USER ||--o{ USER_ROLE : has
    USER_ROLE }o--|| ROLE : refers
    ROLE ||--o{ ROLE_PERMISSION : has
    ROLE_PERMISSION }o--|| PERMISSION : refers
```

---

## 4. Audit & Notification Tables 🆕

### 4.1 AUDIT_LOG (Append-only)

```mermaid
erDiagram
    AUDIT_LOG {
        bigint id PK
        datetime timestamp
        bigint user_id FK
        string username "snapshot"
        string action "CREATE/UPDATE/DELETE/APPROVE/REJECT/LOGIN"
        string resource_type "STAFF/AUTH/TRAINING/USER"
        bigint resource_id
        json before_data "nullable"
        json after_data "nullable"
        string ip_address
        string user_agent
    }
```

> 🆕 **[NEW DESIGN]** — Append-only, ห้าม UPDATE/DELETE

### 4.2 NOTIFICATION & EMAIL_QUEUE

```mermaid
erDiagram
    NOTIFICATION {
        bigint id PK
        bigint user_id FK
        string type "auth_expiring/training_due/etc."
        string title
        text message
        string link
        boolean is_read
        datetime created_at
        datetime read_at
    }
    
    EMAIL_QUEUE {
        bigint id PK
        string to_email
        string subject
        text body_html
        string template_code
        json template_data
        string status "pending/sent/failed"
        int retry_count
        datetime scheduled_at
        datetime sent_at
        datetime failed_at
        text error_message
    }
```

---

## 5. Customer Airlines & Authorities

### 5.1 CUSTOMER_AIRLINE (18 records)

```mermaid
erDiagram
    CUSTOMER_AIRLINE {
        bigint id PK
        string code UK "TG, MH, PR, etc."
        string name
        string country
        string brand_color
        string logo_url
        string regulator "CAAT/CAAM/EASA/FAA"
        boolean is_active
    }
```

ตัวอย่างข้อมูล:
| code | name | country | regulator |
|---|---|---|---|
| TG | Thai Airways | TH | CAAT |
| MH | Malaysia Airlines | MY | CAAM |
| PR | Philippine Airlines | PH | CAAP |
| EK | Emirates | AE | GCAA |
| QF | Qantas | AU | CASA |

### 5.2 AUTHORITY (13 records)

```mermaid
erDiagram
    AUTHORITY {
        bigint id PK
        string code UK "CAAT, EASA, FAA"
        string name
        string country
        string website
    }
```

---

## 6. Indexing Strategy

### 6.1 Primary Indexes

| Table | Index | Reason |
|---|---|---|
| STAFF | (employee_code) UNIQUE | Lookup by code |
| STAFF | (department_id) | Filter by dept |
| STAFF | (status) | Filter active |
| AUTHORIZATION | (staff_id) | Get staff's auths |
| AUTHORIZATION | (customer_airline_id, status) | Compliance reporting |
| AUTHORIZATION | (expiry_date) | Expiry scan |
| AUTHORIZATION | (status, expiry_date) | Expiring filter |
| TRAINING_RECORD | (staff_id, course_id) | Get latest training |
| TRAINING_RECORD | (expiry_date) | Expiry scan |
| AUDIT_LOG | (timestamp DESC) | Recent activities |
| AUDIT_LOG | (user_id, timestamp) | User activity |
| AUDIT_LOG | (resource_type, resource_id) | Resource history |
| EMAIL_QUEUE | (status, scheduled_at) | Worker pickup |

### 6.2 Composite/Specialized

| Index | Use Case |
|---|---|
| `(staff_id, status, expiry_date)` on AUTHORIZATION | CS list with expiry filter |
| `(course_id, training_date DESC)` on TRAINING_RECORD | Latest training per course |
| Full-text on STAFF.first_name + last_name | Search |

---

## 7. Data Flow Diagrams

### 7.1 Authorization Lifecycle Data Flow

```mermaid
flowchart TD
    A[QA Manager] -->|Create Draft| B[INSERT AUTHORIZATION<br/>status=draft]
    B --> C[INSERT AUTH_HISTORY<br/>from=null, to=draft]
    
    A -->|Submit| D[UPDATE AUTHORIZATION<br/>status=submitted]
    D --> E[INSERT AUTH_HISTORY]
    D --> F[INSERT NOTIFICATION<br/>to QA Director]
    
    G[Director] -->|Approve| H[UPDATE AUTHORIZATION<br/>status=active]
    H --> I[INSERT AUTH_HISTORY]
    H --> J[INSERT EMAIL_QUEUE<br/>to staff]
    H --> K[INSERT AUDIT_LOG]
```

### 7.2 Daily Expiry Scan Data Flow

```mermaid
flowchart LR
    JOB[Cron 06:00] --> Q[SELECT * FROM AUTHORIZATION<br/>WHERE expiry_date BETWEEN today AND +30d<br/>AND status='active']
    Q --> LOOP{Loop each}
    LOOP --> UPDATE[UPDATE status='expiring']
    LOOP --> NOTIFY[INSERT NOTIFICATION + EMAIL_QUEUE]
    LOOP --> AUDIT[INSERT AUDIT_LOG]
```

### 7.3 CRS Eligibility Calculation

```mermaid
flowchart TD
    REQ[Frontend: Check CS] --> API[GET /api/v1/auth/staff/:id/crs-eligibility]
    API --> Q1[SELECT samsAuth WHERE staff_id=X AND status IN active,expiring]
    Q1 --> Q2[SELECT customerAuths WHERE staff_id=X AND status IN active,expiring]
    Q1 & Q2 --> CALC{SAMS active AND<br/>≥1 customer active?}
    CALC -->|Yes| ELIGIBLE[Return: Eligible]
    CALC -->|No| NOT[Return: Not Eligible<br/>+ Reason]
```

---

## 8. Data Migration Strategy

### 8.1 Migration Sources

```mermaid
graph LR
    EXCEL_OLD[Old Excel Files<br/>5 ปีย้อนหลัง]
    HR_API[HR System]
    MASTER[Master Data XLSX]
    
    EXCEL_OLD -->|ETL Script| STAGING[(Staging Tables)]
    HR_API -->|API Sync| STAGING
    MASTER -->|Direct Import| STAGING
    
    STAGING -->|Validation| VALID{Valid?}
    VALID -->|Yes| PROD[(Production DB)]
    VALID -->|No| ERROR_REPORT[Error Report]
```

### 8.2 Migration Order

| Step | Entity | เหตุผล |
|---|---|---|
| 1 | DEPARTMENT, COURSE, CUSTOMER_AIRLINE, AUTHORITY | Master data ก่อน |
| 2 | ROLE, PERMISSION, ROLE_PERMISSION | RBAC config |
| 3 | STAFF | ต้องมีก่อน entity อื่น |
| 4 | USER + USER_ROLE | Link to STAFF |
| 5 | EDUCATION, WORK_EXPERIENCE, LOGBOOK | Staff details |
| 6 | TRAINING_RECORD | ต้องมี STAFF + COURSE |
| 7 | AUTHORIZATION | ต้องมี STAFF + CUSTOMER + AUTHORITY |
| 8 | AUTH_HISTORY | บันทึกย้อนหลังจาก timestamp ใน Excel |

---

## 9. Data Retention & Archival 🆕

### 9.1 Retention Policy

| Entity | Active Retention | Archive Retention | Total |
|---|---|---|---|
| STAFF (active) | Forever | — | Forever |
| STAFF (resigned) | 90 วัน | 5 ปี | 5 ปี + 90 วัน |
| AUTHORIZATION | Active period | 5 ปีหลัง expire | Active + 5 ปี |
| TRAINING_RECORD | Active period | 5 ปีหลัง expire | Active + 5 ปี |
| AUDIT_LOG | Forever | — | Forever (≥ 5 ปี ตาม regulation) |
| LOGBOOK | Forever | — | Forever |
| USER (resigned) | Disabled | Forever | Forever (audit) |
| EMAIL_QUEUE (sent) | 30 วัน | — | 30 วัน |
| NOTIFICATION (read) | 90 วัน | — | 90 วัน |
| TRAINING_SESSION (completed) | 1 ปี | 5 ปี | 6 ปี |

### 9.2 Archival Process

```mermaid
flowchart LR
    DAILY[Daily Job 04:00] --> SCAN[Scan retention rules]
    SCAN --> CHECK{Eligible for archive?}
    CHECK -->|Yes| MOVE[Move to ARCHIVE_* tables]
    MOVE --> COMPRESS[Compress + offsite storage]
    SCAN --> CHECK_DELETE{Past archive period?}
    CHECK_DELETE -->|Yes| DELETE[Hard delete + audit log]
```

---

## 10. Data Validation Rules

### 10.1 Field-Level Validation

| Field | Rule |
|---|---|
| STAFF.employee_code | Unique, regex `^[A-Z0-9-]{3,20}$` |
| STAFF.email | Valid email format, unique |
| STAFF.national_id | Encrypted, 13 digits (TH) |
| AUTHORIZATION.expiry_date | > issue_date |
| AUTHORIZATION.expiry_date (Customer) | ≤ SAMS auth expiry |
| TRAINING_RECORD.expiry_date | > training_date |
| COURSE.validity_months | > 0, ≤ 60 |
| USER.password_hash | bcrypt format check |
| EMAIL_QUEUE.to_email | Valid email |

### 10.2 Business Rule Constraints (DB-level)

```sql
-- Customer auth expiry ≤ SAMS auth expiry
CHECK (
  auth_type != 'customer' OR
  expiry_date <= (SELECT expiry_date FROM authorization 
                  WHERE staff_id = self.staff_id 
                  AND auth_type = 'SAMS' AND status = 'active')
)

-- Soft delete only (no hard delete)
ROW LEVEL: deleted_at IS NULL for active queries
```

---

## 11. Sample Data Volumes (Estimated)

| Table | Year 1 | Year 5 | Year 10 |
|---|---|---|---|
| STAFF | 2,000 | 5,000 | 8,000 |
| AUTHORIZATION | 10,000 | 50,000 | 100,000 |
| AUTH_HISTORY | 30,000 | 200,000 | 500,000 |
| TRAINING_RECORD | 100,000 | 1,250,000 | 3,000,000 |
| TRAINING_SESSION | 5,000 | 25,000 | 50,000 |
| AUDIT_LOG | 500,000 | 5,000,000 | 15,000,000 |
| EMAIL_QUEUE | 50,000/year | (rolling 30d) | (rolling 30d) |
| NOTIFICATION | 100,000/year | (rolling 90d) | (rolling 90d) |

> Database size estimated: ~50 GB at Year 5 (with audit logs being largest)

---

*— จบเอกสาร SAMS-QA-SRS-07 —*
