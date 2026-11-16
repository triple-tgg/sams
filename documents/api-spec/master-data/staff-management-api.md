# API Specification: Master Data - Staff Management

เอกสารนี้อธิบายโครงสร้างของ API สำหรับจัดการข้อมูลหลักส่วน Staff Management (อ้างอิงจาก Postman Collection)

## 1. Endpoint: listdata

- **Method:** `POST`
- **Path:** `/master/staff-management/listdata`
- **Description:** (รอระบุคำอธิบายเพิ่มเติม)

### Example Request Body (JSON)

```json
{
  "name": "",
  "employeeId": "",
  "positionId": 0,
  "departmentId": 0,
  "staffstypeId": 0,
  "isActive": true,
  "page": 1,
  "perPage": 20
}
```

### Example Response (JSON)

> (ยังไม่มีข้อมูล Response ตัวอย่างใน Postman Collection)

---

## 2. Endpoint: byid

- **Method:** `GET`
- **Path:** `/master/staff-management/byid/{id}`
- **Description:** ข้อมูลพนักงานทั้งชุด (ใช้ในหน้า HR Staff Detail และเป็นฐานของ `buildStaffUpsertRequest`)
- **Frontend type:** `StaffByIdData` (`lib/api/qa/staff-management.ts`)

### Response (สรุปโครงสร้าง)

| Field | Type | หมายเหตุ |
|---|---|---|
| `id`, `code`, `name`, `fullNameEn` | number / string | `name` = ชื่อไทย |
| `titleId`, `titleObj` | number, object | `titleObj` = `{id, nameEn, nameTh, sortOrder, isdelete, audit}` เช่น `{1, "Mr.", "นาย", 10}` · ไม่มี `title` (string) แล้ว — แสดงผลด้วย `staffTitleText` |
| `dateOfBirth`, `startDate` | `"YYYY-MM-DD"` | |
| `endWorkingDate` | ISO date-time | ไม่มี `endDate` แล้ว |
| `placeOfBirth`, `nationality`, `idCardNo`, `phone`, `email`, `address`, `employeeId` | string | |
| `isUser`, `userId` | boolean, number | บัญชี login ที่ผูกกับพนักงาน |
| `positionObj` | object | มี `staffDepartmentId` |
| `isDepartmentAmo145`, `staffDepartmentPositionAmo145Id` | boolean, number | |
| `staffDepartmentPositionAmo145Obj` | object | มี `staffDepartmentAmo145Id` |
| `staffDepartmentAmo145Obj`, `departmentObj`, `staffstypeObj`, `stationObj` | object | `{id, code, name, description, isdelete, audit}` |
| `stationId`, `jobTitle`, `profileImagePath`, `isActive` | | |
| `educations[]` | | `degree`, `institution`, `fieldOfStudy`, **`startYear`, `endYear`** |
| `workExperiences[]` | | `periodFrom` / `periodTo` เป็น `"YYYY-MM-DD"` |
| `staffDocumentList[]` | | มี `staffDocumentStatusObj`, `staffDocumentTypeObj` |
| `staffAircraftLicenseList[]` | | `aircraftEngineId` + `aircraftEngineObj` (`familyCode`, `series`, `engineCode`, `similarTechnology`, `validFrom`, `validTo`, `updatedBy`, `updatedAtUtc`) |
| `staffAmelLicenseList[]` | | `licenseNumber`, `categoryId`, `issuedDate`, `expiryDate`, `limitations`, `aircraftRatings`, `attachmentFilePath`, `attachmentFileName` |
| `staffStationTransferList[]` | | `stationId` + **`stationObj`** + audit |

ทุก item ใน list มี `id`, `staffId`, `isdelete`, `createddate`, `createdby`, `updateddate`, `updatedby` · frontend กรอง `isdelete: true` ออกก่อนแสดงผล

> **2026-11-15:** sync type กับ response ล่าสุด — `staffStationTransferList[].stationObj` (Roster ใช้ `stationObj.code` ก่อน แล้วจึง fallback ไป master station), `aircraftEngineObj.similarTechnology`, ลบ `endDate` ที่ไม่มีใน response

---

## 3. Endpoint: upsert

- **Method:** `POST`
- **Path:** `/master/staff-management/upsert`
- **Description:** สร้าง (`staffId: 0`) หรือแก้ไขพนักงาน ส่งข้อมูลทั้งชุดทุกครั้ง (list ที่ไม่ส่งไป = ถูกลบ)
- **Frontend:** `upsertStaff` / `buildStaffUpsertRequest` (`lib/api/qa/staff-management.ts`)

