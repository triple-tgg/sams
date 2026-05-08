# 03. User & Role Definition (การกำหนดผู้ใช้งานและสิทธิ์)

เอกสารฉบับนี้อธิบายถึงกลุ่มผู้ใช้งาน (User Roles) ใน SAMS Module QA และสิทธิ์การเข้าถึงเมนูหรือฟังก์ชันต่างๆ ภายในระบบ (Role-Based Access Control - RBAC)

## 1. คำอธิบายกลุ่มผู้ใช้งาน (User Roles)

| Role Name | อักษรย่อ | คำอธิบาย (Description) |
| :--- | :---: | :--- |
| **QA Manager** | QAM | ผู้จัดการแผนกประกันคุณภาพ มีอำนาจสูงสุดใน Module QA สามารถแก้ไข ตั้งค่า และอนุมัติสิทธิ์ (Authorization) ได้ทุกระดับ |
| **QA Staff / Coordinator** | QAS | เจ้าหน้าที่แผนกประกันคุณภาพ รับหน้าที่จัดการเอกสาร อัปเดตตารางฝึกอบรม และบันทึกประวัติการอบรม |
| **Trainer / Instructor** | TRN | ครูฝึกสอน หรือผู้จัดการหลักสูตรการอบรม สามารถดูตารางสอนและบันทึกผู้เข้าร่วมอบรมได้ |
| **Engineer / Certifying Staff** | ENG | ช่างซ่อมบำรุงอากาศยาน หรือวิศวกร เป็น End-user ที่เข้ามาดูสถานะ Authorization และวันหมดอายุ Training ของตนเองเท่านั้น |
| **Auditor / Read-Only** | AUD | ผู้ตรวจสอบ (Internal หรือ External) เข้ามาเพื่อดูรายงานและตรวจสอบข้อมูล Matrix โดยไม่มีสิทธิ์แก้ไขข้อมูลใดๆ |

---

## 2. สิทธิ์การเข้าถึงเมนู (Menu Access Matrix)

ตารางด้านล่างแสดงสิทธิ์การมองเห็นและการเข้าถึงเมนูใน Module QA ของแต่ละ Role
(*หมายเหตุ: `V` = View (ดูได้อย่างเดียว), `E` = Edit (เพิ่ม/ลบ/แก้ไขได้), `N/A` = ไม่สามารถเข้าถึงได้*)

| เมนู (Menu / Feature) | QAM | QAS | TRN | ENG | AUD |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **QA Dashboard** | V | V | N/A | N/A | V |
| **QA Staff List** | E | E | V | V (เฉพาะตนเอง) | V |
| **QA Monitoring (Training Matrix)** | E | E | V | V (เฉพาะตนเอง) | V |
| **Course Management** | E | E | E | N/A | V |
| **Training Scheduler** | E | E | V | V (เฉพาะตนเอง) | V |
| **Customer Authorization Matrix** | E | E | N/A | V (เฉพาะตนเอง) | V |
| **Authority Authorization Matrix**| E | V | N/A | V (เฉพาะตนเอง) | V |
| **Export Excel (Reports)** | V | V | V | N/A | V |

---

## 3. กฎเกณฑ์การใช้งานพิเศษ (Special Business Rules)
1. **Authority Authorization Approval:** แม้ QA Staff (QAS) จะสามารถเตรียมข้อมูลได้ แต่การกดปุ่ม "Approve" หรือ "Issue" สิทธิ์ในระดับ Authority (เช่น การออกบัตร Certifying Staff สำหรับ CAAT) จะต้องใช้สิทธิ์ QA Manager (QAM) เท่านั้น (ขึ้นอยู่กับ Workflow ที่ตกลงกันในองค์กร)
2. **Self-Service View:** ช่างซ่อมบำรุง (ENG) เมื่อเข้าสู่ระบบ จะถูกพาไปยังหน้า `Staff Profile` ของตนเองโดยอัตโนมัติ และระบบจะซ่อนปุ่ม Edit ทุกปุ่มในหน้า Training / Authorization
3. **Audit Logging:** ทุกการกระทำที่มีการเปลี่ยนแปลงสถานะ (เช่น การต่ออายุ, การลบรายการ) ระบบ Backend จะทำการบันทึก Log โดยระบุ `User ID`, `Action`, และ `Timestamp (UTC)` เสมอ เพื่อให้ Auditor สามารถตรวจสอบย้อนหลังได้
