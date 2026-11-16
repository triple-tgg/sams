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


## 5. Endpoint: change-password

- **Method:** `POST`
- **Path:** `/user/change-password`
- **Auth:** Bearer access token (required). The account whose password changes is the signed-in user from the token — there is no `userId` in the body.
- **Description:** เปลี่ยนรหัสผ่านของผู้ใช้ที่ login อยู่ ต้องยืนยันรหัสผ่านปัจจุบัน · การรีเซ็ตรหัสผ่านของผู้ใช้อื่น (แอดมิน) ใช้ `Users-upsert` ส่ง `passwordData`
- **Frontend:** `changeUserPassword` (`lib/api/master/users/userOperations.ts`) → `useChangePassword` (`lib/api/hooks/useUserOperations.ts`) → HR Staff Detail › User Account tab (เฉพาะบัญชีของตัวเอง)

### Example Request Body (JSON)

```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

### Example Response (JSON)

```json
{
  "message": "string",
  "responseData": "string",
  "error": "string"
}
```

> Frontend ถือว่าสำเร็จเมื่อ `message === "success"` · กรณีอื่นแสดง `error` เป็น toast

---

## 6. Endpoint: users-check (กำลังพัฒนา)

- **Method:** `POST`
- **Path:** `/master/users-check`
- **Description:** เช็คว่ามีบัญชีที่ใช้ email นี้แล้วหรือยัง ก่อนสร้างบัญชีให้พนักงาน (HR Staff Detail › User Account › Create User Account)
- **Frontend:** `checkUserEmail` (`lib/api/master/users/userOperations.ts`) → `useCheckUserEmail` (`lib/api/hooks/useUserOperations.ts`) → `CreateUserAccountDialog`

### Example Request Body (JSON)

```json
{
  "email": "email@gmail.com",
  "employeeID": "0163"
}
```

### Expected Response (JSON) — สมมติฐาน รอ backend ยืนยัน

```json
{
  "message": "success",
  "responseData": { "id": 7, "username": "...", "email": "...", "flagInternal": false, "staffEmployeeId": null, "roleObj": { "id": 2, "name": "..." }, "isActive": true },
  "error": ""
}
```

- `responseData` = บัญชีที่ email ตรงกัน หรือ `null` ถ้าไม่มี (frontend รับได้ทั้ง object เดี่ยวและ array)
- ต้องมีอย่างน้อย `id`, `username`, `email`, `fullName`, `roleObj.id`, `isActive`, `flagInternal`, `staffEmployeeId` เพราะใช้แสดงผลและใช้ upsert ตอนผูกบัญชี

### การตัดสินใจฝั่ง frontend (`resolveUserCheck`)

| ผลเช็ค | เงื่อนไข | สิ่งที่ทำ |
|---|---|---|
| ไม่มีบัญชี | `responseData` ว่าง | เปิดฟอร์ม Add New User (ล็อก email ที่เช็คแล้ว) |
| มีบัญชี ยังไม่ผูก Employee | `staffEmployeeId` ว่าง | Link Account → `Users-upsert` ด้วย id เดิม, `flagInternal: true`, `staffEmployeeId` = พนักงานนี้, `passwordData: ""` (คงรหัสผ่านเดิม) |
| ผูกกับพนักงานคนนี้แล้ว | `staffEmployeeId` = employeeID | แจ้งว่าผูกแล้ว + ปุ่ม Refresh |
| ผูกกับพนักงานคนอื่น | `staffEmployeeId` ≠ employeeID | แจ้งเตือนให้ตรวจสอบ email + ปุ่ม Use a Different Email |

> **Fallback ระหว่างรอ API:** ถ้า endpoint ตอบ 404 / 405 frontend จะใช้ `Users-list` กรอง `email` แล้วเลือกตัวที่ email ตรงกันทุกตัวอักษร (ไม่สนตัวพิมพ์เล็กใหญ่) · staging ตอนนี้ยังใช้ fallback นี้อยู่

---
