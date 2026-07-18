# API Specification: Master Data - Aircraft Type Licenses

เอกสารนี้อธิบายโครงสร้างของ API สำหรับการดึงข้อมูล **Aircraft Type Licenses** จากระบบ Master Data แบบเดิม ซึ่งใช้ในการแสดงผลและเลือก Aircraft License ให้กับพนักงานในหน้า HR Profile (Staff Edit Aircraft License Modal)

## Endpoint Details

- **Method:** `GET`
- **Path:** `/master/aircraft-type-licenses`
- **Description:** ดึงรายการตัวเลือก Aircraft Type License ทั้งหมดที่สามารถนำไปกำหนดให้กับพนักงานได้ โดยระบบเก่าจะยังใช้ ID แบบตัวเลข (Integer) 

---

## Example Response (JSON)

```json
{
    "message": "success",
    "responseData": [
        {
            "id": 1,
            "code": "B737-600/700/800/900",
            "name": "B737-600/700/800/900"
        },
        {
            "id": 2,
            "code": "B737-7/8/9",
            "name": "B737-7/8/9"
        },
        {
            "id": 3,
            "code": "A318/A319/A320/A321",
            "name": "A318/A319/A320/A321"
        },
        {
            "id": 4,
            "code": "B777-200/300/300ER",
            "name": "B777-200/300/300ER"
        },
        {
            "id": 5,
            "code": "A330-200/300/800/900",
            "name": "A330-200/300/800/900"
        },
        {
            "id": 6,
            "code": "B787-8/9/10",
            "name": "B787-8/9/10"
        },
        {
            "id": 7,
            "code": "B767-200/300",
            "name": "B767-200/300"
        },
        {
            "id": 8,
            "code": "A350-900/1000",
            "name": "A350-900/1000"
        },
        {
            "id": 9,
            "code": "ERJ-190",
            "name": "ERJ-190"
        }
    ],
    "error": ""
}
```

---

## Field Explanations (คำอธิบายข้อมูลแต่ละฟิลด์)

ใน Array ของ `responseData` แต่ละ Object จะประกอบไปด้วยข้อมูลดังนี้:

| Field Name | Type | Description (คำอธิบาย) |
| :--- | :--- | :--- |
| **`id`** | `Number` | **รหัสอ้างอิงหลัก (Primary Key)** ของ Aircraft Type License แบบดั้งเดิม<br/>*ตัวอย่าง:* `1`, `2`, `3`<br/>**ความสำคัญ:** Frontend จะนำค่านี้ไปเป็น Value ใน Checkbox เพื่อส่งกลับไปตอนทำการ Save (ถูกใช้งานควบคู่กับ `aircraftTypeLicensId` ใน API ข้อมูลพนักงาน) |
| **`code`** | `String` | **รหัสย่อ** ของกลุ่มเครื่องบิน |
| **`name`** | `String` | **ชื่อกลุ่มที่แสดงในหน้าจอ (Display Name)**<br/>*ตัวอย่าง:* `"B737-600/700/800/900"`<br/>**ความสำคัญ:** ใช้แสดงผลเป็นข้อความบนหน้า UI |

---

## การนำไปใช้งานร่วมกับ Staff API (`upsertStaff`)

เมื่อผู้ใช้กดเลือก Aircraft License ในหน้าจอ Frontend (เช่น เลือก ID: 1 และ 2) ค่าที่ถูกส่งไปอัปเดตข้อมูลพนักงานผ่าน API `/master/staff-management/upsert` จะมีรูปแบบดังนี้:

```json
{
  "staffId": 163,
  "staffAircraftLicenseList": [
    {
      "id": 0,
      "aircraftTypeId": 1
    },
    {
      "id": 0,
      "aircraftTypeId": 2
    }
  ]
}
```

> **หมายเหตุถึง Backend Developer:**  
> ในปัจจุบัน Frontend ยังคงส่ง `aircraftTypeId` กลับไปเป็น `Number` และดึงข้อมูลผ่าน API `/master/aircraft-type-licenses` ตัวนี้ เพื่อให้สอดคล้องกับระบบเดิมที่อิงตาม ID เลขจำนวนเต็ม  
> (ส่วนแผนในอนาคต หากจะเปลี่ยนไปใช้ระบบ Authorization Groups ที่มีรหัส String เช่น `AG-737NG` กรุณาอ้างอิงจากเอกสาร `aircraft-license.md` แทนครับ)
