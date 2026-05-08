# 10. Constraints & Assumptions (ข้อจำกัดและข้อสมมติฐาน)

ในการพัฒนาระบบ SAMS Module QA มีข้อจำกัด (Constraints) ที่ต้องปฏิบัติตาม และข้อสมมติฐาน (Assumptions) ที่ตั้งไว้เป็นบรรทัดฐานสำหรับการออกแบบระบบ ดังนี้

## 1. ข้อจำกัดของระบบ (Constraints)

### 1.1 Technical Constraints (ข้อจำกัดด้านเทคนิค)
- **Timezone Standardization:** ระบบจำเป็นต้องจัดการ Timezone อย่างเข้มงวด โดยข้อมูล วัน-เวลา (DateTime) ทั้งหมดที่ถูกส่งไปบันทึกใน Database (API) จะต้องเป็นมาตรฐาน **UTC เท่านั้น** ในขณะที่การแสดงผลบนหน้าจอ (UI) จะแปลงเป็น Local Timezone ของผู้ใช้งาน (เช่น Asia/Bangkok) เพื่อป้องกันความสับสนในการนับวันหมดอายุ
- **Browser Compatibility:** ระบบออกแบบมาให้ทำงานบน Modern Web Browser (เช่น Google Chrome, Microsoft Edge, Safari) บน Desktop และ Tablet เป็นหลัก (หน้าจอแนวกว้าง) เนื่องจาก Matrix มีข้อมูลจำนวนมาก หากเปิดใน Mobile อาจแสดงผลได้ไม่สมบูรณ์
- **System Stack:** ระบบพัฒนาด้วย Next.js (Frontend) และใช้โครงสร้าง UI ตามที่มีการออกแบบไว้เดิม ไม่สามารถเปลี่ยนไปใช้ Framework อื่นนอกเหนือจากที่กำหนดได้

### 1.2 Business Constraints (ข้อจำกัดด้านธุรกิจ)
- **Compliance Regulations:** ฟังก์ชันการตรวจสอบวันหมดอายุของการฝึกอบรมและ Authorization ต้องสอดคล้องกับข้อบังคับของ CAAT (The Civil Aviation Authority of Thailand) และหน่วยงานการบินอื่นๆ อย่างเคร่งครัด
- **Data Legacy:** ระบบใหม่ต้องสามารถรองรับกระบวนการดึงข้อมูลตั้งต้น (Initial Data Load) จากไฟล์ Excel เดิมที่ใช้งานอยู่ (เช่น Training Record Monitoring.xlsx) ได้ 

---

## 2. ข้อสมมติฐาน (Assumptions)

### 2.1 User Assumptions (ข้อสมมติฐานด้านผู้ใช้งาน)
- ผู้ใช้งานในแผนก QA (QA Manager, QA Staff) มีความคุ้นเคยกับกระบวนการ Audit และเข้าใจคำศัพท์ทางเทคนิคด้านการบิน (เช่น INI, R2Y, CRS, AMEL) เป็นอย่างดี จึงไม่จำเป็นต้องมีคำอธิบาย (Tooltip) สำหรับคำศัพท์พื้นฐานทุกคำ
- ผู้ใช้งานมี Internet Connection ที่มีความเสถียรในการเข้าใช้งานระบบ เนื่องจากระบบเป็น Web-based Application

### 2.2 Integration & Interface Assumptions (ข้อสมมติฐานด้านการเชื่อมต่อระบบ)
- **External Systems:** ปัจจุบันระบบหน่วยงานกำกับดูแล (เช่น CAAT) ไม่มี API ที่เปิดให้เชื่อมต่อแบบ Real-time (System-to-System integration) ดังนั้นการรับ-ส่งข้อมูลกับภายนอก จะยังคงอยู่ในรูปแบบการ Export เป็นไฟล์ PDF/Excel หรือการนำเข้าข้อมูลโดยผู้ใช้ (Manual Update/Upload)
- **Master Data:** สันนิษฐานว่าข้อมูล Master Data (เช่น รายชื่อเครื่องบิน, รหัส Authority) มีการถูกจัดการและอัปเดตอย่างถูกต้องจาก Module อื่นแล้ว (เช่น Master Data Module) โดย QA Module เป็นเพียงผู้ดึงข้อมูลมาใช้งาน (Read & Reference) เท่านั้น
