const fs = require('fs');

const testCases = [
  ["TC-TRN-001", "REQ-TRN-01", "สร้าง Training Schedule ใหม่โดยกรอกข้อมูลครบถ้วน (Positive)", "Login ด้วย Role QA Manager หรือ HR", "1. ไปที่เมนู QA > Training Scheduler\n2. คลิกปุ่ม Create New Session\n3. เลือก Course, Instructor, วันเวลา\n4. ระบุ Enrollment Capacity\n5. คลิก Save", "Course = Human Factors, Capacity = 20", "ระบบบันทึกข้อมูลสำเร็จ สถานะเริ่มต้นเป็น Draft", "", "", ""],
  ["TC-TRN-002", "REQ-TRN-01", "สร้าง Training Schedule โดยไม่กรอกข้อมูลบังคับ (Negative)", "Login ด้วย Role QA Manager หรือ HR", "1. คลิก Create New Session\n2. ปล่อยว่างฟิลด์ Course Name และ Capacity\n3. คลิก Save", "ข้อมูลว่างเปล่า", "ระบบแสดง Error Message แจ้งให้กรอกข้อมูลบังคับ (Required Field)", "", "", ""],
  ["TC-TRN-003", "REQ-TRN-02", "แก้ไขข้อมูล Training Schedule ที่อยู่ในสถานะ Draft", "มี Session ที่อยู่ในสถานะ Draft", "1. เลือก Session สถานะ Draft\n2. กดปุ่ม Edit\n3. เปลี่ยนเวลา Date/Time\n4. คลิก Save", "เปลี่ยนเวลาเป็น 09:00 - 16:00", "ข้อมูลถูกอัพเดทเรียบร้อย", "", "", ""],
  ["TC-TRN-004", "REQ-TRN-02", "การเปลี่ยนสถานะจาก Draft เป็น Open Registration", "มี Session ที่อยู่ในสถานะ Draft", "1. เข้าไปที่หน้า Detail ของ Session\n2. เปลี่ยน Status Dropdown เป็น Open Registration", "สถานะปัจจุบัน = Draft", "สถานะเปลี่ยนเป็น Open Registration สำเร็จ และสามารถเริ่ม Add Staff ได้", "", "", ""],
  ["TC-TRN-005", "REQ-TRN-03", "ค้นหาและเพิ่ม Staff เข้าสู่ Training Session (Enrollment)", "Session สถานะ Open Registration", "1. ในตาราง Enrolled Staff คลิกปุ่ม Add Staff\n2. ค้นหาชื่อพนักงานที่ต้องการ\n3. เลือกและกด Enroll", "ค้นหาด้วยชื่อ 'Prakarn'", "พนักงานถูกเพิ่มเข้าในตาราง Enrolled Staff สถานะเป็น Enrolled", "", "", ""],
  ["TC-TRN-006", "REQ-TRN-03", "เพิ่ม Staff เกิน Enrollment Capacity (Boundary)", "Session มี Capacity 1/1 (เต็มแล้ว)", "1. คลิกปุ่ม Add Staff\n2. พยายาม Enroll พนักงานคนที่ 2", "เลือกพนักงานใหม่", "ระบบแจ้งเตือน 'Capacity Full' และไม่อนุญาตให้ Enroll เพิ่ม", "", "", ""],
  ["TC-TRN-007", "REQ-TRN-04", "ส่ง Email Invitation ให้กับพนักงาน", "มีพนักงานที่ถูก Enrolled แล้ว 1 คน", "1. ในคอลัมน์ Action คลิกปุ่มรูปซองจดหมาย (Send Email)\n2. กด Confirm ใน Popup", "Staff Email = test@sams.aero", "ระบบแสดง Toast แจ้งเตือนส่งสำเร็จ สถานะการส่งเปลี่ยนเป็น Invitation Sent", "", "", ""],
  ["TC-TRN-008", "REQ-TRN-03", "ลบ Staff ออกจาก Session (Unenroll)", "มีพนักงานที่ถูก Enrolled สถานะ Pending", "1. ในคอลัมน์ Action คลิกปุ่มรูปถังขยะ\n2. กดยืนยัน Remove", "พนักงาน 1 คน", "พนักงานถูกลบออกจากตาราง Enrolled Staff", "", "", ""],
  ["TC-TRN-009", "REQ-TRN-02", "การเปลี่ยนสถานะเป็น Registration Closed", "Session สถานะ Open Registration", "1. เปลี่ยน Status Dropdown เป็น Registration Closed", "-", "สถานะเปลี่ยนสำเร็จ ปุ่ม Add Staff หายไปหรือไม่สามารถ Enroll เพิ่มได้", "", "", ""],
  ["TC-TRN-010", "REQ-TRN-05", "Export Manager Report", "Session มีพนักงานลงทะเบียนแล้ว", "1. คลิกปุ่ม Managers Report\n2. ตรวจสอบข้อมูลในเอกสาร", "ข้อมูลการฝึกอบรม", "ระบบดาวน์โหลดไฟล์ Manager Report หรือแสดง Preview ที่มีรายชื่อถูกต้อง", "", "", ""],
  ["TC-TRN-011", "REQ-TRN-02", "การเปลี่ยนสถานะเป็น In Progress", "Session สถานะ Registration Closed", "1. เปลี่ยน Status Dropdown เป็น In Progress", "-", "สถานะเปลี่ยนสำเร็จ", "", "", ""],
  ["TC-TRN-012", "REQ-TRN-08", "พิมพ์ใบ Attendance (ใบเช็คชื่อ)", "Session สถานะ In Progress", "1. คลิกปุ่ม Print Attendance (รูปเครื่องพิมพ์)\n2. ตรวจสอบข้อมูล", "-", "แสดงหน้า Preview ใบเช็คชื่อ รายชื่อครบถ้วน", "", "", ""],
  ["TC-TRN-013", "REQ-TRN-02", "การเปลี่ยนสถานะเป็น Grading", "Session สถานะ In Progress", "1. เปลี่ยน Status Dropdown เป็น Grading", "-", "สถานะเปลี่ยนสำเร็จ คอลัมน์ Result แสดงปุ่ม Pass/Fail", "", "", ""],
  ["TC-TRN-014", "REQ-TRN-06", "การให้คะแนน (Grading) พนักงาน - Pass", "Session สถานะ Grading", "1. ในคอลัมน์ Result คลิกปุ่ม 'Pass' ให้พนักงาน", "พนักงานลำดับที่ 1", "ปุ่มหายไป กลายเป็น Badge สีเขียวแสดงคำว่า 'Pass'", "", "", ""],
  ["TC-TRN-015", "REQ-TRN-06", "การให้คะแนน (Grading) พนักงาน - Fail", "Session สถานะ Grading", "1. ในคอลัมน์ Result คลิกปุ่ม 'Fail' ให้พนักงาน", "พนักงานลำดับที่ 2", "ปุ่มหายไป กลายเป็น Badge สีแดงแสดงคำว่า 'Fail'", "", "", ""],
  ["TC-TRN-016", "REQ-TRN-06", "ห้ามเปลี่ยนเป็น Completed ถ้าให้คะแนนไม่ครบ (Boundary/Negative)", "Session สถานะ Grading, ยังมีคน Result = Pending", "1. เปลี่ยน Status Dropdown เป็น Completed", "-", "ระบบแจ้งเตือนว่าต้อง Grading ให้ครบทุกคนก่อน", "", "", ""],
  ["TC-TRN-017", "REQ-TRN-02", "เปลี่ยนสถานะเป็น Completed เมื่อ Grading ครบ", "Session สถานะ Grading, ทุกคนมีเกรด Pass/Fail แล้ว", "1. เปลี่ยน Status Dropdown เป็น Completed", "-", "สถานะเปลี่ยนสำเร็จ", "", "", ""],
  ["TC-TRN-018", "REQ-TRN-08", "อัพโหลด Training Evidence", "Session สถานะ Completed", "1. ไปที่ส่วน Attached Evidence\n2. แนบไฟล์ภาพ/PDF แล้วกด Save", "ไฟล์ .pdf", "ไฟล์ถูกแสดงในรายการ Evidence", "", "", ""],
  ["TC-TRN-019", "REQ-TRN-07", "ออก Certificate ให้พนักงานที่สอบผ่าน (Positive)", "Session สถานะ Completed", "1. คลิกปุ่ม 'Issue Certificates' ด้นบน หรือ ไอคอนรางวัล ในคอลัมน์ Action", "พนักงานที่ Result = Pass", "ระบบแสดง Modal Preview Certificate Form FM-CM-055 ข้อมูลครบถ้วน", "", "", ""],
  ["TC-TRN-020", "REQ-TRN-07", "ไม่ออก Certificate ให้พนักงานที่สอบตก (Negative)", "Session สถานะ Completed", "1. ดูคอลัมน์ Action ของพนักงานที่ Result = Fail", "พนักงานที่ Result = Fail", "ไม่ปรากฏไอคอนให้กด Issue Certificate", "", "", ""],
  ["TC-TRN-021", "REQ-TRN-07", "ตรวจสอบ Certificate Format", "หน้า Preview Certificate Modal", "1. ตรวจสอบ Placeholder: Certificate No, ชื่อ-นามสกุล, ชื่อคอร์ส, วันที่จบ, ชื่อผู้สอน", "-", "ข้อมูลถูกแทนที่ (Replace) ในแบบฟอร์ม FM-CM-055 อย่างถูกต้อง", "", "", ""],
  ["TC-TRN-022", "REQ-TRN-08", "ระบบ Profile อัพเดทเอกสารการฝึกอบรมอัตโนมัติ", "ให้คะแนน Pass และออกใบเซอร์แล้ว", "1. ไปที่ Human Resources > Staff > Profile\n2. ไปที่แท็บ Documents", "ชื่อพนักงานที่พึ่ง Pass", "เอกสารใบ Certificate ปรากฏใน Profile ของพนักงานโดยอัตโนมัติ", "", "", ""],
  ["TC-TRN-023", "REQ-TRN-08", "ค้นหาเอกสารที่รอ Approve", "มีเอกสารใหม่ถูกสร้างขึ้น", "1. ไปที่ QA > Document Verification\n2. ดูตารางเอกสาร", "-", "แสดงรายการเอกสารสถานะ Pending สำหรับรอตรวจสอบ", "", "", ""],
  ["TC-TRN-024", "REQ-TRN-08", "Approve เอกสารฝึกอบรม", "ตาราง Document Verification", "1. เลือกเอกสารสถานะ Pending\n2. คลิกปุ่ม Approve", "เอกสาร 1 รายการ", "สถานะเอกสารเปลี่ยนเป็น Approved ทันที (สีเขียว)", "", "", ""],
  ["TC-TRN-025", "REQ-TRN-08", "Reject เอกสารพร้อมระบุเหตุผล", "ตาราง Document Verification", "1. เลือกเอกสารสถานะ Pending\n2. คลิกปุ่ม Reject\n3. ระบุเหตุผล 'ไม่ชัดเจน' แล้วกดยืนยัน", "เหตุผล = ไม่ชัดเจน", "สถานะเอกสารเปลี่ยนเป็น Rejected และบันทึกเหตุผลไว้", "", "", ""],
  ["TC-TRN-026", "REQ-TRN-09", "สิทธิ์ Role QA Manager", "Login เป็น QA Manager", "1. ลองสร้าง/ลบ Session\n2. ลองแก้เกรด\n3. ลอง Approve เอกสาร", "-", "สามารถทำทุก Actions ได้สำเร็จตามสิทธิ์", "", "", ""],
  ["TC-TRN-027", "REQ-TRN-09", "สิทธิ์ Role General Staff (Negative)", "Login เป็น General Staff", "1. เข้าไปเมนู QA > Training Scheduler\n2. เข้าไปเมนู QA > Document Verification", "-", "ระบบแสดง Access Denied หรือซ่อนเมนูไม่ให้มองเห็น (ตาม Role-based permissions)", "", "", ""]
];

function convertToCSV(data) {
  const header = ['TC ID', 'Requirement Ref', 'Scenario / Objective', 'Precondition', 'Test Steps', 'Test Data', 'Expected Result', 'Actual Result', 'Status', 'Tester / Date / Remark'];
  const rows = [header, ...data];
  
  return rows.map(row => {
    return row.map(cell => {
      // Escape quotes and wrap in quotes if contains comma, newline or quotes
      const strCell = String(cell);
      if (strCell.includes(',') || strCell.includes('\n') || strCell.includes('"')) {
        return `"${strCell.replace(/"/g, '""')}"`;
      }
      return strCell;
    }).join(',');
  }).join('\n');
}

const csvString = '\uFEFF' + convertToCSV(testCases);
fs.writeFileSync('UAT_Test_Cases_SAMS_Training.csv', csvString, 'utf8');
console.log('CSV created successfully.');
