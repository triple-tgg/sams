# API Specification: Master Data - Aircraft Engine Combinations

เอกสารนี้อธิบายโครงสร้างของ API สำหรับการจัดการข้อมูลการจับคู่รุ่นเครื่องบินและเครื่องยนต์ (Aircraft-Engine Combination) 
**หมายเหตุ:** ตารางข้อมูลนี้เป็น Source of truth หลักของระบบ และมีการใช้ระบบ Versioning แบบ Append-only เพื่อเก็บประวัติไว้ (CR-3) 

## 1. Endpoint: Get Combinations

- **Method:** `GET`
- **Path:** `/master/aircraft-engine-combination`
- **Description:** ดึงข้อมูลการจับคู่ Combination ทั้งหมดที่กำลัง Active ณ ปัจจุบัน หรือ ณ จุดเวลาในอดีต

### Query Parameters
- `asOf` (String, optional): วันที่แบบ ISO-8601 UTC หากระบุ ระบบจะคืนค่าข้อมูลเฉพาะบรรทัดที่มีผลใช้งาน (Active) ณ จุดเวลานั้น (ใช้ดูประวัติย้อนหลัง) หากไม่ส่งจะดึงข้อมูลที่ Active ปัจจุบัน

### Example Response (JSON)

```json
{
  "message": "Success",
  "error": "",
  "responseData": [
    {
      "id": 1,
      "familyCode": "B737",
      "series": "800",
      "engineCode": "CFM56",
      "displayLabel": "B737-800 (CFM56)",
      "validFrom": "2026-06-01T03:00:00.000Z",
      "validTo": null,
      "updatedBy": "master.data.admin",
      "updatedAtUtc": "2026-06-01T03:00:00.000Z"
    }
  ]
}
```

### Field Explanations (คำอธิบายข้อมูลแต่ละฟิลด์)

| Field Name | Type | Description (คำอธิบาย) |
| :--- | :--- | :--- |
| **`id`** | `Number` | **Primary Identity** รหัสอ้างอิงของการจับคู่นี้ (ค่าจะคงที่เสมอแม้ว่าจะมีการอัปเดต version ไปเรื่อยๆ ก็ตาม) |
| **`familyCode`** | `String` | รหัสรุ่น Family ของเครื่องบินที่ใช้จับคู่ (อ้างอิงไปที่ตาราง Aircraft Family) |
| **`series`** | `String` | รหัส Series ย่อยของเครื่องบิน (เช่น `"800"`, `"900"`, `"8200"`) บาง Family อาจจะว่างไว้ |
| **`engineCode`** | `String` | รหัสเครื่องยนต์ที่ใช้จับคู่ (อ้างอิงไปที่ `engineCode` ของ Engine Master) |
| **`displayLabel`** | `String` | **Auto-derived** ข้อความแสดงผล เช่น `"B737-800 (CFM56)"` อ่านอย่างเดียวจาก UI |
| **`validFrom`** | `String` | เวลา UTC ที่ข้อมูลบรรทัดนี้เริ่มมีผลบังคับใช้ (Append-only versioning) |
| **`validTo`** | `String \| null` | เวลา UTC ที่ข้อมูลถูกยกเลิก/ปิดเวอร์ชัน หากเป็น `null` แปลว่าข้อมูลนี้กำลัง Active ในปัจจุบัน |
| **`updatedBy`** | `String` | ชื่อผู้ใช้งานที่ทำการอัปเดตข้อมูลล่าสุด |
| **`updatedAtUtc`** | `String` | วันเวลาที่บันทึกบรรทัดนี้ลงฐานข้อมูล |

---

## 2. Endpoint: Upsert Combination

- **Method:** `POST` (หรือ `PUT`)
- **Path:** `/master/aircraft-engine-combination`
- **Description:** เพิ่มหรือแก้ไขข้อมูล Combination

### การทำงานของการ Update
เมื่อมีการเรียกแก้ไข (`id` ถูกส่งมาด้วย) ระบบจะไม่ไปแก้ทับข้อมูลเดิมตรงๆ แต่จะ:
1. หาข้อมูลเก่าที่มี `id` เดียวกัน และ `validTo` เป็น `null`
2. อัปเดต `validTo` ให้เป็นเวลาปัจจุบัน (ปิดการใช้งาน version เก่า)
3. สร้างบรรทัดใหม่ โดยระบุข้อมูลที่ถูกแก้ไข และตั้งค่า `validFrom` ใหม่, `validTo` เป็น `null`

### Example Request Body (JSON)

```json
{
  "id": 1, // ใส่มาในกรณีต้องการแก้ไข
  "familyCode": "B737",
  "series": "800",
  "engineCode": "CFM56"
}
```

### Example Response (JSON)

```json
{
  "message": "Success",
  "error": "",
  "responseData": {
    "id": 1,
    "familyCode": "B737",
    "series": "800",
    "engineCode": "CFM56",
    "displayLabel": "B737-800 (CFM56)",
    "validFrom": "2026-07-18T16:00:00.000Z",
    "validTo": null,
    "updatedBy": "current.user",
    "updatedAtUtc": "2026-07-18T16:00:00.000Z"
  }
}
```

---

## 3. Endpoint: Delete Combination

- **Method:** `DELETE`
- **Path:** `/master/aircraft-engine-combination/{id}`
- **Description:** ลบข้อมูลการจับคู่
- **กลไกการลบ:**
  1. หาก `id` นี้กำลังถูกใช้งานอยู่ใน Group แบบ Active จะถือว่ามี Reference ค้างอยู่ ระบบจะฟ้อง Error `REFERENCED` ทำให้ไม่สามารถลบได้
  2. หากไม่เคยถูกอ้างอิงที่ไหนเลย ระบบจะลบข้อมูลทิ้งจริง (Hard Delete)
  3. หากเคยถูกอ้างอิงในอดีต (History) แต่ตอนนี้ไม่ได้ใช้แล้ว ระบบจะทำการปิดเวอร์ชัน (Soft Delete) โดยกำหนดค่า `validTo = now` เพื่อคงข้อมูลประวัติไว้ (CR-3)
