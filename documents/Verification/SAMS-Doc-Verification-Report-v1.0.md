# SAMS-Doc-Verification-Report-v1.0

**Document Verification Report — SAMS Engineering Maintenance System**
เอกสารตรวจสอบความสอดคล้องระหว่างเอกสาร (SRS / PRD / UAT Master Plan) กับระบบจริง

| รายการ | รายละเอียด |
| :-- | :-- |
| Report No. | SAMS-DVR-2026-001 |
| Version | 1.0 |
| วันที่ตรวจ | 16 กรกฎาคม 2026 |
| ผู้ตรวจ | Documentation Verification Agent |
| ระบบที่ตรวจ | Frontend (Next.js) `frontend-sam-airline-maintenance` @ commit 0f2e590 (main) |
| API ที่ตรวจ | `https://sam-api-staging-triple-tcoth-production.up.railway.app` (staging) |
| ขอบเขต evidence | Source code (read-only), API probe (unauthenticated), เอกสาร SRS/PRD/UAT บน Google Drive |

> **ข้อจำกัดของรอบตรวจนี้ (สำคัญต่อการอ่าน verdict):**
> - ผู้ตรวจ **ไม่มี valid credential** เข้า authenticated API / ไม่มีสิทธิ์ query PostgreSQL (`SamDbContext`) โดยตรง และ **ไม่มี source code ของ backend .NET** ในเครื่อง
> - หลักฐานฝั่งระบบจึงมาจาก **frontend source (API contract ที่ frontend คาดหวัง)** + **การ probe endpoint แบบไม่ login** เป็นหลัก
> - Finding ที่ต้องดู DB schema จริง / backend logic / SMTP config → mark เป็น **CANNOT VERIFY** พร้อมระบุว่าต้องใช้อะไรจึงจะปิดได้
> - รอบตรวจนี้ยังไม่ได้ทดสอบ UI แบบ interactive (คลิกจริงทุก role) — เคส `EDGE-CASE` / `PERM-GAP` ที่ต้อง login จึงเป็น "เสนอให้ทดสอบ" ไม่ใช่ "ยืนยันด้วยตาแล้ว"

---

## 1. Executive Summary

### 1.1 สรุปผล Known Findings (ภารกิจ 1)

| Verdict | จำนวน | Finding IDs |
| :-- | :--: | :-- |
| ✅ Confirmed (มีปัญหาจริง) | 10 | F-01, F-02, F-05(บางส่วน), F-09, F-10, F-13, F-15, F-18, F-23, F-25 |
| ⚠️ Needs SME Decision | 6 | F-03, F-07, F-10, F-16, F-17, F-19 |
| ❌ Not an Issue / ปรับความเข้าใจ | 1 | F-14 |
| 🔍 Cannot Verify (ต้อง backend/DB/tracker) | 8 | F-04, F-06, F-08, F-11, F-12(บางส่วน), F-20, F-21, F-22, F-24 |

> หมายเหตุ: บาง finding มีหลายมิติจึงถูกนับซ้ำในหลายหมวด (เช่น F-10 ยืนยันว่าระบบวางไว้ที่ Master Data แต่ยังต้องให้ SME ตัดสินว่าเอกสาร SRS-07 หรือระบบคือ authoritative)

### 1.2 เคสเสนอเพิ่ม (ภารกิจ 3) — แยกตามประเภทและ Priority

| ประเภท | จำนวน | P1 | P2 | P3 |
| :-- | :--: | :--: | :--: | :--: |
| NEW-FEAT | 3 | 0 | 1 | 2 |
| BEHAV-DIFF | 3 | 1 | 2 | 0 |
| EDGE-CASE | 2 | 0 | 2 | 0 |
| PERM-GAP | 2 | 2 | 0 | 0 |
| DATA-GAP | 3 | 1 | 2 | 0 |
| INT-GAP | 1 | 0 | 1 | 0 |
| **รวม** | **14** | **4** | **8** | **2** |

### 1.3 Top 5 ที่กระทบ UAT มากที่สุด

1. **F-25 / ม.3 — สถานะ mock ยังไม่ 100% (UAT readiness).** ณ ก.ค. 2026 หน้า **QA Dashboard ยังเป็น mock ทั้งหมด** (ไม่ต่อ API เลย) และ **Authorization ส่วนใหญ่ยังเป็น mock** (`data-v2.ts` = hard-coded 16 staff / 18 airlines / 13 authorities). Phase 1 (M-01+M-02) พร้อมกว่ามาก แต่ Dashboard/Authorization ยังไม่พร้อม formal UAT — กระทบ Entry Criteria E1/E2 โดยตรง
2. **F-15 — i18n ไม่ตรงทุกเอกสาร (กระทบ NFR test + Business Rule alert).** ระบบตั้ง `locales = ['en', 'ar']` มีแค่ `messages/en.json` ไฟล์เดียว **ไม่มีภาษาไทย** ขณะที่ PRD NF-08 / SRS-10 บอก "TH/EN สลับได้ทุกหน้า" → เขียน test case ภาษาไทยไม่ได้ ต้องตัดสินใจ scope ก่อน
3. **F-23 + F-21 — Security / Compliance evidence.** JWT + refresh token เก็บใน `localStorage` (เสี่ยง XSS) และ **ไม่พบ business audit-trail table/endpoint** ในฝั่ง frontend เลย — กระทบ Exit Criteria X8 (NFR-SEC) และ X12 (Audit Trail Integrity) / RC-02 immutability ของ CAAT-EASA โดยตรง
4. **F-02 + F-09 + PERM-GAP — Role model จริงเป็น dynamic RBAC ไม่ใช่ 5/8 role ตายตัว.** เอกสารขัดกันเอง (SRS-03 หัวข้อ "8 Roles" แต่ตาราง 5) และ UAT Training doc มี role "Training Coordinator / HR" ที่ไม่มีใน SRS-03 ส่วนระบบจริงมี **เมนู HR + Production Planner ทั้งกลุ่มที่ SRS-03 Permission Matrix ไม่ครอบคลุมเลย** → Permission Matrix ใน UAT ต้องรื้อ
5. **F-10 + DATA-GAP — Department/Position domain + status enum เป็น data-driven.** ระบบจัด Department/Position ไว้ใต้เมนู **Master Data** (ขัด SRS-07 ที่จัดเป็นโดเมน Staff&HR) และ Training status ดึงจาก API `/master/training/datastatuses` (dynamic) ไม่ใช่ enum ตายตัว 4–6 ค่าตามเอกสาร

### 1.4 🚨 Escalate ทันที (ไม่รอรายงานเต็ม)

ไม่พบ **critical functional bug** แบบ "ออก CRS ได้โดยไม่มี Authorization" ในรอบ code-level นี้ (ตรรกะ CRS eligibility อยู่ใน `CrsTab.tsx` และ enforce ผ่าน API — แต่ **ยังไม่ได้ทดสอบ runtime ด้วย login จริง** จึงยังปิดไม่ได้ ดู CASE `BEHAV-DIFF-001`).

**2 ประเด็น compliance ที่ควรแจ้ง QA Director / Dev Lead ทันที** (แม้ยังเป็น "unconfirmed at backend"):
- **F-21** — ไม่พบ audit-trail ฝั่ง frontend; ถ้า backend ก็ไม่มี business audit table จริง จะ **fail CAAT/EASA Part-145 immutability (RC-02)** ซึ่งเป็น Exit Criteria X12
- **F-23** — token ใน `localStorage` เป็น XSS-exposed; ถ้าไม่ใช่การตัดสินใจที่บันทึกเป็น accepted-risk จะ **fail NFR-SEC (A01/A07)** ซึ่งเป็น Exit Criteria X8

---

## 2. Verification Results (Known Findings F-01…F-25)

### P1 — กระทบ UAT Scope / Business Logic

