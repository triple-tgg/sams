# 1. System Information

**System Name:** SAMS Engineering Maintenance System
**Project:** Human Resources & Quality Assurance Module Implementation
**Version:** v1.0
**Prepared By:** QA Lead & Senior Business Analyst
**Test Date:** 16 กรกฎาคม 2026

---

# 2. System Description

**SAMS Engineering Maintenance System** เป็นระบบเทคโนโลยีสารสนเทศระดับองค์กร (Enterprise System) ที่ถูกออกแบบมาเพื่อบริหารจัดการงานบำรุงรักษาอากาศยานและวิศวกรรมการบิน ภายใต้มาตรฐานของสำนักงานการบินพลเรือนแห่งประเทศไทย (CAAT) และ EASA Part-145 

ระบบมีจุดประสงค์เพื่อบูรณาการกระบวนการทำงานแบบดิจิทัล (Digital Transformation) โดยมุ่งเน้นในส่วนของการบริหารจัดการข้อมูลทรัพยากรบุคคล (Human Resources), การประกันคุณภาพและการฝึกอบรม (Quality Assurance) และการจัดการข้อมูลหลัก (Master Data) เพื่อให้กระบวนการทำงานมีความรวดเร็ว ถูกต้อง และสามารถตรวจสอบย้อนกลับ (Traceability) ได้อย่างมีประสิทธิภาพตามมาตรฐานความปลอดภัยระดับสากล

---

# 3. Scope

## 3.1 ฟังก์ชันที่อยู่ใน UAT (In-Scope)
- **Quality Assurance (QA)**
  - Training Scheduler (การสร้างรอบการอบรม, การลงทะเบียน, และออกประกาศนียบัตร)
  - Document Verification (การตรวจสอบและอนุมัติเอกสารพนักงาน)
  - Reports (รายงานผลการฝึกอบรม)
- **Human Resources (HR)**
  - Staff Management (การขึ้นทะเบียนพนักงานใหม่ และจัดการข้อมูลพนักงาน)
  - Document Management (การอัพโหลดเอกสารยืนยันตัวตน)
- **Master Data**
  - Departments (การจัดการแผนก)
  - Positions (การจัดการตำแหน่งงาน)
  - Staff Document Types / Statuses (ประเภทและสถานะของเอกสาร)

## 3.2 ฟังก์ชันที่ไม่อยู่ใน UAT (Out-of-Scope)
- Mobile Application
- API Integration กับระบบภายนอก (Third-Party Systems)

---

# 4. Modules & Test Cases

## 4.1 Quality Assurance (QA)
| Test Case ID | Module | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Tester | Remark |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| UAT-QA-001 | QA | สร้างรอบการฝึกอบรม (Training Session) ใหม่ | ล็อคอินด้วยสิทธิ์ QA Manager | 1. ไปที่เมนู QA > Training Scheduler<br>2. คลิก "Create New Session"<br>3. ระบุข้อมูลคอร์ส, ผู้สอน, และ Capacity<br>4. คลิก "Save" | Course: `Human Factors`<br>Capacity: `20` | ระบบบันทึก Session ใหม่สำเร็จ สถานะเริ่มต้นเป็น "Draft" | | | | |
| UAT-QA-002 | QA | ค้นหาและเพิ่มพนักงานเข้าสู่การอบรม (Enrollment) | Session อยู่ในสถานะ Open Registration | 1. เลือก Training Session<br>2. คอลัมน์ Enrolled Staff คลิก "Add Staff"<br>3. ค้นหาพนักงานและกด Enroll | พนักงาน `John Doe` | รายชื่อพนักงานปรากฏในตาราง Enrolled Staff อย่างถูกต้อง | | | | |
| UAT-QA-003 | QA | การให้คะแนน (Grading) พนักงานที่เข้าอบรม | Session อยู่ในสถานะ Grading | 1. เลือก Training Session<br>2. คอลัมน์ Result คลิกปุ่ม "Pass" หรือ "Fail" | เลือก "Pass" | ปุ่มหายไปและเปลี่ยนเป็น Badge แจ้งสถานะ "Pass" (สีเขียว) | | | | |
| UAT-QA-004 | QA | ออกใบประกาศนียบัตร (Certificate) สำหรับผู้สอบผ่าน | Session สถานะ Completed | 1. ไปที่รายชื่อพนักงานที่ได้เกรด Pass<br>2. คลิกไอคอน "Issue Certificate" (รูปรางวัล) | - | ระบบแสดงหน้าจอ Certificate Preview Form (FM-CM-055) ข้อมูลถูกต้องและสามารถ Print ได้ | | | | |
| UAT-QA-005 | QA | ตรวจสอบและอนุมัติ (Approve) เอกสารของพนักงาน | มีเอกสารสถานะ Pending รอดำเนินการ | 1. ไปที่เมนู QA > Document Verification<br>2. คลิกที่เอกสาร<br>3. ตรวจสอบและกดปุ่ม "Approve" | - | สถานะเอกสารเปลี่ยนเป็น "Approved" ทันที | | | | |
| UAT-QA-006 | QA | ปฏิเสธ (Reject) เอกสารพนักงานพร้อมระบุเหตุผล | มีเอกสารสถานะ Pending รอดำเนินการ | 1. ไปที่ QA > Document Verification<br>2. คลิกปุ่ม "Reject"<br>3. กรอกเหตุผลที่ปฏิเสธ<br>4. ยืนยัน | Reason: `ไม่ชัดเจน` | สถานะเปลี่ยนเป็น "Rejected" พร้อมบันทึกเหตุผลในระบบ | | | | |
| UAT-QA-007 | QA | พิมพ์รายงานสรุปผลการอบรม (Manager Report) | มี Session ที่สิ้นสุดและประเมินผลแล้ว | 1. ไปที่ Training Session<br>2. คลิก "Managers Report" | - | หน้า Preview รายงานแสดงข้อมูลครบถ้วน และพร้อมส่งพิมพ์เป็น PDF | | | | |

