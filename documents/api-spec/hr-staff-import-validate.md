# HR Staff Import — Validate & Import

- **Method:** `POST`
- **Path:** `/migration/import-staff-validate`
- **Description:** ตรวจข้อมูลจากไฟล์ Excel ก่อน import จริง (`POST /migration/import-staff` ใช้ body เดียวกัน) · ไม่บันทึกข้อมูล
- **Frontend:** `validateImportStaff` / `parseImportStaffValidation` (`lib/api/migration/importStaff.ts`) → `StaffExcelImportModal.tsx` · ปุ่ม Import กดได้เมื่อผล validate ผ่านเท่านั้น

## Request Body

```json
{
  "staffInfo": [
    {
      "employeeId": "string",
      "titleId": 0,
      "fullNameTh": "string",
      "fullNameEn": "string",
      "joined": "string",
      "positionId": 0,
      "isDepartmentAmo145": true,
      "staffDepartmentPositionAmo145Id": 0,
      "stationId": 0,
      "idCardNo": "string",
      "nationality": "string",
      "dateOfBirth": "string",
      "placeOfBirth": "string",
      "phone": "string",
      "email": "string",
      "address": "string"
    }
  ],
  "amelLicense": [
    { "employeeId": "string", "fullNameTh": "string", "fullNameEn": "string", "licenseNumber": "string", "categoryId": 0, "issuedDate": "string", "expiryDate": "string" }
  ],
  "aircraftLicense": [
    { "employeeId": "string", "fullNameTh": "string", "fullNameEn": "string", "aircraftLicenseId": 0 }
  ],
  "previousTrainingRecords": [
    { "employeeId": "string", "fullNameTh": "string", "fullNameEn": "string", "courseName": "string", "academyName": "string", "dateFrom": "string", "dateTo": "string" }
  ],
  "trainingRecords": [
    { "employeeId": "string", "fullNameTh": "string", "fullNameEn": "string", "courseCode": "string", "academyName": "string", "dateFrom": "string", "dateTo": "string", "validUntil": "string" }
  ],
  "workExperience": [
    { "employeeId": "string", "fullNameTh": "string", "fullNameEn": "string", "company": "string", "jobTitle": "string", "dateFrom": "string", "dateTo": "string", "notes": "string" }
  ],
  "education": [
    { "employeeId": "string", "fullNameTh": "string", "fullNameEn": "string", "degree": "string", "institution": "string", "fieldOfStudy": "string", "startYear": "string", "endYear": "string" }
  ]
}
```

- `positionId`, `staffDepartmentPositionAmo145Id`, `stationId`, `categoryId`, `aircraftLicenseId` — frontend แปลงจากชื่อในไฟล์เทียบกับ master · หาไม่เจอ: id = `0` (station = `null`) และขึ้น warning
- **`titleId`** (2026-11-15, เดิม `title` string) — frontend แปลงจากคอลัมน์ Title (หรือ Title TH ถ้าว่าง) ด้วย `resolveStaffTitleId` เทียบกับ master คำนำหน้าชื่อ (`useStaffTitles` → `GET /master/titles/listdata`) · หาไม่เจอ = `0` + warning · **backend ตรวจ titleId**: `0` หรือ id ที่ไม่มี → row error "ไม่พบข้อมูลในระบบ TitleId : N" · master จาก `GET /master/titles/listdata` (Mr., Mrs., Miss, Ms., Dr.)
- `stationId` ว่างในไฟล์ → ใช้ BKK · ถ้าหา station ไม่เจอส่ง `null` (API รับได้ — ทดสอบบน staging 2026-11-15)
- `education.startYear` / `endYear` เป็น string (ต่างจาก staff upsert ที่เป็น number)

## Response

```json
{
  "message": "success",
  "responseData": {
    "flagPass": true,
    "validateList": [
      {
        "staffInfo": [{ "rowId": 0, "employeeId": "string", "statusText": "string" }],
        "amelLicense": [],
        "aircraftLicense": [],
        "previousTrainingRecords": [],
        "trainingRecords": [],
        "workExperience": [],
        "education": []
      }
    ]
  },
  "error": ""
}
```

- `validateList` มี **เฉพาะแถวที่ไม่ผ่าน** · ผ่านทั้งหมด = ทุก section เป็น `[]` และ `flagPass: true`
- `rowId` = ลำดับ (เริ่ม 1) ของแถวใน section นั้นของ payload · frontend แปลงกลับเป็นแถวในชีต Excel (`resolveValidationRowErrors`) · แถวที่แปลงไม่ได้แสดงเป็นข้อความ
- ผ่านเมื่อ `flagPass === true` และไม่มี row error / `error` ว่าง · ไม่มี `flagPass` = ไม่ผ่าน
- HTTP 4xx ที่มี body ถือเป็นผล validate (ไม่ผ่าน) ไม่ใช่ error ของระบบ

### ตัวอย่างจาก staging

ส่ง payload ที่ไม่มี staffInfo:

```json
{
  "message": "success",
  "responseData": {
    "flagPass": false,
    "validateList": [{ "staffInfo": [{ "rowId": 1, "employeeId": "", "statusText": "ต้องมี StaffInfo อย่างน้อย 1 รายการ" }], "amelLicense": [], "aircraftLicense": [], "previousTrainingRecords": [], "trainingRecords": [], "workExperience": [], "education": [] }]
  },
  "error": ""
}
```

Test: `lib/api/migration/importStaff.test.ts` › "import-staff-validate response (staging)"

---

# Import

- **Method:** `POST`
- **Path:** `/migration/import-staff`
- **Body:** เหมือน `import-staff-validate` ทุก field (รวม `staffInfo[].titleId` ที่เปลี่ยนจาก `title` เมื่อ 2026-11-15) · ใช้ payload ชุดเดียวกับที่ validate ผ่าน
- **Frontend:** `importStaff` / `parseImportStaffResult` (`lib/api/migration/importStaff.ts`) · เรียกหลัง validate ผ่านเท่านั้น · **บันทึกข้อมูลจริง**

## Response

```json
{
  "message": "string",
  "responseData": {
    "total": 0,
    "succeeded": 0,
    "failed": 0,
    "created": 0,
    "updated": 0,
    "staffResults": [
      {
        "staffId": 0,
        "employeeId": "string",
        "isNewStaff": true,
        "amelLicenseCount": 0,
        "aircraftLicenseCount": 0,
        "previousTrainingCount": 0,
        "trainingRecordCount": 0,
        "workExperienceCount": 0,
        "educationCount": 0,
        "error": "string",
        "isError": true
      }
    ]
  },
  "error": "string"
}
```

- จำนวนสรุปใช้ `created` / `updated` / `failed` จาก API ก่อน · ถ้าไม่มีจึงนับจาก `staffResults`
- จำนวนแต่ละ section (AMEL, aircraft license, …) = ผลรวมของ `*Count` เฉพาะพนักงานที่ไม่ error
- **`isError` เป็นตัวตัดสิน** ว่าพนักงานคนนั้น import ไม่สำเร็จ · `error` เป็นข้อความประกอบ (ใช้ตัดสินเฉพาะเมื่อ API ไม่ส่ง `isError`)
- import ถือว่า **ล้มเหลวทั้งหมด** เมื่อ `succeeded === 0` และ `failed > 0` หรือมี `error` ระดับบนสุด · ถ้ามีบางคนสำเร็จ แสดงสรุปพร้อมรายชื่อคนที่ error
- ยังไม่ได้ทดสอบกับ staging เพราะ endpoint นี้บันทึกข้อมูลจริง · test: `importStaff.test.ts` › "parseImportStaffResult — staffResults wrapper"
