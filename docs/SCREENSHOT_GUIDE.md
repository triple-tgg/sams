# 📸 คู่มือการ Capture Screenshot สำหรับ User Manual

## วิธีการถ่ายภาพหน้าจอ

เพื่อให้เอกสาร User Manual สมบูรณ์ ต้อง capture หน้าจอตามรายการด้านล่าง
บันทึกภาพในโฟลเดอร์ `docs/screenshots/`

### เครื่องมือที่แนะนำ
- **Windows**: กด `Win + Shift + S` (Snipping Tool)
- **Full Page Screenshot**: ใช้ Extension "GoFullPage" ใน Chrome

---

## รายการ Screenshot ที่ต้อง Capture

### 1. Login Page
- **ไฟล์:** `login_page.png`
- **URL:** `/en/auth/login`
- **คำอธิบาย:** หน้า Login ทั้งหน้า (รวมโลโก้, ฟอร์ม, ปุ่ม Sign In)

### 2. Dashboard
- **ไฟล์:** `dashboard_page.png`
- **URL:** `/en/dashboard`
- **คำอธิบาย:** หน้า Dashboard ทั้งหน้า (รวม Sidebar, Welcome Card, Statistics, Charts)

### 3. Sidebar Navigation
- **ไฟล์:** `sidebar_navigation.png`
- **URL:** (ครอปจากหน้าใดก็ได้)
- **คำอธิบาย:** Sidebar เมนูด้านซ้าย — ขยาย Master Data ให้เห็นเมนูย่อย

### 4. Flight List
- **ไฟล์:** `flight_list_page.png`
- **URL:** `/en/flight`
- **คำอธิบาย:** หน้ารายการเที่ยวบิน (รวม Filter, ตาราง, Pagination)

### 5. Create Flight Dialog
- **ไฟล์:** `create_flight_dialog.png`
- **URL:** `/en/flight` → คลิกปุ่ม "+ Add"
- **คำอธิบาย:** Dialog สร้างเที่ยวบินใหม่

### 6. Edit Flight Dialog
- **ไฟล์:** `edit_flight_dialog.png`
- **URL:** `/en/flight` → คลิก Edit ที่รายการใดรายการหนึ่ง
- **คำอธิบาย:** Dialog แก้ไขเที่ยวบิน (หลังจาก Confirm แล้ว)

### 7. THF Stepper
- **ไฟล์:** `thf_stepper.png`
- **URL:** `/en/flight/thf/create?flightInfosId=XXX`
- **คำอธิบาย:** ครอปส่วน Stepper Header (5 ขั้นตอน)

### 8. THF Step 1: Flight
- **ไฟล์:** `thf_step1_flight.png`
- **URL:** THF Form Step 1
- **คำอธิบาย:** ฟอร์มข้อมูลเที่ยวบินใน THF

### 9. THF Step 2: Services
- **ไฟล์:** `thf_step2_services.png`
- **URL:** THF Form Step 2
- **คำอธิบาย:** ฟอร์มบริการ (Fluid, Engine Oil, Towing)

### 10. THF Step 3: Equipment
- **ไฟล์:** `thf_step3_equipment.png`
- **URL:** THF Form Step 3
- **คำอธิบาย:** ตาราง/การ์ดอุปกรณ์

### 11. THF Step 4: Parts & Tools
- **ไฟล์:** `thf_step4_parts_tools.png`
- **URL:** THF Form Step 4
- **คำอธิบาย:** ตาราง/การ์ดอะไหล่และเครื่องมือ

### 12. THF Step 5: Attach File
- **ไฟล์:** `thf_step5_attach_file.png`
- **URL:** THF Form Step 5
- **คำอธิบาย:** ส่วนอัปโหลดไฟล์

### 13. Contract Page
- **ไฟล์:** `contract_page.png`
- **URL:** `/en/contract`
- **คำอธิบาย:** หน้าจัดการสัญญา (Tabs, ตาราง)

### 14. Invoice Page
- **ไฟล์:** `invoice_page.png`
- **URL:** `/en/invoice`
- **คำอธิบาย:** หน้าจัดการใบแจ้งหนี้ (Tabs, ตาราง)

### 15. Report Page
- **ไฟล์:** `report_page.png`
- **URL:** `/en/report`
- **คำอธิบาย:** หน้าสร้างรายงาน (Filter + Report Cards)

### 16. Master Data - Overview
- **ไฟล์:** `master_data_page.png`
- **URL:** `/en/master-data`
- **คำอธิบาย:** หน้า Master Data หลัก

### 17. Master Data - Customer Airline
- **ไฟล์:** `master_data_customer_airline.png`
- **URL:** `/en/master-data/customer-airline`
- **คำอธิบาย:** หน้าจัดการสายการบิน

### 18. Master Data - Staff
- **ไฟล์:** `master_data_staff.png`
- **URL:** `/en/master-data/staff`
- **คำอธิบาย:** หน้าจัดการพนักงาน

### 19. Master Data - Station
- **ไฟล์:** `master_data_station.png`
- **URL:** `/en/master-data/station`
- **คำอธิบาย:** หน้าจัดการสถานี

### 20. Master Data - User Login
- **ไฟล์:** `master_data_user_login.png`
- **URL:** `/en/master-data/user-login`
- **คำอธิบาย:** หน้าจัดการบัญชีผู้ใช้

### 21. Master Data - Role
- **ไฟล์:** `master_data_role.png`
- **URL:** `/en/master-data/role`
- **คำอธิบาย:** หน้าจัดการบทบาท

### 22. Master Data - Permission
- **ไฟล์:** `master_data_permission.png`
- **URL:** `/en/master-data/set-permission`
- **คำอธิบาย:** หน้ากำหนดสิทธิ์

---

## การตั้งค่าหน้าจอสำหรับ Capture

1. ใช้ Browser ขนาด **1920×1080** (หรือ Full HD)
2. Zoom Level: **100%**
3. ปิด DevTools ก่อน Capture
4. ใช้ Light Mode (Default Theme)
5. บันทึกเป็นไฟล์ `.png` ความละเอียดสูง

---

## หลัง Capture เสร็จ

ภาพที่บันทึกจะถูกอ้างอิงอัตโนมัติในไฟล์ `docs/USER_MANUAL.md`
ตรวจสอบว่าชื่อไฟล์ตรงกับที่ระบุไว้ในเอกสาร
