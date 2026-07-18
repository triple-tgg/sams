# API Specification: Master Data - Engine Master

เอกสารนี้อธิบายโครงสร้างของ API สำหรับจัดการข้อมูลหลักของเครื่องยนต์ (Engine Master) ซึ่งใช้เป็น Controlled vocabulary สำหรับอ้างอิงในระบบ Aircraft-Engine

## 1. Endpoint: Get Engine Master

- **Method:** `GET`
- **Path:** `/master/engine`
- **Description:** ดึงข้อมูลเครื่องยนต์ทั้งหมด เพื่อนำไปใช้เป็นตัวเลือก (Dropdown)

### Example Response (JSON)

```json
{
  "message": "Success",
  "error": "",
  "responseData": [
    {
      "engineCode": "CFM56",
      "engineName": "CFM56",
      "manufacturer": "CFM International",
      "notes": "Classic narrow/wide-body",
      "updatedBy": "master.data.admin",
      "updatedAtUtc": "2026-06-01T03:00:00.000Z"
    },
    {
      "engineCode": "LEAP1A",
      "engineName": "CFM LEAP-1A",
      "manufacturer": "CFM International",
      "notes": "A320neo family",
      "updatedBy": "master.data.admin",
      "updatedAtUtc": "2026-06-01T03:00:00.000Z"
    }
  ]
}
```

### Field Explanations (คำอธิบายข้อมูลแต่ละฟิลด์)

| Field Name | Type | Description (คำอธิบาย) |
| :--- | :--- | :--- |
| **`engineCode`** | `String` | **Primary Key** รหัสอ้างอิงของเครื่องยนต์ (เช่น `"CFM56"`) |
| **`engineName`** | `String` | ชื่อเรียกของเครื่องยนต์ที่นำไปแสดงผล (เช่น `"CFM LEAP-1A"`) |
| **`manufacturer`** | `String` | ชื่อผู้ผลิตเครื่องยนต์ (เช่น `"CFM International"`) |
| **`notes`** | `String` | คำอธิบายเพิ่มเติม หรือบันทึกช่วยจำ (เช่น `"A320neo family"`) |
| **`updatedBy`** | `String` | ชื่อผู้ใช้งานที่ทำการอัปเดตข้อมูลล่าสุด |
| **`updatedAtUtc`** | `String` | วันเวลาที่อัปเดตข้อมูลล่าสุด (รูปแบบ ISO-8601 UTC) |

---

## 2. Endpoint: Upsert Engine Master

- **Method:** `POST` (หรือ `PUT`)
- **Path:** `/master/engine`
- **Description:** สร้างข้อมูลเครื่องยนต์ใหม่ หรือแก้ไขข้อมูลเครื่องยนต์ที่มีอยู่

### Example Request Body (JSON)

```json
{
  "engineCode": "CFM56",
  "engineName": "CFM56",
  "manufacturer": "CFM International",
  "notes": "Classic narrow/wide-body updated"
}
```

### Example Response (JSON)

```json
{
  "message": "Success",
  "error": "",
  "responseData": {
    "engineCode": "CFM56",
    "engineName": "CFM56",
    "manufacturer": "CFM International",
    "notes": "Classic narrow/wide-body updated",
    "updatedBy": "current.user",
    "updatedAtUtc": "2026-07-18T16:00:00.000Z"
  }
}
```

---

## 3. Endpoint: Delete Engine Master

- **Method:** `DELETE`
- **Path:** `/master/engine/{engineCode}`
- **Description:** ลบข้อมูลเครื่องยนต์ออกจากระบบ
- **หมายเหตุ:** หาก `engineCode` นี้กำลังถูกใช้งาน (อ้างอิงอยู่) ในตาราง `aircraft_engine_combination` ระบบจะต้องปฏิเสธการลบ และคืนค่า Error กลับมาว่า `REFERENCED` (Soft-block deletes)