| ID | Finding (ย่อ) | Verdict | Evidence | ควรแก้ฝั่งไหน | Blocking UAT? |
| :-- | :-- | :-- | :-- | :-- | :-- |
| F-01 | นิยาม CRS ขัดกัน (Crew Resource Signing vs Certificate of Release to Service) | ✅ Confirmed (เอกสารผิด, ระบบถูก) | ระบบใช้ **"Certificate of Release to Service"** ทุกจุด: `app/[locale]/(protected)/qa/authorization/components/StaffAuthDrawer.tsx:197`, `.../tabs/CrsTab.tsx:99`, `hr/staff/[id]/components/LogbookRecordModal.tsx:51`. ไม่พบคำว่า "Crew Resource Signing" ในโค้ดเลย | **Doc** — แก้ SRS-01 §2.1 | ไม่ block แต่ต้องแก้ก่อน sign-off (compliance term) |
| F-02 | SRS-03 หัวข้อ "8 Roles" แต่ตารางมี 5; เลขข้อ 2.3.4 → 2.3.8 (หาย 2.3.5–2.3.7) | ✅ Confirmed (เอกสารขัดกันเอง) | อ่าน SRS-03 ตัวจริง: §2.1 หัวเรื่อง **"รายการ Role (8 Roles)"** แต่ตารางมี 5 แถว (QA_MANAGER, CM_OFFICER, CERTIFYING_STAFF, AME_STAFF, SYSTEM_ADMIN); §2.3 ข้ามจาก 2.3.4 ไป **2.3.8** จริง; §3.2 หัวข้อเขียน "Role **ADMIN**" แต่ role code คือ SYSTEM_ADMIN. ระบบจริง = **dynamic RBAC** (login คืน `roleObj{id,code,name}`, permission ต่อ role ดึงผ่าน API, มีหน้า CRUD role ที่ `/master-data/role`) ไม่ผูกกับเลข 5 หรือ 8 | **Doc** — แก้ SRS-03 ให้ระบุ "5 named seed roles + ระบบรองรับ role เพิ่มได้ (data-driven)" | ไม่ block โดยตรง แต่กระทบ RBAC test scope |
| F-03 | Role "Trainer" / "QA Inspector" อยู่ใน SRS-01 §4.1 แต่ไม่มีใน SRS-03 | ⚠️ Needs SME + 🔍 Cannot Verify | Frontend **ไม่ hardcode** role ชื่อ TRAINER / QA_INSPECTOR (grep = 0). แต่ role จริงเก็บใน DB (`master/Role-list`) ซึ่ง **query ไม่ได้ (ไม่มี auth)** จึงยืนยันไม่ได้ว่ามี row เหล่านี้จริงหรือไม่ | **Doc** (ถ้าไม่มีจริง) หรือ **ทั้งคู่** (ถ้ามีใน DB ต้องเพิ่ม matrix). SME: Dev Lead query `roles` table | Cannot verify — ต้อง query DB |
| F-04 | FR ID typo `FR-AUTH-0116` ควรเป็น `FR-AUTH-016` | 🔍 Cannot Verify (doc-internal) | ไม่มี FR ID ใน source code (frontend ไม่ tag FR). ต้องดู SRS-04 ตัวเต็ม + tracker/backlog ซึ่งเข้าไม่ถึง | **Doc** — แก้ SRS-04 §4.2.2 (แทบแน่นอนว่า typo) | ไม่ block |
| F-05 | `FR-STAFF-015…018` อยู่ผิดในตาราง FR-SCHED §7 และซ้ำกับ §3.2 (ควรเป็น FR-SCHED-015…018 — Course closure evidence + Certificate) | ✅ Confirmed บางส่วน (feature มีจริง) | ฟีเจอร์ที่ FR เหล่านี้อธิบาย **มีจริงในระบบ**: แนบหลักฐานก่อนปิดคอร์ส → `qa/training-scheduler/components/EvidenceUploadModal.tsx`; ออก Certificate → `qa/training-scheduler/components/CertificateModal.tsx` + API `/training/enrollment/complete-certificate`. ส่วนการ **misassign FR ID** เป็น doc-internal (ยืนยันเต็มไม่ได้เพราะไม่เห็น SRS-04 ทั้งไฟล์) | **Doc** — แก้ SRS-04 §7 ให้เป็น FR-SCHED-015…018 | ไม่ block (feature พร้อม) |
| F-06 | Traceability อ้าง `FR-AUTH-001..042` แต่เอกสารมีถึง 024 | 🔍 Cannot Verify (doc-internal) | ต้องดู backlog/SRS-04 เต็ม — เข้าไม่ถึง. Frontend ไม่ช่วยตอบ | **Doc** — แก้ §10 ให้ตรงช่วงจริง | ไม่ block |
| F-07 | BR prefix ชนกัน: SRS-02 BR-01..06 = Business Rules, SRS-11 BR-01..06 = Business Risks | ⚠️ Needs SME (convention) | ไม่พบการอ้าง `BR-0x` ใน source code เลย (grep documents+code = 0) → ไม่มี "ระบบใช้ ID ชุดไหน" ให้ยึด. UAT Master Plan §13 เสนอ `R-BR-*` สำหรับ Risks ไว้แล้ว | **Doc** — รับ convention `R-BR-*` (ตาม Master Plan) ทั่วทั้งชุด SRS-11 | ไม่ block |
| F-08 | SRS-11 Document No. ระบุ `SRS-13`; SRS-01 §8 บอกชุดมี "13 ส่วน" แต่ตารางมี 11 | 🔍 Cannot Verify (บางส่วน) | บน Google Drive โฟลเดอร์ SRS หลักมี SRS-01…11 (11 ไฟล์). พบชุดแยก **Phase2-SRS** ที่มี `BEC-PA-SRS-12-Glossary-Acceptance` และ SRS-09 Test-Plan (คนละ prefix "BEC-PA") — บ่งชี้ว่าเลข 12/13 มาจากการ restructure/ชุดอื่น ไม่ใช่ SRS ชุดนี้ | **Doc** — แก้เลขใน SRS-11 Document Control + SRS-01 §8 (11 ส่วน) | ไม่ block |
| F-09 | "HR Admin" / "Training Coordinator" ใน UAT ไม่มีใน SRS-03 RBAC | ✅ Confirmed | `documents/UAT/UAT_Document_SAMS_Training.md:42` ระบุ test account **"Training Coordinator / HR: hr_training@sams.aero"** ซึ่งไม่มีใน SRS-03 (มี 5 role). ระบบจริงมี **เมนูกลุ่ม Human Resources แยกต่างหาก** (`lib/menus.ts` groupLabel "HumanResources": permCodes HR, HR_STAFF, HR_STAFF_INCOME, HR_DOCUMENT_VERIFICATION) → มี HR persona จริงในระบบ | **ทั้งคู่** — SRS-03 ต้องเพิ่ม HR/Coordinator role; UAT ต้อง map เข้ากับ role จริงใน DB | อาจ block: ใครมีสิทธิ์ Create Staff ต้องชัดก่อน UAT |
| F-10 | Department/Position: UAT จัดเป็น Master Data แต่ SRS-07 จัดเป็นโดเมน Staff&HR | ✅ Confirmed ระบบ + ⚠️ Needs SME | ระบบวางไว้ใต้ **Master Data**: เมนู `MASTER_DATA_DEPARTMENT` อยู่ในกลุ่ม Master Data > Organization (`lib/menus.ts`), route `/master-data/department` (`lib/route-permissions.ts:61`), API `/master/staff-departments/*`, `/master/staff-department-positions/*`. ตรงกับ UAT v1.0 แต่ขัด SRS-07 §3.5 | **Doc** — ให้ SME ตัดสินว่า SRS-07 (โดเมน) หรือ UAT/ระบบ (เมนู) คือ authoritative; แนะนำแก้ SRS-07 ให้สอดคล้อง navigation จริง | ไม่ block |

