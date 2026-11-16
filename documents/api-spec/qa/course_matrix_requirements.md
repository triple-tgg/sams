# API Specification: QA Training Needs Matrix — Requirements Upsert

## 1. Endpoint: requirements/upsert

- **Method:** `POST`
- **Path:** `/training/course-department-subs/requirements/upsert`
- **Auth:** Bearer access token
- **Description:** บันทึกว่า course ใดจำเป็นสำหรับ department sub (role) ใด ใน Training Needs Matrix · `aircraftEngineCombinationIds` ใช้กับทุกรายการใน `requirements` ของ request นั้น (ส่ง `[]` เมื่อไม่ใช่ Type Course)
- **Frontend:** `upsertCourseMatrixRequirements` (`lib/api/qa/course.ts`) → `useUpsertCourseMatrixRequirements` (`lib/api/qa/course.hooks.ts`) → QA › Course Management › Training Needs Matrix (`TrainingNeedsMatrix.tsx`) · ช่อง role: ส่ง 1 requirement ต่อการแก้ 1 ช่อง · ช่อง Aircraft Type: ส่งทุก requirement ที่ `isRequired = true` ของ course นั้นพร้อม combination ที่เลือก (ปุ่ม Save ปิดเมื่อ course ยังไม่มี role ที่ Required) · สำเร็จแล้ว invalidate query `['course-matrix']`

### Example Request Body (JSON)

```json
{
  "requirements": [
    {
      "courseId": 0,
      "courseDepartmentSubId": 0,
      "isRequired": true
    }
  ],
  "aircraftEngineCombinationIds": [0]
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

### Change log

| Date | Change |
|---|---|
| 2026-11-14 | Matrix เพิ่มการแก้ aircraft type จากคอลัมน์ Aircraft Type (ใช้ endpoint นี้ ส่งหลาย requirement ใน request เดียว) |
| 2026-11-14 | Body เปลี่ยนจาก array ของ `{ courseId, courseDepartmentSubId, isRequired, aircraftEngineCombinationIds }` เป็น object `{ requirements: [...], aircraftEngineCombinationIds: [...] }` — combination ย้ายออกมาอยู่ระดับ request |
