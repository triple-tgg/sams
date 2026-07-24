# API Specification: Master Data - Routes

เอกสารนี้อธิบายโครงสร้างของ API สำหรับจัดการข้อมูลหลักส่วน Routes (อ้างอิงจาก Postman Collection)

## 1. Endpoint: Routes-list

- **Method:** `POST`
- **Path:** `/master/Routes-list`
- **Description:** (รอระบุคำอธิบายเพิ่มเติม)

### Example Request Body (JSON)

```json
{
  "page": 1,
  "perPage": 7
}
```

### Example Response (JSON)

> (ยังไม่มีข้อมูล Response ตัวอย่างใน Postman Collection)

---

## 2. Endpoint: {id}

- **Method:** `GET`
- **Path:** `/master/Routes-byid/1`
- **Description:** (รอระบุคำอธิบายเพิ่มเติม)

### Example Response (JSON)

> (ยังไม่มีข้อมูล Response ตัวอย่างใน Postman Collection)

---

## 3. Endpoint: Routes-upsert

- **Method:** `POST`
- **Path:** `/master/Routes-upsert`
- **Description:** (รอระบุคำอธิบายเพิ่มเติม)

### Example Request Body (JSON)

```json
{
  "id": 0,
  "code": "string",
  "name": "string",
  "description": "string",
  "userName": "string",
  "isdelete": true
}
```

### Example Response (JSON)

> (ยังไม่มีข้อมูล Response ตัวอย่างใน Postman Collection)

---

## 4. Endpoint: Routes-delete

- **Method:** `POST`
- **Path:** `/master/Routes-delete`
- **Description:** (รอระบุคำอธิบายเพิ่มเติม)

### Example Request Body (JSON)

```json
{
  "id": 1,
  "userName": "navee"
}
```

### Example Response (JSON)

> (ยังไม่มีข้อมูล Response ตัวอย่างใน Postman Collection)

---

## 5. Endpoint: {name}

- **Method:** `GET`
- **Path:** `/master/Routes-bynames/test`
- **Description:** (รอระบุคำอธิบายเพิ่มเติม)

### Example Response (JSON)

> (ยังไม่มีข้อมูล Response ตัวอย่างใน Postman Collection)

---