### Example Request Body (JSON)

```json
{
  "staffId": 0,
  "titleId": 0,
  "fullNameTh": "string",
  "fullNameEn": "string",
  "dateOfBirth": "string",
  "placeOfBirth": "string",
  "nationality": "string",
  "idCardNo": "string",
  "phone": "string",
  "email": "string",
  "address": "string",
  "employeeId": "string",
  "startDate": "string",
  "endWorkingDate": "string",
  "staffDepartmentPositionId": 0,
  "isDepartmentAmo145": true,
  "staffDepartmentPositionAmo145Id": 0,
  "stationId": 0,
  "staffstypeid": 0,
  "jobTitle": "string",
  "profileImagePath": "string",
  "educations": [
    {
      "id": 0,
      "degree": "string",
      "institution": "string",
      "fieldOfStudy": "string",
      "startYear": 0,
      "endYear": 0
    }
  ],
  "workExperiences": [
    {
      "id": 0,
      "jobTitle": "string",
      "company": "string",
      "periodFrom": "string",
      "periodTo": "string",
      "description": "string"
    }
  ],
  "staffDocumentList": [
    {
      "id": 0,
      "staffDocumentStatusId": 0,
      "staffDocumentTypeId": 0,
      "fileName": "string",
      "filePath": "string"
    }
  ],
  "staffAmelLicenseList": [
    {
      "id": 0,
      "licenseNumber": "string",
      "categoryId": 0,
      "issuedDate": "string",
      "expiryDate": "string",
      "limitations": "string",
      "aircraftRatings": "string",
      "attachmentFilePath": "string",
      "attachmentFileName": "string"
    }
  ],
  "staffAircraftLicenseList": [
    {
      "id": 0,
      "aircraftEngineId": 0,
      "isDelete": true
    }
  ],
  "staffStationTransferList": [
    {
      "id": 0,
      "stationId": 0,
      "isDelete": true
    }
  ]
}
```

### หมายเหตุ

- **2026-11-15:** `title` (string) เปลี่ยนเป็น **`titleId`** (number, id ของ master คำนำหน้าชื่อ) · `buildStaffUpsertRequest` ส่ง `titleId` เดิมของพนักงาน (`titleId` หรือ `titleObj.id`) เมื่อแก้ส่วนอื่น

- **2026-11-15:** `educations[].year` แยกเป็น `startYear` + `endYear` · frontend ส่ง `0` เมื่อไม่ระบุปี · `GET byid` คืน `startYear` / `endYear` (ข้อมูลเก่ามีแค่ `endYear`, `startYear` เป็น `null`)
- การแสดงผลปีใช้ `formatEducationYears` → `2017 – 2021`, `2021`, `2017 – Present`
- `buildStaffUpsertRequest` ตัด education ที่ `isdelete: true` ออก ไม่ส่งกลับไป

### Example Response (JSON)

```json
{ "message": "string", "responseData": ["string"], "error": "string" }
```

> `responseData` เป็น list ของ string · หน้า New Staff อ่านตัวแรกเป็น staffId ถ้าเป็นตัวเลข (`upsertedStaffId`) แล้วพาไปหน้า detail · ถ้าไม่ใช่ตัวเลขกลับไปหน้า Staff List

---

## 4. Endpoint: delete

- **Method:** `POST`
- **Path:** `/master/staff-management/delete`
- **Description:** (รอระบุคำอธิบายเพิ่มเติม)

### Example Request Body (JSON)

```json
{
  "id": 0,
  "userName": "string"
}
```

### Example Response (JSON)

> (ยังไม่มีข้อมูล Response ตัวอย่างใน Postman Collection)

---

## 5. Endpoint: positions

- **Method:** `GET`
- **Path:** `/master/staff-management/positions`
- **Description:** (รอระบุคำอธิบายเพิ่มเติม)

### Example Response (JSON)

> (ยังไม่มีข้อมูล Response ตัวอย่างใน Postman Collection)

---

## 6. Endpoint: departments

- **Method:** `GET`
- **Path:** `/master/staff-management/departments`
- **Description:** (รอระบุคำอธิบายเพิ่มเติม)

### Example Response (JSON)

