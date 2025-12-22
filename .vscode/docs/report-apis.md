# Report APIs และ Download System Documentation

## Overview
ระบบ Report API และ Download สำหรับการดาวน์โหลดรายงาน 3 ประเภท: Equipment, Parts & Tools, และ THF Document

## API Endpoints

### 1. Equipment Report API
```
POST /report/equipments
```
**Request Body:**
```json
{
  "dateStart": "2025-09-01",
  "dateEnd": "2025-09-30"
}
```

**Response:**
```json
{
  "message": "success",
  "responseData": [
    {
      "equipmentName": "Tesssss 445",
      "thfNo": "Tes444",
      "flightNo": "STFFG-5444",
      "customerAirline": "SEJ",
      "formDate": "26/09/2025",
      "formTime": "12:00",
      "toDate": "27/09/2025",
      "toTime": "12:00",
      "svc": "0",
      "hrs": "0",
      "loan": "Yes"
    }
  ],
  "error": ""
}
```

### 2. Parts & Tools Report API
```
POST /report/partstools
```
**Request Body:**
```json
{
  "dateStart": "2025-09-01",
  "dateEnd": "2025-09-30"
}
```

**Response:**
```json
{
  "message": "success",
  "responseData": [
    {
      "name": "test1111",
      "partNo": "",
      "serialNoIn": "",
      "serialNoOut": "",
      "equipmentNo": "test888",
      "thfNo": "Tes444",
      "flightNo": "STFFG-5444",
      "customerAirline": "SEJ",
      "formDate": "09/09/2025",
      "formTime": "13:30",
      "toDate": "09/09/2025",
      "toTime": "14:30",
      "qty": "0",
      "hrs": "0",
      "loan": "Yes"
    }
  ],
  "error": ""
}
```

### 3. THF Document Report API
```
POST /report/thf
```
**Request Body:**
```json
{
  "dateStart": "2025-09-01",
  "dateEnd": "2025-09-30"
}
```

**Response:**
```json
{
  "message": "success",
  "responseData": [
    {
      "updateDate": "28/09/2025",
      "acType": "",
      "acReg": "test Reg",
      "stationCode": "BKK",
      "arrivalFlightNo": "STFFG-5444",
      "departureFlightNo": "STFFG-5445",
      "iataAirlines": "SEJ",
      "airlineName": "Spicejet",
      "stateOfOperator": "",
      "route": "CNX-CEI",
      "arrivalStaTime": "13:00",
      "arrivalAtaTimeDiff30": "13:00",
      "arrivalAtaTime": "13:30",
      "departureStdTime": "12:30",
      "departureAtdTime": "12:30",
      "groundTime": "00:00",
      "aircraftDelay": "",
      "aircraftTotalDelay": "",
      "towingAircraftBayBay": "A1-A2",
      "towingTime": "",
      "engOil_LR1": "0.4-2.4",
      "engOil_LR2": "",
      "engOil_LR3": "",
      "apuOilServicing": "",
      "hydraulicServicingA": "1",
      "hydraulicServicingB": "4",
      "defectDetails": "xxxxxxx",
      "maintenancePerformed": "",
      "ataChapter": "xxxxxx",
      "flightDeck": "FALSE",
      "nameCS": "",
      "csId": "",
      "nameMech": "",
      "mechId": "",
      "thfNumber": "Tes444"
    }
  ],
  "error": ""
}
```

## Files Structure

```
lib/api/
├── report/
│   ├── equipments/
│   │   └── getEquipments.ts          # Equipment Report API
│   ├── partstools/
│   │   └── getPartsTools.ts          # Parts & Tools Report API
│   └── thf/
│       └── getThf.ts                 # THF Report API
├── hooks/
│   └── useReports.ts                 # React Query hooks
lib/utils/
└── excelExport.ts                    # Excel/CSV export utilities
components/report/
└── ReportDownloadButton.tsx          # Download button component
```

## API Functions

### Core API Functions

#### Equipment Report
```typescript
import { getEquipmentReport } from '@/lib/api/report/equipments/getEquipments';

const response = await getEquipmentReport({
  dateStart: '2025-09-01',
  dateEnd: '2025-09-30'
});
```

#### Parts & Tools Report
```typescript
import { getPartsToolsReport } from '@/lib/api/report/partstools/getPartsTools';

const response = await getPartsToolsReport({
  dateStart: '2025-09-01',
  dateEnd: '2025-09-30'
});
```

#### THF Report
```typescript
import { getThfReport } from '@/lib/api/report/thf/getThf';

const response = await getThfReport({
  dateStart: '2025-09-01',
  dateEnd: '2025-09-30'
});
```

## React Query Hooks

### Basic Usage
```typescript
import { 
  useEquipmentReport, 
  usePartsToolsReport, 
  useThfReport 
} from '@/lib/api/hooks/useReports';

// Equipment Report
const { data, isLoading, error } = useEquipmentReport({
  dateStart: '2025-09-01',
  dateEnd: '2025-09-30'
});

// Parts & Tools Report
const { data, isLoading, error } = usePartsToolsReport({
  dateStart: '2025-09-01',
  dateEnd: '2025-09-30'
});

// THF Report
const { data, isLoading, error } = useThfReport({
  dateStart: '2025-09-01',
  dateEnd: '2025-09-30'
});
```

### Download Hooks
```typescript
import { useReportDownload } from '@/lib/api/hooks/useReports';

const { downloadReport, isLoading } = useReportDownload();

// Download Equipment Report
await downloadReport('equipment', {
  dateStart: '2025-09-01',
  dateEnd: '2025-09-30'
}, 'xlsx');

// Download Parts & Tools Report
await downloadReport('partstools', {
  dateStart: '2025-09-01',
  dateEnd: '2025-09-30'
}, 'csv');

// Download THF Report
await downloadReport('thf', {
  dateStart: '2025-09-01',
  dateEnd: '2025-09-30'
}, 'xlsx');
```

