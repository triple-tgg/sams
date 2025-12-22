import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import axios from "@/lib/axios.config";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

// เปิดใช้งาน plugin สำหรับ parse format ต่างๆ
dayjs.extend(customParseFormat);

// Interface สำหรับข้อมูลที่ส่งไป API
export interface ImportFlightData {
  id: number;
  airlinesCode: string;
  stationsCode: string;
  acReg: string;
  acTypeCode: string;
  arrivalFlightNo: string;
  arrivalDate: string;
  arrivalStaTime: string;
  arrivalAtaTime: string;
  departureFlightNo: string;
  departureDate: string;
  departureStdTime: string;
  departureAtdTime: string;
  bayNo: string;
  statusCode: string;
  note: string;
}

export const useExcelImport = () => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();


  // Helper function เพื่อจัดการวันที่ด้วย dayjs
  const formatDate = (dateValue: any): string => {

    if (!dateValue) return '';

    try {
      let parsedDate: dayjs.Dayjs | null = null;

      // ถ้าเป็น Excel date serial number
      if (typeof dateValue === 'number') {
        // ใช้ XLSX library แปลง serial number เป็น Date object
        const excelDate = XLSX.SSF.parse_date_code(dateValue);
        if (excelDate) {
          parsedDate = dayjs(new Date(excelDate.y, excelDate.m - 1, excelDate.d));
        }
      }
      // ถ้าเป็น Date object แล้ว
      else if (dateValue instanceof Date) {
        parsedDate = dayjs(dateValue);
      }
      // ถ้าเป็น string ให้ใช้ dayjs parse
      else if (typeof dateValue === 'string' && dateValue.trim()) {
        const dateStr = dateValue.trim();

        // ลอง parse ด้วย dayjs ในหลายรูปแบบ
        const formats = [
          'YYYY-MM-DD',
          'DD/MM/YYYY',
          'MM/DD/YYYY',
          'DD-MM-YYYY',
          'MM-DD-YYYY',
          'YYYY/MM/DD',
          'DD/MM/YY',
          'MM/DD/YY',
          'DD-MM-YY',
          'MM-DD-YY'
        ];

        // ลอง parse ด้วยแต่ละ format
        for (const format of formats) {
          const parsed = dayjs(dateStr, format, true);
          if (parsed.isValid()) {
            parsedDate = parsed;
            break;
          }
        }

        // ถ้า parse ด้วย format ไม่ได้ ลอง parse แบบ flexible
        if (!parsedDate || !parsedDate.isValid()) {
          const flexibleParsed = dayjs(dateStr);
          if (flexibleParsed.isValid()) {
            parsedDate = flexibleParsed;
          }
        }
      }

      // ถ้า parse สำเร็จ ให้ format เป็น YYYY-MM-DD
      if (parsedDate && parsedDate.isValid()) {
        return parsedDate.format('YYYY-MM-DD');
      }

    } catch (error) {
      console.warn('Date parsing error:', error, 'for value:', dateValue);
    }

    // ถ้า parse ไม่ได้ ให้ return string ตามที่เป็น
    return String(dateValue);
  };

  // Helper function เพื่อจัดการเวลาด้วย dayjs
  const formatTime = (timeValue: any): string => {
    if (!timeValue) return '';

    try {
      let parsedTime: dayjs.Dayjs | null = null;

      // ถ้าเป็น Excel time serial number (เศษส่วนของวัน)
      if (typeof timeValue === 'number') {
        if (timeValue < 1) {
          // ถ้าเป็นเศษส่วนของวัน (0.5 = 12:00)
          const totalMinutes = Math.round(timeValue * 24 * 60);
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        } else {
          // ถ้าเป็น timestamp หรือ serial number ให้แปลงเป็น Date
          parsedTime = dayjs(new Date(timeValue));
        }
      }
      // ถ้าเป็น Date object แล้ว
      else if (timeValue instanceof Date) {
        parsedTime = dayjs(timeValue);
      }
      // ถ้าเป็น string ให้ใช้ dayjs parse
      else if (typeof timeValue === 'string' && timeValue.trim()) {
        const timeStr = timeValue.trim();

        // ถ้าเป็น format HH:mm หรือ HH:mm:ss แล้ว ให้ return ตามที่เป็น
        if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(timeStr)) {
          const parts = timeStr.split(':');
          const hours = parseInt(parts[0]).toString().padStart(2, '0');
          const minutes = parseInt(parts[1]).toString().padStart(2, '0');
          return `${hours}:${minutes}`;
        }

        // ลอง parse ด้วย dayjs ในหลายรูปแบบ
        const timeFormats = [
          'HH:mm',
          'HH:mm:ss',
          'h:mm A',
          'h:mm:ss A',
          'H:mm',
          'H:mm:ss'
        ];

        // ลอง parse ด้วยแต่ละ format
        for (const format of timeFormats) {
          const parsed = dayjs(timeStr, format, true);
          if (parsed.isValid()) {
            parsedTime = parsed;
            break;
          }
        }

        // ถ้า parse ด้วย format ไม่ได้ ลอง parse แบบ flexible
        if (!parsedTime || !parsedTime.isValid()) {
          // สร้าง date string สำหรับ parse เวลา
          const dateWithTime = `2000-01-01 ${timeStr}`;
          const flexibleParsed = dayjs(dateWithTime);
          if (flexibleParsed.isValid()) {
            parsedTime = flexibleParsed;
          }
        }
      }

      // ถ้า parse สำเร็จ ให้ format เป็น HH:mm
      if (parsedTime && parsedTime.isValid()) {
        return parsedTime.format('HH:mm');
      }

    } catch (error) {
      console.warn('Time parsing error:', error, 'for value:', timeValue);
    }

    // ถ้า parse ไม่ได้ ให้ return string ตามที่เป็น
    return String(timeValue);
  };

  // ฟังก์ชันแปลงข้อมูล Excel เป็น format ที่ API ต้องการ
  const mapExcelDataToApiFormat = (excelData: any[]): ImportFlightData[] => {
    return excelData.map((row, index) => {
      // สร้าง object ตาม API format
      console.log("object row :", row);
      return {
        id: 0, // Default สำหรับ record ใหม่
        airlinesCode: String(row['Airlines Code'] || row['airlinesCode'] || '').trim(),
        stationsCode: String(row['Station Code'] || row['stationsCode'] || '').trim(),
        acReg: String(row['A/C Reg'] || row['acReg'] || '').trim(),
        acTypeCode: String(row['A/C Type'] || row['acType'] || '').trim(),
        arrivalFlightNo: String(row['Arrival Flight No'] || row['arrivalFlightNo'] || '').trim(),
        arrivalDate: formatDate(row['Arrival Date'] || row['arrivalDate']),
        arrivalStaTime: formatTime(row['Arrival STA (UTC)'] || row['arrivalStaTime']),
        arrivalAtaTime: formatTime(row['Arrival ATA (UTC)'] || row['arrivalAtaTime']),
        departureFlightNo: String(row['Departure Flight No'] || row['departureFlightNo'] || '').trim(),
        departureDate: formatDate(row['Departure Date'] || row['departureDate']),
        departureStdTime: formatTime(row['Departure STA (UTC)'] || row['departureStdTime']),
        departureAtdTime: formatTime(row['Departure ATA (UTC)'] || row['departureAtdTime']),
        bayNo: String(row['Bay'] || row['bayNo'] || '').trim(),
        statusCode: String(row['Status'] || row['statusCode']).trim(),
        note: String(row['Note'] || row['note'] || '').trim()
      };
    });
  };

  // ฟังก์ชันส่งข้อมูลไปยัง API
  const sendImportData = async (data: ImportFlightData[]) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_DEVELOPMENT_API
        ? `${process.env.NEXT_PUBLIC_DEVELOPMENT_API}/flight/importlist`
        : 'https://sam-api-staging-triple-tcoth-production.up.railway.app/flight/importlist';

      console.log('Sending to API:', {
        endpoint: apiUrl,
        sampleData: data.slice(0, 2), // แสดง 2 records แรกเพื่อ debug
        totalRecords: data.length
      });

      const response = await axios.post(apiUrl, data, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000 // 30 seconds timeout
      });

      // console.log('Import response:', response.data);
      toast.success(`Successfully imported ${data.length} flight records.`);
      
      // Invalidate flight list queries to refresh data
      qc.invalidateQueries({ queryKey: ["flightList"] });

      return response.data;

    } catch (error: any) {
      console.error('Import API error:', error);

      let errorMessage = "Failed to import data. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);

      throw error;
    }
  };

  // ฟังก์ชันอ่านไฟล์ Excel และแปลงเป็น JSON
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ตรวจสอบประเภทไฟล์
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error("Please select an Excel file (.xlsx or .xls)");

      return;
    }

    setIsUploading(true);

    try {
      // อ่านไฟล์เป็น ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // แปลง ArrayBuffer เป็น workbook
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      // เลือก sheet แรก
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // แปลง worksheet เป็น JSON โดยใช้ header row เป็น key
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '' // ค่า default สำหรับ cell ว่าง
      });

      // ลบ header row และแปลงเป็น object format
      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1) as any[][];

      console.log('Excel headers:', headers);
      console.log('Excel rows sample:', rows.slice(0, 3));

      const excelObjects = rows
        .filter(row => row.some(cell => cell !== undefined && cell !== '')) // กรองแถวว่าง
        .map(row => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || '';
          });
          return obj;
        });

      // console.log('Excel objects sample:', excelObjects.slice(0, 3));

      // แปลงข้อมูลเป็น format ที่ API ต้องการ
      const apiFormatData = mapExcelDataToApiFormat(excelObjects);

      // console.log('API format data sample:', apiFormatData.slice(0, 3));

      // ส่งข้อมูลไปยัง API
      await sendImportData(apiFormatData);

    } catch (error) {
      console.error('Error processing file:', error);
      toast.error("Failed to process the Excel file. Please check the file format.");
    } finally {
      setIsUploading(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // ฟังก์ชันสำหรับ import ไฟล์ Excel
  const handleImportFile = () => {
    fileInputRef.current?.click();
  };

  return {
    isUploading,
    fileInputRef,
    handleImportFile,
    handleFileChange
  };
};
