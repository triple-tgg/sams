# 08. UI/UX Design (การออกแบบส่วนต่อประสานผู้ใช้)

เอกสารฉบับนี้อธิบายแนวคิดการออกแบบหน้าจอ (UI) และประสบการณ์ผู้ใช้ (UX) สำหรับระบบ SAMS Module QA เพื่อให้สอดคล้องกับมาตรฐานความสวยงาม (Aesthetics) และใช้งานง่าย (Usability) ตามที่ได้พัฒนาไว้

## 1. แนวคิดการออกแบบหลัก (Design Principles)
- **Dashboard-First Approach:** เมื่อผู้ใช้เข้าสู่ระบบ (เช่น HR/QA) ระบบจะนำเสนอภาพรวมสถานะทันที (Dashboard) เช่น การแจ้งเตือนใบอนุญาตใกล้หมดอายุ กราฟจำนวนบุคลากร ก่อนที่จะเจาะลึกไปยังข้อมูลระดับบุคคล
- **Dynamic & Interactive:** ใช้ Hover Effects, Tooltips และ Micro-animations ในการแสดงผลข้อมูลวันที่ เพื่อไม่ให้หน้าจอดูรกเกินไป เช่น ในหน้า Matrix จะแสดงแค่ "สี" หรือ "ไอคอน" แต่เมื่อนำเมาส์ไปชี้ (Hover) จะแสดงรายละเอียดวันหมดอายุอย่างครบถ้วน
- **Visual Status Indicators (การใช้สีสื่อความหมาย):**
  - <span style="color: #16a34a">**สีเขียว (Green):**</span> ปกติ (Valid / Active)
  - <span style="color: #d97706">**สีเหลือง/ส้ม (Yellow/Amber):**</span> ใกล้หมดอายุ (Expiring soon) ควบคุมให้เตรียมตัวต่ออายุ
  - <span style="color: #dc2626">**สีแดง (Red):**</span> หมดอายุแล้ว (Expired) ไม่สามารถปฏิบัติงานได้
- **Clean & Modern Aesthetic:** ใช้ Tailwind CSS ในการจัดโครงสร้างแบบ Card-based layout ใช้สีพื้นหลังที่สบายตา (เช่น bg-slate-50) และแบ่ง Section ด้วย Border ที่ดูนุ่มนวล

## 2. โครงสร้างหน้าจอหลัก (Key Screens Layout)

### 2.1 หน้า QA Staff List (ตารางรายชื่อพนักงาน)
- **Top Bar:** มีกล่องค้นหา (Search Bar) สำหรับพิมพ์ชื่อพนักงาน และปุ่ม Filter สำหรับกรองแผนกหรือตำแหน่ง พร้อมปุ่ม "+ Add New Staff"
- **Data Table:** แสดง Column หลัก เช่น Employee ID, Name, Position, Department, Status (Badge สีเขียว/แดง)
- **Actions:** คอลัมน์ขวาสุดมีปุ่ม View Profile 

### 2.2 หน้า New Staff Registration (ฟอร์มลงทะเบียนพนักงานใหม่)
- **Sectioned Form:** ใช้ Layout แบบ 2 คอลัมน์ โดยแบ่งกลุ่มข้อมูลออกเป็นกล่อง (SectionCard) เช่น Personal Info, Contact, Employment, Education
- **Real-time Validation:** แสดงข้อความแจ้งเตือนสีแดง (Error state) ทันทีหากผู้ใช้กรอกข้อมูลไม่ครบถ้วน หรือผิดรูปแบบ (เช่น Format เบอร์โทรศัพท์ หรือ Email ผิด)
- **Dynamic File Upload:** มีปุ่มรองรับการอัปโหลดไฟล์รูปภาพโปรไฟล์ (Preview รูปทันที) และเอกสารสำคัญ (PDF) พร้อมแสดงสถานะ Uploading (Loader spinner)

### 2.3 หน้า Staff Profile (/staff/{id})
หน้าจอนี้จะถูกแบ่งออกเป็น 2 ส่วนหลัก:
1. **Hero Header (ส่วนหัว):** แสดงรูปโปรไฟล์, ชื่อ-นามสกุล, ตำแหน่ง, แผนก, และข้อมูลส่วนตัวพื้นฐานในรูปแบบ Grid
2. **Tab Navigation (ส่วนเนื้อหา):** ประกอบด้วย 4 Tabs เพื่อไม่ให้หน้าจอยาวเกินไป:
   - **Profile Tab:** แสดงข้อมูลส่วนตัว, ติดต่อ, การจ้างงาน, และเอกสารแนบ
   - **Training Tab:** แสดงประวัติการฝึกอบรม (Course, Date, Valid Until) และสถานะหมดอายุ
   - **Experience & License Tab:** แสดงใบอนุญาต AMEL (สำหรับ Engineer) และประวัติการทำงาน
   - **Logbook Records Tab:** แสดงบันทึกประสบการณ์การซ่อมบำรุงอากาศยาน

### 2.4 หน้า QA Monitoring Matrix
- **Sticky Header/Column:** เนื่องจาก Matrix มีข้อมูลมาก (พนักงานอยู่แกน Y, หลักสูตร/เครื่องบินอยู่แกน X) คอลัมน์ชื่อพนักงาน และหัวตารางจะถูกตรึงไว้ (Sticky) เพื่อให้เลื่อนดูข้อมูลได้สะดวก
- **Interactive Cells:** แต่ละ Cell ในตารางสามารถคลิกเพื่อเปิด Modal สำหรับ Edit/Update ข้อมูลได้โดยตรง โดยไม่ต้องเข้าไปในหน้า Profile ของแต่ละคน
