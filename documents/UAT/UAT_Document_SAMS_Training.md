# User Acceptance Test (UAT) Document
**System:** SAMS Engineering Maintenance System
**Module:** Training Management (M-02)
**Reference:** Functional Requirements (REQ-TRN-01 ถึง REQ-TRN-37)

---

## 1. Document Control

*   **Document ID:** UAT-TRN-001 Rev.00
*   **Date:** 16 July 2026
*   **Prepared By:** QA Lead (Aviation MRO)
*   **Approved By:** ___________________________
*   **Revision History:**
    *   Rev.00 (16-Jul-2026): Initial Draft สำหรับโมดูล Training Management (อ้างอิง CAAT/EASA Part-145)

---

## 2. Introduction

*   **วัตถุประสงค์ของการทดสอบ:** 
    เพื่อยืนยันความถูกต้องและครบถ้วนของการทำงานในระบบ SAMS สำหรับโมดูล Training Management ว่าเป็นไปตามความต้องการ (Functional Requirements) และสอดคล้องกับมาตรฐานของ CAAT / EASA Part-145 โดยเฉพาะเรื่องการจัดการประวัติการฝึกอบรม (Training Records), การประเมินผล, และการออกใบประกาศนียบัตร
*   **ขอบเขต (In Scope):** 
    *   การสร้างและบริหารจัดการ Training Scheduler
    *   การลงทะเบียนพนักงานเข้าสู่หลักสูตร (Enrollment)
    *   การประเมินผลการฝึกอบรม (Grading)
    *   การออกใบรับรอง (Certificate) และหลักฐานการฝึกอบรม (Evidence)
    *   การตรวจสอบเอกสารการฝึกอบรม (Document Verification)
*   **ขอบเขตที่อยู่นอกเหนือการทดสอบ (Out of Scope):** 
    *   โมดูล Flight Timeline และ Contract Management (ทดสอบแยกต่างหาก)
*   **เอกสารอ้างอิง:** 
    *   Software Requirements Specification (SRS) - Training Module
    *   EASA Part-145.A.30 (Personnel requirements) / Part-145.A.35 (Certifying staff and support staff)

---

## 3. Test Environment & Prerequisites

*   **URL/Environment:** `https://sam-stg.sams.aero` (Staging Environment)
*   **Test Accounts (Roles):**
    *   **QA Manager:** `qa_manager@sams.aero` (สิทธิ์เต็มในการสร้าง/ลบ/จัดการ Session, เกรด, Approve เอกสาร)
    *   **Training Coordinator / HR:** `hr_training@sams.aero` (สิทธิ์สร้าง Session, Enroll, แต่ไม่อนุมัติเอกสาร)
    *   **General Staff (Engineer):** `engineer01@sams.aero` (ดูประวัติการอบรมของตนเอง, อัพโหลดเอกสาร)
*   **ข้อมูลตั้งต้น (Master Data) ที่ต้องมี:**
    *   รายชื่อ Course (เช่น SAMS-HFM-001-R24 - Human Factors)
    *   รายชื่อ Staff ในระบบ (Active Staff)
    *   Training Data Statuses (Draft, Open Registration, In Progress, Grading, Completed, Cancelled)
    *   Staff Document Types & Statuses

---

## 4. Entry / Exit Criteria

*   **Entry Criteria (เงื่อนไขก่อนเริ่ม UAT):**
    *   ระบบได้รับการทำ System Integration Test (SIT) ผ่านแล้ว
    *   Environment สำหรับ UAT มีความเสถียรและเชื่อมต่อ Database ได้
    *   Master Data ทั้งหมดถูก Setup ในระบบเรียบร้อยแล้ว
*   **Exit Criteria (เกณฑ์การผ่าน):**
    *   Critical และ High Severity Defect ต้องเป็น `0`
    *   Medium และ Low Severity Defect ต้องได้รับการอนุมัติ (Sign-off) จาก Project Manager ให้ไปแก้ไขในเฟสถัดไป
    *   Test Cases ทั้งหมดถูกรันและมีสถานะ Pass อย่างน้อย 95%

---

## 5. Test Scenarios & Test Cases

*(ไฟล์ Test Cases แบบละเอียดสำหรับกรอกผลการทดสอบ ได้ถูกสร้างแยกเป็นไฟล์ CSV `UAT_Test_Cases_SAMS_Training.csv` ซึ่งสามารถเปิดด้วย Microsoft Excel ได้)*

**ภาพรวมการทดสอบครอบคลุม:**
*   **Positive Cases:** ทำงานได้ตามปกติ (Happy Path)
*   **Negative Cases:** กรอกข้อมูลผิด, ข้ามขั้นตอน, หรือทำสิ่งที่ห้ามทำ
*   **Boundary Cases:** Enroll คนเกินความจุ (Capacity limits)
*   **Role-based Access:** สิทธิ์การมองเห็นและแก้ไข

---

## 6. Traceability Matrix

| Requirement Ref | Requirement Description | Test Case ID |
| :--- | :--- | :--- |
| REQ-TRN-01 | สร้าง Training Session ใหม่ได้ | TC-TRN-001, 002 |
| REQ-TRN-02 | จัดการสถานะของ Session ตาม Workflow ได้ | TC-TRN-004, 009, 011, 013, 017 |
| REQ-TRN-03 | ค้นหาและ Enroll Staff เข้าสู่หลักสูตรได้ | TC-TRN-005, 006, 008 |
| REQ-TRN-04 | ส่ง Email Invitation ให้อย่างถูกต้อง | TC-TRN-007 |
| REQ-TRN-05 | ออกรายงาน Manager Report ได้ | TC-TRN-010 |
| REQ-TRN-06 | บันทึกคะแนน (Pass/Fail) ในช่วง Grading | TC-TRN-014, 015, 016 |
| REQ-TRN-07 | ออกใบ Certificate ตาม Template (FM-CM-055) | TC-TRN-019, 020, 021 |
| REQ-TRN-08 | การอัพโหลดหลักฐานและตรวจสอบเอกสาร (Verification) | TC-TRN-018, 023, 024, 025 |
| REQ-TRN-09 | ความปลอดภัยตาม Role (Role-based Access) | TC-TRN-026, 027 |

---

## 7. Defect Log Template

หากพบปัญหา ให้ผู้ทดสอบบันทึกลงในระบบ Bug Tracking (เช่น Jira) หรือตารางดังนี้:

| Defect ID | Severity | TC Ref | Description | Expected Result | Actual Result | Status | Assignee |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| DEF-001 | High | TC-TRN-006 | ระบบไม่แจ้งเตือนเมื่อลงทะเบียนเกิน Capacity | มีแจ้งเตือนไม่ให้ลง | ลงได้ปกติ | Open | Dev Team |
| | | | | | | | |

*Severity Levels: Critical, High, Medium, Low*

---

## 8. Sign-off Section

การลงนามด้านล่างนี้ เป็นการยืนยันว่า User Acceptance Test (UAT) ได้ถูกดำเนินการเสร็จสิ้น และระบบมีความพร้อมสำหรับการใช้งานจริง (Go-Live) ตามเกณฑ์ที่ได้ตกลงไว้

| Role | Name | Signature | Date |
| :--- | :--- | :--- | :--- |
| **QA Lead / User Representative** | _______________________ | _______________________ | __/__/____ |
| **Project Manager** | _______________________ | _______________________ | __/__/____ |
| **SAMS Co., Ltd. Representative** | _______________________ | _______________________ | __/__/____ |

