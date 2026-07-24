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

## 2. Endpoint: [id}

- **Method:** `GET`
- **Path:** `/master/staff-management/byid/163`
- **Description:** (รอระบุคำอธิบายเพิ่มเติม)

### Example Response (JSON)

> (ยังไม่มีข้อมูล Response ตัวอย่างใน Postman Collection)

---

## 3. Endpoint: upsert

- **Method:** `POST`
- **Path:** `/master/staff-management/upsert`
- **Description:** (รอระบุคำอธิบายเพิ่มเติม)

### Example Request Body (JSON)

```json
{
  "staffId": 0,
  "title": "string",
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
  "positionId": 0,
  "departmentId": 0,
  "staffstypeid": 0,
  "jobTitle": "string",
  "profileImagePath": "string",
  "educations": [
    {
      "id": 0,
      "degree": "string",
      "institution": "string",
      "fieldOfStudy": "string",
      "year": 0
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
  "staffAircraftLicenseList": [
    {
      "id": 0,
      "aircraftTypeId": 0
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
  ]
}
```

### Example Response (JSON)

> (ยังไม่มีข้อมูล Response ตัวอย่างใน Postman Collection)

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

