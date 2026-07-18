# API Specification: Master Data - Authorization Type Groups

เอกสารนี้อธิบายโครงสร้างของ API สำหรับจัดการกลุ่มของเครื่องบิน (Authorization Type Groups) และสถานะความพร้อม/ความสมบูรณ์ของกลุ่มนั้นๆ

## Enums & Statuses

### `ReviewStatus` (สถานะการตรวจสอบ Group)
- **`DRAFT`**: แบบร่าง (เพิ่งสร้างใหม่ มีการแก้ไข หรือถูก reject ยังไม่ส่งตรวจ)
- **`IN_REVIEW`**: กำลังรอการตรวจสอบ (Submit ส่งตรวจแล้ว)
- **`PUBLISHED`**: อนุมัติและเผยแพร่แล้ว (สามารถนำไปใช้งานได้ หาก completeness เป็น `complete`)

### `CompletenessStatus` (สถานะความสมบูรณ์ของข้อมูล - Auto-computed)
- **`draft`**: ยังไม่มีสมาชิกใน Group
- **`incomplete`**: มีสมาชิกใน Group แล้ว แต่มีปัญหา Validation 
- **`complete`**: ข้อมูลสมาชิกถูกต้องสมบูรณ์ ไม่มี outstanding issue พร้อมใช้งาน

### `AuthGroupTransition` (Action สำหรับเปลี่ยนสถานะ)
- **`SUBMIT`**: แจ้งขอตรวจ (เปลี่ยนเป็น `IN_REVIEW`)
- **`PUBLISH`**: อนุมัติและเผยแพร่ (เปลี่ยนเป็น `PUBLISHED`)
- **`REJECT`**: ปฏิเสธการตรวจ (เปลี่ยนกลับเป็น `DRAFT`)

---

## 1. Endpoint: Get Authorization Groups

- **Method:** `GET`
- **Path:** `/master/authorization-group`
- **Description:** ดึงข้อมูล Authorization Group ทั้งหมด 

### Query Parameters
- `asOf` (String, optional): วันที่แบบ ISO String สำหรับดึงข้อมูลย้อนหลัง
- `downstream` (Boolean, optional): ถ้าเป็น `true` จะกรองเอาเฉพาะ group ที่มีสถานะ `PUBLISHED` และ `complete` เท่านั้น
- `customerId` (Number, optional): ID สายการบิน เพื่อค้นหา Group เฉพาะที่ใช้ Override ลูกค้าเจ้านั้นๆ

### Example Response (JSON)

```json
{
  "message": "Success",
  "error": "",
  "responseData": [
    {
      "groupId": "AG-737NG",
      "groupLabel": "B737-600/700/800/900",
      "memberCombinationIds": [1, 2, 3, 4],
      "reviewStatus": "PUBLISHED",
      "completenessStatus": "complete",
      "engineListCached": ["CFM56"],
      "customerId": null,
      "legacyEngineLabels": [],
      "publishedBy": "master.data.admin",
      "publishedAtUtc": "2026-06-01T03:00:00.000Z",
      "updatedBy": "master.data.admin",
      "updatedAtUtc": "2026-06-01T03:00:00.000Z"
    }
  ]
}
```

### Field Explanations (คำอธิบายข้อมูลแต่ละฟิลด์)

| Field Name | Type | Description (คำอธิบาย) |
| :--- | :--- | :--- |
| **`groupId`** | `String` | **Primary Key** รหัสอ้างอิงของ Group (เช่น `"AG-737NG"`) |
| **`groupLabel`** | `String` | ชื่อ Group ที่นำไปแสดงผลบนหน้าจอ |
| **`memberCombinationIds`** | `Array<Number>` | รายการ ID ของ `AircraftEngineCombination` ที่ผูกอยู่ในกลุ่มนี้ ณ ปัจจุบัน (Active) |
| **`reviewStatus`** | `String` | สถานะการตรวจสอบ ใช้ Enum `ReviewStatus` |
| **`completenessStatus`** | `String` | สถานะความสมบูรณ์ที่ระบบคำนวณอัตโนมัติ ใช้ Enum `CompletenessStatus` |
| **`engineListCached`** | `Array<String>` | **Auto-computed** สรุปรายชื่อเครื่องยนต์ทั้งหมดในกลุ่มนี้ เพื่อใช้อ้างอิงง่ายๆ โดยไม่ต้อง join ข้อมูล |
| **`customerId`** | `Number \| null` | `null` คือใช้เป็นค่าเริ่มต้นสำหรับทุกลูกค้า, ถ้ามีตัวเลขแปลว่าเป็น Group ย่อยที่สร้างขึ้นทับ (Override) เฉพาะสายการบินนั้นๆ |
| **`legacyEngineLabels`** | `Array<String>` | ข้อมูล Free-text จากระบบเก่า หากยังมีค่าแปลกปลอมอยู่ใน Array นี้ Group จะติดสถานะ `incomplete` |
| **`incompleteSinceUtc`** | `String \| null` | เวลา UTC ที่กลุ่มนี้กลายเป็น `incomplete` ใช้สำหรับคำนวณอายุความผิดปกติ (Staleness SLA) |
| **`submittedBy`, `reviewedBy`, `publishedBy`, `updatedBy`** | `String` | ผู้ใช้งานที่ทำการเปลี่ยนแปลงสถานะนั้นๆ |
| **`submittedAtUtc`, `publishedAtUtc`, `updatedAtUtc`** | `String` | วันเวลาในแต่ละ State |

---

## 2. Endpoint: Save Authorization Group Draft

- **Method:** `POST`
- **Path:** `/master/authorization-group/draft`
- **Description:** สร้าง หรือแก้ไข Group โดยระบบจะบังคับเซ็ต `reviewStatus` เป็น `DRAFT` เสมอ

### Example Request Body (JSON)

```json
{
  "groupId": "AG-737NG", 
  "groupLabel": "B737-600/700/800/900",
  "memberCombinationIds": [1, 2, 3, 4],
  "customerId": null 
}
```
**หมายเหตุ:** 
- ถ้าไม่มี `groupId` ส่งมา ระบบจะสร้าง Group ใหม่ด้วย ID ใหม่ (รัน Auto) 
- ทันทีที่ Save การเปลี่ยนแปลง `memberCombinationIds` จะถูกบันทึกลง Table ข้อมูลสมาชิก (Junction table) แบบ Append-only

### Example Response (JSON)
*(ข้อมูล `AuthorizationTypeGroup` ที่อัปเดตแล้ว)*

---

## 3. Endpoint: Transition Authorization Group Status

- **Method:** `POST`
- **Path:** `/master/authorization-group/{groupId}/transition`
- **Description:** ปรับเปลี่ยนสถานะของ Group 

### Example Request Body (JSON)

```json
{
  "action": "SUBMIT"
}
```
*(ส่งค่า `action` เป็น `SUBMIT`, `PUBLISH`, หรือ `REJECT`)*

### Example Response (JSON)
*(ข้อมูล `AuthorizationTypeGroup` พร้อมสถานะและ Timestamp ที่อัปเดตใหม่)*
