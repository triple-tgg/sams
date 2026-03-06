const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, TableCell, TableRow, Table, WidthType, ShadingType, PageBreak, TabStopPosition, TabStopType, Header, Footer, PageNumber, NumberFormat } = require("docx");
const fs = require("fs");

// ─── Helpers ──────────────────────────────────────────
function title(text) {
    return new Paragraph({
        children: [new TextRun({ text, bold: true, size: 56, font: "TH Sarabun New", color: "1a3c6e" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
    });
}
function h1(text) {
    return new Paragraph({
        children: [new TextRun({ text, bold: true, size: 36, font: "TH Sarabun New", color: "1a3c6e" })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "1a3c6e" } },
    });
}
function h2(text) {
    return new Paragraph({
        children: [new TextRun({ text, bold: true, size: 32, font: "TH Sarabun New", color: "2563eb" })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
    });
}
function h3(text) {
    return new Paragraph({
        children: [new TextRun({ text, bold: true, size: 28, font: "TH Sarabun New", color: "333333" })],
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 },
    });
}
function p(text, opts = {}) {
    return new Paragraph({
        children: [new TextRun({ text, size: 24, font: "TH Sarabun New", ...opts })],
        spacing: { after: 100 },
    });
}
function bullet(text) {
    return new Paragraph({
        children: [new TextRun({ text, size: 24, font: "TH Sarabun New" })],
        bullet: { level: 0 },
        spacing: { after: 60 },
    });
}
function numberedItem(text) {
    return new Paragraph({
        children: [new TextRun({ text, size: 24, font: "TH Sarabun New" })],
        numbering: { reference: "main-numbering", level: 0 },
        spacing: { after: 60 },
    });
}
function screenshotPlaceholder(label) {
    // Creates a visible bordered box with text indicating where a screenshot goes
    const row = new TableRow({
        children: [
            new TableCell({
                children: [
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 100 }, children: [new TextRun({ text: "📷", size: 48 })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: `[ Screenshot: ${label} ]`, size: 24, font: "TH Sarabun New", color: "999999", italics: true })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [new TextRun({ text: "แทรกรูปภาพหน้าจอที่นี่", size: 20, font: "TH Sarabun New", color: "bbbbbb" })] }),
                ],
                borders: {
                    top: { style: BorderStyle.DASHED, size: 2, color: "aaaaaa" },
                    bottom: { style: BorderStyle.DASHED, size: 2, color: "aaaaaa" },
                    left: { style: BorderStyle.DASHED, size: 2, color: "aaaaaa" },
                    right: { style: BorderStyle.DASHED, size: 2, color: "aaaaaa" },
                },
                shading: { type: ShadingType.SOLID, color: "f8f9fa" },
                width: { size: 100, type: WidthType.PERCENTAGE },
            }),
        ],
    });
    return new Table({ rows: [row], width: { size: 100, type: WidthType.PERCENTAGE } });
}

function makeTableRow(cells, isHeader = false) {
    return new TableRow({
        children: cells.map(text =>
            new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text, size: 22, font: "TH Sarabun New", bold: isHeader })], spacing: { before: 40, after: 40 } })],
                shading: isHeader ? { type: ShadingType.SOLID, color: "e8eef7" } : undefined,
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
                    left: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
                    right: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
                },
            })
        ),
    });
}
function makeTable(headers, rows) {
    return new Table({
        rows: [makeTableRow(headers, true), ...rows.map(r => makeTableRow(r))],
        width: { size: 100, type: WidthType.PERCENTAGE },
    });
}
function spacer() {
    return new Paragraph({ spacing: { after: 100 }, children: [] });
}
function pageBreak() {
    return new Paragraph({ children: [new PageBreak()] });
}
function note(text) {
    return new Paragraph({
        children: [new TextRun({ text: "⚠️ หมายเหตุ: ", bold: true, size: 22, font: "TH Sarabun New", color: "d97706" }), new TextRun({ text, size: 22, font: "TH Sarabun New", color: "d97706" })],
        spacing: { after: 100 },
    });
}
function tip(text) {
    return new Paragraph({
        children: [new TextRun({ text: "💡 เคล็ดลับ: ", bold: true, size: 22, font: "TH Sarabun New", color: "059669" }), new TextRun({ text, size: 22, font: "TH Sarabun New", color: "059669" })],
        spacing: { after: 100 },
    });
}

