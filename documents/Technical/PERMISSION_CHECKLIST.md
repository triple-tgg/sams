# Permission Validation Checklist (Frontend)

> **กติกา:** อัปเดตไฟล์นี้ทุกครั้งที่ (1) มีการตรวจสอบ permission ของเมนู/ปุ่ม หรือ (2) มีเมนู / หน้า / ปุ่ม action ใหม่ระหว่างพัฒนา — เพิ่ม/แก้แถวในตาราง และบันทึกใน [Audit Log](#audit-log) ท้ายไฟล์
>
> สถานะปัจจุบัน: **Phase 0–3 ทำในโค้ดเสร็จแล้ว (2026-11-11) · เหลือ Phase 4 (ยืนยันกับ backend + ทดสอบด้วย role จริง)**

## 1. กลไก permission

| ชั้น | ไฟล์ | ทำอะไร |
|---|---|---|
| Code กลาง | [lib/permission-codes.ts](../../lib/permission-codes.ts) | `MENU.*` = menuCode ทุกตัว · `MENU_REF.*` = code + fallback |
| Logic กลาง (pure, มี test) | [lib/permission-utils.ts](../../lib/permission-utils.ts), [lib/permission-utils.test.ts](../../lib/permission-utils.test.ts) | `normalizeMenuCode`, `buildPermissionIndex`, `resolvePermission`, `hasPermission` |
| โหลดสิทธิ์ | [hooks/use-permission-hydration.ts](../../hooks/use-permission-hydration.ts), [PermissionGuard.tsx](../../components/partials/auth/PermissionGuard.tsx) | ดึงสิทธิ์จาก `getMenuPermissions(roleId)` ลง Redux |
| เมนู sidebar | [lib/menus.ts](../../lib/menus.ts) (`permCode`) + [hooks/use-filtered-menu-list.ts](../../hooks/use-filtered-menu-list.ts) | ซ่อนเมนูที่ไม่มี `canView` · **เมนูกลุ่มไม่มี `permCode`** — แสดงเมื่อมีลูกอย่างน้อย 1 ตัวที่ดูได้ |
| หน้า Role | [lib/permission-tree.ts](../../lib/permission-tree.ts) (`recalcParents`, มี test) | คำนวณสิทธิ์แถวกลุ่มจากลูก แบบล่างขึ้นบน (รองรับกลุ่ม 3 ชั้น) |
| Route | [lib/route-permissions.ts](../../lib/route-permissions.ts) + [RoutePermissionGuard.tsx](../../components/partials/auth/RoutePermissionGuard.tsx) | menuCode + `action` ต่อ route (default `canView`) · **route ที่ไม่อยู่ใน map = เปิดให้ทุกคนที่ login** |
| ปุ่ม/action | [PermissionActionGuard.tsx](../../components/partials/auth/PermissionActionGuard.tsx), [hooks/use-menu-permission.ts](../../hooks/use-menu-permission.ts) | `useMenuPermission(MENU.X)` → `{canView, canCreate, canEdit, canDelete, canExport}` · ไม่พบ code = `false` |

**กติกา fallback (`MENU_REF`)** — code แรกในลิสต์ที่ **มีอยู่ใน DB** เป็นตัวตัดสิน (ไม่ใช่ "อันไหนก็ได้"). ใช้กับหน้าที่ code ของตัวเองอาจยังไม่ได้ลงทะเบียนใน DB:

| Ref | ลำดับ code | ใช้ที่ |
|---|---|---|
| _(ว่าง — ทุก code มีใน DB แล้ว ตั้งแต่ 2026-11-11)_ | | |

**Mapping มาตรฐาน**
- Add / New / Import / Create version / Upload ใหม่ → `canCreate`
- Edit / Save / Toggle active / Approve / Reject / Assign / Send email / Submit score / Enroll / Remove ผู้เข้าอบรม → `canEdit`
- Delete → `canDelete`
- Export / Download / Print / PDF → `canExport` · Download template (ใช้คู่กับ Import) → `canCreate` หรือ `canExport`

**สัญลักษณ์:** ✅ ทำแล้ว · 🟡 บางส่วน · ❌ ยังไม่ได้ทำ · ⚪ ไม่มี action ที่ต้องกัน (ดูอย่างเดียว / stub / state ในเครื่อง) · ❓ ต้องยืนยันกับ backend

---

## 2. สรุปภาพรวมรายเมนู

| เมนู | Permission ref | Route guard | ปุ่ม action | สถานะรวม |
|---|---|---|---|---|
| Flight List | `MENU.FLIGHT_LIST` (DB: `Flight_List`) | ✅ | ✅ | ✅ |
| Flight Timeline (fullscreen) | `MENU.FLIGHT_TIMELINE` | ✅ | ✅ | ✅ |
| THF Create (`/flight/thf/create`) | `MENU.THF` (แยกสิทธิ์จาก Flight List, ไม่มี fallback) | ✅ canCreate/canEdit | ✅ (ทั้งหน้า) | ✅ |
| Contract | `MENU.CONTRACT` | ✅ | ✅ | ✅ |
| Invoice | `MENU.INVOICE` | ✅ | ✅ | ✅ |
| Report | `MENU.REPORT` | ✅ | ✅ | ✅ |
| PP · Dashboard | `MENU.PRODUCTION_DASHBOARD` | ✅ | ✅ | ✅ |
| PP · Production Plan | `MENU.PRODUCTION_PLAN` | ✅ | ✅ | ✅ |
| PP · Revenue Plan | `MENU.REVENUE_PLAN` | ✅ | ✅ | ✅ |
| PP · Customer Service Type | `MENU.CUSTOMER_SERVICE_TYPE` | ✅ | ✅ | ✅ |
| QA · Monitoring | `MENU.QA_TRAINING_MONITORING` | ✅ | ✅ | ✅ |
| QA · Course Management | `MENU.QA_COURSE_MANAGEMENT` | ✅ | ✅ | ✅ |
| QA · Training Scheduler (+ `[id]`) | `MENU.QA_TRAINING_SCHEDULER` | ✅ | ✅ | ✅ |
| QA · Instructor | `MENU.QA_INSTRUCTOR` | ✅ | ✅ | ✅ |
| QA · Authorization | `MENU.QA_AUTHORIZATION` | ✅ | ✅ | ✅ |
| QA · Work Experience Records | `MENU.QA_DOC_WORK_EXPERIENCE` | ✅ | ✅ | ✅ |
| QA · Employee History Training | `MENU.QA_DOC_EMPLOYEE_HISTORY` | ✅ | ⚪ | ✅ |
| HR · Staff List | `MENU.HR_STAFF` | ✅ | ✅ | ✅ |
| HR · New Staff (`/hr/staff/new`) | `MENU.HR_STAFF` | ✅ canCreate | ✅ | ✅ |
| HR · Staff Detail (`/hr/staff/[id]`) | `MENU.HR_STAFF` | ✅ | ✅ | ✅ |
| HR · Employee Income | `MENU.HR_STAFF_INCOME` | ✅ | ✅ | ✅ |
| HR · Document Verification | `MENU.HR_DOCUMENT_VERIFICATION` | ✅ | ✅ | ✅ |
| HR · Workload | `MENU.HR_WORKLOAD` | ✅ | ⚪ | ✅ |
| Roster · Flight Roster | `MENU.FLIGHT_ROSTER` | ✅ | ✅ | ✅ |
| Roster · Certifying Staff / Mech Staff / A/C Type Summary | `MENU.CERTIFYING_STAFF` / `MECH_STAFF` / `AIRCRAFT_TYPE_SUMMARY` | ✅ | ⚪ | ✅ |
| Roster · Manpower Planning | `MENU.MANPOWER_ANALYSIS` | ✅ | ✅ | ✅ |
| Roster · Manpower Scheduling | `MENU.MANPOWER_ANALYSIS` | ✅ | ✅ | ✅ |
| MD · Department | `MENU.MASTER_DATA_DEPARTMENT` | ✅ | ✅ | ✅ |
| MD · Department AMO145 | `MENU.MASTER_DATA_DEPARTMENT_AMO145` | ✅ | ✅ | ✅ |
| MD · Manager Mapping | `MENU.MASTER_DATA_MANAGER_MAPPING` | ✅ | ✅ | ✅ |
| MD · Aircraft Engine | `MENU.MASTER_DATA_AIRCRAFT_ENGINE` | ✅ | ✅ | ✅ |
| MD · Customer Airline | `MENU.MASTER_DATA_CUSTOMER_AIRLINE` | ✅ | ✅ | ✅ |
| MD · Authority | `MENU.MASTER_DATA_AUTHORITY` | ✅ | ✅ | ✅ |
| MD · Station | `MENU.MASTER_DATA_STATION` | ✅ | ✅ | ✅ |
| MD · User Login | `MENU.MASTER_DATA_USER_LOGIN` | ✅ | ✅ | ✅ |
| MD · Role / Set Permission | `MENU.MASTER_DATA_ROLE` | ✅ | ✅ | ✅ |
| MD · Role › Permission Menu (`/master-data/permission-menu`) | `MENU.MASTER_DATA_ROLE` (ใช้ code เดียวกับหน้า Role — ไม่ต้องเพิ่มแถว DB) | ✅ | ✅ | ✅ |
| MD · Training › Venues | `MENU.MASTER_DATA_TRAINING_VENUE` (DB ต้องเพิ่มแถว — ดู MENUS_DB.json id 48–49) | ✅ | ✅ | ✅ |

**ตัวเลขรวม (38 แถว):** ✅ 38 · ⚪ 0 · 🟡 0 · ❌ 0 — code ทุกตัวมีใน DB แล้ว ไม่มี fallback

---

## 3. รายละเอียดรายปุ่ม

> `P/` = `app/[locale]/(protected)/`

### 3.1 Flight — `FLIGHT_LIST`, `FLIGHT_TIMELINE`, `THF`
| ปุ่ม | ไฟล์ | ต้องการ | สถานะ |
|---|---|---|---|
| Add Flight / Import Excel | `P/flight/list/components/list-table.tsx` | FLIGHT_LIST canCreate | ✅ |
| Download Template (ปุ่ม + เมนู) | list-table.tsx | FLIGHT_LIST canCreate หรือ canExport | ✅ |
| Bulk Delete | list-table.tsx | FLIGHT_LIST canDelete | ✅ |
| Open Timeline | list-table.tsx | FLIGHT_TIMELINE canView | ✅ |
| Row: Edit Flight / Delete | `.../columns.tsx` | FLIGHT_LIST canEdit / canDelete | ✅ |
| Row: THF create / edit / view / Request Unlock | columns.tsx | THF canCreate/canEdit/canView | ✅ |
| Row: "Revision Required" badge (เปิด THF) | columns.tsx | THF canEdit (ไม่มีสิทธิ์ = badge กดไม่ได้) | ✅ |
| Row: Send Email | columns.tsx | FLIGHT_LIST canEdit | ✅ |
| Route `/flight/thf/create` | `lib/route-permissions.ts` | THF canCreate หรือ canEdit | ✅ |
| Timeline: Add Flight / Import / Template | `components/flight-timeline/FlightTimelineWrapper.tsx` | FLIGHT_TIMELINE canCreate / canExport | ✅ |
| Timeline: Edit Flight menu | `components/flight-timeline/FlightTable.tsx` | FLIGHT_TIMELINE canEdit | ✅ |
| Timeline: inline cell edit (Check / Time / Staff / Remarks) | FlightTable.tsx (handler return ถ้าไม่มีสิทธิ์) | FLIGHT_TIMELINE canEdit | ✅ |

### 3.2 Contract — `CONTRACT`
| New Contract / Edit / Delete | `P/contract/page.tsx`, `ContractTable.tsx` | canCreate / canEdit / canDelete | ✅ |
|---|---|---|---|

### 3.3 Invoice — `INVOICE`
| ปุ่ม | ไฟล์ | ต้องการ | สถานะ |
|---|---|---|---|
| Export (Pre-Invoice) / Print (Draft) | `P/invoice/page.tsx` | canExport | ✅ |
| Create Pre-Invoice (bulk + row) | `components/ThfDocumentTable.tsx` | canCreate | ✅ |
| Review Unlock (badge + row menu) → Approve / Reject | ThfDocumentTable.tsx | canEdit | ✅ |
| Request Revision | ThfDocumentTable.tsx | canEdit | ✅ |
| `PreInvoiceModal.tsx` | — | ไม่มีที่ใช้งาน | ⚪ |

### 3.4 Report — `REPORT`
| Download (Excel / CSV / ZIP) | `P/report/components/CardList.tsx` | canExport | ✅ |
|---|---|---|---|

### 3.5 Production Planner
| ปุ่ม | ไฟล์ | ต้องการ | สถานะ |
|---|---|---|---|
| Dashboard: Export | `P/production-planner/dashboard/_module/components/RevenueComparisonDashboard.tsx` | PRODUCTION_DASHBOARD canExport | ✅ |
| Dashboard: Save Comment | `.../shared/CommentBox.tsx` | — (เก็บใน localStorage ของเครื่องตัวเอง) | ⚪ |
| Plan: Import | `P/production-planner/_plan/PlanWorkspace.tsx` | PRODUCTION_PLAN / REVENUE_PLAN canCreate | ✅ |
| Plan: Export / Download Template | PlanWorkspace.tsx | canExport | ✅ |
| Plan: Create New Version / Add Station | PlanWorkspace.tsx | canCreate | ✅ |
| Plan grid: แก้ cell / aircraft / station / airline | `_plan/PlanGrid.tsx` (`canEdit`) | canEdit + version lock | ✅ |
| Plan grid: Add airline / type group | PlanGrid.tsx (`canCreate`) | canCreate + version lock | ✅ |
| Plan grid: Delete station / airline / type group | PlanGrid.tsx (`canDelete`) | canDelete + version lock | ✅ |
| Customer Service Type: Import / Export / Add / Edit | `P/production-planner/customer-service-type/page.tsx` | CUSTOMER_SERVICE_TYPE | ✅ |

### 3.6 QA
| ปุ่ม | ไฟล์ | ต้องการ | สถานะ |
|---|---|---|---|
| Monitoring: Edit / Enroll Course | `P/qa/monitoring/components/TrainingDetailModal.tsx` | QA_TRAINING_MONITORING canEdit | ✅ |
| Course Mgmt: Add / Import / Download Template / Edit / Delete | `P/qa/course-management/**` | QA_COURSE_MANAGEMENT (Template + Import + Add อยู่ใน guard canCreate เดียวกัน) | ✅ |
| Course Mgmt: Export (`/migration/courses-export`) | `P/qa/course-management/page.tsx` | QA_COURSE_MANAGEMENT canExport (guard แยกจาก canCreate) | ✅ |
| Course Mgmt: Training Needs Matrix role cell (isRequired) — ทุก category | `TrainingNeedsMatrix.tsx` | QA_COURSE_MANAGEMENT canEdit | ✅ |
| Course Mgmt: Training Needs Matrix › Aircraft Type cell (Edit Aircraft Types) | `TrainingNeedsMatrix.tsx` | QA_COURSE_MANAGEMENT canEdit + Type Course row เท่านั้น | ✅ |
| Scheduler: New Session / Edit / Delete | `P/qa/training-scheduler/page.tsx`, `SessionDetail.tsx` | QA_TRAINING_SCHEDULER | ✅ |
| Scheduler `[id]`: เปลี่ยนสถานะ (→ Evidence Upload), Enroll, Submit Score, Remove staff, Send email / Send All / Manager & Instructor report | `P/qa/training-scheduler/[id]/page.tsx` (ซ่อนปุ่ม + handler return) | QA_TRAINING_SCHEDULER canEdit | ✅ |
| Scheduler `[id]`: Issue Certificates / Print Attendance | `[id]/page.tsx` | QA_TRAINING_SCHEDULER canExport | ✅ |
| Instructor: Add | `P/qa/instructor/page.tsx` | QA_INSTRUCTOR canCreate | ✅ |
| Instructor: Active switch / Edit | page.tsx | QA_INSTRUCTOR canEdit | ✅ |
| Instructor: Delete | page.tsx | QA_INSTRUCTOR canDelete | ✅ |
| Authorization: SAMS / Customer / Authority tab | `P/qa/authorization/components/tabs/*` | QA_AUTHORIZATION canEdit | ✅ |
| Authorization: Mech tab | `MechAuthTab.tsx` | — (state ในหน้าเท่านั้น ไม่บันทึก) | ⚪ |
| Authorization: CRS tab | `CrsTab.tsx` | (มีแค่ filter) | ⚪ |
| Work Experience: Print | `.../work-experience-records/components/*Preview.tsx` | QA_DOC_WORK_EXPERIENCE canExport | ✅ |
| Staff Records › เมนู Work Experience (Maintenance Experiences Logbook Records, SAMS-FM-CM-041) | `.../work-experience-records/components/MaintenanceLogbookPreview.tsx` | เปิด Preview: QA_DOC_WORK_EXPERIENCE canView (เหมือนเมนู Employee Profile / Certifying Staff) · Print + PDF: canExport | ✅ |

### 3.7 HR
| ปุ่ม | ไฟล์ | ต้องการ | สถานะ |
|---|---|---|---|
| Staff list: New Staff / Import Excel / Download Template | `P/hr/staff/page.tsx` | HR_STAFF canCreate | ✅ |
| Staff list: Export (`/migration/staffs-export`) | `P/hr/staff/page.tsx` | HR_STAFF canExport (guard แยกจาก canCreate) | ✅ |
| Route `/hr/staff/new` | `lib/route-permissions.ts` | HR_STAFF canCreate | ✅ |
| Detail: Section edit (Personal / Contact / Employment), Docs edit, Aircraft edit, License edit | `P/hr/staff/[id]/components/ProfileTab.tsx` | HR_STAFF canEdit | ✅ |
| Detail: Add aircraft | ProfileTab.tsx | HR_STAFF canCreate | ✅ |
| Detail: Delete doc / Delete AMEL doc | ProfileTab.tsx | HR_STAFF canDelete | ✅ |
| Detail › User Account tab: view account details | `P/hr/staff/[id]/components/UserAccountTab.tsx` | MASTER_DATA_USER_LOGIN canView (or own account) | ✅ |
| Detail › User Account tab: Create User Account | UserAccountTab.tsx | MASTER_DATA_USER_LOGIN canCreate | ✅ |
| Detail › User Account tab: Link existing account (หลังเช็ค email) | CreateUserAccountDialog.tsx | MASTER_DATA_USER_LOGIN canCreate (เปิด dialog) + canEdit (ปุ่ม Link Account) | ✅ |
| Detail › User Account tab: Change Password | UserAccountTab.tsx | Own account only (API ใช้ token + currentPassword) · คนที่มี MASTER_DATA_USER_LOGIN canEdit เห็นข้อความให้ไปรีเซ็ตที่ Master Data › User Login | ✅ |
| Header profile menu › Account Settings (`/account-settings`): ดูบัญชีตัวเอง + Change Password | `P/account-settings/page.tsx`, `components/partials/header/profile-info.tsx` | ทุกคนที่ login (ไม่อยู่ใน `ROUTE_PERMISSION_MAP` โดยตั้งใจ · ไม่มี menuCode / DB row) | ✅ |
| Header profile menu › My Profile (`/profile`): โปรไฟล์พนักงานของตัวเอง (แสดงเมนูเฉพาะบัญชีที่ผูกพนักงาน `users.staffId`) · landing ของคนที่ไม่มีเมนูที่ดูได้เลยแต่ผูกพนักงานแล้ว (`getNoMenuLandingRoute`) | `P/profile/page.tsx`, `P/hr/staff/[id]/components/StaffProfileView.tsx`, `profile-info.tsx`, `lib/auth/resolveAuthRedirect.ts` | ทุกคนที่ login (ไม่อยู่ใน `ROUTE_PERMISSION_MAP` โดยตั้งใจ · ไม่มี menuCode / DB row) · เจ้าของแก้เองได้โดยไม่ต้องมีสิทธิ์ HR_STAFF (`isSelf` → `SelfProfileContext`): รูปโปรไฟล์, Documents (อัปโหลด/แทนที่/ลบ), AMEL Attachment (อัปโหลด/ลบ), Contact (Email ล็อก แก้ไม่ได้), Logbook Records (บันทึก/แก้ไข) · ส่วนอื่น (Personal Info, Employment, AMEL License, Aircraft License, Training, Experience) ยังใช้ HR_STAFF เหมือนหน้า Staff Detail · ไม่มีปุ่ม Back | ✅ |
| IT Support (`/it-support`): หน้าติดต่อ IT · landing ของคนที่ไม่มีเมนูที่ดูได้เลย (`FALLBACK_ROUTE`) · ปลายทางของปุ่ม Contact IT Support ในหน้า Access Denied | `P/it-support/page.tsx`, `RoutePermissionGuard.tsx`, `lib/auth/resolveAuthRedirect.ts` | ทุกคนที่ login (ไม่อยู่ใน `ROUTE_PERMISSION_MAP` โดยตั้งใจ — ต้องเข้าได้แม้ไม่มีสิทธิ์ใดเลย) | ✅ |
| Detail: Experience / Education add / edit / delete | `ExperienceTab.tsx` | canCreate / canEdit / canDelete | ✅ |
| Detail: Previous Training add / edit / delete | `TrainingTab.tsx` | canCreate / canEdit / canDelete | ✅ |
| Detail: Logbook Record / Skip | `LogbookTab.tsx` | canCreate / canEdit | ✅ |
| Detail: Avatar upload | `[id]/components/StaffProfileView.tsx`, `ProfileAvatar.tsx` (`onUpload` optional) | canEdit | ✅ |
| Detail: Print / PDF | `[id]/page.tsx` | canExport | ✅ |
| Employee Income: Add Rule / Edit / Delete | `P/hr/employee-income/page.tsx` | HR_STAFF_INCOME | ✅ |
| Document Verification: Approve / Reject (row menu + preview) | `P/hr/document-verification/page.tsx` | HR_DOCUMENT_VERIFICATION canEdit | ✅ |

### 3.8 Roster
| ปุ่ม | ไฟล์ | ต้องการ | สถานะ |
|---|---|---|---|
| Flight Roster: Add Flight / Edit Flight | `P/roster/flight-roster/page.tsx` | FLIGHT_ROSTER canCreate / canEdit | ✅ |
| Manpower Settings: ทุก input / Add / Delete / Save / Reset | `P/roster/manpower/planning/SettingsTab.tsx` (`<fieldset disabled>`) | MANPOWER_ANALYSIS canEdit | ✅ |
| Manpower Scheduling: Auto Generate / Reset all / คลิกเปลี่ยนกะ | `P/roster/manpower/scheduling/page.tsx` | MANPOWER_ANALYSIS canEdit | ✅ |

### 3.9 Master Data
| ปุ่ม | ไฟล์ | ต้องการ | สถานะ |
|---|---|---|---|
| Department: Add Dept / Add Position / Edit / Delete | `P/master-data/department/page.tsx`, `components/NodeDetailPanel.tsx` | MASTER_DATA_DEPARTMENT | ✅ |
| Department AMO145: เหมือนข้างบน | `P/master-data/department-amo145/**` | MASTER_DATA_DEPARTMENT_AMO145 | ✅ |
| Manager Mapping: Assign / Change | `P/master-data/manager-mapping/page.tsx` | canCreate หรือ canEdit | ✅ |
| Manager Mapping: Remove | manager-mapping/page.tsx | canDelete | ✅ |
| Aircraft Engine: ทุกแท็บ | `P/master-data/aircraft-engine/components/*` | MASTER_DATA_AIRCRAFT_ENGINE | ✅ |
| Customer Airline / Station / User Login: Add / Edit / Delete | page.tsx ของแต่ละเมนู | code ของเมนูนั้น | ✅ |
| Authority: Add / Edit / Delete | `P/master-data/customer-airline/authority/page.tsx` | MASTER_DATA_AUTHORITY | ✅ |
| Role: Add / Edit / Delete / Save permission | `P/master-data/role/page.tsx` | MASTER_DATA_ROLE | ✅ |
| Permission Menu: Add Menu / Add child (canCreate) · Edit / Drag reorder / Save Order / Reset (canEdit) — Sort Order แสดงอย่างเดียว | `P/master-data/permission-menu/page.tsx` | MASTER_DATA_ROLE (handler เช็คซ้ำ) | ✅ |
| Training Venues: Add Venue / Edit / Delete (View ทุกคนที่เข้าหน้าได้) | `P/master-data/training-venues/page.tsx` | MASTER_DATA_TRAINING_VENUE canCreate / canEdit / canDelete (handler เช็คซ้ำ) | ✅ |

---

## 4. ปัญหาเชิงโครงสร้าง (สถานะ)

1. ✅ menuCode ไม่ตรงกัน — แก้ด้วย `MENU_REF` (code ของตัวเอง + fallback) · `QA_STAFF` → `HR_STAFF`
2. ✅ route map entry ค้าง (`aircraft-type*`, `aircraft-group`) — ลบแล้ว
3. ✅ route ที่เป็น action ใช้แค่ canView — เพิ่ม `action` ใน route map (`/hr/staff/new`, `/flight/thf/create`)
4. ✅ normalize 3 แบบ — รวมเป็น `normalizeMenuCode` ใช้ทั้ง sidebar / route / ปุ่ม
5. ✅ ไม่มี constant กลาง — `lib/permission-codes.ts`
6. ✅ hardcode `/en/` — ใช้ `useLocale()` (hr/staff, hr/staff/new, hr/staff/[id], qa/dashboard)
7. ❓ backend ต้องตรวจสิทธิ์ทุก endpoint (ยังไม่ได้ยืนยัน — ดู Phase 4) · สิทธิ์ฝั่ง frontend เป็นแค่การซ่อน UI (cache อยู่ใน `localStorage.user.menuPermissions` ซึ่งผู้ใช้แก้เองได้)
8. ✅ หน้า landing หลัง login — `getFirstViewableRoute` เคยเลือกแถวกลุ่ม (FLIGHT, HR, QA…) ซึ่ง route ชี้ไปหน้าลูกตัวแรก ทำให้ role ที่ได้สิทธิ์แค่บางเมนูในกลุ่มเจอ Access Denied ทันทีหลัง login → ข้ามแถวกลุ่ม และเลือกเฉพาะ route ที่ route guard ให้เข้า (2026-11-11)
10. ✅ เมนู Master Data ไม่แสดง — (a) หน้า Role คำนวณแถวแม่รอบเดียวจากบนลงล่าง กลุ่ม 3 ชั้น (MASTER_DATA → MASTER_ORGANIZATION / MASTER_AIRCRAFT_CONFIG / MASTER_AIRLINE_AUTHORITY / MASTER_SYSTEM → หน้า) จึงใช้ค่าเก่าของกลุ่มย่อย แล้วบันทึก MASTER_DATA เป็น false (b) sidebar เช็ค code ของเมนูกลุ่มตรงๆ (`MASTER_DATA`, `QA`, `QA_TRAINING`, `HR`, `ROSTER`, `PRODUCTION_PLANNER`) ผิดกฎ "ห้ามเช็ค code แม่" → แก้ทั้งสองจุด (2026-11-11) · ค่าที่ผิดใน DB จะถูกแก้เมื่อกด Save ในหน้า Role อีกครั้ง
9. ❓ ข้อมูลในตาราง `menus` ที่ควรแก้ฝั่ง DB (frontend ทำงานได้อยู่แล้ว): `PRODUCTION_PLANNER.route` = `/production-planner/` ไม่มีหน้านี้ (ควรเป็น `/production-planner/dashboard`) · `Flight_List` ควรเป็น `FLIGHT_LIST` ตามกฎ menuCode · `QA_TRAINING_TRAINING` (id 16) ไม่มีที่ใช้

---

## 5. แผนปรับปรุง

### Phase 0 — Foundation ✅
- [x] 0.1 `lib/permission-codes.ts` + ใช้ใน menus.ts, route-permissions.ts และปุ่มทั้งหมด
- [x] 0.2 รวม normalize เป็น `normalizeMenuCode` + fallback AMO145 ใน route guard (ผ่าน `MENU_REF`)
- [x] 0.3 ยืนยัน menuCode ใน DB: `THF` (**จำเป็น** — ไม่มี fallback ถ้าไม่มี code นี้ ปุ่ม THF และ `/flight/thf/create` จะถูกปิดสำหรับทุกคน), `QA_MONITORING1`, `QA_COURSE_MANAGEMENT`, `QA_INSTRUCTOR`, `QA_TRAINING_SCHEDULER` → ถ้ามีครบ ลบ fallback ใน `MENU_REF` ได้ · **2026-11-11:** DB มี QA_COURSE_MANAGEMENT, QA_INSTRUCTOR, QA_TRAINING_SCHEDULER, MASTER_DATA_DEPARTMENT_AMO145 แล้ว → ลบ fallback แล้ว · QA_MONITORING1 → เปลี่ยนเป็น QA_TRAINING_MONITORING ตาม DB แล้ว (fallback หมดแล้ว)
- [x] 0.4 `RoutePermission.action`
- [x] 0.5 unit test `lib/permission-utils.test.ts` (11 tests)

### Phase 1 — code ผิด / route ✅
- [x] 1.1 Course Management / Instructor / Training Scheduler ใช้ code ของตัวเอง (มี fallback)
- [x] 1.2 Staff detail `QA_STAFF` → `HR_STAFF`
- [x] 1.3 Monitoring → `MENU.QA_TRAINING_MONITORING` ทั้ง sidebar / route / ปุ่ม
- [x] 1.4 `/hr/staff/new` canCreate, `/flight/thf/create` canCreate|canEdit
- [x] 1.5 ลบ entry ค้าง · service-category-rules ใช้ `PRODUCTION_PLANNER` ไปก่อน (ยังไม่มี code ของตัวเอง)

### Phase 2 — ปุ่มแก้ข้อมูลสำคัญ ✅
- [x] 2.1 HR Document Verification
- [x] 2.2 HR Employee Income
- [x] 2.3 Invoice
- [x] 2.4 Production / Revenue Plan
- [x] 2.5 Department, AMO145, Manager Mapping, Authority
- [x] 2.6 QA Instructor

### Phase 3 — ปุ่มที่เหลือ ✅
- [x] 3.1 HR Staff detail + Staff Import Excel
- [x] 3.2 Training Scheduler `[id]`
- [x] 3.3 Monitoring modal, Training Needs Matrix, Work Experience Print, QA Dashboard (Mech tab = ⚪)
- [x] 3.4 Flight: Revision badge, Send Email, Template, Timeline inline edit
- [x] 3.5 Roster: Flight Roster, Manpower Settings, Scheduling
- [x] 3.6 Report download, PP Dashboard Export (Comment = ⚪)
- [x] 3.7 hardcode `/en/`

### Phase 4 — Verify & กันไม่ให้หลุดอีก (ยังไม่ทำ)
- [ ] 4.1 ยืนยันกับทีม backend ว่าทุก endpoint create/update/delete/export ตรวจสิทธิ์ฝั่ง server
- [ ] 4.2 ทดสอบบนเครื่องด้วย role 3 แบบ: view-only, editor (ไม่มี delete), full — เดินทุกหน้าใน §2
- [ ] 4.3 (optional) script/ESLint rule ตรวจไฟล์ที่มี handler แก้ข้อมูลแต่ไม่มี `useMenuPermission` / `PermissionActionGuard` — หมายเหตุ: `npm run lint` ของโปรเจคพังอยู่แล้ว (ESLint 9 + `.eslintrc.json`) ต้องแก้ config ก่อน
- [ ] 4.4 ถ้า 0.3 ยืนยันแล้ว ลบ fallback ที่ไม่ใช้ใน `MENU_REF`

---

## 6. วิธีเพิ่มรายการใหม่
1. **menuCode ใหม่** → เพิ่มใน `MENU` ใน `lib/permission-codes.ts`
2. **เมนู/หน้าใหม่** → `permCode: MENU.X` ใน `lib/menus.ts` + entry ใน `lib/route-permissions.ts` (ใส่ `action` ถ้าหน้านั้นเป็นการสร้าง/แก้) + แถวใน §2
3. **ปุ่ม action ใหม่** → `const perm = useMenuPermission(MENU.X)` แล้ว `{perm.canEdit && <Button…/>}` หรือ `<PermissionActionGuard menuCode={MENU.X} action="canEdit">` + แถวใน §3
   - ระวัง: อย่าใส่ `PermissionActionGuard` ไว้ **ข้างใน** `<TooltipTrigger asChild>` / `<DropdownMenuTrigger asChild>` — ให้ครอบ Trigger ทั้งก้อนแทน
   - ถ้า handler ถูกเรียกได้จากหลายทาง (Enter key, cell click) ให้ `if (!perm.canEdit) return` ใน handler ด้วย
4. **แถวใหม่ในตาราง `menus` (DB)** → เพิ่มใน [MENUS_DB.json](MENUS_DB.json) ด้วย ตามกฎ:
   - **sortOrder:** หลักร้อย = กลุ่มเมนูหลักตามลำดับ sidebar (100 Flight · 200 Contract · 300 Invoice · 400 Report · 500 Production Planner · 600 QA · 700 HR · 800 Roster · 900 Master Data · กลุ่มใหม่ 1000, 1100…) · เลขที่เหลือ = ลำดับในกลุ่มตาม sidebar (901, 902…) · กลุ่มที่มีกลุ่มย่อยใช้หลักสิบ (QA: 610 Training → 611–614) · เมนูใหม่ใช้เลขว่างถัดไปในกลุ่ม ไม่ต้องเลื่อนเลขแถวอื่น · ห้ามซ้ำ
   - **parentId:** หน้า Role คำนวณสิทธิ์เมนูแม่จากเมนูลูก (ลูกตัวไหนได้ = แม่ได้) และแก้เมนูแม่ตรงๆ ไม่ได้ → ถ้า code ไหนต้องตั้งสิทธิ์แยก **ห้ามให้เป็นแม่-ลูกกัน** · แถวแม่เป็นแค่กลุ่ม ห้ามใช้ code ของแม่เช็คสิทธิ์ตรงๆ (เช่น `FLIGHT` เป็นแม่ของ `Flight_List` / `FLIGHT_TIMELINE` / `THF` → หน้า Flight List เช็ค `FLIGHT_LIST`) · `route` ของแถวกลุ่มไม่ถูกใช้เป็นหน้า landing
   - **menuCode:** ตัวพิมพ์ใหญ่ คั่นด้วย `_` (ไม่ใช้ช่องว่าง) ต้องตรงกับ `MENU`
5. บันทึก Audit Log ด้านล่าง

---

## Audit Log
| วันที่ | ผู้ตรวจ | ขอบเขต | ผลลัพธ์ |
|---|---|---|---|
| 2026-11-11 | Claude (ตามคำขอ sattaya prata) | ตรวจทั้งโปรเจค: sidebar, route guard, ปุ่ม action ทุกหน้า | เช็คลิสต์ฉบับแรก: ✅ 12 · 🟡 11 · ❌ 17 · ⚪ 3 · ยังไม่ได้แก้โค้ด |
| 2026-11-11 | Claude (ตามคำขอ sattaya prata) | ทำ Phase 0–3 + สแกนซ้ำรวม `DropdownMenuItem` / `Switch` (รอบแรกตกหล่น เช่น Approve/Reject ในเมนูแถว, Edit/Delete ของ Employee Income, Instructor switch) | ✅ 36 · ⚪ 4 · `tsc` ผ่าน · test ใหม่ 11/11 ผ่าน · test เดิมที่ fail 10 ตัว (Aircraft-Engine, Authorization) fail เหมือนก่อนแก้ ไม่เกี่ยวกับงานนี้ · ยังไม่ได้ทดสอบบน browser ด้วย role จริง |
| 2026-11-11 | Claude (ตามคำขอ sattaya prata) | ตัด fallback `THF → FLIGHT` (ผู้ใช้ยืนยัน: THF แยกสิทธิ์จาก Flight) | ปุ่ม THF + route `/flight/thf/create` ใช้ `MENU.THF` อย่างเดียว · สิทธิ์ `FLIGHT` ไม่ให้สิทธิ์ THF แล้ว · role ไหนต้องใช้ THF ต้องตั้งสิทธิ์ `THF` ในหน้า Role · เพิ่ม test 1 ตัว |
| 2026-11-11 | Claude (ตามคำขอ sattaya prata) | เทียบตาราง `menus` ใน DB (47 แถว) กับ frontend · ลบหน้า Document Generation (stub, ไม่ใช้งาน, ไม่มี code ใน DB) | DB มี code ที่ frontend ใช้ครบ · ลบ `/qa/document-generation`, เมนู sidebar, route map, `MENU.QA_DOCUMENT_GENERATION`, i18n key · code ใน DB ที่ frontend ไม่ใช้: `QA_STAFF`, `MASTER_DATA_STAFF`, `MONTHLY_FREQUENCY`, `QA_DOC_CERTIFYING_STAFF` |
| 2026-11-11 | Claude (ตามคำขอ sattaya prata) | เพิ่ม code ให้หน้าที่ยังไม่มี code ของตัวเอง | `SERVICE_CATEGORY_RULES`, `QA_DASHBOARD` + route map + fallback ไป `PRODUCTION_PLANNER` / `QA` จนกว่า DB จะมี code · ต้อง INSERT ลงตาราง `menus` · เพิ่ม test 1 ตัว |
| 2026-11-11 | Claude (ตามคำขอ sattaya prata) | ทำ JSON ตาราง `menus` ที่ควรมีใน DB ([MENUS_DB.json](MENUS_DB.json)) | 45 แถว ตรงกับ `MENU` ทุกตัว · sortOrder แบ่งเป็นช่วงร้อยตามกลุ่ม · **THF ต้องอยู่ระดับบนสุด (parentId null)** เพราะหน้า Role คำนวณสิทธิ์เมนูแม่จากเมนูลูก (มีลูกตัวไหนได้ = แม่ได้) และแก้เมนูแม่โดยตรงไม่ได้ ถ้าย้าย THF ไปไว้ใต้ FLIGHT สิทธิ์ Flight จะถูกคำนวณจาก THF แทน · ย้าย Monitoring/Course/Scheduler/Instructor ไปไว้ใต้ `QA_MONITORING` ให้ตรงกับ sidebar |
| 2026-11-11 | Claude (ตามคำขอ sattaya prata) | ลบหน้า Config Version Plan (stub, ไม่ใช้งาน) | ลบ `/production-planner/config-version-plan`, เมนู sidebar, route map, `MENU.CONFIG_VERSION_PLAN`, แถวใน MENUS_DB.json (เหลือ 44 แถว, ไม่เลื่อน sortOrder ตามกฎ) · ต้องลบแถว id 46 ใน DB |
| 2026-11-11 | Claude (ตามคำขอ sattaya prata) | ลบหน้า Import Flight Data (stub, ไม่ใช้งาน, ไม่อยู่ใน sidebar) | ลบ `/production-planner/import-flight-data`, route map, `MENU.IMPORT_FLIGHT_DATA`, แถวใน MENUS_DB.json (เหลือ 43 แถว, ไม่เลื่อน sortOrder) · ต้องลบแถว id 23 ใน DB |
| 2026-11-11 | Claude (ตามคำขอ sattaya prata) | ลบหน้า Service Category Rules (stub, ไม่ใช้งาน) | ลบ `/production-planner/service-category-rules`, route map, `MENU.SERVICE_CATEGORY_RULES` + `MENU_REF`, แถวใน MENUS_DB.json (เหลือ 42 แถว) · ไม่ต้อง INSERT ใน DB แล้ว · ไม่มีหน้า stub เหลือ |
| 2026-11-11 | Claude (ตามคำขอ sattaya prata) | ลบหน้า QA Dashboard (ไม่ใช้งาน, ไม่อยู่ใน sidebar, ข้อมูล mock) | ลบ `/qa/dashboard` (page + css), route map, `MENU.QA_DASHBOARD` + `MENU_REF`, test, แถวใน MENUS_DB.json (เหลือ 41 แถว) · ไม่ต้อง INSERT ใน DB · `MENU_REF` เหลือ 5 ตัว ซึ่ง DB มี code หลักครบแล้ว |
| 2026-11-11 | Claude (ตามคำขอ sattaya prata) | หน้า Flight List ใช้ code `FLIGHT_LIST` (DB เพิ่ม `Flight_List` ใต้ `FLIGHT`) | sidebar, route `/flight` และปุ่มใน list-table.tsx / columns.tsx เปลี่ยนจาก `MENU.FLIGHT` เป็น `MENU.FLIGHT_LIST` · `FLIGHT` เป็นเมนูแม่ (คำนวณจากลูก) ห้ามใช้เช็คสิทธิ์ตรงๆ · เพิ่ม test 1 ตัว |
| 2026-11-11 | Claude (ตามคำขอ sattaya prata) | ลบ fallback ใน `MENU_REF` ของ QA_COURSE_MANAGEMENT, QA_TRAINING_SCHEDULER, QA_INSTRUCTOR, MASTER_DATA_DEPARTMENT_AMO145 (DB มี code ครบแล้ว) | ทุกจุดใช้ `MENU.*` ตรงๆ · สิทธิ์ `QA_MONITORING` / `MASTER_DATA_DEPARTMENT` ไม่ให้สิทธิ์หน้าเหล่านี้แล้ว · ถ้าลบ row เหล่านี้ออกจาก DB หน้าจะเข้าไม่ได้ทันที · เหลือ `MENU_REF.QA_MONITORING_PAGE` (รอแก้ชื่อ QA Training) |
| 2026-11-11 | Claude (ตามคำขอ sattaya prata) | เปลี่ยนชื่อ code QA Training ให้ตรง DB และลบ fallback ตัวสุดท้าย | `MENU.QA_MONITORING` ("QA_MONITORING") → `MENU.QA_TRAINING` ("QA_TRAINING", กลุ่ม Training ใน sidebar) · `QA_MONITORING_PAGE` ("QA_MONITORING1") → `MENU.QA_TRAINING_MONITORING` (sidebar, route `/qa/monitoring`, TrainingDetailModal) · `MENU_REF` ว่างแล้ว · row `QA_TRAINING_TRAINING` (id 16) ใน DB ไม่ได้ใช้ ควรลบ |
| 2026-11-11 | Claude (ตามคำขอ sattaya prata) | ตรวจซ้ำทั้งโปรเจค: `MENU` ↔ MENUS_DB.json (48 แถว) ↔ sidebar ↔ route map ↔ หน้า 45 หน้า · mutation hook 91 ตัว + ฟังก์ชัน API ที่แก้ข้อมูล 138 ตัว เทียบกับไฟล์ที่เช็คสิทธิ์ · handler ของปุ่ม action ทุกไฟล์ | ไม่พบปุ่ม/route ที่หลุด · `MENU` ทุกตัวมีใน DB · ไม่มี string literal / `MENU_REF` เหลือ · **แก้ 2 จุด:** (1) หน้า landing หลัง login ข้ามแถวกลุ่มและเช็ค route guard (`getFirstViewableRoute` + test 7 ตัว) (2) `/qa` redirect ไป `/qa/training` ที่ไม่มีอยู่ → `/qa/monitoring` · test สิทธิ์ 34/34 ผ่าน · `tsc` ผ่าน (ยกเว้น error เดิมใน aircraftEngine.completeness.test และ `.next/types` ที่ค้างจากหน้าที่ลบไป) · ยังไม่ได้ทดสอบบน browser ด้วย role จริง · ดู §4 ข้อ 8–9 |
| 2026-11-11 | Claude (ตามคำขอ sattaya prata) | เมนู Master Data ไม่แสดงใน sidebar | สาเหตุ + วิธีแก้ดู §4 ข้อ 10 · ย้าย `flattenPerms` / `recalcParents` ไป `lib/permission-tree.ts` + test 3 ตัว · เอา `permCode` ออกจากเมนูกลุ่ม 6 ตัวใน `lib/menus.ts` · route map ไม่เปลี่ยน · test สิทธิ์ 37/37 ผ่าน · `tsc` ผ่าน (ยกเว้น error เดิม) · ยังไม่ได้ทดสอบบน browser · **ต้องเปิดหน้า Role แล้วกด Save ทุก role** เพื่อแก้ค่าแถวกลุ่มใน DB |
| 2026-11-11 | Claude (ตามคำขอ sattaya prata) | เมนู Master Data ยังไม่แสดง — ดึง `/permission/menus/{roleId}` จาก API จริง | **สาเหตุอยู่ที่ DB:** `HR`, `ROSTER`, `MASTER_DATA`, `QA_DOC` ส่ง `children: null` · id ใน DB เลื่อนลง 1 ตั้งแต่ QA_COURSE_MANAGEMENT (ไม่มีแถว QA_TRAINING_TRAINING) แต่ `parentId` ยังใช้ค่าจาก MENUS_DB.json → แถวลูกชี้ไปที่ตัวเอง (เช่น HR_STAFF id 24 parentId 24) backend จึงตัดทิ้ง · frontend ถูกแล้ว (ไม่มี code = ไม่ให้สิทธิ์) · ต้องแก้ `parentId` ใน DB ด้วย SQL ที่อ้างอิงตาม menuCode · หลังแก้แล้วต้องตั้งสิทธิ์เมนูเหล่านี้ในหน้า Role แล้วกด Save |
| 2026-11-11 | Claude (ตามคำขอ sattaya prata) | ตรวจซ้ำทั้งโปรเจค + ดึง `/permission/menus/{roleId}` จาก API จริง | **DB แก้แล้ว:** tree ครบ 47 แถว HR / Roster / Master Data / QA Document มีลูกครบ · **พบว่าโค้ดแก้ของ §4 ข้อ 10 ไม่อยู่ใน repo** (commit 1718cf26 มีแค่ไฟล์นี้) → ใส่กลับ: `lib/permission-tree.ts` (`recalcParents` ล่างขึ้นบน + test 3 ตัว), เอา `permCode` ออกจากเมนูกลุ่ม 6 ตัวใน `lib/menus.ts` · **พบสำเนา `recalcParents` อีกจุด** ใน `user-login/components/UserFormDialog.tsx` (บั๊กเดียวกัน) → ใช้ตัวกลางร่วมกับหน้า Role · MENUS_DB.json ปรับให้ตรง DB จริง (ลบ `QA_TRAINING_TRAINING`, id 1–47) · code / route map / sidebar / ปุ่ม action ไม่พบจุดหลุด · test สิทธิ์ 37/37 ผ่าน · `tsc` ผ่าน (ยกเว้น error เดิม) · role ที่ทดสอบ: `QA_DOC_EMPLOYEE_HISTORY` และ `MASTER_DATA_USER_LOGIN` ยังเป็น false ทุก action |
| 2026-11-12 | Claude (ตามคำขอ sattaya prata) | Course Management: เพิ่มปุ่ม Template (GET `/migration/courses-template`) | อยู่ใน `PermissionActionGuard` QA_COURSE_MANAGEMENT canCreate ร่วมกับ Import / Add Course — ไม่มี canCreate จะไม่เห็นปุ่ม · ไม่มีเมนูหรือ route ใหม่ ไม่ต้องแก้ DB |
| 2026-11-12 | Claude (ตามคำขอ sattaya prata) | HR Staff List: เพิ่มปุ่ม Template (GET `/migration/staffs-template`) | อยู่ใน `PermissionActionGuard` HR_STAFF canCreate เดียวกับ Import Excel — ไม่มี canCreate จะไม่เห็นปุ่ม · ไม่มีเมนูหรือ route ใหม่ ไม่ต้องแก้ DB |
| 2026-11-13 | Claude (ตามคำขอ sattaya prata) | HR Staff Detail: เพิ่ม tab User Account (สร้างบัญชี / ดูบัญชี / เปลี่ยนรหัสผ่าน) | ใช้สิทธิ์ `MASTER_DATA_USER_LOGIN` (ไม่ใช่ HR_STAFF) เพราะเป็นการจัดการบัญชีผู้ใช้ · ผู้ใช้ดูและเปลี่ยนรหัสผ่านบัญชีตัวเองได้แม้ไม่มีสิทธิ์ · tab แสดงทุกคนที่เข้าหน้า Staff Detail ได้ · ไม่มีเมนูหรือ route ใหม่ ไม่ต้องแก้ DB |
| 2026-11-14 | Claude (ตามคำขอ sattaya prata) | HR Staff Detail › User Account: ต่อ API `POST /user/change-password` ตัวจริง (body `currentPassword`, `newPassword`) | API เปลี่ยนรหัสผ่านของผู้ใช้จาก token เท่านั้น → ฟอร์ม Change Password แสดงเฉพาะบัญชีของตัวเอง · **`MASTER_DATA_USER_LOGIN` canEdit ไม่ให้สิทธิ์เปลี่ยนรหัสผ่านคนอื่นใน tab นี้แล้ว** (แสดงข้อความให้ไปรีเซ็ตที่ Master Data › User Login ซึ่งยังใช้ canEdit เหมือนเดิม) · ไม่มีเมนูหรือ route ใหม่ ไม่ต้องแก้ DB |
| 2026-11-14 | Claude (ตามคำขอ sattaya prata) | Course Management › Training Needs Matrix: คลิกช่อง Aircraft Type เพื่อแก้ aircraft type ของ course | ใช้สิทธิ์เดียวกับช่อง role คือ `QA_COURSE_MANAGEMENT` canEdit และเฉพาะแถว Type Course · บันทึกผ่าน `POST /training/course-department-subs/requirements/upsert` โดยส่งทุก role ที่ Required ของ course นั้นพร้อม combination ชุดเดียว · ไม่มีเมนูหรือ route ใหม่ ไม่ต้องแก้ DB |
| 2026-11-14 | Claude (ตามคำขอ sattaya prata) | Training Needs Matrix: ช่อง role แก้ isRequired ได้ทุก course (เดิมเฉพาะ Type Course) | ใช้ `QA_COURSE_MANAGEMENT` canEdit เหมือนเดิม · course ที่ไม่ใช่ Type Course ส่ง `aircraftEngineCombinationIds: []` · ช่อง Aircraft Type ยังแก้ได้เฉพาะ Type Course · ไม่มีเมนูหรือ route ใหม่ ไม่ต้องแก้ DB |
| 2026-11-14 | Claude (ตามคำขอ sattaya prata) | เพิ่มเมนู Account Settings ใน dropdown โปรไฟล์ (header) → หน้าใหม่ `/account-settings` | หน้าเฉพาะบัญชีของตัวเอง (ข้อมูลจาก `GET user/{id}` ของ id ตัวเอง + `POST /user/change-password`) จึงเปิดให้ทุกคนที่ login · ไม่ใช่เมนู sidebar ไม่มี menuCode ไม่ต้องเพิ่มแถว DB / route map · ฟอร์มเปลี่ยนรหัสผ่านแยกเป็น `components/partials/auth/ChangePasswordForm.tsx` ใช้ร่วมกับ HR Staff › User Account tab |
| 2026-11-14 | Claude (ตามคำขอ sattaya prata) | เพิ่มหน้า IT Support `/it-support` + เปลี่ยน `FALLBACK_ROUTE` จาก `/flight/list` เป็น `/it-support` | ผู้ใช้ที่ role ไม่มีเมนูที่ดูได้เลย: หลัง login / เปิด root ไปหน้า IT Support (ไม่ใช่ Access Denied ที่ Flight List) · `RoutePermissionGuard`: ถ้าโดนปฏิเสธและไม่มีเมนูที่ดูได้เลย → redirect ไป IT Support, ถ้ายังมีเมนูอื่น → Access Denied พร้อมปุ่ม Contact IT Support (`?from=<path>`) · ช่องทางติดต่ออ่านจาก env `NEXT_PUBLIC_IT_SUPPORT_*` · ไม่มี menuCode ไม่ต้องเพิ่มแถว DB · test `resolveAuthRedirect` +1 |
| 2026-11-15 | Claude (ตามคำขอ sattaya prata) | HR Staff Detail › User Account: Create User Account เช็ค email ก่อน (`POST /master/users-check`, fallback `Users-list`) | ไม่มีบัญชี → ฟอร์ม Add New User เดิม (canCreate) · มีบัญชีที่ยังไม่ผูก Employee → ปุ่ม Link Account อัปเดตบัญชีเดิม จึงต้องมี `MASTER_DATA_USER_LOGIN` **canEdit** เพิ่ม (ไม่มีจะเห็นข้อความแจ้งและปุ่มกดไม่ได้) · ผูกกับพนักงานอื่นแล้ว → แจ้งเตือนเท่านั้น · ไม่มีเมนูหรือ route ใหม่ ไม่ต้องแก้ DB |
| 2026-11-15 | Claude (ตามคำขอ sattaya prata) | Course Management: เพิ่มปุ่ม Export (POST `/migration/courses-export`) | ใช้ `PermissionActionGuard` QA_COURSE_MANAGEMENT **canExport** แยกจากกลุ่ม canCreate (Template / Import / Add) · role ที่มีแค่ canView + canExport เห็นเฉพาะปุ่ม Export · staging ตอนนี้ตอบ POST เป็น 405 และรองรับแค่ GET → frontend ลอง GET ต่อเมื่อได้ 405 · ไม่มีเมนูหรือ route ใหม่ ไม่ต้องแก้ DB |
| 2026-11-15 | Claude (ตามคำขอ sattaya prata) | HR Staff List: เพิ่มปุ่ม Export (POST `/migration/staffs-export`) | ใช้ `PermissionActionGuard` HR_STAFF **canExport** แยกจาก canCreate (Template / Import Excel / New Staff) · staging ตอนนี้ตอบ POST เป็น 405 และรองรับแค่ GET → frontend ลอง GET ต่อเมื่อได้ 405 · ไม่มีเมนูหรือ route ใหม่ ไม่ต้องแก้ DB |
| 2026-11-15 | Claude (ตามคำขอ sattaya prata) | QA Document › Staff Records: เพิ่มเมนู Work Experience → Preview Maintenance Experiences Logbook Records (A4 แนวนอน, `POST /staffs/maintenance-experiences/logbook-records/list`) | ใช้สิทธิ์เดิมของหน้า `QA_DOC_WORK_EXPERIENCE` · ปุ่ม Print / PDF อยู่ใต้ canExport เหมือน Preview อื่นในหน้า · ไม่มีเมนูหรือ route ใหม่ ไม่ต้องแก้ DB |
| 2026-11-17 | Claude (ตามคำขอ sattaya prata) | Master Data: เพิ่มกลุ่ม Training › Venues (`/master-data/training-venues`, API `/master/trainingVenues/*`) | code ใหม่ `MASTER_DATA_TRAINING_VENUE` ใน `MENU` · sidebar `permCode` · route map (ก่อน prefix `/master-data`) · ปุ่ม Add ใช้ `PermissionActionGuard` canCreate, Edit/Delete ในเมนูแถวใช้ `perm.canEdit` / `perm.canDelete` + เช็คใน handler · **ต้องเพิ่มแถว DB:** `MASTER_TRAINING` (id 48, parent 34, sortOrder 950, กลุ่มเท่านั้น) และ `MASTER_DATA_TRAINING_VENUE` (id 49, parent 48, sortOrder 951) แล้วตั้งสิทธิ์ในหน้า Role · ถ้ายังไม่มีแถวใน DB หน้านี้จะเข้าไม่ได้สำหรับทุกคน · test สิทธิ์ 35/35 ผ่าน · `tsc` ไม่มี error ใหม่ |
| 2026-11-17 | Claude (ตามคำขอ sattaya prata) | Role & Permission: เพิ่มหน้า Permission Menu (`/master-data/permission-menu`, API `/menu/list`, `/menu/byid/{id}`, `/menu/upsert`) จัดการเมนูในตาราง menus + ลากเรียง / แก้ sortOrder อิสระ | ใช้ `MENU.MASTER_DATA_ROLE` ทั้งหน้า (ถ้าใช้ code ใหม่จะต้องเพิ่มแถว DB ก่อนถึงจะเข้าได้) · sidebar `permCode` + route map (ก่อน prefix `/master-data`) · Add ใช้ canCreate, Edit/ลากเรียง/Save Order ใช้ canEdit + เช็คใน handler · ไม่มีปุ่ม Delete (API ไม่มี) ใช้ Active toggle แทน · ไม่ต้องแก้ DB · test สิทธิ์ผ่าน · `tsc` ไม่มี error ใหม่ |
| 2026-11-17 | Claude (ตามคำขอ sattaya prata) | Permission Menu: Sort Order เป็นแบบแสดงอย่างเดียว · ซ่อนคอลัมน์ Code · ลากย้ายเมนูแล้ว sub menu ถูกเลื่อนเลขตาม parent | ไม่มีปุ่มหรือ route ใหม่ สิทธิ์เหมือนเดิม (canEdit สำหรับลาก / Save Order) · ไม่ต้องแก้ DB |
| 2026-11-17 | Claude (ตามคำขอ sattaya prata) | Sidebar เรียงตาม sortOrder ใน DB (`lib/sidebar-order.ts` ใช้ใน `useFilteredMenuList`) + refresh permission หลังบันทึกในหน้า Permission Menu · แก้ bug ฟอร์ม Parent Menu ที่ส่ง `parentId: 0` | bug ทำให้แถว `MASTER_DATA_ROLE` (id 47) ถูกบันทึกเป็น parent 0 / sortOrder 1 → หลุดจาก `/permission/menus` ทำให้เมนู Role หายและหน้า Role / Permission Menu ขึ้น Access Denied · แก้ข้อมูลกลับเป็น parent 44 / sortOrder 953 แล้ว (ผู้ใช้อนุมัติ) · โครงสร้าง sidebar ยังมาจาก `lib/menus.ts` เปลี่ยนแค่ลำดับ |
| 2026-11-19 | Claude (ตามคำขอ sattaya prata) | เพิ่มเมนู My Profile ใน dropdown โปรไฟล์ (header) → หน้าใหม่ `/profile` แสดงเฉพาะบัญชีที่ผูกพนักงาน · คนที่ไม่มีเมนูที่ดูได้เลยแต่ผูกพนักงานแล้ว → หลัง login / root / Access Denied ไปหน้า `/profile` แทน IT Support | แยกเนื้อหาหน้า Staff Detail เป็น `StaffProfileView` ใช้ร่วมกัน (`/hr/staff/[id]` เหมือนเดิม) · `/profile` ไม่อยู่ใน route map (ทุกคนที่ login เข้าได้) ปุ่มแก้ไขยังผูก HR_STAFF · `auth.provider` map `staffId` จาก localStorage ด้วย (เดิมหายหลัง refresh) · ไม่มี menuCode ไม่ต้องเพิ่มแถว DB · test `resolveAuthRedirect` +3 · ⚠️ ถ้า API `staff/byid` ฝั่ง backend เช็คสิทธิ์ HR ผู้ใช้ที่ไม่มีสิทธิ์จะโหลดโปรไฟล์ไม่ได้ |
| 2026-11-19 | Claude (ตามคำขอ sattaya prata) | `/profile`: ให้เจ้าของแก้โปรไฟล์ตัวเองได้ — รูปโปรไฟล์, Documents, AMEL Attachment, Contact (Email แก้ไม่ได้), Logbook Records | `StaffProfileView` รับ `isSelf` → `SelfProfileContext` · ส่วนที่ระบุใช้ `perm.X \|\| isSelf` ส่วนอื่นยังผูก HR_STAFF · Contact: ช่อง Email disabled + ตอนบันทึกส่ง email เดิมจาก API (เฉพาะคนที่ไม่มี HR_STAFF canEdit) · หน้า `/hr/staff/[id]` ไม่เปลี่ยน · ไม่มี menuCode ไม่ต้องเพิ่มแถว DB · ⚠️ API upsert / upload / logbook ฝั่ง backend ต้องยอมให้ผู้ใช้แก้ข้อมูลของ staffId ตัวเองด้วย |