### P2 — Spec ขัดกันเอง

| ID | Finding (ย่อ) | Verdict | Evidence | ควรแก้ฝั่งไหน | Blocking UAT? |
| :-- | :-- | :-- | :-- | :-- | :-- |
| F-11 | Concurrent users: 1 (NFR-PERF-007) / 50 (PC-03) / ≥500 (PRD NF-05) | 🔍 Cannot Verify | ต้องมี load-test config + infra sizing (backend/infra) — เข้าไม่ถึง. ค่า "1" เป็น typo ชัดเจน | **Doc** — SME (PM+Infra) เลือกค่าเดียว; ลบ "1" | ไม่ block เดี๋ยวนี้ แต่ต้อง lock ก่อนเขียน NFR test |
| F-12 | Page/API target: PRD (3s/1s) vs SRS-05 (5s/3s) vs SRS-11 (API P95 ≤1s) | 🔍 Cannot Verify บางส่วน | วัด baseline latency ของ API staging (unauthenticated `GET /master/Stations` → 401): **~0.12–0.25 s** (3 ตัวอย่าง). ต่ำกว่าทุก target มาก แต่ **ยังไม่ได้วัด authenticated page load / query จริง** (ต้อง login) | **Doc** — SME เลือกชุด target เดียว (แนะนำ SRS-05: 5s/3s เป็น acceptance, P95≤1s เป็น stretch) | ไม่ block |
| F-13 | Dashboard load "3 นาที" (SRS-04 §2.3) ขัด NFR-PERF-003 "≤5 วินาที" | ✅ Confirmed (typo ชัด) | เป็นความขัดแย้งภายในเอกสารที่ชัดเจน (นาที↔วินาที). ระบบจริง QA Dashboard เป็น mock (โหลดทันที) จึงไม่มีเหตุผลใดจะ 3 นาที | **Doc** — แก้ SRS-04 §2.3 เป็น "≤ 5 วินาที" | ไม่ block |
| F-14 | Recurrent interval: 24 เดือน (SRS-01) vs 12/24 เดือน (PRD) | ❌ Not an Issue (ปรับความเข้าใจ) | ระบบ model เป็น **ปี**: field `recurrenceIntervalYears` (`lib/api/qa/course.ts:41,85`, `enrollment.ts:137`). Mock ตั้ง `recurrentYears: 2` ทุกคอร์ส. ระบบรองรับค่า integer ใดก็ได้ ⇒ 12 เดือน = 1 ปี, 24 เดือน = 2 ปี แสดงได้ทั้งคู่ ไม่ขัดกัน | **Doc** — แก้ให้ระบุหน่วยเป็น "ปี" ให้ตรงระบบ; ยืนยันว่ามีคอร์ส recur 1 ปีจริงหรือไม่ (ดู DATA-GAP-003) | ไม่ block |
| F-15 | i18n: next-intl EN (SRS-01) / th,en+RTL (SRS-10) / TH-EN ทุกหน้า (PRD NF-08) | ✅ Confirmed (ระบบไม่มี TH) | `config/index.ts`: **`locales = ['en', 'ar']`** (ไม่ใช่ th/en!); `i18n/routing.ts` defaultLocale `'en'`; โฟลเดอร์ `messages/` มี **`en.json` ไฟล์เดียว** (ไม่มี th.json, ไม่มี ar.json). Locale switcher (`components/partials/header/locale-switcher.tsx`) มีตัวเลือก en + ar. "RTL" ใน SRS-10 คือของตกค้างจาก template (ar=RTL) | **ทั้งคู่** — SME ตัดสิน scope: ถ้าต้อง TH ต้อง implement (system gap); ถ้า EN-only ต้องแก้ PRD/SRS-10 | **อาจ block** Phase ที่ต้องทดสอบ TH |
| F-16 | UAT window ≥2 สัปดาห์ (SRS-10 BC-05) vs commitment ≥4 ชม./วัน (SRS-11 PA-02) | ⚠️ Needs SME (process) | เป็นเรื่อง resource commitment — ตรวจจากระบบไม่ได้ | **Doc/Process** — PM ยืนยันกับ Business Owner ก่อน lock schedule | ไม่ block (แต่เป็น risk OR-05) |
| F-17 | Phase 1 = Q2 2026 (PRD) แต่ปัจจุบัน ก.ค. 2026 = Q3 | ⚠️ Needs SME (PM) | วันนี้ 2026-07-16 = Q3 จริง. Master Plan ใช้ UAT window ส.ค. 2026 (สมมติ delay 1 ไตรมาส) | **Doc** — PM ยืนยัน timeline ปัจจุบัน; แก้ PRD §10.2 หรือใส่ note revised | ไม่ block |

### P3 — Data Model / Code Quality

| ID | Finding (ย่อ) | Verdict | Evidence | ควรแก้ฝั่งไหน | Blocking UAT? |
| :-- | :-- | :-- | :-- | :-- | :-- |
| F-18 | Typo `IsAcive` ใน entity Staff | ✅ Confirmed | **ระบบไม่สม่ำเสมอเอง**: write path `StaffUpsertRequest.isAcive` (typo) — `lib/api/master/staff/staff.interface.ts:65` พร้อม comment "API uses isAcive (typo)"; ส่งค่านี้จริงที่ `master-data/staff/page.tsx:169,200`. แต่ read path `StaffItem.isActive` (สะกดถูก) — บรรทัด 18. ⇒ import/upsert ต้องใช้ `isAcive`, response ใช้ `isActive` | **System** (แก้ backend column → `IsActive` แล้ว sync frontend) — แต่เป็น breaking change; ต้อง SME ตัดสินจังหวะ | ไม่ block แต่กระทบ XLSX import template |
| F-19 | Course PK type: `Course.Id=long` แต่ `CourseAssignment.CourseId=int`, `TrainingSchedule.CourseId=int` | 🔍 Cannot Verify (+ ⚠️ SME) | Frontend ใช้ `number` ทุกที่ (`lib/api/qa/course.ts`: `id:number`, `courseId:number`) — TS แยก int/long ไม่ได้. ต้องดู `SamDbContext` / EF entity จริง | **System** (ถ้า mismatch จริงเสี่ยง overflow/join) — Dev Lead ตรวจ EF model | ไม่ block |
| F-20 | ไม่เห็น field `ApprovedBy/ApprovedDate` ใน TrainingEnrollment (FR-SCHED-008) | 🔍 Cannot Verify | Frontend มี grading/approval flow ผ่าน API `/training/enrollment/complete-certificate` (grade Pass/Fail) และ HR `documentVerification` (approve/reject) — แต่ field-level schema ต้องดู DB. `enrollment.ts` มี `result` field | **System/Doc** — Dev ยืนยัน schema; ถ้าไม่มี field ต้องเพิ่ม | ไม่ block |
| F-21 | Audit Log: SRS-04 FR-AUDIT ต้อง append-only + before/after; SRS-07 มีแค่ ApiInfoLog | 🔍 Cannot Verify + 🚨 flag | **ไม่พบ audit table/endpoint ฝั่ง frontend เลย** (grep "audit" เจอแต่ชื่อคอร์ส "Internal Audit"/"EASA Audit" ไม่ใช่ระบบ log). ถ้า backend มีแค่ ApiInfoLog จะไม่ครอบ field-level business audit | **System** (ถ้าไม่มีจริง = compliance gap RC-02) — escalate Dev Lead | **อาจ block** X12 (Audit Trail Integrity) |
| F-22 | bcrypt cost ≥12 (NFR-SEC-004) | 🔍 Cannot Verify | Hashing อยู่ backend .NET — ไม่มี source ในเครื่อง และห้าม extract hash จริง | **-** — Dev Lead ยืนยันใน code review | ไม่ block |
| F-23 | JWT ใน localStorage (SRS-06) เสี่ยง XSS ขัด NFR-SEC-011 | ✅ Confirmed + 🚨 flag | `providers/auth.provider.tsx:53-54` และ `lib/axios.config.ts:33,74-76` เก็บ **`access_token`, `refresh_token`, `user` ใน `localStorage`** (ไม่ใช่ httpOnly cookie) | **ทั้งคู่** — ถ้ายอมรับ risk นี้ ต้องบันทึกเป็น accepted-risk ใน SRS-05/06; ถ้าไม่ ต้องย้ายเป็น httpOnly cookie (system) | **อาจ block** X8 (NFR-SEC) จนกว่าจะ sign-off เป็น accepted-risk |
| F-24 | Email templates: SRS-04 ~7 vs SRS-09 §4.1 = 10 | 🔍 Cannot Verify | ระบบมี email infra: `/training/preview-email-person`, `/preview-email-department`, `/training/email-log-datalist`, `/training/send-email-list` + `lib/api/email/`. แต่ **จำนวน template จริงอยู่ใน backend/SMTP config** — นับจาก frontend ไม่ได้ | **Doc** — ใช้ SRS-09 (10) เป็น baseline; Dev ยืนยันจำนวนจริง | ไม่ block |
| F-25 | สถานะ mock (SRS-01 §5.1 ณ เม.ย. 2026: 4/6 sub-module ยัง mock) | ✅ Confirmed (สถานะเปลี่ยนแล้ว) | ณ ก.ค. 2026 (ดูตาราง §3 ด้านล่าง): **Dashboard = mock ทั้งหมด** (`qa/dashboard/page.tsx:21` "// ── Mock Data ──", 0 API call); **Authorization = mock เป็นหลัก** (`data-v2.ts` hard-coded); **Monitoring / Course Mgmt / Training Scheduler = ต่อ API จริงแล้ว**; **HR Staff = ต่อ API เต็ม** | **Doc** — update SRS-01 §5.1 snapshot ตามสถานะปัจจุบัน | **กำหนด UAT readiness** — Dashboard/Auth ยังไม่พร้อม formal UAT |

