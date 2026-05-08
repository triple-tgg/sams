# 06. System Architecture (สถาปัตยกรรมระบบ)

เอกสารฉบับนี้แสดงภาพรวมของสถาปัตยกรรมเชิงเทคนิค (Technical Architecture) สำหรับระบบ SAMS Module QA เพื่อให้เห็นถึงโครงสร้างการเชื่อมต่อระหว่างส่วนประกอบต่างๆ

## 1. High-Level Architecture (โครงสร้างระบบภาพรวม)
ระบบถูกออกแบบด้วยสถาปัตยกรรมแบบ **Client-Server Architecture** โดยแยกส่วนการประมวลผล (Frontend/Backend) อย่างชัดเจน ดังนี้

- **Frontend (Client Side):**
  - **Framework:** Next.js (React)
  - **Styling:** Tailwind CSS (สำหรับจัดการ UI / Responsive)
  - **State Management:** Zustand (จัดการ State ระดับ Global) และ React Query (จัดการ API Caching & Fetching)
  - **หน้าที่:** จัดการเรื่องการเรนเดอร์หน้าจอ (UI/UX) หน้า Monitoring Matrix และรับ Input จากผู้ใช้

- **Backend (Server Side):**
  - **Framework:** Node.js (Express หรือ NestJS)
  - **Architecture:** Layered Architecture (Controller -> Service -> Repository)
  - **หน้าที่:** ประมวลผล Business Logic (เช่น การคำนวณวันหมดอายุ, Dual Check Eligibility), สร้างเอกสาร Export (Excel), และจัดการ Security (JWT Authentication)

- **Database (Data Storage):**
  - **Type:** Relational Database (เช่น PostgreSQL)
  - **ORM:** Prisma
  - **หน้าที่:** จัดเก็บข้อมูลแบบมีโครงสร้างความสัมพันธ์ (Relational) เช่น ข้อมูลบุคลากร ข้อมูลสายการบิน และการอนุมัติสิทธิ์

## 2. Component Block Diagram (แผนภาพส่วนประกอบ)
```text
[ User / QA Manager ]
       |
       v (HTTPS)
+-----------------------------------------------------+
|                     Frontend                        |
|  +----------------+  +---------------------------+  |
|  | QA Staff List  |  | QA Monitoring & Matrix    |  |
|  +----------------+  +---------------------------+  |
|  | Course Manager |  | Authorization Matrix      |  |
|  +----------------+  +---------------------------+  |
|                                                     |
|  (Data Fetching via React Query / Axios)            |
+-----------------------------------------------------+
       |
       v (RESTful API / JSON)
+-----------------------------------------------------+
|                      Backend                        |
|  +----------------+  +---------------------------+  |
|  | Auth Service   |  | Staff / Training Service  |  |
|  +----------------+  +---------------------------+  |
|  | Matrix Service |  | Report / Export Service   |  |
|  +----------------+  +---------------------------+  |
|                                                     |
|  (Prisma Client / ORM)                              |
+-----------------------------------------------------+
       |
       v (TCP/IP)
+-----------------------------------------------------+
|                     Database                        |
|  [Staff Tables] [Training Tables] [Auth Tables]     |
+-----------------------------------------------------+
```

## 3. Technology Stack Summary (สรุปเทคโนโลยีที่เลือกใช้)
- **UI Components:** Lucide-react (Icons), Sonner (Toast Notifications)
- **Date/Time Processing:** Day.js (จัดการ Timezone Parsing / Formatting)
- **Data Export:** SheetJS / XLSX (สร้างไฟล์ Excel หลาย Sheet)
- **File Upload:** แปลงเอกสาร (PDF, รูปภาพ) เป็น Base64 หรืออัปโหลดเข้าสู่ File Storage (S3 / Local Storage) ก่อนส่ง Path เก็บลง Database

## 4. Architectural Constraints (ข้อควรระวังเชิงสถาปัตยกรรม)
- **Matrix Rendering:** การดึงข้อมูลพนักงานทั้งหมดเพื่อแสดง Authorization หรือ Training Matrix อาจดึงข้อมูลมามากกว่า 1,000 แถว ระบบ Backend จำเป็นต้องทำ Data Aggregation (JOIN ล่วงหน้า) และส่งกลับมาในรูปแบบ Array 2 มิติที่แบนราบ (Flattened) เพื่อลดภาระการจัดกลุ่มข้อมูล (Grouping) บนฝั่ง Frontend
