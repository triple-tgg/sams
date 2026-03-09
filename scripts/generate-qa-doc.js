const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType, ShadingType, PageBreak } = require('docx');

const ARTIFACT_DIR = '/Users/appleclub/.gemini/antigravity/brain/61096a76-2b12-4633-b08b-858819ee52b4';
const OUTPUT = '/Users/appleclub/Desktop/Triple-T/SAM Airline Maintenance/frontend-sam-airline-maintenance/QA_UX_UI_Phase2.docx';

function img(filename, w = 680, h = 400) {
    const p = path.join(ARTIFACT_DIR, filename);
    if (!fs.existsSync(p)) { console.log('MISSING:', filename); return null; }
    const buf = fs.readFileSync(p);
    return new ImageRun({ data: buf, transformation: { width: w, height: h }, type: filename.endsWith('.webp') ? 'png' : undefined });
}

function heading(text, level = HeadingLevel.HEADING_1) {
    return new Paragraph({ heading: level, spacing: { before: 300, after: 120 }, children: [new TextRun({ text, bold: true, size: level === HeadingLevel.HEADING_1 ? 32 : level === HeadingLevel.HEADING_2 ? 28 : 24, color: '1a56db' })] });
}

function para(text, opts = {}) {
    return new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text, size: 22, ...opts })] });
}

function bullet(text) {
    return new Paragraph({ spacing: { after: 80 }, bullet: { level: 0 }, children: [new TextRun({ text, size: 22 })] });
}

function caption(text) {
    return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 200 }, children: [new TextRun({ text, size: 18, italics: true, color: '64748b' })] });
}

function imgParagraph(filename) {
    const i = img(filename);
    if (!i) return para(`[ภาพ: ${filename} — ไม่พบไฟล์]`);
    return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [i] });
}

function separator() {
    return new Paragraph({ spacing: { before: 200, after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'e2e8f0' } }, children: [] });
}