---

## 3. New Discoveries (ภารกิจ 2)

| # | หัวข้อ | สิ่งที่พบ | Evidence | Verdict | แก้ฝั่งไหน |
| :-- | :-- | :-- | :-- | :-- | :-- |
| D-01 | Menu จริง vs SRS-03 Permission Matrix (18 items) | เมนูจริงมี **29 permCode entries** และมีทั้งกลุ่ม **Production Planner** (dashboard, production-plan, revenue-plan, monthly-frequency, import-flight-data) และ **Human Resources** (staff, employee-income, document-verification) ที่ **SRS-03 Permission Matrix ไม่ครอบคลุมเลย** (matrix มีแค่ Flight/Contract/Invoice/Report/QA/MasterData/StaffProfile) | `lib/menus.ts` (29 permCode), `lib/route-permissions.ts` | ✅ Gap ชัด | **Doc** — SRS-03 matrix ต้องขยายให้ครบทุกเมนูจริง |
| D-02 | 2 จุดสร้าง Staff field ไม่เท่ากัน | `master-data/staff` upsert รับแค่ 8 field (code, name, staffstypeid, userName, isAcive, title, jobTitle, email) แต่ `hr/staff/new` มีฟอร์มเต็ม FM-CM-036 (Title, ชื่อไทย/อังกฤษ, DOB, Place of Birth, Nationality, Thai ID, Phone, Email, Address, Employee ID, Start Date, Position, Department, Staff Type, Job Title, Degree/Education…) | `lib/api/master/staff/staff.interface.ts:57-70` vs `hr/staff/new/page.tsx:584-701` | ✅ Gap | **Doc/System** — เอกสารต้องระบุว่า FM-CM-036 เต็มอยู่ที่ HR path ไม่ใช่ Master Data |
| D-03 | FM-CM-055 (Certificate) ไม่อยู่ใน PRD ภาคผนวก A | ระบบใช้จริง: `public/FM-CM-055-Certificate-Template.html`, fetch โดย `qa/training-scheduler/components/CertificateModal.tsx:41`, อ้างใน UAT Training doc REQ-TRN-07. แต่ PRD ภาคผนวก A มีแค่ 014/036/041/062/063/072 | `public/` + `CertificateModal.tsx:41` | ✅ Confirmed มีจริง, doc ขาด | **Doc** — เพิ่ม FM-CM-055 เข้า PRD ภาคผนวก A + reference list |
| D-04 | Login ใช้ email ไม่ใช่ username | `postLogin` ส่ง `{email, password}` (`lib/api/auth/postLogin.ts:5-6,47`). ทดสอบ POST `/user/login` ด้วย `userName` → ตอบ **"Email field is required"** (HTTP 200, message:error). ขัดกับ `AUTH_SYSTEM_DOCS.md:52` ที่ยกตัวอย่าง `loginUser({userName:'navee'})` | API probe + `postLogin.ts` | ✅ Gap | **Doc** — แก้ AUTH_SYSTEM_DOCS ให้ใช้ email |
| D-05 | Training status values richer กว่าเอกสาร | UI ใช้อย่างน้อย 9 ค่า: Draft, Open Registration, **Registration Closed**, In Progress, Grading, Completed, Cancelled, **Scheduled**, Recurrent — ดึงจาก API `/master/training/datastatuses` (dynamic). UAT v1.0 ระบุ 6 ค่า (Draft/Open Registration/In Progress/Grading/Completed/Cancelled); SRS-02 lifecycle diagram มักน้อยกว่า | grep UI (§ evidence), `lib/api/master/trainingDataStatuses.ts` | ✅ Gap (ดู DATA-GAP-001) | **Doc** — sync enum จาก API จริง |
| D-06 | หน้า `service-category-rules` ไม่มีในเมนู/route-permission | มีไฟล์ `production-planner/service-category-rules/page.tsx` แต่ **ไม่มี permCode ใน `lib/menus.ts` และไม่มีใน `route-permissions.ts`** → เข้าถึงได้โดยไม่มี permission gate (ดู NEW-FEAT-001) | filesystem + grep | ✅ Gap | **ทั้งคู่** |
| D-07 | Airlines = 18, Authorities = 13 (ตรงเอกสาร) | Mock `AIRLINES` = 18 รายการ, `AUTHORITIES` = 13 รายการ ตรงกับ PRD/Master Plan พอดี | `qa/authorization/data-v2.ts:7-49` | ❌ Not an Issue (ตรง) | — (แต่เป็น mock ดู F-25) |

---

## 4. Proposed Case Additions — DOC REVISION PACKAGE (ภารกิจ 3)

> ส่วนนี้ standalone — ทีมเอกสารนำไปเขียน Test Case ได้เลย. ทุกเคสอ้าง evidence จาก code/API ที่ตรวจแล้ว. เคสที่ต้อง login/DB จะระบุชัดว่า "ยังไม่ได้ execute — เสนอให้ทดสอบ"

### 4.1 ตารางสรุป

