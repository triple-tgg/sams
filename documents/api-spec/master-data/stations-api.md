# API Specification: Master Data - Stations

เอกสารนี้อธิบายโครงสร้างของ API สำหรับจัดการข้อมูลหลักส่วน Stations (อ้างอิงจาก Postman Collection)

## 1. Endpoint: Stations

- **Method:** `GET`
- **Path:** `/master/Stations`
- **Description:** (รอระบุคำอธิบายเพิ่มเติม)

### Example Response (JSON)

> (ยังไม่มีข้อมูล Response ตัวอย่างใน Postman Collection)

---

## 2. Endpoint: Stations-list

- **Method:** `POST`
- **Path:** `/master/Stations-list`
- **Description:** (รอระบุคำอธิบายเพิ่มเติม)

### Example Request Body (JSON)

```json
{
  "page": 1,
  "perPage": 20,
  "code": "",
  "name": "",
  "description": ""
}
```

### Example Response (JSON)

> (ยังไม่มีข้อมูล Response ตัวอย่างใน Postman Collection)

---

## 3. Endpoint: {id}

- **Method:** `GET`
- **Path:** `/master/Stations-byid/1`
- **Description:** (รอระบุคำอธิบายเพิ่มเติม)

### Example Response (JSON)

> (ยังไม่มีข้อมูล Response ตัวอย่างใน Postman Collection)

---

## 4. Endpoint: Stations-upsert

- **Method:** `POST`
- **Path:** `/master/Stations-upsert`
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

## 5. Endpoint: Stations-delete

- **Method:** `POST`
- **Path:** `/master/Stations-delete`
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

