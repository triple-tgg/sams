# API Specification: Master Data - Aircraft System Config

เอกสารนี้อธิบายโครงสร้างของ API สำหรับจัดการการตั้งค่าระบบเครื่องบิน (Aircraft System Config) ของเครื่องบินแต่ละรุ่น

## Enums

### `ClassicNeo`
ระบุว่าเครื่องบินรุ่นนั้นจัดอยู่ในกลุ่มเครื่องคลาสสิกหรือกลุ่มเครื่องยนต์รุ่นใหม่
- **`CLASSIC`**: รุ่นคลาสสิก (เช่น A320-200)
- **`NEO`**: รุ่นใหม่ที่เปลี่ยนตัวเลือกเครื่องยนต์ (เช่น A320neo, 737 MAX)

---

## 1. Endpoint: Get Aircraft System Configs

- **Method:** `GET`
- **Path:** `/master/aircraft-system-config`
- **Description:** ดึงข้อมูล System Config ของเครื่องบินทั้งหมด

### Example Response (JSON)

```json
{
  "message": "Success",
  "error": "",
  "responseData": [
    {
      "icaoCode": "B738",
      "familyCode": "B737",
      "modelVariant": "737-800 (NG)",
      "classicNeo": "CLASSIC",
      "engineCount": 2,
      "generatorCount": 2,
      "hydraulicCount": 3,
      "hasApu": true,
      "legacyEngineLabel": null,
      "updatedBy": "master.data.admin",
      "updatedAtUtc": "2026-06-01T03:00:00.000Z"
    }
  ]
}
```

### Field Explanations (คำอธิบายข้อมูลแต่ละฟิลด์)

| Field Name | Type | Description (คำอธิบาย) |
| :--- | :--- | :--- |
| **`icaoCode`** | `String` | **Primary Key** รหัส ICAO 4 ตัวอักษรของเครื่องบิน (เช่น `"B738"`, `"A320"`) |
| **`familyCode`** | `String` | รหัส Family ที่เครื่องบินนี้สังกัดอยู่ (เช่น `"B737"`) |
| **`modelVariant`** | `String` | ชื่อรุ่นย่อยแบบเต็ม (เช่น `"737-800 (NG)"`) |
| **`classicNeo`** | `String` | ประเภทเครื่องยนต์ ใช้ Enum `ClassicNeo` (`"CLASSIC"` หรือ `"NEO"`) |
| **`engineCount`** | `Number` | จำนวนเครื่องยนต์ของรุ่นนี้ (เช่น `2`, `4`) |
| **`generatorCount`** | `Number` | จำนวน Generator ของรุ่นนี้ |
| **`hydraulicCount`** | `Number` | จำนวนระบบ Hydraulic ของรุ่นนี้ |
| **`hasApu`** | `Boolean` | ระบุว่ารุ่นนี้มี APU (Auxiliary Power Unit) หรือไม่ (`true` / `false`) |
| **`legacyEngineLabel`** | `String \| null` | ข้อมูลดิบ (Free-text) จากระบบเก่า (Excel) ที่รอการตรวจสอบ หากมีค่าแปลกปลอมระบบจะฟ้อง Validation `NAMING` |
| **`updatedBy`** | `String` | ชื่อผู้ใช้งานที่ทำการอัปเดตข้อมูลล่าสุด |
| **`updatedAtUtc`** | `String` | วันเวลาที่อัปเดตข้อมูลล่าสุด (รูปแบบ ISO-8601 UTC) |

---

## 2. Endpoint: Upsert Aircraft System Config

- **Method:** `POST` (หรือ `PUT`)
- **Path:** `/master/aircraft-system-config`
- **Description:** สร้างข้อมูลใหม่ หรือแก้ไขข้อมูล Config ของเครื่องบิน

### Example Request Body (JSON)

```json
{
  "icaoCode": "B738",
  "familyCode": "B737",
  "modelVariant": "737-800 (NG)",
  "classicNeo": "CLASSIC",
  "engineCount": 2,
  "generatorCount": 2,
  "hydraulicCount": 3,
  "hasApu": true,
  "isNew": false
}
```
**หมายเหตุ:** หากเป็นการสร้างรายการใหม่ ให้ส่ง `isNew: true` มาด้วย เพื่อที่ระบบ Backend จะได้ตรวจสอบว่า `icaoCode` นี้มีอยู่ในระบบแล้วหรือยัง (หากซ้ำให้ฟ้อง Error `"DUPLICATE"`)

### Example Response (JSON)

```json
{
  "message": "Success",
  "error": "",
  "responseData": {
    "icaoCode": "B738",
    "familyCode": "B737",
    "modelVariant": "737-800 (NG)",
    "classicNeo": "CLASSIC",
    "engineCount": 2,
    "generatorCount": 2,
    "hydraulicCount": 3,
    "hasApu": true,
    "updatedBy": "current.user",
    "updatedAtUtc": "2026-07-18T16:00:00.000Z"
  }
}
```

---

## 3. Endpoint: Delete Aircraft System Config

- **Method:** `DELETE`
- **Path:** `/master/aircraft-system-config/{icaoCode}`
- **Description:** ลบข้อมูล System Config ตาม `icaoCode`