| CASE-ID | Module | ประเภท | สรุป 1 บรรทัด | Priority | Action เสนอ |
| :-- | :-- | :-- | :-- | :--: | :-- |
| PERM-GAP-001 | Cross / Auth | PERM-GAP | หน้า service-category-rules ไม่มี permission gate | P1 | แก้ระบบ + เพิ่ม Test Case |
| PERM-GAP-002 | M-01 / HR+MasterData | PERM-GAP | 2 จุดสร้าง Staff — role ไหนใช้จุดไหน / field ไม่เท่ากัน | P1 | แก้ SRS-03 + Test Case |
| BEHAV-DIFF-001 | M-03 Authorization | BEHAV-DIFF | CRS eligibility ยังไม่ได้ทดสอบ runtime (BR-01/BR-03) | P1 | Test Case (positive+negative) |
| DATA-GAP-001 | M-02 Training | DATA-GAP | Training status มี ≥9 ค่า vs เอกสาร 4–6 | P1 | แก้ SRS-02/07 + Test Case |
| NEW-FEAT-001 | Production Planner | NEW-FEAT | service-category-rules ไม่มี FR/เมนูรองรับ | P2 | แก้ SRS + Test Case |
| NEW-FEAT-002 | M-02 Training | NEW-FEAT | Duplicate/Recurrent session flow ไม่มีใน FR-SCHED | P3 | ยืนยัน + แก้ SRS-04 |
| NEW-FEAT-003 | M-05 / Logbook | NEW-FEAT | Logbook flagCrs (FM-CM-041) ไม่มี test case | P3 | Test Case |
| BEHAV-DIFF-002 | Cross / i18n | BEHAV-DIFF | ระบบ EN+AR ไม่มี TH ตาม PRD NF-08 | P2 | SME + Test Case |
| BEHAV-DIFF-003 | Auth | BEHAV-DIFF | Login ใช้ email ไม่ใช่ username | P2 | แก้ doc + Test Case |
| EDGE-CASE-001 | M-01 Staff | EDGE-CASE | Negative input ฟอร์ม Create Staff ยังไม่มีเคส | P2 | Test Case |
| EDGE-CASE-002 | M-02 Training | EDGE-CASE | วันหมดอายุ/วันที่ย้อนหลังใน course/session | P2 | Test Case |
| DATA-GAP-002 | M-01 Staff | DATA-GAP | isAcive (write) vs isActive (read) กระทบ import | P2 | แก้ระบบ + Test Case |
| DATA-GAP-003 | M-02 Training | DATA-GAP | recurrenceIntervalYears หน่วยปี — ยืนยันมีคอร์ส 1 ปี | P2 | Test Case |
| INT-GAP-001 | Cross / SMTP | INT-GAP | Email retry/bounce behavior ยังไม่ยืนยัน (SRS-09) | P2 | Test Case |

### 4.2 Case Cards (ฉบับเต็ม)

---
**CASE-ID:** PERM-GAP-001
**พบที่:** `app/[locale]/(protected)/production-planner/service-category-rules/page.tsx`; ไม่ปรากฏใน `lib/menus.ts` และ `lib/route-permissions.ts`
**Module:** Cross-cutting / Production Planner
**สิ่งที่เจอ:** มีหน้า `service-category-rules` ทำงานได้ แต่ไม่มี permCode ในเมนูและไม่มี entry ใน route-permission map → `findRoutePermission()` คืน `null` = "ไม่จำกัดสิทธิ์" ⇒ ผู้ใช้ที่ login แล้วทุก role เข้าถึงได้ผ่าน URL ตรง แม้ไม่มีสิทธิ์
**เอกสารที่เกี่ยว:** ไม่มีเอกสารรองรับ (ไม่อยู่ใน SRS-03 matrix / SRS-06 folder structure)
**ช่องว่าง (Gap):** UAT ไม่มีเคสตรวจว่าเมนู/หน้า ที่ไม่มี gate จะรั่ว; SRS-03 matrix ไม่ครอบ Production Planner
**Repro Steps:** 1) login ด้วย role สิทธิ์ต่ำ (เช่น STAFF) 2) เข้า URL `/{locale}/production-planner/service-category-rules` ตรง 3) สังเกตว่าหน้าเปิดได้หรือไม่
**Expected (เสนอ):** ควรถูก block ด้วย Access Denied — **ตัวเลือก A:** เพิ่ม permCode + route-permission (แนะนำ); **ตัวเลือก B:** ถ้าตั้งใจเปิดสาธารณะภายใน ต้องระบุใน SRS → *flag SME (Dev Lead + Business Owner)*
**Evidence:** grep `service-category-rules` ใน menus.ts/route-permissions.ts = ไม่พบ; `route-permissions.ts:79-91` (default = no restriction)
**Priority เสนอ:** P1 (security/RBAC)
**Action เสนอ:** แก้ระบบ (เพิ่ม gate) + เพิ่ม Test Case negative-access

---
**CASE-ID:** PERM-GAP-002
**พบที่:** `master-data/staff` (upsert) vs `hr/staff/new`; API `/master/staff-management/upsert` vs staff create ฝั่ง HR
**Module:** M-01 Staff Introduction
**สิ่งที่เจอ:** มี 2 ทางสร้าง Staff ที่ field ไม่เท่ากัน — Master Data path รับ 8 field, HR path รับฟอร์มเต็ม FM-CM-036 (~20 field). SRS-03 ระบุเฉพาะ SYSTEM_ADMIN/CM_OFFICER ที่แตะ Master Data > Staff แต่ไม่พูดถึง HR path เลย และ F-09 พบ role "Training Coordinator/HR" ที่ไม่มีใน matrix
**เอกสารที่เกี่ยว:** SRS-03 §3 Permission Matrix; SRS-07 §3.5; FM-CM-036
**ช่องว่าง (Gap):** ไม่ชัดว่า role ไหนควรใช้ path ไหน และ field ชุดไหน authoritative → UAT เขียนเคส "ใครสร้าง staff ได้" ไม่ได้
**Repro Steps:** 1) login แต่ละ role 2) ลองเข้า `/master-data/staff` และ `/hr/staff/new` 3) บันทึกว่า role ใดเห็น/สร้างได้ที่จุดใด และ field ต่างกันอย่างไร
**Expected (เสนอ):** นิยาม single source of truth ของ Staff master + mapping role→path. **ตัวเลือก A:** HR path = ทางการสำหรับ full profile, Master Data = quick add; **ตัวเลือก B:** รวมเป็นจุดเดียว → *flag SME (Business Owner)*
**Evidence:** `staff.interface.ts:57-70` (8 field); `hr/staff/new/page.tsx:584-701` (full form); `lib/menus.ts` (HR group)
**Priority เสนอ:** P1
**Action เสนอ:** แก้ SRS-03 (เพิ่ม HR role + path) + Test Case ต่อ role

---
**CASE-ID:** BEHAV-DIFF-001
**พบที่:** `qa/authorization/components/tabs/CrsTab.tsx`, `StaffAuthDrawer.tsx`; API `/qa` authorization endpoints
**Module:** M-03 Authorization & Certification
**สิ่งที่เจอ:** UI อธิบาย CRS eligibility ("ต้องมี SAMS Authorization ที่ยังไม่หมดอายุ + …") ตรงกับ BR-01/BR-03 แต่ **ยังไม่ได้ทดสอบ runtime** ว่าระบบ block จริงเมื่อขาดเงื่อนไข เพราะไม่มี credential เข้า authenticated flow และ Authorization module ส่วนใหญ่ยังเป็น mock (`data-v2.ts`)
**เอกสารที่เกี่ยว:** SRS-02 §6.3 BR-01, BR-03; UAT Master Plan §15
**ช่องว่าง (Gap):** BR-01/BR-03 เป็น P1 ต้อง verify 100% (positive+negative) แต่ยังไม่มีหลักฐาน runtime และ mock อาจไม่ enforce กฎ
**Repro Steps:** 1) login QA_MANAGER 2) เลือก staff ที่ SAMS Auth = Draft/หมดอายุ 3) พยายามออก Customer Auth / mark CRS eligible 4) บันทึกว่า block พร้อม error หรือไม่ 5) ทำซ้ำ 3 negative: ขาด SAMS / ขาด Customer / ขาด Mandatory Training
**Expected (เสนอ):** Positive (ครบ 3 เงื่อนไข) → Eligible; แต่ละ Negative → Not Eligible พร้อมเหตุผลเฉพาะ. **ต้องยืนยันว่ากฎ enforce ที่ backend ไม่ใช่แค่ UI**
**Evidence:** `CrsTab.tsx:99` (ข้อความเงื่อนไข); Authorization ยัง mock (F-25)
**Priority เสนอ:** P1 (compliance/business rule)
**Action เสนอ:** Test Case + ยืนยันว่า Authorization ต่อ API จริงก่อน Phase 2 UAT

