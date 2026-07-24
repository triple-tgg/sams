# API Specification: Master Data - Staffs

เอกสารนี้อธิบายโครงสร้างของ API สำหรับจัดการข้อมูลหลักส่วน Staffs (อ้างอิงจาก Postman Collection)

## 1. Endpoint: Staffs

- **Method:** `POST`
- **Path:** `/master/Staffs`
- **Description:** (รอระบุคำอธิบายเพิ่มเติม)

### Example Request Body (JSON)

```json
{
  "code": "",
  "name": "navee"
}
```

### Example Response (JSON)

> (ยังไม่มีข้อมูล Response ตัวอย่างใน Postman Collection)

---

## 2. Endpoint: StaffsTypes

- **Method:** `GET`
- **Path:** `/master/StaffsTypes`
- **Description:** (รอระบุคำอธิบายเพิ่มเติม)

### Example Response (JSON)

> (ยังไม่มีข้อมูล Response ตัวอย่างใน Postman Collection)

---

## 3. Endpoint: StaffsTypesAll

- **Method:** `GET`
- **Path:** `/master/StaffsTypesAll`
- **Description:** (รอระบุคำอธิบายเพิ่มเติม)

### Example Response (JSON)

> (ยังไม่มีข้อมูล Response ตัวอย่างใน Postman Collection)

---

## 4. Endpoint: Staffs-list

- **Method:** `POST`
- **Path:** `/master/Staffs-list`
- **Description:** (รอระบุคำอธิบายเพิ่มเติม)

### Example Request Body (JSON)

```json
{
  "page": 1,
  "perPage": 20,
  "code": "",
  "name": "",
  "title": "",
  "jobTitle": "",
  "email": ""
}
```

### Example Response (JSON)

> (ยังไม่มีข้อมูล Response ตัวอย่างใน Postman Collection)

---

## 5. Endpoint: {id}

- **Method:** `GET`
- **Path:** `/master/Staffs-byid/1`
- **Description:** (รอระบุคำอธิบายเพิ่มเติม)

### Example Response (JSON)

> (ยังไม่มีข้อมูล Response ตัวอย่างใน Postman Collection)

---

## 6. Endpoint: Staffs-upsert

- **Method:** `POST`
- **Path:** `/master/Staffs-upsert`
- **Description:** (รอระบุคำอธิบายเพิ่มเติม)

### Example Request Body (JSON)

```json
{
  "id": 0,
  "code": "A0001",
  "name": "test",
  "staffstypeid": 1,
  "userName": "navee",
  "isAcive": true,
  "title": "test",
  "jobTitle": "test",
  "email": ""
}
```

### Example Response (JSON)

> (ยังไม่มีข้อมูล Response ตัวอย่างใน Postman Collection)

---

## 7. Endpoint: Staffs-delete

- **Method:** `POST`
- **Path:** `/master/Staffs-delete`
- **Description:** (รอระบุคำอธิบายเพิ่มเติม)

### Example Request Body (JSON)

```json
{
  "id": 0,
  "userName": "navee"
}
```

### Example Response (JSON)

> (ยังไม่มีข้อมูล Response ตัวอย่างใน Postman Collection)

---