## 4.2 Human Resources (HR)
| Test Case ID | Module | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Tester | Remark |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| UAT-HR-001 | HR | ขึ้นทะเบียนพนักงานใหม่เข้าสู่ระบบ (New Staff) | ล็อคอินด้วยสิทธิ์ HR Admin | 1. ไปที่เมนู HR > Staff<br>2. คลิก "New Staff"<br>3. ระบุชื่อ, รหัสพนักงาน, แผนก, ตำแหน่ง<br>4. คลิก "Save" | ID: `EMP-001`<br>Name: `Somchai Test` | ระบบบันทึกข้อมูลสำเร็จและแสดงรายชื่อในตาราง Staff List | | | | |
| UAT-HR-002 | HR | ค้นหาและแก้ไขประวัติการทำงานของพนักงาน | มีข้อมูลพนักงานในระบบ | 1. ไปที่เมนู HR > Staff<br>2. ค้นหาชื่อพนักงาน<br>3. แก้ไขข้อมูลส่วนตัวหรือตำแหน่งงาน<br>4. คลิก "Save" | - | ข้อมูลพนักงานอัพเดทสำเร็จและสะท้อนข้อมูลล่าสุดในระบบทันที | | | | |
| UAT-HR-003 | HR | อัพโหลดเอกสารส่วนตัว / ใบอนุญาตของพนักงาน | มีโปรไฟล์พนักงานในระบบ | 1. เข้าไปที่ Staff Profile ของพนักงาน<br>2. ไปที่แท็บ "Documents"<br>3. อัพโหลดไฟล์เอกสาร<br>4. บันทึก | ไฟล์ `ID_Card.png` | ระบบบันทึกเอกสารและตั้งสถานะเป็น "Pending" เพื่อรอ QA ตรวจสอบ | | | | |

## 4.3 Master Data
| Test Case ID | Module | Test Scenario | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Tester | Remark |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| UAT-MD-001 | Master | สร้างแผนกใหม่ (Department) | ล็อคอินด้วยสิทธิ์ System Admin | 1. ไปที่ Master Data > Departments<br>2. คลิก "Add Department"<br>3. ตั้งชื่อแผนก และบันทึก | Dept: `Quality Control` | แผนกใหม่แสดงในรายการ และสามารถเลือกได้ตอนสร้างพนักงานใหม่ | | | | |
| UAT-MD-002 | Master | ป้องกันการลบแผนกที่มีพนักงานสังกัดอยู่ (Validation) | มีแผนกที่มีพนักงาน Active อยู่ | 1. ไปที่ Master Data > Departments<br>2. เลือกแผนกเป้าหมาย<br>3. คลิก "Delete" | - | ระบบแสดงข้อความ Error แจ้งว่าไม่สามารถลบได้เนื่องจากมีการใช้งานอยู่ | | | | |
| UAT-MD-003 | Master | สร้างตำแหน่งงานใหม่ (Position) | ล็อคอินด้วยสิทธิ์ System Admin | 1. ไปที่ Master Data > Positions<br>2. คลิก "Add Position"<br>3. ตั้งชื่อตำแหน่ง และบันทึก | Position: `Inspector` | ตำแหน่งงานใหม่แสดงในรายการ และนำไปผูกกับพนักงานได้ | | | | |

---

# 5. Defect Log

| Defect ID | Module | Description | Severity | Priority | Status | Assigned To | Resolution |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| DEF-001 | Example | ตัวอย่าง: ค้นหาพนักงานในหน้า Enrollment ไม่พบ | High | High | Open | Dev Team | - |
| | | | | | | | |
| | | | | | | | |
| | | | | | | | |
| | | | | | | | |

---

# 6. UAT Summary

| Total Test Cases | Passed | Failed | Blocked | Pass Rate |
| :---: | :---: | :---: | :---: | :---: |
| 13 | - | - | - | 0.00% |

---

# 7. Sign Off

| Role | Name | Signature | Sign Date |
| :--- | :--- | :--- | :--- |
| **Prepared By** | _____________________________ | _____________________________ | ___/___/2026 |
| **Reviewed By** | _____________________________ | _____________________________ | ___/___/2026 |
| **Business Owner** | _____________________________ | _____________________________ | ___/___/2026 |
| **Project Manager** | _____________________________ | _____________________________ | ___/___/2026 |
| **QA Lead** | _____________________________ | _____________________________ | ___/___/2026 |