---
**CASE-ID:** DATA-GAP-001
**พบที่:** API `/master/training/datastatuses`; UI QA Training/Scheduler
**Module:** M-02 Training Management
**สิ่งที่เจอ:** Training status ในระบบมีอย่างน้อย 9 ค่า (Draft, Open Registration, Registration Closed, In Progress, Grading, Completed, Cancelled, Scheduled, Recurrent) ดึงจาก API แบบ dynamic — มากกว่า UAT v1.0 (6 ค่า) และ lifecycle ในเอกสาร
**เอกสารที่เกี่ยว:** SRS-02 lifecycle; SRS-07 TrainingDataStatus; UAT_Document_SAMS_Training.md:47
**ช่องว่าง (Gap):** UAT lifecycle test ครอบไม่ครบสถานะจริง (ขาด Registration Closed, Scheduled) → transition ที่ไม่ทดสอบอาจมี bug
**Repro Steps:** 1) เรียก `GET /master/training/datastatuses` (ต้อง login) 2) เทียบรายการกับ SRS-07 3) สร้าง session แล้วไล่ทุก transition
**Expected (เสนอ):** เอกสาร lifecycle = enum จาก API ตรงกัน 100% + มี test ต่อ transition. หาก "Recurrent/Scheduled" เป็นสถานะพิเศษต้องอธิบาย
**Evidence:** `lib/api/master/trainingDataStatuses.ts`; grep UI status values (§ evidence ด้านบน)
**Priority เสนอ:** P1
**Action เสนอ:** sync SRS-02/07 กับ enum API + Test Case ต่อ transition

---
**CASE-ID:** NEW-FEAT-001
**พบที่:** `production-planner/service-category-rules/page.tsx`
**Module:** Production Planner (Phase 4 scope)
**สิ่งที่เจอ:** หน้า Service Category Rules มีอยู่จริงแต่ไม่มี FR/เมนู/permission รองรับ
**เอกสารที่เกี่ยว:** ไม่มีเอกสารรองรับ
**ช่องว่าง (Gap):** ฟีเจอร์ที่ไม่มี FR → ไม่มี traceability, ไม่มี UAT
**Repro Steps:** 1) เข้า URL ตรง 2) สังเกต UI/ฟังก์ชัน
**Expected (เสนอ):** เพิ่ม FR + menu หากเป็นฟีเจอร์จริงของ Phase 4 (Commercial pricing rules) — *flag SME PM*
**Evidence:** filesystem; ไม่พบใน menus.ts/route-permissions.ts
**Priority เสนอ:** P2
**Action เสนอ:** แก้ SRS + Test Case (Phase 4)

---
**CASE-ID:** NEW-FEAT-002
**พบที่:** `qa/training-scheduler/` (ปุ่ม/flow session), course "Recurrent"
**Module:** M-02 Training Management
**สิ่งที่เจอ:** ระบบมีแนวคิด Recurrent session (สถานะ "Recurrent", `recurrenceIntervalYears`, `recurrentCount`) และ scheduler upsert — พฤติกรรมการ generate/duplicate session ตามรอบยังไม่มี FR-SCHED เจาะจง
**เอกสารที่เกี่ยว:** SRS-04 FR-SCHED-*
**ช่องว่าง (Gap):** ไม่มี FR อธิบายการสร้าง recurrent occurrence → UAT ไม่ครอบ
**Repro Steps:** 1) สร้างคอร์ส recurrent 2) สร้าง session 3) สังเกตว่าระบบ generate รอบถัดไปอัตโนมัติหรือ manual
**Expected (เสนอ):** ระบุ FR ว่า recurrent สร้างอย่างไร (auto vs manual) — *flag SME*
**Evidence:** `lib/api/qa/course.ts:247` (`recurrentCount`), `scheduler.ts`
**Priority เสนอ:** P3
**Action เสนอ:** ยืนยันพฤติกรรม + แก้ SRS-04

---
**CASE-ID:** NEW-FEAT-003
**พบที่:** `hr/staff/[id]/components/LogbookRecordModal.tsx` (FM-CM-041)
**Module:** M-05 Maintenance Ops / Logbook
**สิ่งที่เจอ:** Logbook record มี checkbox task types รวม "CRS – Certificate of Release to Service" ที่ set `flagCrs` — mapping ไปสิทธิ์ CRS แต่ไม่มี UAT case
**เอกสารที่เกี่ยว:** FM-CM-041; SRS-04 (Experience Log)
**ช่องว่าง (Gap):** flagCrs เชื่อมกับ CRS eligibility แต่ไม่มีเคสตรวจ
**Repro Steps:** 1) เปิด staff → Logbook 2) เพิ่ม record ติ๊ก CRS 3) ตรวจว่า flagCrs ถูกบันทึกและกระทบ eligibility หรือไม่
**Expected (เสนอ):** flagCrs บันทึกถูกต้อง + สะท้อนใน experience summary — *flag SME ว่ากระทบ eligibility จริงไหม*
**Evidence:** `LogbookRecordModal.tsx:51,249`
**Priority เสนอ:** P3
**Action เสนอ:** Test Case

---
**CASE-ID:** BEHAV-DIFF-002
**พบที่:** `config/index.ts`, `messages/`, locale-switcher
**Module:** Cross-cutting / i18n
**สิ่งที่เจอ:** ระบบรองรับ `['en','ar']` มีแค่ `en.json` ไม่มีภาษาไทย ขัด PRD NF-08 "TH/EN สลับได้ทุกหน้า"
**เอกสารที่เกี่ยว:** PRD NF-08; SRS-10 TC-08; SRS-01 §7.2
**ช่องว่าง (Gap):** เขียน test ภาษาไทยไม่ได้ + มี ar ที่ไม่มีในเอกสาร
**Repro Steps:** 1) กดสลับภาษาใน header 2) สังเกตว่ามีตัวเลือก TH หรือไม่ 3) ตรวจ `messages/`
**Expected (เสนอ):** **A:** ถ้าต้องการ TH → implement th.json + เพิ่ม locale (system gap); **B:** ถ้า EN-only จริง → แก้ PRD/SRS-10 และลบ ar ที่ไม่ใช้ → *flag SME (Business Owner + PM)*
**Evidence:** `config/index.ts:1` `locales = ['en', 'ar']`; `messages/` = en.json เท่านั้น
**Priority เสนอ:** P2 (อาจ P1 หาก Phase ต้องทดสอบ TH)
**Action เสนอ:** SME ตัดสิน scope + Test Case ตามผล

---
**CASE-ID:** BEHAV-DIFF-003
**พบที่:** API `POST /user/login`; `lib/api/auth/postLogin.ts`
**Module:** Auth
**สิ่งที่เจอ:** Login ต้องใช้ `email` + `password`; ส่ง `userName` ได้ error "Email field is required". ขัด AUTH_SYSTEM_DOCS ที่ยกตัวอย่าง userName
**เอกสารที่เกี่ยว:** `documents/Technical/AUTH_SYSTEM_DOCS.md:52,117`
**ช่องว่าง (Gap):** เอกสาร dev ทำให้เข้าใจผิด field login → test/automation ผิด
**Repro Steps:** 1) `POST /user/login {"userName":"x","password":"y"}` → error; 2) `{"email":..,"password":..}` → ทำงาน
**Expected (เสนอ):** เอกสารระบุ login field = email
**Evidence:** API probe (message "Email field is required"); `postLogin.ts:47`
**Priority เสนอ:** P2
**Action เสนอ:** แก้ AUTH_SYSTEM_DOCS + Test Case login (positive/negative)

