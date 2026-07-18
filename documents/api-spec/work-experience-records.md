# API Specification: QA Document - Work Experience Records

เอกสารนี้อธิบายการใช้งาน API สำหรับหน้าจอ **Quality Assurance > QA Document > Work Experience Records** ซึ่งใช้ในการแสดงรายชื่อพนักงานพร้อมระบุแผนกและตำแหน่ง และมีปุ่มสำหรับจัดการเอกสาร (Work Experience, Certifying Staff)

## 1. Get Staff List (พร้อม Filter)

ดึงรายชื่อพนักงานทั้งหมด โดยสามารถกรองตาม ชื่อพนักงาน, แผนก, และตำแหน่งได้

- **Method:** `POST`
- **Path:** `/master/staff-management/listdata`
- **Description:** ใช้ API เดียวกับระบบ Staff Management เพื่อดึงข้อมูลรายชื่อพนักงานทั้งหมด พร้อมข้อมูล `departmentObj` และ `positionObj`

### Request Payload

```json
{
  "name": "",             // ค้นหาจากชื่อ (Search by Employee Name)
  "employeeId": "",       // (ส่งค่าว่าง)
  "positionId": 0,        // รหัสตำแหน่ง (0 = ทั้งหมด)
  "departmentId": 0,      // รหัสแผนก (0 = ทั้งหมด)
  "staffstypeId": 0,      // (ส่ง 0)
  "page": 1,              // หน้าที่แสดง
  "perPage": 10           // จำนวนรายการต่อหน้า
}
```

### Example Response

```json
{
  "message": "success",
  "responseData": [
    {
      "id": 163,
      "code": "EMP-0163",
      "title": "Mr.",
      "name": "Aleks Reymer",
      "fullNameEn": "Aleks Reymer",
      "employeeId": "EMP-0163",
      "profileImagePath": null,
      "departmentObj": {
        "id": 1,
        "name": "Engineering"
      },
      "positionObj": {
        "id": 5,
        "name": "Certifying Staff"
      }
    }
  ],
  "page": 1,
  "perPage": 10,
  "total": 1,
  "totalAll": 1,
  "error": ""
}
```

---

## 2. Get Department Options (สำหรับ Filter)

- **Method:** `GET`
- **Path:** `/master/staff-departments/list`
- **Description:** ดึงข้อมูลแผนกทั้งหมดเพื่อนำมาสร้างเป็นตัวเลือกใน Dropdown

### Example Response

```json
{
  "message": "success",
  "responseData": [
    {
      "id": 1,
      "code": "ENG",
      "name": "Engineering"
    },
    {
      "id": 2,
      "code": "QA",
      "name": "Quality Assurance"
    }
  ],
  "error": ""
}
```

---

## 3. Get Position Options (สำหรับ Filter)

- **Method:** `GET`
- **Path:** `/master/staff-department-positions/list`
- **Description:** ดึงข้อมูลตำแหน่งทั้งหมดเพื่อนำมาสร้างเป็นตัวเลือกใน Dropdown (ในหน้าจอจะมีการกรองตาม Department ที่เลือกอีกชั้นหนึ่ง)

### Example Response

```json
{
  "message": "success",
  "responseData": [
    {
      "id": 1,
      "staffDepartmentId": 1,
      "code": "MEC",
      "name": "Mechanic"
    },
    {
      "id": 5,
      "staffDepartmentId": 1,
      "code": "CRS",
      "name": "Certifying Staff"
    }
  ],
  "error": ""
}
```

---

## หมายเหตุ

- ในปัจจุบันปุ่มกดดูเอกสาร (`Work Experience`, `Certifying Staff`) ในคอลัมน์ **Documents** ยังคงเป็น UI Mockup ซึ่งแสดงข้อความ Toast แจ้งเตือนเมื่อกด 
- หากในอนาคตมีการสร้าง API สำหรับแสดงผลหรือดาวน์โหลด PDF เอกสารเหล่านี้ จะต้องเพิ่มรายละเอียด API เหล่านั้นในเอกสารนี้ต่อไป