## Excel Export Functions

### Basic Export
```typescript
import { exportToExcel, exportToCSV } from '@/lib/utils/excelExport';

// Export to Excel (.xlsx)
exportToExcel(data, 'Equipment_Report', 'Equipment Report');

// Export to CSV (.csv)
exportToCSV(data, 'Equipment_Report');
```

### Specific Report Exports
```typescript
import { 
  exportEquipmentReport, 
  exportPartsToolsReport, 
  exportThfReport 
} from '@/lib/utils/excelExport';

// Export Equipment Report
exportEquipmentReport(data, 'xlsx'); // or 'csv'

// Export Parts & Tools Report
exportPartsToolsReport(data, 'xlsx'); // or 'csv'

// Export THF Report
exportThfReport(data, 'xlsx'); // or 'csv'
```

## Download Button Component

### Basic Usage
```typescript
import ReportDownloadButton from '@/components/report/ReportDownloadButton';

<ReportDownloadButton
  reportType="equipment" // 'equipment' | 'partstools' | 'thf'
  dateRange={{
    dateStart: '2025-09-01',
    dateEnd: '2025-09-30'
  }}
  disabled={false}
  className="custom-class"
/>
```

### Features
- **Dropdown Menu** เลือกรูปแบบไฟล์ (.xlsx หรือ .csv)
- **Loading State** แสดงสถานะการดาวน์โหลด
- **Error Handling** จัดการข้อผิดพลาด
- **Date Validation** ตรวจสอบ date range
- **Toast Notifications** แสดงผลลัพธ์การดาวน์โหลด

## CardList Integration

### Updated CardList Props
```typescript
type Props = {
  values: Array<{
    id: string
    name: string
    description: string
    reportType: 'equipment' | 'partstools' | 'thf' // เพิ่มใหม่
  }>
  date?: { dateStart: string, dateEnd: string }
  isError?: boolean
}
```

### Updated Data Structure
```typescript
// app/[locale]/(protected)/report/data.ts
export const itemReport = [
  { 
    id: '1', 
    name: 'Equipment', 
    description: 'Equipment Report',
    reportType: 'equipment' as const
  },
  { 
    id: '2', 
    name: 'Parts & Tools', 
    description: 'Parts & Tools Report',
    reportType: 'partstools' as const
  },
  { 
    id: '3', 
    name: 'THF Document', 
    description: 'THF Document Report',
    reportType: 'thf' as const
  },
]
```

## TypeScript Interfaces

### Equipment Report
```typescript
interface EquipmentReportItem {
  equipmentName: string;
  thfNo: string;
  flightNo: string;
  customerAirline: string;
  formDate: string;
  formTime: string;
  toDate: string;
  toTime: string;
  svc: string;
  hrs: string;
  loan: string;
}
```

### Parts & Tools Report
```typescript
interface PartsToolsReportItem {
  name: string;
  partNo: string;
  serialNoIn: string;
  serialNoOut: string;
  equipmentNo: string;
  thfNo: string;
  flightNo: string;
  customerAirline: string;
  formDate: string;
  formTime: string;
  toDate: string;
  toTime: string;
  qty: string;
  hrs: string;
  loan: string;
}
```

### THF Report
```typescript
interface ThfReportItem {
  updateDate: string;
  acType: string;
  acReg: string;
  stationCode: string;
  arrivalFlightNo: string;
  departureFlightNo: string;
  iataAirlines: string;
  airlineName: string;
  // ... (full interface in code files)
}
```

## Performance Features

- **React Query Caching** - 2 นาที stale time, 5 นาที garbage collection
- **Automatic Retry** - Built-in retry mechanism
- **Loading States** - Proper loading indicators
- **Error Handling** - Comprehensive error management
- **Toast Notifications** - User feedback
- **File Size Optimization** - Auto-sizing Excel columns
- **Memory Management** - Proper cleanup after download

## Error Handling

### API Errors
- Network timeout (30 วินาที สำหรับ data, 60 วินาที สำหรับ download)
- Invalid date range validation
- Server error responses
- Empty data handling

### Export Errors
- Empty data validation
- File write permissions
- Browser compatibility
- Memory limitations for large datasets

## Usage Examples

ดูไฟล์ `examples/useReports.example.tsx` สำหรับตัวอย่างการใช้งานครบถ้วน:

1. **Basic Report Data Fetching** - ดึงข้อมูลรายงาน
2. **Download Buttons Usage** - ใช้งาน download buttons
3. **Manual Download** - การดาวน์โหลดแบบ manual
4. **Direct API Usage** - เรียก API โดยตรง

## Dependencies

- **axios** - HTTP client
- **@tanstack/react-query** - Data fetching และ caching
- **xlsx** - Excel file generation
- **sonner** - Toast notifications
- **dayjs** - Date manipulation
- **lucide-react** - Icons

## Installation

ติดตั้ง dependencies ที่จำเป็น:
```bash
npm install xlsx
# หรือ
yarn add xlsx
```

## Deployment Notes

1. **Memory Usage** - Large datasets อาจใช้หน่วยความจำมาก
2. **File Size Limits** - ตรวจสอบ browser download limits
3. **CORS Settings** - ตั้งค่า CORS สำหรับ API endpoints
4. **Rate Limiting** - พิจารณา rate limiting สำหรับ download APIs
5. **File Storage** - พิจารณาใช้ temporary file storage สำหรับ large reports