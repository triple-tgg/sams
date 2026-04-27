# SAMS-QA-SRS-02 — Business Process
## ระบบ SAMS: โมดูล Quality Assurance (QA)

| รายการ | รายละเอียด |
|---|---|
| **Document No.** | SAMS-QA-SRS-02 |
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

## สารบัญ

1. [ภาพรวมกระบวนการธุรกิจ](#1-ภาพรวมกระบวนการธุรกิจ)
2. [As-Is Process: กระบวนการปัจจุบัน](#2-as-is-process-กระบวนการปัจจุบัน)
3. [Pain Points](#3-pain-points)
4. [To-Be Process: กระบวนการใหม่](#4-to-be-process-กระบวนการใหม่)
5. [Process Flow แต่ละ Sub-module](#5-process-flow-แต่ละ-sub-module)
6. [Cross-Process Dependencies](#6-cross-process-dependencies)

---

## 1. ภาพรวมกระบวนการธุรกิจ

QA Module ครอบคลุมกระบวนการธุรกิจหลัก **6 กระบวนการ** ที่เชื่อมโยงกัน:

```mermaid
graph TB
    A[1. Staff Onboarding] --> B[2. Initial Training]
    B --> C[3. Authorization Issuance]
    C --> D[4. Recurrent Training]
    D --> E[5. Compliance Monitoring]
    E -->|Renewal| C
    E --> F[6. Reporting & Audit]
    
    style A fill:#dbeafe
    style C fill:#fef3c7
    style E fill:#fee2e2
    style F fill:#dcfce7
```

| # | กระบวนการ | ผู้รับผิดชอบ | วัตถุประสงค์ |
|---|---|---|---|
| 1 | Staff Onboarding | HR + QA Manager | บันทึกพนักงานใหม่เข้าระบบ |
| 2 | Initial Training | Trainer | ฝึกอบรมพื้นฐานก่อนออก Authorization |
| 3 | Authorization Issuance | QA Manager | ออก Authorization ให้ Certifying Staff |
| 4 | Recurrent Training | Trainer | Refresher training ตามรอบเวลา |
| 5 | Compliance Monitoring | CM Officer | ติดตามวันหมดอายุ + แจ้งเตือน |
| 6 | Reporting & Audit | QA Manager | สร้างรายงานสำหรับ Authority |

---

## 2. As-Is Process: กระบวนการปัจจุบัน

### 2.1 เครื่องมือที่ใช้อยู่

```mermaid
graph LR
    EXCEL[📊 Excel Spreadsheet<br/>หลายไฟล์ แยกตามหัวข้อ]
    EMAIL[📧 Email<br/>แจ้งเตือนด้วยตัวเอง]
    PAPER[📄 Paper Forms<br/>เซ็นชื่ออนุมัติ]
    SHARE[🗄️ Shared Drive<br/>เก็บไฟล์ปนกัน]
    
    EXCEL --> SHARE
    EMAIL --> SHARE
    PAPER --> SHARE
```

### 2.2 As-Is: Authorization Issuance

```mermaid
sequenceDiagram
    participant CS as Certifying Staff
    participant TR as Trainer
    participant QM as QA Manager
    participant XLS as Excel Files
    
    CS->>TR: เข้าฝึกอบรม
    TR->>XLS: บันทึกผลฝึกอบรม (ไฟล์ Training.xlsx)
    TR->>QM: ส่ง email แจ้งว่าผ่าน
    QM->>XLS: เปิด Auth.xlsx เพิ่มข้อมูล
    QM->>QM: พิมพ์เอกสาร, เซ็น
    QM->>CS: ส่งเอกสารให้
    Note over QM,XLS: ไม่มี audit trail<br/>ไม่มี link ระหว่างไฟล์
```

### 2.3 As-Is: Compliance Monitoring

```mermaid
flowchart TD
    START([ทุกต้นเดือน]) --> OPEN[เปิดไฟล์ Excel ทุกไฟล์]
    OPEN --> CHECK{ตรวจวันหมดอายุ<br/>ทีละแถว}
    CHECK -->|ใกล้หมดอายุ| MARK[ทำเครื่องหมายสีแดง]
    CHECK -->|ปกติ| NEXT[แถวต่อไป]
    MARK --> EMAIL[ส่ง email แจ้ง CS]
    NEXT --> CHECK
    EMAIL --> END([จบ])
    
    style OPEN fill:#fee2e2
    style CHECK fill:#fee2e2
```

---

## 3. Pain Points

### 3.1 ปัญหาหลักที่พบ

| # | ปัญหา | ผลกระทบ | ความรุนแรง |
|---|---|---|---|
| P1 | ตรวจวันหมดอายุด้วยมือ ใช้เวลามาก | CM Officer ใช้เวลา 2-3 วัน/เดือน | 🔴 สูง |
| P2 | ไม่มี alert อัตโนมัติเมื่อใกล้หมดอายุ | พลาดวันหมดอายุ → CS ออก CRS ไม่ได้ | 🔴 สูง |
| P3 | ข้อมูลกระจายในหลายไฟล์ Excel | ข้อมูลขัดแย้งกัน, version control ยาก | 🟡 ปานกลาง |
| P4 | ไม่มี audit trail | ตรวจสอบย้อนหลังไม่ได้, audit ลำบาก | 🔴 สูง |
| P5 | ไม่รองรับ multi-customer concurrent | 18 สายการบินต้องเปิดทีละไฟล์ | 🟡 ปานกลาง |
| P6 | CRS eligibility ต้องคำนวณเอง | เกิด human error ได้สูง | 🔴 สูง |
| P7 | Report ต้องสร้างเอง ทุกครั้ง | ใช้เวลาในการเตรียม audit นาน | 🟡 ปานกลาง |
| P8 | ไม่มี role-based access | ทุกคนเห็นทุกอย่าง — risk ข้อมูลรั่ว | 🔴 สูง |

### 3.2 Root Cause Analysis

```mermaid
graph LR
    ROOT[ปัญหาหลัก:<br/>ขาดระบบรวมศูนย์]
    ROOT --> R1[Excel ไม่ใช่ DB]
    ROOT --> R2[ไม่มี automation]
    ROOT --> R3[ไม่มี integration]
    R1 --> P3 & P4 & P5
    R2 --> P1 & P2 & P6 & P7
    R3 --> P8
```

---

## 4. To-Be Process: กระบวนการใหม่

### 4.1 หลักการออกแบบ

| หลักการ | คำอธิบาย |
|---|---|
| **Single Source of Truth** | ข้อมูลทั้งหมดอยู่ใน DB เดียว, มี link ระหว่างกัน |
| **Automation First** | Automate alert, calculation, reporting |
| **Role-Based Access** | จำกัดสิทธิ์ตามตำแหน่ง |
| **Audit Trail** | บันทึกทุกการเปลี่ยนแปลง พร้อม timestamp + user |
| **Real-time Dashboard** | ผู้บริหารเห็นภาพรวมทันที |

### 4.2 To-Be: Authorization Issuance

```mermaid
sequenceDiagram
    participant CS as Certifying Staff
    participant TR as Trainer
    participant SYS as SAMS System
    participant QM as QA Manager
    
    CS->>TR: เข้าฝึกอบรม
    TR->>SYS: บันทึกผลผ่านใน Training Scheduler
    SYS->>SYS: ตรวจ training requirements
    SYS-->>TR: แจ้ง CS ผ่านครบทุกหลักสูตร
    TR->>SYS: สร้าง Authorization Request (Draft)
    SYS->>QM: 🔔 Notify: รออนุมัติ Auth ของ {CS Name}
    QM->>SYS: ตรวจสอบ + อนุมัติ
    SYS->>SYS: เปลี่ยนสถานะ → Active
    SYS->>CS: 📧 Email: Authorization Approved
    SYS->>SYS: บันทึก Audit Log
    Note over SYS: 🆕 NEW DESIGN<br/>Approval workflow + audit
```

### 4.3 To-Be: Compliance Monitoring

```mermaid
flowchart TD
    SCHED[⏰ Scheduled Job<br/>ทุกวัน 06:00] --> SCAN[Scan All Authorizations]
    SCAN --> CHECK{Expiry < 30 วัน?}
    CHECK -->|Yes| ALERT[Generate Alert]
    CHECK -->|< 90 วัน| WARN[Mark Status: Expiring]
    CHECK -->|ปกติ| LOG[Update Last Check]
    ALERT --> EMAIL[📧 Auto Email: CS + QM]
    ALERT --> DASH[Update Dashboard Counter]
    WARN --> DASH
    LOG --> DASH
    
    style SCHED fill:#dcfce7
    style ALERT fill:#fee2e2
    style WARN fill:#fef3c7
```

---

## 5. Process Flow แต่ละ Sub-module

### 5.1 Staff Management Flow

```mermaid
stateDiagram-v2
    [*] --> NewStaff: HR ส่งข้อมูล
    NewStaff --> Active: บันทึกครบถ้วน
    Active --> Updating: แก้ไขข้อมูล
    Updating --> Active: บันทึก
    Active --> OnLeave: ลาพักงาน
    OnLeave --> Active: กลับมา
    Active --> Resigned: ลาออก
    Resigned --> Archived: 🆕 NEW DESIGN<br/>Auto-archive 90 วันหลังลาออก
    Archived --> [*]
```

### 5.2 Authorization Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Draft: 🆕 QA สร้าง
    Draft --> Submitted: 🆕 ส่งอนุมัติ
    Submitted --> Active: 🆕 อนุมัติ
    Submitted --> Rejected: 🆕 ไม่อนุมัติ
    Rejected --> Draft: 🆕 แก้ไข
    Active --> Expiring: ≤ 90 วัน
    Active --> Suspended: ระงับชั่วคราว
    Suspended --> Active: คืนสิทธิ์
    Suspended --> Revoked: เพิกถอน
    Expiring --> Active: ต่ออายุ
    Expiring --> Expired: หมดอายุ
    Expired --> Active: ต่ออายุย้อนหลัง
    Revoked --> [*]
    
    note right of Submitted: 🆕 NEW DESIGN<br/>Approval workflow ใหม่
```

### 5.3 Training Compliance Flow

```mermaid
flowchart LR
    subgraph DAILY["⏰ Daily (06:00)"]
        SCAN[Scan Training Records]
    end
    
    subgraph CHECK["Check Each Staff"]
        EXP{Expiry?}
        REQ{Required for Role?}
    end
    
    subgraph ACTION["Action"]
        OK[✅ Compliant]
        ALERT[⚠️ Alert]
        SCHED_TRAIN[📅 Schedule Training]
    end
    
    SCAN --> EXP
    EXP -->|≤ 30 days| ALERT
    EXP -->|expired| ALERT
    EXP -->|fine| REQ
    REQ -->|missing| SCHED_TRAIN
    REQ -->|complete| OK
```

### 5.4 Course Management Flow

```mermaid
flowchart TD
    A[QA Manager] --> B[เพิ่มหลักสูตรใหม่<br/>ลงใน Course Catalog]
    B --> C[กำหนด Training Needs Matrix<br/>SAMS-FM-CM-014]
    C --> D[ผูกหลักสูตรกับ Role/Type]
    D --> E[Trainer เห็นรายการที่ต้องสอน]
    E --> F[สร้าง Training Session<br/>ใน Scheduler]
```

### 5.5 Training Scheduler Flow

```mermaid
sequenceDiagram
    participant TR as Trainer
    participant SYS as System
    participant CS as Staff
    
    TR->>SYS: สร้าง Session (Date, Course, Capacity)
    SYS->>CS: 🔔 Open for Enrollment
    CS->>SYS: Enroll
    SYS->>TR: Notify: New enrollment
    TR->>SYS: Conduct Training (Mark Attendance)
    TR->>SYS: Submit Results
    SYS->>SYS: Update Training Records
    SYS->>CS: 📧 Result + Certificate
    SYS->>SYS: Auto-update Compliance Status
```

### 5.6 QA Dashboard (Read-only Aggregation)

```mermaid
graph LR
    DB[(Database)] --> A[Aggregate:<br/>- Total Staff<br/>- Active Auths<br/>- Expiring Soon<br/>- Compliance %<br/>- Upcoming Sessions]
    A --> DASH[Dashboard Widgets]
    DASH --> ROLE{User Role?}
    ROLE -->|QA Manager| FULL[Full View]
    ROLE -->|Trainer| TRAINING[Training only]
    ROLE -->|CS| OWN[Own data only]
```

---

## 6. Cross-Process Dependencies

### 6.1 Data Flow ระหว่าง Sub-modules

```mermaid
graph TB
    STAFF[Staff Module]
    COURSE[Course Mgmt]
    SCHED[Training Scheduler]
    AUTH[Authorization]
    MON[Monitoring]
    DASH[Dashboard]
    
    STAFF -->|Staff List| SCHED
    STAFF -->|Staff Profile| AUTH
    COURSE -->|Course Catalog| SCHED
    COURSE -->|Required Courses| MON
    SCHED -->|Training Records| MON
    SCHED -->|Completion Status| AUTH
    AUTH -->|Expiry Data| MON
    AUTH -->|Active Auths| DASH
    MON -->|Compliance %| DASH
    SCHED -->|Upcoming Events| DASH
```

### 6.2 ตารางสรุป Trigger Events

| Trigger | ผลกระทบต่อ Module |
|---|---|
| Staff ลาออก | → Suspend ทุก Authorization → Cancel pending Training |
| Training ผ่าน | → Update Compliance % → Trigger Authorization eligibility check |
| Authorization Active | → Update Dashboard counter → Email confirmation |
| Authorization Expiring (30d) | → Alert → Suggest renewal training |
| Course เพิ่มใน Matrix | → Re-evaluate compliance ของ staff ที่เกี่ยวข้อง |
| Customer เพิ่มใหม่ | → Generate Customer Auth template |

### 6.3 Business Rules ที่ระบบต้อง Enforce

> 🆕 **[NEW DESIGN]** — กฎเหล่านี้ปัจจุบันใช้ความจำของ QA Manager ระบบใหม่จะ enforce อัตโนมัติ

| Rule ID | กฎ |
|---|---|
| BR-01 | CS ต้องมี SAMS Auth ที่ Active ก่อนจึงออก Customer Auth ได้ |
| BR-02 | Customer Auth ต้องไม่ extend เกิน SAMS Auth expiry |
| BR-03 | CRS Eligibility = SAMS Active + ≥1 Customer Active + Mandatory Training ครบ |
| BR-04 | Staff ที่ลาออกแล้ว → Auto-suspend ทุก Authorization |
| BR-05 | Training expiry ≤ 30 days → Auto-alert CS + Trainer + QA Manager |
| BR-06 | ห้ามแก้ไข Training Record ที่ approved แล้ว ต้องสร้าง Amendment record |

---

*— จบเอกสาร SAMS-QA-SRS-02 —*
