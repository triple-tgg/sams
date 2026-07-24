# API Specification: Master Data - Users

เอกสารนี้อธิบายโครงสร้างของ API สำหรับจัดการข้อมูลหลักส่วน Users (อ้างอิงจาก Postman Collection)

## 1. Endpoint: Users-list

- **Method:** `POST`
- **Path:** `/master/Users-list`
- **Description:** (รอระบุคำอธิบายเพิ่มเติม)

### Example Request Body (JSON)

```json
{
  "page": 1,
  "perPage": 20,
  "username": "",
  "email": "",
  "fullName": ""
}
```

### Example Response (JSON)

> (ยังไม่มีข้อมูล Response ตัวอย่างใน Postman Collection)

---

## 2. Endpoint: {id}

- **Method:** `GET`
- **Path:** `/master/Users-byid/1`
- **Description:** (รอระบุคำอธิบายเพิ่มเติม)

### Example Response (JSON)

> (ยังไม่มีข้อมูล Response ตัวอย่างใน Postman Collection)

---

## 3. Endpoint: Users-upsert

- **Method:** `POST`
- **Path:** `/master/Users-upsert`
- **Description:** (รอระบุคำอธิบายเพิ่มเติม)

### Example Request Body (JSON)

```json
{
  "id": 0,
  "username": "eknut",
  "email": "eknut@sams.aero",
  "passwordData": "sams-password",
  "fullName": "eknut",
  "roleId": 2,
  "isActive": true,
  "userBy": "system"
}
```

### Example Response (JSON)

> (ยังไม่มีข้อมูล Response ตัวอย่างใน Postman Collection)

---

## 4. Endpoint: Users-delete

- **Method:** `POST`
- **Path:** `/master/Users-delete`
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

