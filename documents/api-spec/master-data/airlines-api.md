# API Specification: Master Data - Airlines

เอกสารนี้อธิบายโครงสร้างของ API สำหรับจัดการข้อมูลหลักส่วน Airlines (อ้างอิงจาก Postman Collection)

## 1. Endpoint: Airlines

- **Method:** `GET`
- **Path:** `/master/Airlines`
- **Description:** (รอระบุคำอธิบายเพิ่มเติม)

### Example Response (JSON)

> (ยังไม่มีข้อมูล Response ตัวอย่างใน Postman Collection)

---

## 2. Endpoint: Airlines-list

- **Method:** `POST`
- **Path:** `/master/Airlines-list`
- **Description:** (รอระบุคำอธิบายเพิ่มเติม)

### Example Request Body (JSON)

```json
{
  "page": 1,
  "perPage": 20,
  "code": "",
  "name": "",
  "description": "",
  "emailTo": "",
  "emailCc": ""
}
```

### Example Response (JSON)

> (ยังไม่มีข้อมูล Response ตัวอย่างใน Postman Collection)

---

## 3. Endpoint: {id}

- **Method:** `GET`
- **Path:** `/master/Airlines-byid/1`
- **Description:** (รอระบุคำอธิบายเพิ่มเติม)

### Example Response (JSON)

> (ยังไม่มีข้อมูล Response ตัวอย่างใน Postman Collection)

---

## 4. Endpoint: Airlines-upsert

- **Method:** `POST`
- **Path:** `/master/Airlines-upsert`
- **Description:** (รอระบุคำอธิบายเพิ่มเติม)

### Example Request Body (JSON)

```json
{
  "id": 0,
  "code": "string",
  "name": "string",
  "description": "string",
  "isdelete": false,
  "colorForeground": "#00000",
  "colorBackground": "#ffffff",
  "emailTo": "string",
  "emailCc": "string"
}
```

### Example Response (JSON)

> (ยังไม่มีข้อมูล Response ตัวอย่างใน Postman Collection)

---

## 5. Endpoint: Airlines-delete

- **Method:** `POST`
- **Path:** `/master/Airlines-delete`
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