// ─── Build Document ──────────────────────────────────
const doc = new Document({
    numbering: {
        config: [{ reference: "main-numbering", levels: [{ level: 0, format: NumberFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT }] }],
    },
    sections: [{
        properties: {
            page: { margin: { top: 1200, bottom: 1200, left: 1200, right: 1200 } },
        },
        headers: {
            default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "SAM Airline Maintenance — User Manual", size: 16, font: "TH Sarabun New", color: "999999", italics: true })] })] }),
        },
        footers: {
            default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "© 2026 Triple-T — SAM Airline Maintenance System  |  หน้า ", size: 16, font: "TH Sarabun New", color: "999999" }), new TextRun({ children: [PageNumber.CURRENT], size: 16, font: "TH Sarabun New", color: "999999" })] })] }),
        },
        children: [
            // ── COVER ──
            spacer(), spacer(), spacer(), spacer(), spacer(),
            title("📘 คู่มือการใช้งานระบบ"),
            title("SAM Airline Maintenance"),
            spacer(),
            p("User Manual — SAMS Airline Maintenance System", { size: 28, color: "666666", italics: true }),
            spacer(), spacer(),
            p("เวอร์ชัน: 1.0", { size: 24 }),
            p("วันที่จัดทำ: 22 กุมภาพันธ์ 2026", { size: 24 }),
            p("จัดทำโดย: ทีมพัฒนา Triple-T", { size: 24 }),
            p("ระบบ: SAM Maintenance — ระบบเว็บแอปพลิเคชันบันทึกข้อมูลการบำรุงรักษาอากาศยาน", { size: 24 }),
            pageBreak(),

            // ── TABLE OF CONTENTS (manual) ──
            h1("สารบัญ"),
            p("1. ภาพรวมของระบบ"),
            p("2. ข้อกำหนดเบื้องต้น"),
            p("3. การเข้าสู่ระบบ (Login)"),
            p("4. หน้า Dashboard"),
            p("5. เมนูหลักและการนำทาง"),
            p("6. โมดูล Flight List (รายการเที่ยวบิน)"),
            p("7. โมดูล THF Form (Technical Handling Form)"),
            p("8. โมดูล Contract (สัญญา)"),
            p("9. โมดูล Invoice (ใบแจ้งหนี้)"),
            p("10. โมดูล Report (รายงาน)"),
            p("11. โมดูล Master Data (ข้อมูลหลัก)"),
            p("12. การออกจากระบบ (Logout)"),
            p("13. คำถามที่พบบ่อย (FAQ)"),
            pageBreak(),

            // ── 1. OVERVIEW ──
            h1("1. ภาพรวมของระบบ"),
            p("SAM Airline Maintenance (SAMS) เป็นระบบเว็บแอปพลิเคชันสำหรับบันทึก ติดตาม และจัดการข้อมูลการบำรุงรักษาอากาศยาน (Line Maintenance) ออกแบบมาเพื่อใช้งานภายในสนามบิน"),
            spacer(),
            makeTable(
                ["โมดูล", "คำอธิบาย"],
                [
                    ["Dashboard", "แสดงภาพรวมสถิติการทำงาน กราฟ และข้อมูลสรุป"],
                    ["Flight List", "จัดการรายการเที่ยวบินทั้งหมด สร้าง/แก้ไข/ค้นหา"],
                    ["THF Form", "แบบฟอร์ม Technical Handling Form สำหรับบันทึกการบำรุงรักษา (5 ขั้นตอน)"],
                    ["Contract", "จัดการสัญญาบริการ"],
                    ["Invoice", "จัดการใบแจ้งหนี้"],
                    ["Report", "สร้างรายงานต่างๆ"],
                    ["Master Data", "จัดการข้อมูลพื้นฐาน (สายการบิน, พนักงาน, สถานี, บัญชีผู้ใช้, บทบาท, สิทธิ์)"],
                ]
            ),
            pageBreak(),

            // ── 2. REQUIREMENTS ──
            h1("2. ข้อกำหนดเบื้องต้น"),
            makeTable(
                ["รายการ", "ข้อกำหนด"],
                [
                    ["Web Browser", "Google Chrome (แนะนำ), Microsoft Edge, หรือ Firefox เวอร์ชันล่าสุด"],
                    ["ความละเอียดหน้าจอ", "แนะนำ 1366×768 ขึ้นไป (Responsive)"],
                    ["อินเทอร์เน็ต", "ต้องมีการเชื่อมต่ออินเทอร์เน็ต"],
                    ["บัญชีผู้ใช้", "ต้องมี Email และ Password ที่ได้รับจากผู้ดูแลระบบ"],
                ]
            ),
            pageBreak(),

            // ── 3. LOGIN ──
            h1("3. การเข้าสู่ระบบ (Login)"),
            screenshotPlaceholder("หน้า Login Page"),
            spacer(),
            h3("คำอธิบายหน้าจอ"),
            bullet("โลโก้ระบบ — แสดงอยู่ตรงกลางด้านบนของฟอร์ม"),
            bullet("ข้อความ \"Sign in to your account to start using\""),
            bullet("ฟอร์มเข้าสู่ระบบ — อยู่ภายในกรอบสีขาวพร้อมเงา"),
            spacer(),
            h3("ขั้นตอนการเข้าสู่ระบบ"),
            numberedItem("เปิด Web Browser แล้วเข้าไปที่ URL ของระบบ"),
            numberedItem("ระบบจะแสดงหน้า Login โดยอัตโนมัติ"),
            numberedItem("กรอก Email ที่ลงทะเบียนไว้ในระบบ"),
            numberedItem("กรอก Password (อย่างน้อย 4 ตัวอักษร)"),
            numberedItem("คลิกปุ่ม \"Sign In\" (ปุ่มสีน้ำเงิน)"),
            numberedItem("รอระบบตรวจสอบข้อมูล — จะแสดงสถานะ \"Loading...\""),
            numberedItem("เมื่อเข้าสู่ระบบสำเร็จ จะเปลี่ยนหน้าไปยัง Dashboard โดยอัตโนมัติ"),
            spacer(),
            tip("คลิกไอคอน 👁 ข้างช่องรหัสผ่านเพื่อแสดง/ซ่อนรหัสผ่าน"),
            note("หากกรอกข้อมูลไม่ถูกต้อง ระบบจะแสดงข้อความแจ้งเตือนสีแดงใต้ช่องที่ผิดพลาด"),
            pageBreak(),

            // ── 4. DASHBOARD ──
            h1("4. หน้า Dashboard"),
            screenshotPlaceholder("หน้า Dashboard"),
            spacer(),
            h3("ส่วนประกอบหลัก"),
            makeTable(
                ["ส่วน", "คำอธิบาย"],
                [
                    ["Welcome Card", "แสดงข้อความ \"SAMS Airline Maintenance — Analytical Flight Plan\""],
                    ["Statistics Cards", "แสดงสถิติ 3 การ์ด: Revenue, Total Services, Growth"],
                    ["Revenue Bar Chart", "กราฟแท่งแสดงรายรับตามช่วงเวลา"],
                    ["Overview Chart", "กราฟวงกลมแสดงภาพรวมสัดส่วน"],
                    ["Company Table", "ตารางแสดงข้อมูลบริษัท"],
                    ["Recent Activity", "แสดงกิจกรรมล่าสุดในระบบ"],
                ]
            ),
            pageBreak(),

            // ── 5. NAVIGATION ──
            h1("5. เมนูหลักและการนำทาง"),
            screenshotPlaceholder("Sidebar Navigation"),
            spacer(),
            h3("กลุ่ม Aircraft Maintenance"),
            makeTable(
                ["เมนู", "เส้นทาง", "คำอธิบาย"],
                [
                    ["Dashboard", "/dashboard", "หน้าแสดงภาพรวม"],
                    ["Flight List", "/flight", "จัดการรายการเที่ยวบิน"],
                    ["Contract", "/contract", "จัดการสัญญาบริการ"],
                    ["Invoice", "/invoice", "จัดการใบแจ้งหนี้"],
                    ["Report", "/report", "สร้างรายงาน"],
                ]
            ),
            spacer(),
            h3("กลุ่ม Setting — Master Data"),
            makeTable(
                ["เมนูย่อย", "เส้นทาง"],
                [
                    ["Customer Airline", "/master-data/customer-airline"],
                    ["Staff", "/master-data/staff"],
                    ["Station", "/master-data/station"],
                    ["User Login", "/master-data/user-login"],
                    ["Role", "/master-data/role"],
                    ["Set Permission", "/master-data/set-permission"],
                ]
            ),
            spacer(),
            tip("คลิกที่ Master Data เพื่อแสดง/ซ่อนเมนูย่อย และสามารถย่อ/ขยาย Sidebar ได้"),
            pageBreak(),

            // ── 6. FLIGHT LIST ──
            h1("6. โมดูล Flight List (รายการเที่ยวบิน)"),
            h2("6.1 การดูรายการเที่ยวบิน"),
            screenshotPlaceholder("หน้า Flight List"),
            spacer(),
            h3("คอลัมน์ในตาราง"),
            makeTable(
                ["คอลัมน์", "คำอธิบาย"],
                [
                    ["Flight No", "หมายเลขเที่ยวบิน"],
                    ["Airline", "สายการบิน"],
                    ["Station", "สถานี"],
                    ["AC Reg", "ทะเบียนอากาศยาน"],
                    ["AC Type", "ประเภทอากาศยาน"],
                    ["Arrival Date", "วันที่มาถึง"],
                    ["STA", "เวลามาถึงที่กำหนด"],
                    ["Status", "สถานะเที่ยวบิน"],
                    ["Actions", "ปุ่มดำเนินการ (แก้ไข/ดู THF)"],
                ]
            ),
            spacer(),
            h2("6.2 การค้นหาและกรองข้อมูล"),
            makeTable(
                ["ฟิลด์", "ประเภท", "คำอธิบาย"],
                [
                    ["Flight No", "Text Input", "ค้นหาตามหมายเลขเที่ยวบิน"],
                    ["Station", "Dropdown", "กรองตามสถานี"],
                    ["Airline", "Dropdown", "กรองตามสายการบิน"],
                    ["Date Start", "Date Picker", "วันเริ่มต้น (ค่าเริ่มต้น: วันนี้)"],
                    ["Date End", "Date Picker", "วันสิ้นสุด (ค่าเริ่มต้น: วันนี้)"],
                ]
            ),
            spacer(),
            h2("6.3 การสร้างเที่ยวบินใหม่ (Create Flight)"),
            screenshotPlaceholder("Create Flight Dialog"),
            spacer(),
            numberedItem("คลิกปุ่ม \"+ Add Flight\" ที่ด้านขวาบน"),
            numberedItem("กรอก Customer/Airlines, Station, A/C Type (จำเป็น)"),
            numberedItem("กรอกข้อมูล Arrival: Flight No, Date (DD/MM/YYYY), STA (HH:mm)"),
            numberedItem("กรอกข้อมูล Departure (ถ้ามี): Flight No, Date, STD"),
            numberedItem("กรอก Bay, Status, Note, Personnel (CS / Mechanic)"),
            numberedItem("คลิก \"Create\" เพื่อบันทึก"),
            spacer(),
            note("หากกรอก Departure บางฟิลด์ จะต้องกรอก Date และ STD ให้ครบ"),
            spacer(),
            h2("6.4 การแก้ไขเที่ยวบิน (Edit Flight)"),
            screenshotPlaceholder("Edit Flight Dialog"),
            spacer(),
            numberedItem("คลิกปุ่ม \"Edit\" ที่คอลัมน์ Actions"),
            numberedItem("ยืนยันตัวตนในหน้าต่าง Confirm — กรอกชื่อผู้แก้ไข"),
            numberedItem("คลิก \"Confirm\" เพื่อเปิดฟอร์มแก้ไข"),
            numberedItem("แก้ไขข้อมูลตามต้องการ"),
            numberedItem("คลิก \"Update\" เพื่อบันทึก"),
            pageBreak(),

            // ── 7. THF FORM ──
            h1("7. โมดูล THF Form (Technical Handling Form)"),
            p("THF (Technical Handling Form) คือแบบฟอร์มหลักที่ใช้บันทึกรายละเอียดการบำรุงรักษาอากาศยาน ประกอบด้วย 5 ขั้นตอน:"),
            p("① Flight → ② Services → ③ Equipment → ④ Parts & Tools → ⑤ Attach File", { bold: true, color: "2563eb" }),
            spacer(),
            screenshotPlaceholder("THF Stepper Header"),
            spacer(),
            tip("สามารถคลิกที่หมายเลขขั้นตอนเพื่อข้ามไปยังขั้นตอนนั้นๆ ได้"),
            spacer(),
            h2("7.1 Step 1: Flight (ข้อมูลเที่ยวบิน)"),
            screenshotPlaceholder("THF Step 1 — Flight"),
            spacer(),
            p("แสดงและแก้ไขข้อมูลพื้นฐานของเที่ยวบิน: สายการบิน, สถานี, ทะเบียนอากาศยาน, ข้อมูล Arrival/Departure, เส้นทาง, บุคลากร"),
            spacer(),
            h2("7.2 Step 2: Services (บริการ)"),
            screenshotPlaceholder("THF Step 2 — Services"),
            spacer(),
            makeTable(
                ["หมวดหมู่", "รายละเอียด"],
                [
                    ["Fluid Services", "บันทึก Engine Oil, น้ำมันไฮดรอลิก, สารเติม"],
                    ["Engine Oil", "เลือก Left/Right Engine + กรอกปริมาณ"],
                    ["General Services", "บริการทั่วไป เช่น ทำความสะอาด, ตรวจสอบ"],
                    ["Aircraft Towing", "ข้อมูลลากจูงอากาศยาน — On Time / Off Time"],
                ]
            ),
            spacer(),
            h2("7.3 Step 3: Equipment (อุปกรณ์)"),
            screenshotPlaceholder("THF Step 3 — Equipment"),
            spacer(),
            p("บันทึกอุปกรณ์ที่ใช้: ชื่อ, หมายเลข, จำนวน, สถานะ, หมายเหตุ"),
            spacer(),
            h2("7.4 Step 4: Parts & Tools (อะไหล่และเครื่องมือ)"),
            screenshotPlaceholder("THF Step 4 — Parts & Tools"),
            spacer(),
            p("บันทึกอะไหล่/เครื่องมือ: เลือกชื่อจาก Dropdown, Part Number, จำนวน, หน่วย"),
            spacer(),
            h2("7.5 Step 5: Attach File (แนบไฟล์)"),
            screenshotPlaceholder("THF Step 5 — Attach File"),
            spacer(),
            p("อัปโหลดไฟล์เอกสาร: รองรับ JPG, PNG, PDF — ลากไฟล์มาวาง หรือคลิกปุ่มอัปโหลด"),
            pageBreak(),

            // ── 8. CONTRACT ──
            h1("8. โมดูล Contract (สัญญา)"),
            screenshotPlaceholder("หน้า Contract"),
            spacer(),
            p("จัดการสัญญาบริการระหว่างบริษัทและสายการบิน"),
            bullet("สร้างสัญญาใหม่: คลิก \"+ Add New\" → กรอกข้อมูล → \"Save\""),
            bullet("ดูรายละเอียด: คลิก \"View\" ที่คอลัมน์ Actions"),
            bullet("แก้ไข: คลิก \"Edit\" → แก้ไข → \"Save\""),
            bullet("ลบ: คลิก \"Delete\" → กรอกชื่อยืนยัน → \"Confirm\""),
            bullet("กรองตามสถานะ: ใช้ Status Tabs ด้านบน"),
            pageBreak(),

            // ── 9. INVOICE ──
            h1("9. โมดูล Invoice (ใบแจ้งหนี้)"),
            screenshotPlaceholder("หน้า Invoice"),
            spacer(),
            p("จัดการใบแจ้งหนี้ 2 ประเภท:"),
            makeTable(
                ["ประเภท", "คำอธิบาย"],
                [
                    ["Pre-Invoice", "ใบแจ้งหนี้เบื้องต้น"],
                    ["Draft Invoice", "ใบแจ้งหนี้ฉบับร่าง"],
                ]
            ),
            spacer(),
            bullet("สลับประเภท: คลิกแท็บ Pre-Invoice / Draft Invoice"),
            bullet("พิมพ์: คลิก Print → ระบบสร้างเอกสาร A4 → Ctrl+P"),
            pageBreak(),

            // ── 10. REPORT ──
            h1("10. โมดูล Report (รายงาน)"),
            screenshotPlaceholder("หน้า Report"),
            spacer(),
            h3("ตัวกรองรายงาน"),
            bullet("Date Start / Date End: เลือกช่วงวันที่"),
            bullet("Airline: เลือกสายการบิน หรือ All Airlines"),
            spacer(),
            h3("ประเภทรายงาน"),
            makeTable(
                ["#", "ชื่อรายงาน", "คำอธิบาย", "ไฟล์"],
                [
                    ["1", "Equipment", "รายงานอุปกรณ์", "PDF/Excel"],
                    ["2", "Parts & Tools", "รายงานอะไหล่และเครื่องมือ", "PDF/Excel"],
                    ["3", "THF Document", "รายงานเอกสาร THF", "PDF"],
                    ["4", "THF Document V.2", "รายงาน THF พร้อมคำนวณ", "PDF"],
                    ["5", "THF Document File", "ไฟล์เอกสาร THF", "ZIP"],
                ]
            ),
            spacer(),
            note("หากช่วงวันที่ไม่ถูกต้อง (End ก่อน Start) ระบบจะไม่อนุญาตให้สร้างรายงาน"),
            pageBreak(),

            // ── 11. MASTER DATA ──
            h1("11. โมดูล Master Data (ข้อมูลหลัก)"),
            p("จัดการข้อมูลพื้นฐานของระบบ เข้าถึงจากเมนู Setting → Master Data"),
            spacer(),
            h2("11.1 Customer Airline (สายการบิน)"),
            screenshotPlaceholder("Master Data — Customer Airline"),
            spacer(),
            bullet("เพิ่ม: คลิก \"+ Add\" → กรอก Code, Name → \"Save\""),
            bullet("แก้ไข: คลิก \"Edit\" → แก้ไข → \"Save\""),
            bullet("ลบ: คลิก \"Delete\" → ยืนยัน"),
            spacer(),
            h2("11.2 Staff (พนักงาน)"),
            screenshotPlaceholder("Master Data — Staff"),
            spacer(),
            p("จัดการพนักงาน CS (Customer Service) และ Mechanic (ช่างซ่อมบำรุง)"),
            spacer(),
            h2("11.3 Station (สถานี)"),
            screenshotPlaceholder("Master Data — Station"),
            spacer(),
            p("จัดการสถานี/สนามบิน เช่น BKK, DMK, CNX"),
            spacer(),
            h2("11.4 User Login (บัญชีผู้ใช้)"),
            screenshotPlaceholder("Master Data — User Login"),
            spacer(),
            p("จัดการบัญชีผู้ใช้ — Email, Password, Full Name, Role"),
            spacer(),
            h2("11.5 Role (บทบาท)"),
            screenshotPlaceholder("Master Data — Role"),
            spacer(),
            p("จัดการบทบาท เช่น Admin, User, Viewer"),
            spacer(),
            h2("11.6 Set Permission (กำหนดสิทธิ์)"),
            screenshotPlaceholder("Master Data — Set Permission"),
            spacer(),
            p("กำหนดสิทธิ์การเข้าถึงเมนูและฟังก์ชันตาม Role"),
            pageBreak(),

            // ── 12. LOGOUT ──
            h1("12. การออกจากระบบ (Logout)"),
            numberedItem("คลิกที่ชื่อผู้ใช้ หรือไอคอนผู้ใช้ที่มุมขวาบนของ Header"),
            numberedItem("คลิก \"Logout\""),
            numberedItem("ระบบจะล้าง Session, Redux State, localStorage Token"),
            numberedItem("เปลี่ยนหน้าไปยังหน้า Login โดยอัตโนมัติ"),
            spacer(),
            note("หากปิด Browser โดยไม่ Logout ระบบจะจดจำสถานะ Login (Auto Restore)"),
            pageBreak(),

            // ── 13. FAQ ──
            h1("13. คำถามที่พบบ่อย (FAQ)"),
            h3("❓ ลืมรหัสผ่าน ทำอย่างไร?"),
            p("ติดต่อผู้ดูแลระบบ (Admin) เพื่อรีเซ็ตรหัสผ่าน"),
            spacer(),
            h3("❓ ข้อมูลจากหน้าจอไม่แสดง / แสดงช้า"),
            bullet("ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต"),
            bullet("ลอง Refresh (F5 หรือ Ctrl+R)"),
            bullet("หากยังมีปัญหา ติดต่อทีมเทคนิค"),
            spacer(),
            h3("❓ เห็นข้อความ \"Using offline data\""),
            p("ระบบใช้ข้อมูลสำรอง เนื่องจากเชื่อมต่อ API ไม่ได้ — ลองรอแล้ว Refresh"),
            spacer(),
            h3("❓ เปิด Flight List แล้วไม่มีข้อมูล"),
            bullet("ตรวจสอบช่วงวันที่ (Date Range) — ค่าเริ่มต้นคือวันนี้"),
            bullet("ลองขยายช่วงวันที่ให้กว้างขึ้น"),
            spacer(),
            h3("❓ กรอกข้อมูลในฟอร์มแล้วมีขอบแดง"),
            bullet("วันที่: ต้องเป็น DD/MM/YYYY"),
            bullet("เวลา: ต้องเป็น HH:mm"),
            bullet("ฟิลด์ Required ต้องกรอกข้อมูล"),
            spacer(),
            h3("❓ ไม่สามารถแก้ไขเที่ยวบินได้"),
            p("ต้องยืนยันตัวตน (Confirm) ก่อน — กรอกชื่อผู้แก้ไข → คลิก Confirm"),
            spacer(),

            // ── END ──
            spacer(), spacer(),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "— จบเอกสาร —", size: 24, font: "TH Sarabun New", color: "999999", italics: true })],
            }),
        ],
    }],
});

// ─── Generate ──────────────────────────────────────────
Packer.toBuffer(doc).then(buf => {
    const outPath = __dirname + "/SAM_Airline_Maintenance_User_Manual.docx";
    fs.writeFileSync(outPath, buf);
    console.log("✅ User Manual created: " + outPath);
}).catch(err => {
    console.error("❌ Error:", err);
});