> (ยังไม่มีข้อมูล Response ตัวอย่างใน Postman Collection)

---


## 7. Endpoint: print-preview

- **Method:** `GET`
- **Path:** `/staffs/{staffId}/print-preview`
- **Description:** ข้อมูลสำหรับฟอร์ม Certifying Staff Maintenance Experience Summary (QA Document › Work Experience Records)
- **Frontend:** `getStaffPrintPreview` → `useStaffPrintPreview` → `CertifyingStaffPreview.tsx`

### Response (สรุปโครงสร้าง)

| Field | หมายเหตุ |
|---|---|
| `profile` | โครงสร้างเดียวกับ `GET /master/staff-management/byid/{id}` (type `StaffByIdData`) — มี `titleId` + `titleObj`, ไม่มี `title` |
| `training.summary` | `totalCourses`, `expired`, `permanent`, `expiringSoon` + list ของแต่ละกลุ่ม (`totalCoursesList`, `expiredList`, `permanentList`, `expiringSoonList`) |
| `training.records[]` / list ใน summary | `id`, `courseName`, `courseCode`, `validUntil`, `providedBy`, `status`, `dateFrom`, `dateTo` |
| `training.needsMatrix` | `completionPercentage`, `validCount`, `totalRequired`, `courses[] {courseName, isRequired, status}` |
| `training.histories[]` | `id`, `courseName`, `academyName`, `dateFrom`, `dateTo` |
| `summaryOfMaintenaneObj` | `group1`, `group2`, `group3`, `trainingManagementInstructor`, `total` — ใช้ใน Part 4 ของฟอร์ม |

> **ชื่อ key สะกดผิดใน API:** `summaryOfMaintenaneObj` (ขาด "c") · frontend อ่านตัวนี้ก่อน และรองรับ `summaryOfMaintenanceObj` ไว้ด้วยถ้า backend แก้ชื่อ
>
> **2026-11-15:** Part 4 เดิมเป็นตัวเลข hardcode (370 / 6 / 2 / 378) → ใช้ค่าจาก `summaryOfMaintenaneObj` · แถว Group 3 ไม่อยู่ในแบบฟอร์มต้นฉบับ แสดงเฉพาะเมื่อ `group3 > 0`

---

---

## 8. Master คำนำหน้าชื่อ (titles)

- **`GET /master/titles/listdata`** → `{ message, responseData: StaffTitle[], error }`
- **`GET /master/titles/{id}`** → `{ message, responseData: StaffTitle, error }`
- **`POST /master/titles/upsert`** body `{ id, nameTh, nameEn, sortOrder }` (`id: 0` = สร้างใหม่) → `{ message, responseData: StaffTitle, error }` · frontend `upsertStaffTitle` → `useUpsertStaffTitle` (สำเร็จเมื่อ `message === "success"` แล้ว refresh รายการ) · ยังไม่มีหน้าจัดการ master นี้ใน UI
- **`POST /master/titles/delete`** body `{ id }` → `{ message, responseData: StaffTitle (isdelete: true), error }` · frontend `deleteStaffTitle` → `useDeleteStaffTitle` (สำเร็จแล้ว refresh รายการ) · listdata กรอง `isdelete` ออก · พนักงานที่ใช้ title ที่ถูกลบยังมี `titleObj` เดิม (ยังแสดงผลได้) แต่จะไม่อยู่ในตัวเลือกของฟอร์ม
- `StaffTitle` = `{ id, nameTh, nameEn, sortOrder, isdelete, createddate, createdby, updateddate, updatedby }`
- **Frontend:** `getStaffTitles` / `getStaffTitleById` (`lib/api/master/staff-titles.ts`) → `useStaffTitles` / `useStaffTitleById` (`staff-titles.hooks.ts`) · ใช้ในฟอร์ม New Staff, Edit Personal Info และ Staff Excel Import (แปลง Title → `titleId`)
- staging (2026-11-15): `1` Mr./นาย · `2` Mrs./นาง · `3` Miss/นางสาว · `4` Ms./นางสาว · `5` Dr./ดร.
- Miss กับ Ms. ใช้ชื่อไทยเดียวกัน → `resolveStaffTitleId` จับคู่ชื่อตรงตัวก่อน ("Ms." → 4, "Miss" → 3, "นางสาว" → 3 ตาม sortOrder) · select ภาษาไทยแสดง "นางสาว (Miss)" / "นางสาว (Ms.)"