// ── Build Document ──
const doc = new Document({
    title: 'SAMs QA Module — UX/UI Phase 2 Documentation',
    description: 'Comprehensive UX/UI documentation for QA module Phase 2',
    styles: {
        default: {
            document: { run: { font: 'TH Sarabun New', size: 22 } },
        },
    },
    sections: [{
        properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
        children: [
            // ── Cover ──
            new Paragraph({ spacing: { before: 2000 } }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'SAMs Airline Maintenance', size: 48, bold: true, color: '1a56db' })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'Quality Assurance Module', size: 36, bold: true, color: '1e40af' })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: 'UX/UI Phase 2 Documentation', size: 32, color: '64748b' })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [new TextRun({ text: `Version 1.0 — ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`, size: 22, color: '94a3b8' })] }),
            separator(),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, children: [new TextRun({ text: 'Triple-T Innovation Co., Ltd.', size: 24, bold: true, color: '0f172a' })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'SAM Airline Maintenance System', size: 22, color: '64748b' })] }),

            // ── Page Break ──
            new Paragraph({ children: [new PageBreak()] }),

            // ── Table of Contents ──
            heading('สารบัญ (Table of Contents)'),
            para('1. ภาพรวมระบบ QA Module'),
            para('2. QA Dashboard — ภาพรวมทรัพยากรบุคคล'),
            para('3. Training & Compliance Dashboard — ภาพรวมการฝึกอบรม'),
            para('4. Training Plan — จัดการแผนฝึกอบรม'),
            para('5. Create Plan — สร้างแผนฝึกอบรมใหม่'),
            para('6. Staff List — รายชื่อพนักงาน'),
            para('7. Staff Profile — โปรไฟล์พนักงาน'),
            para('8. Training Matrix — ตารางการฝึกอบรม'),
            para('9. Experience — ประสบการณ์ทำงาน'),
            para('10. Logbook — สมุดบันทึกการซ่อมบำรุง'),
            para('11. Logbook Form Modal — ฟอร์มบันทึกข้อมูล Logbook'),
            para('12. User Flow Diagram'),
            new Paragraph({ children: [new PageBreak()] }),

            // ══════════════════════════════════════
            // 1. Overview
            // ══════════════════════════════════════
            heading('1. ภาพรวมระบบ QA Module'),
            para('ระบบ QA (Quality Assurance) Module เป็นส่วนสำคัญของ SAMs Airline Maintenance System ที่ใช้ในการบริหารจัดการคุณภาพงานซ่อมบำรุงอากาศยาน ครอบคลุมการจัดการพนักงาน, การฝึกอบรม, การรับรองใบอนุญาต, และการบันทึก Logbook'),
            para(''),
            para('ฟังก์ชันหลักของ QA Module ประกอบด้วย:', { bold: true }),
            bullet('QA Dashboard — ภาพรวมข้อมูลทรัพยากรบุคคลและสถิติ'),
            bullet('Training & Compliance — จัดการการฝึกอบรมและใบรับรอง'),
            bullet('Training Plan — วางแผน/สร้าง/ติดตามแผนการฝึกอบรม'),
            bullet('Staff Management — จัดการข้อมูลพนักงาน, การฝึกอบรม, ประสบการณ์'),
            bullet('Logbook — บันทึกงานซ่อมบำรุงพร้อมฟอร์ม Multi-step'),
            para(''),
            para('โครงสร้าง Navigation:', { bold: true }),
            bullet('QA → Training & Compliance (default)'),
            bullet('QA → Training Plan'),
            bullet('QA → Staff List → Staff Profile (Profile / Training Matrix / Experience / Logbook)'),
            bullet('QA → QA Dashboard'),
            separator(),

            new Paragraph({ children: [new PageBreak()] }),

            // ══════════════════════════════════════
            // 2. QA Dashboard
            // ══════════════════════════════════════
            heading('2. QA Dashboard'),
            para('หน้า QA Dashboard แสดงภาพรวมทรัพยากรบุคคลของฝ่าย QA'),
            para(''),
            para('องค์ประกอบหลัก:', { bold: true }),
            bullet('Summary Cards — จำนวนพนักงาน, ใบอนุญาต, สถานะการฝึกอบรม'),
            bullet('Staff Distribution Chart — กราฟแสดงการกระจายตัวของพนักงานตามแผนก'),
            bullet('Recent Activity — กิจกรรมล่าสุดในระบบ'),
            para(''),
            para('Route: /qa/dashboard', { color: '1a56db' }),
            para(''),
            imgParagraph('qa_dashboard_1773015431341.png'),
            caption('รูปที่ 1: QA Dashboard — ภาพรวมทรัพยากรบุคคล'),

            new Paragraph({ children: [new PageBreak()] }),

            // ══════════════════════════════════════
            // 3. Training & Compliance Dashboard
            // ══════════════════════════════════════
            heading('3. Training & Compliance Dashboard'),
            para('หน้าหลักสำหรับจัดการการฝึกอบรมและการตรวจสอบ Compliance'),
            para(''),
            para('องค์ประกอบหลัก:', { bold: true }),
            bullet('KPI Cards — Total Staff (248), Compliance Rate (87%), Training in Progress (34), Critical Alerts (12)'),
            bullet('Authorization Status — Donut Chart แสดงสถานะใบอนุญาต (Valid / Expiring / Expired)'),
            bullet('Monthly Training Workload — Bar Chart แสดงภาระงานฝึกอบรมตามเดือน (Scheduled vs Available Capacity)'),
            bullet('Top Missing Skills — อันดับทักษะที่ขาดมากที่สุด พร้อม Progress Bar'),
            bullet('Critical Alerts Table — ตารางเตือนใบอนุญาตหมดอายุ พร้อมปุ่ม Enroll Now'),
            bullet('Quick Stats — สถิติสรุป (Courses Completed, Avg Days to Renew, Upcoming Expirations)'),
            para(''),
            para('ปุ่มการทำงาน:', { bold: true }),
            bullet('ตรวจ Conflict — ตรวจสอบความขัดแย้งของตารางฝึกอบรม'),
            bullet('Training Plan — นำทางไปหน้าจัดการ Training Plan'),
            bullet('สร้าง Certificate — สร้างใบรับรองผ่านการฝึกอบรม'),
            para(''),
            para('Route: /qa/training', { color: '1a56db' }),
            para(''),
            imgParagraph('qa_training_dashboard_1773015313084.png'),
            caption('รูปที่ 2: Training & Compliance Dashboard'),

            new Paragraph({ children: [new PageBreak()] }),

            // ══════════════════════════════════════
            // 4. Training Plan
            // ══════════════════════════════════════
            heading('4. Training Plan — จัดการแผนฝึกอบรม'),
            para('หน้าจัดการและติดตามแผนการฝึกอบรมทั้งหมด เข้าถึงได้จากปุ่ม "Training Plan" บน Dashboard'),
            para(''),
            para('องค์ประกอบหลัก:', { bold: true }),
            bullet('Summary Cards — Total Plans (8), Active (3), Completed (2), Overdue (1)'),
            bullet('Filter Bar — ค้นหา, กรองตาม Status (Draft/Active/Completed/Overdue), Quarter, Department'),
            bullet('Training Plan Table — ตารางรายการแผนทั้งหมด'),
            para(''),
            para('คอลัมน์ในตาราง:', { bold: true }),
            bullet('Plan ID — รหัสแผน (TP-2026-XXX)'),
            bullet('Plan Name — ชื่อแผน'),
            bullet('Period — ช่วงเวลาดำเนินการ'),
            bullet('Department — แผนกที่เกี่ยวข้อง'),
            bullet('Courses — จำนวนคอร์ส'),
            bullet('Enrolled — จำนวนผู้ลงทะเบียน/เป้าหมาย'),
            bullet('Completion — Progress Bar แสดง % ความสำเร็จ'),
            bullet('Status — สถานะ (Draft/Active/Completed/Overdue) ด้วย Color Badges'),
            bullet('Action — ปุ่ม View / Edit'),
            para(''),
            para('ปุ่มการทำงาน:', { bold: true }),
            bullet('← Back — กลับไป Dashboard'),
            bullet('+ Create Plan — เปิด Modal สร้างแผนใหม่'),
            para(''),
            para('Route: /qa/training/plan', { color: '1a56db' }),
            para(''),
            imgParagraph('qa_training_plan_1773015339979.png'),
            caption('รูปที่ 3: Training Plan — ตารางจัดการแผนฝึกอบรม'),

            new Paragraph({ children: [new PageBreak()] }),

            // ══════════════════════════════════════
            // 5. Create Plan Modal
            // ══════════════════════════════════════
            heading('5. Create Plan — สร้างแผนฝึกอบรมใหม่'),
            para('Modal Popup สำหรับกรอกข้อมูลสร้างแผนการฝึกอบรมใหม่ เปิดจากปุ่ม "+ Create Plan"'),
            para(''),
            para('ฟิลด์ข้อมูลในฟอร์ม:', { bold: true }),
            bullet('Plan Name * — ชื่อแผนการฝึกอบรม'),
            bullet('Description — คำอธิบายวัตถุประสงค์ของแผน'),
            bullet('Department * — เลือกแผนก (All Departments, Maintenance, Line Maintenance, Safety, ...)'),
            bullet('Target Staff * — จำนวนพนักงานเป้าหมาย'),
            bullet('Start Date * — วันที่เริ่มต้น'),
            bullet('End Date * — วันที่สิ้นสุด'),
            bullet('Courses * — เลือกคอร์สจากรายการ 12 คอร์ส (พร้อม Search)'),
            para(''),
            para('Course Picker:', { bold: true }),
            bullet('ค้นหาคอร์สจากชื่อหรือหมวดหมู่'),
            bullet('กด + เพื่อเพิ่มคอร์สเข้าแผน'),
            bullet('คอร์สที่เลือกแล้วจะแสดงรายการด้านบนพร้อมปุ่มลบ'),
            bullet('แสดงข้อมูล Category, Type (R2Y/INI), Duration'),
            para(''),
            para('ปุ่มการทำงาน:', { bold: true }),
            bullet('Cancel — ยกเลิกและปิด Modal'),
            bullet('Save as Draft — บันทึกเป็นฉบับร่าง'),
            bullet('+ Create Plan — สร้างแผนและเปิดใช้งาน'),
            para(''),
            para('Flow: กดปุ่ม → กรอกข้อมูล → เลือกคอร์ส → Create/Save → Success Screen'),
            para(''),
            imgParagraph('qa_create_plan_modal_1773015361904.png'),
            caption('รูปที่ 4: Create Training Plan Modal'),

            new Paragraph({ children: [new PageBreak()] }),

            // ══════════════════════════════════════
            // 6. Staff List
            // ══════════════════════════════════════
            heading('6. Staff List — รายชื่อพนักงาน'),
            para('หน้ารายชื่อพนักงานทั้งหมดในฝ่าย QA พร้อมเครื่องมือจัดการ'),
            para(''),
            para('องค์ประกอบหลัก:', { bold: true }),
            bullet('Summary Header — จำนวนพนักงานทั้งหมด, Active, Inactive'),
            bullet('Search Bar — ค้นหาด้วยชื่อหรือรหัสพนักงาน'),
            bullet('Staff Table — ตารางรายชื่อพนักงาน (รหัส, ชื่อ, ตำแหน่ง, แผนก, สถานะ)'),
            bullet('Pagination — แบ่งหน้าแสดงผล'),
            para(''),
            para('ปุ่มการทำงาน:', { bold: true }),
            bullet('Import — นำเข้าข้อมูลพนักงานจากไฟล์'),
            bullet('+ New Staff — เพิ่มพนักงานใหม่'),
            para(''),
            para('Flow: คลิกที่แถวในตาราง → นำทางไปหน้า Staff Profile (/qa/staff/[id])'),
            para(''),
            para('Route: /qa/staff', { color: '1a56db' }),
            para(''),
            imgParagraph('qa_staff_list_1773015447174.png'),
            caption('รูปที่ 5: Staff List — รายชื่อพนักงาน'),

            new Paragraph({ children: [new PageBreak()] }),

            // ══════════════════════════════════════
            // 7. Staff Profile — Profile Tab
            // ══════════════════════════════════════
            heading('7. Staff Profile — โปรไฟล์พนักงาน'),
            para('หน้าแสดงรายละเอียดพนักงานแต่ละคน ประกอบด้วย 4 แท็บ'),
            para(''),
            para('Hero Section:', { bold: true }),
            bullet('รูปโปรไฟล์, ชื่อ, ตำแหน่ง, รหัสพนักงาน'),
            bullet('สถานะ Active/Inactive'),
            bullet('ข้อมูลสรุป (แผนก, วันที่เริ่มงาน, ประสบการณ์)'),
            para(''),
            para('Tab: Profile', { bold: true }),
            bullet('ข้อมูลส่วนบุคคล — ชื่อ-นามสกุล, วันเกิด, เบอร์โทร, อีเมล'),
            bullet('ข้อมูลการศึกษา — ปริญญา, สถาบัน, ปี'),
            bullet('ใบอนุญาต/ใบรับรอง — หมายเลข, วันออก, วันหมดอายุ'),
            para(''),
            para('Route: /qa/staff/[id]', { color: '1a56db' }),
            para(''),
            imgParagraph('qa_staff_profile_1773015470163.png'),
            caption('รูปที่ 6: Staff Profile — แท็บ Profile'),

            new Paragraph({ children: [new PageBreak()] }),

            // ══════════════════════════════════════
            // 8. Training Matrix Tab
            // ══════════════════════════════════════
            heading('8. Training Matrix — ตารางการฝึกอบรม'),
            para('แท็บแสดงตารางการฝึกอบรมแบบ Matrix ของพนักงาน'),
            para(''),
            para('องค์ประกอบหลัก:', { bold: true }),
            bullet('Training Categories — แสดง Progress แต่ละหมวดหมู่ (Aircraft Type, Regulatory, Safety)'),
            bullet('Donut Chart — สัดส่วน Completed / Pending / Expired'),
            bullet('Training Matrix Table — ตารางรายวิชา พร้อมสถานะ Valid/Expired/Pending'),
            bullet('Training Highlights — ประวัติการฝึกอบรมที่โดดเด่น'),
            para(''),
            para('ประเภทการฝึกอบรม:', { bold: true }),
            bullet('R2Y (Recurrent 2-Year) — ต้องต่ออายุทุก 24 เดือน'),
            bullet('INI (Initial) — ฝึกครั้งแรก'),
            bullet('PERM (Permanent) — ถาวร ไม่มีวันหมดอายุ'),
            para(''),
            imgParagraph('qa_training_matrix_tab_1773015495045.png'),
            caption('รูปที่ 7: Training Matrix — ตารางรายวิชาฝึกอบรม'),

            new Paragraph({ children: [new PageBreak()] }),

            // ══════════════════════════════════════
            // 9. Experience Tab
            // ══════════════════════════════════════
            heading('9. Experience — ประสบการณ์ทำงาน'),
            para('แท็บแสดงประสบการณ์การทำงานของพนักงาน'),
            para(''),
            para('องค์ประกอบหลัก:', { bold: true }),
            bullet('Timeline — แสดงประวัติงานเรียงตามเวลา'),
            bullet('Aircraft Types — ประเภทอากาศยานที่มีประสบการณ์'),
            bullet('Work Summary — สรุปชั่วโมงงาน, จำนวนงาน, ปีประสบการณ์'),
            para(''),
            imgParagraph('qa_experience_tab_1773015524373.png'),
            caption('รูปที่ 8: Experience — ประสบการณ์ทำงาน'),

            new Paragraph({ children: [new PageBreak()] }),

            // ══════════════════════════════════════
            // 10. Logbook Tab
            // ══════════════════════════════════════
            heading('10. Logbook — สมุดบันทึกการซ่อมบำรุง'),
            para('แท็บบันทึกงานซ่อมบำรุงของพนักงาน ประกอบด้วย 2 ส่วน'),
            para(''),
            para('ส่วนที่ 1: รอบันทึกข้อมูล (Pending Entries)', { bold: true }),
            bullet('แสดงรายการ Logbook ที่ยังไม่ได้กรอกข้อมูล'),
            bullet('แสดง Date, Type of Maintenance, Aircraft Type, Location'),
            bullet('ปุ่ม "Fill Form" เปื่อเปิด Modal กรอกข้อมูล'),
            para(''),
            para('ส่วนที่ 2: ประวัติ Logbook (Completed Entries)', { bold: true }),
            bullet('ตาราง Logbook ที่กรอกข้อมูลแล้ว'),
            bullet('Compact/Expanded view toggle'),
            bullet('แสดงรายละเอียดงาน, ระยะเวลา, สถานะ'),
            para(''),
            imgParagraph('qa_logbook_tab_1773015560406.png'),
            caption('รูปที่ 9: Logbook — สมุดบันทึกการซ่อมบำรุง'),

            new Paragraph({ children: [new PageBreak()] }),

            // ══════════════════════════════════════
            // 11. Logbook Form Modal
            // ══════════════════════════════════════
            heading('11. Logbook Form Modal — ฟอร์มบันทึกข้อมูล'),
            para('Modal Multi-step Form สำหรับบันทึกข้อมูล Logbook เปิดจากปุ่ม "Fill Form"'),
            para(''),
            para('ขั้นตอนการกรอก (5 Steps):', { bold: true }),
            bullet('Step 1: ข้อมูลงาน — รายละเอียดงานซ่อมบำรุง, วันที่, ประเภท'),
            bullet('Step 2: Aircraft — ข้อมูลอากาศยาน, ทะเบียน, ตำแหน่ง'),
            bullet('Step 3: รายละเอียดงาน — รายการงานที่ดำเนินการ, เครื่องมือ, อะไหล่'),
            bullet('Step 4: Review — ตรวจสอบข้อมูลทั้งหมดก่อนบันทึก'),
            bullet('Step 5: แนบไฟล์ — อัพโหลดเอกสาร/รูปภาพ'),
            para(''),
            para('UI Features:', { bold: true }),
            bullet('Progress Bar — แสดงความคืบหน้าขั้นตอน'),
            bullet('Stepper Navigation — เดินหน้า/ย้อนกลับ'),
            bullet('Form Validation — ตรวจสอบข้อมูลก่อนบันทึก'),
            bullet('Success Screen — แสดงผลสำเร็จหลังบันทึก'),
            para(''),
            imgParagraph('qa_logbook_form_modal_1773015601566.png'),
            caption('รูปที่ 10: Logbook Form Modal — ฟอร์มบันทึกข้อมูล Multi-step'),

            new Paragraph({ children: [new PageBreak()] }),

            // ══════════════════════════════════════
            // 12. User Flow Diagram
            // ══════════════════════════════════════
            heading('12. User Flow — สรุปการไหลของกระบวนการ'),
            para(''),
            para('Flow 1: Training Management', { bold: true, color: '1a56db' }),
            para('QA Menu → Training & Compliance Dashboard → [ตรวจ Conflict / Training Plan / สร้าง Certificate]'),
            para('→ Training Plan → [ดูรายการ / Filter / Search / + Create Plan]'),
            para('→ Create Plan Modal → [กรอกข้อมูล → เลือกคอร์ส → Save Draft / Create] → Success'),
            para(''),
            para('Flow 2: Staff Management', { bold: true, color: '1a56db' }),
            para('QA Menu → Staff List → [ค้นหา / Import / + New Staff]'),
            para('→ คลิกชื่อพนักงาน → Staff Profile'),
            para('→ [Profile Tab / Training Matrix Tab / Experience Tab / Logbook Tab]'),
            para(''),
            para('Flow 3: Logbook Recording', { bold: true, color: '1a56db' }),
            para('Staff Profile → Logbook Tab → Pending Entries → คลิก "Fill Form"'),
            para('→ Logbook Form Modal → Step 1 (ข้อมูลงาน) → Step 2 (Aircraft)'),
            para('→ Step 3 (รายละเอียด) → Step 4 (Review) → Step 5 (แนบไฟล์) → Submit → Success'),
            para(''),
            separator(),
            para(''),
            para('จัดทำโดย: QA Department — SAMs Airline Maintenance System', { color: '64748b', italics: true }),
            para(`เอกสารฉบับที่ 1.0 — ${new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}`, { color: '94a3b8', italics: true }),
        ]
    }]
});

Packer.toBuffer(doc).then(buf => {
    fs.writeFileSync(OUTPUT, buf);
    console.log('✅ DOCX created:', OUTPUT);
    console.log('Size:', (buf.length / 1024).toFixed(1), 'KB');
}).catch(e => { console.error('Error:', e.message); });
