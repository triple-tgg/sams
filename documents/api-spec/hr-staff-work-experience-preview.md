# API Specification: QA Document - Employee Profile and Training Record (Preview)

เอกสารนี้อธิบายการดึงข้อมูลเพื่อนำมาแสดงผลในหน้าต่าง Preview **Employee Profile and Training Record** (อ้างอิงฟอร์ม SAMS-FM-CM-036) ซึ่งเป็นการนำข้อมูลหลายส่วนมาแสดงรวมกันในใบเดียว

## การดึงข้อมูล (API Endpoints)

หน้าจอ Preview นี้จำเป็นต้องเรียกใช้ 2 API เพื่อให้ได้ข้อมูลครบถ้วน:
1. **GET Staff Details:** `/master/staff-management/byid/{staffId}`
2. **GET Training Dashboard:** `/staffs/{staffId}/trainings/dashboard`

---

## 1. Endpoint: Get Staff Details

- **Method:** `GET`
- **Path:** `/master/staff-management/byid/{staffId}`
- **Description:** ดึงข้อมูลส่วนตัว, ประวัติการศึกษา, ใบอนุญาต AMEL, และประวัติการทำงาน เพื่อนำไปแสดงใน Section 1 - 4 ของเอกสาร

### Fields Mapping (การนำไปแสดงผล)

#### Personal Information
ดึงข้อมูลจาก Root object ของ `responseData`
- `Name (English)`: `responseData.fullNameEn` (ถ้าไม่มีให้ใช้ `name`)
- `ชื่อ (ภาษาไทย)`: `responseData.title` + `responseData.name`
- `Date of birth`: `responseData.dateOfBirth`
- `Place of birth`: `responseData.placeOfBirth`
- `Thai ID Card`: `responseData.idCardNo`
- `Nationality`: `responseData.nationality`
- `Current address`: `responseData.address`
- `Phone`: `responseData.phone`
- **Photo**: `responseData.profileImagePath`

#### Education Information
ดึงข้อมูลจาก Array `responseData.educations` (กรองเฉพาะ `isdelete == false`)
- `Degree`: `educations[].degree`
- `Name of Institution`: `educations[].institution`
- `End (year)`: `educations[].year`

#### Aircraft Maintenance Engineer License (AMEL)
ดึงข้อมูลจาก Array `responseData.staffAmelLicenseList` (กรองเฉพาะ `isdelete == false`)
- `License No.`: `staffAmelLicenseList[].licenseNumber`
- `Ratings`: `staffAmelLicenseList[].aircraftRatings` (คั่นด้วย Comma ให้นำมาตัดแบ่งขึ้นบรรทัดใหม่)
- `From`: `staffAmelLicenseList[].issuedDate`
- `To`: `staffAmelLicenseList[].expiryDate`

#### Previous Employment Information
ดึงข้อมูลจาก Array `responseData.workExperiences` (กรองเฉพาะ `isdelete == false`)
- `Employer`: `workExperiences[].company`
- `Position`: `workExperiences[].jobTitle`
- `From`: `workExperiences[].periodFrom`
- `To`: `workExperiences[].periodTo`

---

## 2. Endpoint: Get Training Dashboard

- **Method:** `GET`
- **Path:** `/staffs/{staffId}/trainings/dashboard`
- **Description:** ดึงประวัติการฝึกอบรมทั้งในอดีต (Previous) และปัจจุบัน (Current) เพื่อนำไปแสดงใน Section ท้ายๆ ของเอกสาร

### Fields Mapping (การนำไปแสดงผล)

#### Previous Training Records
ดึงข้อมูลจาก Array `responseData.histories`
- `Date (From)`: `histories[].dateFrom`
- `Date (To)`: `histories[].dateTo`
- `Training Course`: `histories[].courseName`
- `By`: `histories[].academyName`

#### Current Training Records
ดึงข้อมูลจาก Array `responseData.records`
- `Training Date (From)`: `records[].dateFrom`
- `Training Date (To)`: `records[].dateTo`
- `Valid Until`: `records[].validUntil` (ถ้าไม่มีวันหมดอายุ หรือเป็น null ให้แสดงว่า `Never`)
- `Training Course`: `records[].courseName`
- `By`: `records[].providedBy`

---

## การแสดงผลต่อเนื่อง (Pagination & Printing)

- ข้อมูลทั้งหมดจะถูก Render เรียงต่อกันเป็น Table ในหน้าเดียวบนเว็บ (เพื่อให้สามารถ Scroll ดูได้ง่าย)
- เมื่อกดปุ่ม **Print** ระบบจะใช้ CSS Rules `page-break-inside: avoid` และ `page-break-after: always` เพื่อตัดหน้ากระดาษ (A4) ให้สวยงามและข้อมูลไม่ถูกหั่นครึ่งบรรทัด
- ลายเซ็นส่วนท้ายเอกสาร **(Signature of Compliance Monitoring)** เป็นฟอร์มเปล่าสำหรับการนำไปให้ Compliance Control Executive เป็นผู้เซ็นรับรอง (Hardcoded ตำแหน่งอ้างอิงจาก Template PDF SAMS-FM-CM-036)
