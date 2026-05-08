# 09. Integration & Interface (การเชื่อมต่อระบบและส่วนต่อประสาน)

เอกสารฉบับนี้อธิบายถึงจุดเชื่อมต่อข้อมูล (Integration Points) ระหว่างระบบ SAMS Module QA กับระบบภายนอกและ Module อื่นๆ ภายใน SAMS (Internal Interface) เพื่อให้การไหลเวียนของข้อมูล (Data Flow) เป็นไปอย่างราบรื่น

## 1. Internal Integration (การเชื่อมต่อกับ Module ภายใน SAMS)

ระบบ QA จะไม่มีการทำ Data Entry สำหรับข้อมูลพื้นฐาน (Master Data) ซ้ำซ้อน แต่จะอาศัยกลไกการดึงข้อมูลจากส่วนกลางผ่าน API ภายใน (Internal APIs):

1. **Master Data Module:**
   - **Data Pulled:** รหัสประเภทเครื่องบิน (Aircraft Type License), รหัสตำแหน่ง (Positions), รหัสแผนก (Departments) และ Authority Code
   - **Method:** เรียกใช้ GET Request ไปยัง Master Data Endpoint (`/api/master-data/...`) ทุกครั้งที่โหลดหน้า Form หรือตั้งค่า Cache ในระดับ Application State

2. **HR Module (Human Resources):**
   - **Data Shared:** โครงสร้างข้อมูล Staff Profile ของฝั่ง QA และ HR ใช้ฐานข้อมูลหรือตารางเดียวกัน (Staff Table) เพื่อให้มั่นใจว่าเมื่อมีพนักงานเข้าใหม่หรือลาออก ทั้ง HR และ QA จะเห็นข้อมูลที่สอดคล้องกัน (Single Source of Truth)

## 2. External Integration (การเชื่อมต่อกับระบบภายนอก)

ปัจจุบัน ระบบไม่ได้เชื่อมต่อ API โดยตรง (System-to-System) กับระบบของลูกค้า (Customer Airlines) หรือหน่วยงานกำกับดูแล (CAAT) การเชื่อมต่อจึงเป็นการนำเข้าและส่งออกไฟล์ (File-based Integration):

1. **CAAT (The Civil Aviation Authority of Thailand):**
   - **Interface Type:** Manual Export (PDF / Excel)
   - **Description:** ระบบรองรับการออกรายงาน "List of Certifying Staff" (เช่น ฟอร์ม SAMS-FM-CM-008) และรายงานประวัติการทำงาน (SAMS-FM-CM-062) ในรูปแบบที่ตรงกับ Template มาตรฐานของ CAAT เพื่อให้ QA สามารถปริ้นท์หรือส่งอีเมลไปยังหน่วยงานได้ทันที

2. **Customer Airlines (สายการบินลูกค้า):**
   - **Interface Type:** Export to Excel / Audit View
   - **Description:** เมื่อ Auditor จากสายการบินลูกค้าต้องการตรวจสอบสิทธิ์ ระบบสามารถกรองรายชื่อเฉพาะผู้ที่มี Authorization ของสายการบินนั้นๆ และออกรายงาน (Export) เป็นไฟล์ Excel ได้

## 3. Data Storage & File Upload Integration

1. **Document Storage (การเก็บเอกสารแนบ):**
   - ระบบใช้บริการ File Storage (เช่น AWS S3 หรือ Local File Server ผ่าน Path `/public/uploads/`) ในการจัดเก็บรูปโปรไฟล์, ไฟล์ PDF (ใบอนุญาต AMEL), และเอกสารรับรองต่างๆ
   - **กระบวนการ:** ฝั่ง Frontend ทำการแปลงไฟล์ที่อัปโหลดเป็น Base64 แล้วส่งผ่าน Endpoint `/api/qa/staff-management/upload` ระบบ Backend จะรับไฟล์ นำไปจัดเก็บ และคืนค่า Path เพื่อให้ระบบบันทึกลง Database (`attachmentFilePath`)

## 4. Notification Interface (การแจ้งเตือน) *[Future Enhancement]*
*ระบบถูกออกแบบให้พร้อมรองรับการต่อยอด (Scalable) เพื่อทำระบบแจ้งเตือนอัตโนมัติในอนาคต:*
- **Email Gateway (SMTP):** Backend จะสามารถรัน Job อัตโนมัติในเวลา 00:01 ของทุกวัน (Cron Job) เพื่อตรวจสอบรายการ Authorization / Training ที่กำลังจะหมดอายุในอีก 30 วันล่วงหน้า และส่งแจ้งเตือนไปยัง Email ของ QA Manager และพนักงานที่เกี่ยวข้อง
