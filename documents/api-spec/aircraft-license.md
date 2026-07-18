# API Specification: Master Data - Authorization Type Groups

เอกสารนี้อธิบายโครงสร้างของ API สำหรับการดึงข้อมูล **Authorization Type Groups** จากระบบ Master Data (Aircraft-Engine) เพื่อนำมาใช้เป็นตัวเลือก (Options) ในการกำหนด Aircraft License ให้กับพนักงานในหน้า HR Profile

## Endpoint Details

- **Method:** `GET`
- **Path:** `/master/aircraft-engine/authorization-groups`
- **Description:** ดึงรายการ Group ของเครื่องบินทั้งหมดที่ผ่านการรับรองแล้ว (PUBLISHED) เพื่อนำไปใช้เป็นตัวเลือกในหน้าจอต่างๆ เช่น Staff Aircraft License

---

## Example Response (JSON)

```json
{
  "message": "Success",
  "error": "",
  "responseData": [
    {
      "groupId": "AG-737NG",
      "groupLabel": "B737-600/700/800/900",
      "reviewStatus": "PUBLISHED",
      "completenessStatus": "complete",
      "engineListCached": [
        "CFM56"
      ]
    },
    {
      "groupId": "AG-737MAX",
      "groupLabel": "B737-7/8/9",
      "reviewStatus": "PUBLISHED",
      "completenessStatus": "incomplete",
      "engineListCached": [
        "CFM LEAP-1B"
      ]
    }
  ]
}
```

---

## Field Explanations (คำอธิบายข้อมูลแต่ละฟิลด์)

ใน Array ของ `responseData` แต่ละ Object จะประกอบไปด้วยข้อมูลดังนี้:

| Field Name | Type | Description (คำอธิบาย) |
| :--- | :--- | :--- |
| **`groupId`** | `String` | **รหัสอ้างอิงหลัก (Primary Key)** ของกลุ่มเครื่องบิน<br/>*ตัวอย่าง:* `"AG-737NG"`, `"AG-A320"`<br/>**ความสำคัญ:** Frontend จะใช้ค่านี้ส่งกลับไปตอนที่ทำการ Save `upsertStaff` (ฟิลด์ `aircraftTypeId` หรือ `aircraftGroupId`) |
| **`groupLabel`** | `String` | **ชื่อกลุ่มที่แสดงในหน้าจอ (Display Name)**<br/>*ตัวอย่าง:* `"B737-600/700/800/900"`<br/>**ความสำคัญ:** ใช้แสดงเป็นข้อความใน Checkbox หรือ Dropdown ให้ User เลือก |
| **`reviewStatus`** | `String` | **สถานะการตรวจสอบข้อมูล**<br/>ค่าที่เป็นไปได้: `"DRAFT"`, `"IN_REVIEW"`, `"PUBLISHED"`<br/>*คำแนะนำ:* สำหรับการนำไปใช้งานเป็นตัวเลือก ควรดึงมาเฉพาะรายการที่เป็น `"PUBLISHED"` เท่านั้น |
| **`completenessStatus`** | `String` | **สถานะความสมบูรณ์ของข้อมูลในกลุ่ม** (อิงจากการตรวจสอบความถูกต้องของข้อมูลย่อย)<br/>ค่าที่เป็นไปได้: `"draft"`, `"incomplete"`, `"complete"` |
| **`engineListCached`** | `Array<String>` | **รายการเครื่องยนต์ (Engine)** ที่ผูกอยู่กับกลุ่มเครื่องบินนี้<br/>*ตัวอย่าง:* `["CFM56", "V2500"]`<br/>**ความสำคัญ:** เป็นข้อมูล pre-computed ที่ระบบดึงมาจาก Aircraft-Engine Combination เอาไว้แสดงผลเพิ่มเติมได้ |

---

## การนำไปใช้งานร่วมกับ Staff API (`upsertStaff`)

เมื่อผู้ใช้กดเลือก Aircraft License ในหน้าจอ Frontend ระบบจะเก็บค่า `groupId` (เช่น `"AG-737NG"`) ไว้ใน Array และเมื่อกด "Save Changes" ข้อมูลจะถูกส่งไปที่ API `/master/staff-management/upsert` ตามรูปแบบนี้:

```json
{
  "staffId": 105,
  "staffAircraftLicenseList": [
    {
      "id": 0,
      "aircraftTypeId": "AG-737NG" // เปลี่ยนมาใช้ groupId แบบ String แทนตัวเลขเดิม
    }
  ]
}
```

**สิ่งที่ต้องทำสำหรับ Backend (API Developer):**
1. สร้าง Endpoint `GET /master/aircraft-engine/authorization-groups` เพื่อ Return ข้อมูลตามโครงสร้างด้านบน
2. ปรับแก้ฐานข้อมูลตาราง `staff_aircraft_license` (หรือตารางที่เกี่ยวข้อง) ให้คอลัมน์ `aircraftTypeId` รองรับประเภทข้อมูลเป็น **String (VARCHAR)** เพื่อให้เชื่อมกับ `groupId` ของระบบ Master Data ตัวใหม่ได้