---
**CASE-ID:** EDGE-CASE-001
**พบที่:** `hr/staff/new/page.tsx` (ฟอร์ม FM-CM-036)
**Module:** M-01 Staff Introduction
**สิ่งที่เจอ:** ฟอร์มมี required fields (Title, ชื่อไทย, ชื่ออังกฤษ, DOB, Nationality, Thai ID, Phone, Email, Employee ID, Start Date, Position, Department) แต่ยังไม่มี UAT case สำหรับ negative input
**เอกสารที่เกี่ยว:** FM-CM-036; SRS-04 FR-STAFF
**ช่องว่าง (Gap):** UAT Phase 1 ~35 case ส่วนใหญ่ happy path — ขาด validation/negative
**Repro Steps:** ป้อน: Thai ID ผิด format, Email ผิด, DOB อนาคต, Start Date ย้อนหลังไกล, ปล่อย required ว่าง, empId ซ้ำ — บันทึกว่าระบบตอบอย่างไร (client vs server validation)
**Expected (เสนอ):** ทุก invalid ถูก reject พร้อม error เฉพาะ field + ตรวจซ้ำที่ server (ดู F-23 ว่า validation ต้องไม่พึ่ง client อย่างเดียว)
**Evidence:** `hr/staff/new/page.tsx:584-701` (`getError()` per field)
**Priority เสนอ:** P2
**Action เสนอ:** เพิ่ม negative Test Cases ชุด Staff

---
**CASE-ID:** EDGE-CASE-002
**พบที่:** `qa/course-management`, `qa/training-scheduler` (course/session dates)
**Module:** M-02 Training Management
**สิ่งที่เจอ:** มี field วันหมดอายุ/รอบ recurrent/วันจัด session — ยังไม่มีเคสขอบสำหรับวันที่ย้อนหลัง/expiry ก่อน start (เชื่อม R-BR-04 "expiry > start")
**เอกสารที่เกี่ยว:** SRS-11 R-BR-04; SRS-04 FR-SCHED
**ช่องว่าง (Gap):** ไม่มีเคส validate ความสัมพันธ์ของวันที่
**Repro Steps:** 1) สร้าง session ที่ end < start; 2) expiry ย้อนหลัง; 3) ตรวจ block/ข้อความ
**Expected (เสนอ):** ระบบ block (DB constraint + UI + server). ถ้ายอมรับได้ = defect
**Evidence:** field วันที่ใน `scheduler.ts`, `course.ts`
**Priority เสนอ:** P2
**Action เสนอ:** Test Case + ยืนยัน constraint (เชื่อม F-20)

---
**CASE-ID:** DATA-GAP-002
**พบที่:** `lib/api/master/staff/staff.interface.ts` (write vs read)
**Module:** M-01 Staff Introduction
**สิ่งที่เจอ:** upsert ใช้ `isAcive` (typo), response ใช้ `isActive`. XLSX import template ต้อง map ตาม typo จึงจะเขียน active ได้
**เอกสารที่เกี่ยว:** SRS-07 §3.5 (ระบุ typo ไว้แล้ว); FR-IMP (bulk import)
**ช่องว่าง (Gap):** import template / API contract doc ต้องเตือนเรื่อง typo ไม่งั้น active field เพี้ยน
**Repro Steps:** 1) import staff ด้วยคอลัมน์ `isActive` → ตรวจว่าค่า active ถูกละเลยหรือไม่; 2) เทียบกับ `isAcive`
**Expected (เสนอ):** **A:** แก้ backend เป็น `IsActive` (แนะนำระยะยาว, breaking); **B:** คงไว้แต่ document ชัดในทุก template → *flag SME (Dev Lead จังหวะแก้)*
**Evidence:** `staff.interface.ts:18` (isActive) vs `:65` (isAcive) + comment
**Priority เสนอ:** P2
**Action เสนอ:** แก้ระบบ/หรือ document + Test Case import

---
**CASE-ID:** DATA-GAP-003
**พบที่:** `lib/api/qa/course.ts` (`recurrenceIntervalYears`)
**Module:** M-02 Training Management
**สิ่งที่เจอ:** interval เก็บเป็น **ปี** ไม่ใช่เดือน — PRD พูดถึง "12/24 เดือน". ต้องยืนยันว่ามีคอร์ส recur 1 ปีจริง (mock ตั้ง 2 ปีทั้งหมด)
**เอกสารที่เกี่ยว:** PRD §4.3; SRS-01 §6.1
**ช่องว่าง (Gap):** เอกสารใช้หน่วยเดือน ระบบใช้ปี → เขียน test case interval สับสน
**Repro Steps:** 1) `GET /training/course/listdata` ดู `recurrenceIntervalYears` จริง 2) ตรวจว่ามีค่า 1 (=12 เดือน) หรือไม่
**Expected (เสนอ):** เอกสารระบุหน่วย "ปี"; ยืนยันชุดคอร์สที่ recur 1 ปี มีจริง
**Evidence:** `course.ts:41,85`; mock `course-management/data.ts` (recurrentYears:2)
**Priority เสนอ:** P2
**Action เสนอ:** แก้ SRS-01/PRD หน่วย + Test Case

---
**CASE-ID:** INT-GAP-001
**พบที่:** API `/training/send-email-list`, `/training/email-log-datalist`; `lib/api/email/`
**Module:** Cross-cutting / SMTP (INT-04)
**สิ่งที่เจอ:** ระบบมี email queue/log/preview จริง แต่พฤติกรรม retry (SRS-09 บอก 3 รอบ) และ bounce handling ยังไม่ยืนยันจาก frontend
**เอกสารที่เกี่ยว:** SRS-09 §4.1; F-24 (template count)
**ช่องว่าง (Gap):** UAT ต้องมีเคส retry/bounce แต่ค่าจริง (จำนวนรอบ, template count) อยู่ backend
**Repro Steps:** 1) trigger email ไป inbox ที่ bounce 2) ดู `email-log-datalist` ว่า retry กี่รอบ, สถานะ bounce
**Expected (เสนอ):** retry ตาม SRS-09 (3 รอบ) + log สถานะครบ — ต้องยืนยันจำนวนจริงกับ Dev (อาจ ≠ 3)
**Evidence:** `lib/api/qa/email-log.ts`, endpoint ข้างต้น
**Priority เสนอ:** P2
**Action เสนอ:** Test Case + ยืนยัน retry count/templates กับ Dev

---

## 5. Questions for SME

เรียงตาม priority — ระบุผู้ควรตอบ

| # | คำถาม | อ้างอิง | ควรตอบโดย |
| :-- | :-- | :-- | :-- |
| Q1 | Audit trail แบบ business (append-only, before/after, field-level) มีจริงใน backend หรือมีแค่ ApiInfoLog? ถ้าไม่มี จะปิด CAAT/EASA RC-02 / Exit X12 อย่างไร | F-21 | **Dev Lead / QA Director** |
| Q2 | JWT ใน localStorage เป็น accepted-risk ที่บันทึกแล้วหรือยัง? จะย้ายเป็น httpOnly cookie ก่อน Go-Live หรือไม่ | F-23 | **Dev Lead / QA Director** |
| Q3 | ภาษาไทยอยู่ใน scope จริงไหม? ระบบตอนนี้เป็น EN + AR (ตกค้าง) ไม่มี TH — ถ้าต้อง TH ต้อง implement | F-15 / BEHAV-DIFF-002 | **Business Owner / PM** |
| Q4 | Role model จริงคือ dynamic (data-driven) — จำนวน role "5" หรือ "8" ในเอกสารควรแก้เป็นอะไร? และ Trainer/QA Inspector/HR-Coordinator มี row ใน DB จริงไหม | F-02/F-03/F-09 | **Dev Lead (query DB) + Business Owner** |
| Q5 | Department/Position: SRS-07 (โดเมน Staff&HR) หรือ ระบบ/UAT (เมนู Master Data) คือ authoritative? | F-10 / D-01 | **QA Director / BA** |
| Q6 | Concurrent users target เดียว (1/50/500) และ page/API target (3s-1s vs 5s-3s) — เลือกชุดไหน | F-11, F-12 | **PM + Infra Lead** |
| Q7 | 2 จุดสร้าง Staff (Master Data quick-add vs HR full FM-CM-036) — จุดไหน source of truth, role ไหนใช้จุดไหน | PERM-GAP-002 / D-02 | **Business Owner** |
| Q8 | หน้า service-category-rules ตั้งใจไม่มี permission gate หรือเป็น bug? เป็นฟีเจอร์ Phase 4 ที่ต้องมี FR ไหม | PERM-GAP-001 / NEW-FEAT-001 | **PM / Dev Lead** |
| Q9 | Phase 1 timeline ปัจจุบัน (PRD Q2 2026 แต่ตอนนี้ Q3) — ยืนยัน UAT window ส.ค. 2026 | F-17 | **PM** |
| Q10 | Email retry จริงกี่รอบ (SRS-09 บอก 3) และมี template กี่อัน (7 vs 10)? | F-24 / INT-GAP-001 | **Dev Lead** |
| Q11 | Course PK: `Course.Id=long` vs `CourseId=int` mismatch จริงใน EF model ไหม | F-19 | **Dev Lead** |
| Q12 | BR prefix convention — รับ `R-BR-*` สำหรับ Risks ตาม Master Plan เป็นมาตรฐานทั้งชุดหรือไม่ | F-07 | **QA Director** |
| Q13 | SRS-12/13 มีจริงไหม หรือเป็นเลขตกค้างจาก restructure (พบชุด BEC-PA-SRS-12 แยกต่างหาก) | F-08 | **QA Lead / BA** |
| Q14 | CRS eligibility (BR-01/BR-03) enforce ที่ backend จริงไหม (ยังไม่ได้ทดสอบ runtime + Authorization ยัง mock) | BEHAV-DIFF-001 | **Dev Lead / QA Director** |

---

## 6. Recommended Document Changes (ยืนยันแล้วเท่านั้น)

> เฉพาะรายการที่มี evidence ฝั่งระบบยืนยันชัด — รายการที่ยัง Cannot Verify / Needs SME อยู่ใน §5

| # | เอกสาร / Section | ข้อความเดิม | ข้อความใหม่ที่เสนอ |
| :-- | :-- | :-- | :-- |
| R1 | SRS-01 §2.1 | "CRS (Crew Resource Signing)" | "CRS (Certificate of Release to Service)" — ให้ตรงกับระบบและมาตรฐานการบิน |
| R2 | SRS-03 §2.1 | หัวข้อ "รายการ Role (8 Roles)" + ตาราง 5 แถว | "รายการ Role (5 named seed roles)" + หมายเหตุว่าระบบเป็น data-driven RBAC เพิ่ม role ได้ผ่าน `/master-data/role` |
| R3 | SRS-03 §2.3 | เลขข้อ 2.3.4 → 2.3.8 (ข้าม 2.3.5–2.3.7) | เรียงใหม่ 2.3.1–2.3.5 (5 roles ต่อเนื่อง); §3.2 หัวข้อ "Role ADMIN" → "Role SYSTEM_ADMIN" |
| R4 | SRS-03 §3 Permission Matrix | ครอบเฉพาะ Flight/Contract/Invoice/Report/QA/MasterData/StaffProfile | เพิ่มกลุ่มเมนูจริงที่ขาด: **Production Planner** (5 หน้า) และ **Human Resources** (Staff/Income/Document Verification) — รวม 29 permCode |
| R5 | SRS-04 §2.3 | "Dashboard load สำเร็จภายใน 3 นาที" | "Dashboard load สำเร็จภายใน 5 วินาที" (ตาม NFR-PERF-003) |
| R6 | SRS-04 §7 | `FR-STAFF-015…018` (ในตาราง FR-SCHED) | `FR-SCHED-015…018` — Course closure evidence + Certificate issuance (feature มีจริง: EvidenceUploadModal, CertificateModal) |
| R7 | SRS-04 §4.2.2 | `FR-AUTH-0116` | `FR-AUTH-016` (แก้ typo) |
| R8 | PRD ภาคผนวก A + reference list | มี 014/036/041/062/063/072 | เพิ่ม **FM-CM-055 (Certificate Template)** — ใช้จริงใน `public/FM-CM-055-Certificate-Template.html` |
| R9 | SRS-01 §5.1 | (สถานะ mock ณ เม.ย. 2026: 4/6 sub-module ยัง mock) | อัปเดตเป็น ก.ค. 2026: Monitoring/Course Mgmt/Training Scheduler/HR-Staff ต่อ API แล้ว; **Dashboard และ Authorization ยัง mock** |
| R10 | SRS-01 §6.1 / PRD §4.3 | "recurrent ทุก 24 เดือน" / "12/24 เดือน" | ระบุหน่วยเป็น **ปี** (`recurrenceIntervalYears`) ให้ตรงกับ data model |
| R11 | `AUTH_SYSTEM_DOCS.md` | `loginUser({ userName: 'navee', … })` | `loginUser({ email: '…', password: '…' })` — login field จริงคือ email |
| R12 | SRS-02 lifecycle / SRS-07 TrainingDataStatus | 4–6 สถานะ | sync กับ enum จาก API `/master/training/datastatuses` (≥9 ค่า รวม Registration Closed, Scheduled) |
| R13 | SRS-11 Document Control + SRS-01 §8 | Document No. "SAMS-QA-SRS-13"; "ชุดมี 13 ส่วน" | แก้เป็น SRS-11; "ชุดมี 11 ส่วน" (SRS-01…11) — ยืนยัน SRS-12/13 กับ SME ก่อน (Q13) |

---

### ภาคผนวก — Evidence เพิ่มเติม (training status values ที่พบใน UI)

จาก grep ค่าสถานะใน `app/[locale]/(protected)/qa/**`:
`Completed`(21), `Open Registration`(14), `Cancelled`(13), `In Progress`(11), `Grading`(11), `Draft`(10), `Registration Closed`(5), `Recurrent`(2), `Scheduled`(1), `Passed`/`Pass`(grading)

### ภาคผนวก — API endpoints ที่ frontend ใช้ (ตัวอย่างที่ probe แล้ว)
- `POST /user/login` — ต้อง `{email, password}` (probe: userName → "Email field is required")
- `GET /master/Stations` — 401 เมื่อไม่มี token (baseline latency ~0.12–0.25s), ยืนยัน auth guard ทำงาน
- `GET /health` — **404** (ไม่มี health endpoint มาตรฐาน — ดู note: การ probe readiness ต้องใช้ endpoint อื่น)

> หมายเหตุ discovery เพิ่ม: `GET /health` คืน 404 — ถ้า SRS-09/monitoring คาดหวัง health-check endpoint มาตรฐาน อาจต้องเพิ่ม (P3, ไม่รวมใน case card หลักเพราะอาจมี path อื่น เช่น `/healthz`)

---
*จบรายงาน SAMS-Doc-Verification-Report-v1.0 — ผู้ตรวจไม่ได้แก้ไขเอกสารหรือระบบใด ๆ ทุก verdict อ้างอิง evidence ที่ระบุ path/endpoint ไว้ในตาราง การตัดสินใจสุดท้ายเป็นของ SME*
