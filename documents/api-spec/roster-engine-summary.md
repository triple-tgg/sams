# API Specification: Roster Engine Summary & Manpower Readiness

เอกสารนี้ระบุการออกแบบโครงสร้าง API สำหรับหน้าจอ **Engine Summary** (`/roster/aircraft-type-summary`) ซึ่งแสดงภาพรวมความพร้อมของกำลังคน (Manpower Coverage & Readiness) แยกตามรุ่นเครื่องบิน (Aircraft Family), ประเภทเครื่องยนต์ (Engine Variant), และรายการ Aircraft-Engine Combinations

---

## 1. Endpoint Details

- **Method:** `GET`
- **Path:** `/api/v1/roster/engine-summary`
- **Description:** ดึงข้อมูลภาพรวมสถิติกำลังคน (KPI Summary) และตารางความสามารถของเครื่องบิน-เครื่องยนต์ (Capability Matrix) พร้อมรายการ Combinations ของแต่ละเครื่องยนต์

### Query Parameters

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `station` | `string` | No | `ALL` | กรองตามรหัสสถานี (เช่น `BKK`, `DMK`, `HKT`) หรือ `ALL` เพื่อดูทุกสถานี |
| `search` | `string` | No | - | ค้นหาจากชื่อรุ่นเครื่องบิน (เช่น `A320`), ชื่อเครื่องยนต์ (เช่น `CFM56`), หรือ Combination label |

---

## 2. Example Response (JSON)

```json
{
  "message": "Success",
  "error": null,
  "responseData": {
    "kpiSummary": {
      "fleetModelsCount": 8,
      "engineVariantsCount": 14,
      "licenceHoldersCount": 42,
      "activeCsCount": 28,
      "coveragePercentage": 82
    },
    "families": [
      {
        "familyCode": "A318",
        "familyName": "Airbus A318",
        "summary": {
          "licensedCount": 1,
          "certifyingCount": 0
        },
        "engines": [
          {
            "engineCode": "CFM56",
            "engineName": "CFM56-5B",
            "licensedCount": 1,
            "certifyingCount": 0,
            "status": "NO_AUTHORISED_CS",
            "statusLabel": "No Authorised CS",
            "coveragePercentage": 0,
            "combinations": [
              {
                "id": 101,
                "familyCode": "A318",
                "series": "100",
                "engineCode": "CFM56",
                "displayLabel": "A318-100 (CFM56)",
                "similarTechnology": "Group 1"
              }
            ]
          }
        ]
      },
      {
        "familyCode": "A319",
        "familyName": "Airbus A319",
        "summary": {
          "licensedCount": 4,
          "certifyingCount": 2
        },
        "engines": [
          {
            "engineCode": "CFM-LEAP-1A",
            "engineName": "CFM LEAP-1A",
            "licensedCount": 3,
            "certifyingCount": 1,
            "status": "LOW_COVERAGE",
            "statusLabel": "Low Coverage ≤ 2",
            "coveragePercentage": 33,
            "combinations": [
              {
                "id": 105,
                "familyCode": "A319",
                "series": "neo",
                "engineCode": "CFM-LEAP-1A",
                "displayLabel": "A319neo (CFM LEAP-1A)",
                "similarTechnology": "Group 2"
              }
            ]
          },
          {
            "engineCode": "CFM56",
            "engineName": "CFM56-5B",
            "licensedCount": 1,
            "certifyingCount": 1,
            "status": "LOW_COVERAGE",
            "statusLabel": "Low Coverage ≤ 2",
            "coveragePercentage": 100,
            "combinations": [
              {
                "id": 102,
                "familyCode": "A319",
                "series": "100",
                "engineCode": "CFM56",
                "displayLabel": "A319-100 (CFM56)",
                "similarTechnology": "Group 1"
              }
            ]
          },
          {
            "engineCode": "IAE-PW1100G",
            "engineName": "Pratt & Whitney PW1100G",
            "licensedCount": 2,
            "certifyingCount": 0,
            "status": "NO_AUTHORISED_CS",
            "statusLabel": "No Authorised CS",
            "coveragePercentage": 0,
            "combinations": [
              {
                "id": 106,
                "familyCode": "A319",
                "series": "neo",
                "engineCode": "IAE-PW1100G",
                "displayLabel": "A319neo (PW1100G)",
                "similarTechnology": "Group 2"
              }
            ]
          },
          {
            "engineCode": "V2500",
            "engineName": "IAE V2500",
            "licensedCount": 2,
            "certifyingCount": 2,
            "status": "LOW_COVERAGE",
            "statusLabel": "Low Coverage ≤ 2",
            "coveragePercentage": 100,
            "combinations": [
              {
                "id": 103,
                "familyCode": "A319",
                "series": "100",
                "engineCode": "V2500",
                "displayLabel": "A319-100 (V2500)",
                "similarTechnology": "Group 1"
              }
            ]
          }
        ]
      },
      {
        "familyCode": "A320",
        "familyName": "Airbus A320",
        "summary": {
          "licensedCount": 12,
          "certifyingCount": 9
        },
        "engines": [
          {
            "engineCode": "CFM56",
            "engineName": "CFM56-5B",
            "licensedCount": 8,
            "certifyingCount": 7,
            "status": "ADEQUATE",
            "statusLabel": "Adequate",
            "coveragePercentage": 88,
            "combinations": [
              {
                "id": 110,
                "familyCode": "A320",
                "series": "200",
                "engineCode": "CFM56",
                "displayLabel": "A320-200 (CFM56)",
                "similarTechnology": "Group 1"
              }
            ]
          },
          {
            "engineCode": "CFM-LEAP-1A",
            "engineName": "CFM LEAP-1A",
            "licensedCount": 5,
            "certifyingCount": 4,
            "status": "ADEQUATE",
            "statusLabel": "Adequate",
            "coveragePercentage": 80,
            "combinations": [
              {
                "id": 112,
                "familyCode": "A320",
                "series": "neo",
                "engineCode": "CFM-LEAP-1A",
                "displayLabel": "A320neo (CFM LEAP-1A)",
                "similarTechnology": "Group 2"
              }
            ]
          }
        ]
      },
      {
        "familyCode": "B777",
        "familyName": "Boeing 777",
        "summary": {
          "licensedCount": 3,
          "certifyingCount": 0
        },
        "engines": [
          {
            "engineCode": "GE90",
            "engineName": "GE90-115B",
            "licensedCount": 3,
            "certifyingCount": 0,
            "status": "NO_AUTHORISED_CS",
            "statusLabel": "No Authorised CS",
            "coveragePercentage": 0,
            "combinations": [
              {
                "id": 201,
                "familyCode": "B777",
                "series": "300ER",
                "engineCode": "GE90",
                "displayLabel": "B777-300ER (GE90)",
                "similarTechnology": "Group 1"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

---

## 3. Field Explanations (คำอธิบายฟิลด์ข้อมูล)

### 3.1 `kpiSummary` (แผงสรุป 4 การ์ดด้านบน)

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `fleetModelsCount` | `number` | จำนวนแบบเครื่องบินในฝูงบิน (นับจำนวน Family ทั้งหมด) |
| `engineVariantsCount` | `number` | จำนวนประเภทเครื่องยนต์ทั้งหมดที่รองรับ |
| `licenceHoldersCount` | `number` | จำนวนพนักงาน (Distinct Staff) ที่ถือใบอนุญาต AMEL |
| `activeCsCount` | `number` | จำนวนวิศวกรที่มีสิทธิ์ปล่อยเครื่องบินจริง (Valid SAMS CRS ที่ไม่หมดอายุ) |
| `coveragePercentage` | `number` | เปอร์เซ็นต์ความพร้อมของกำลังคนภาพรวม (`activeCsCount / licenceHoldersCount * 100`) |

### 3.2 `families[]` (ตารางหลัก — แถวระดับ Aircraft Model)

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `familyCode` | `string` | รหัสรุ่นเครื่องบิน (เช่น `"A318"`, `"A319"`, `"A320"`, `"B777"`) |
| `familyName` | `string` | ชื่อเต็มรุ่นเครื่องบิน (เช่น `"Airbus A320"`) |
| `summary.licensedCount` | `number` | จำนวนผู้ถือสิทธิ์ AMEL รวมของทุกเครื่องยนต์ในรุ่นนี้ (`All engines`) |
| `summary.certifyingCount` | `number` | จำนวนผู้มีสิทธิ์ Valid CS รวมของทุกเครื่องยนต์ในรุ่นนี้ |
| `engines` | `Array<EngineRow>` | รายการเครื่องยนต์ย่อยภายใต้รุ่นนี้ |

### 3.3 `engines[]` (แถวย่อยระดับ Engine Variant)

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `engineCode` | `string` | รหัสเครื่องยนต์ (เช่น `"CFM56"`, `"V2500"`, `"CFM-LEAP-1A"`) |
| `engineName` | `string` | ชื่อเต็มของเครื่องยนต์ |
| `licensedCount` | `number` | จำนวนพนักงานที่ถือ AMEL สำหรับเครื่องยนต์นี้ (แสดงในคอลัมน์ `LICENCE HOLDERS (AMEL)`) |
| `certifyingCount` | `number` | จำนวนพนักงานที่มีสิทธิ์ปล่อยเครื่องบินจริง (แสดงในคอลัมน์ `VALID CS (LINE RELEASE)`) |
| `status` | `string` | สถานะความพร้อม: `"ADEQUATE"` \| `"LOW_COVERAGE"` \| `"NO_AUTHORISED_CS"` |
| `statusLabel` | `string` | ข้อความแสดงบน Badge: `"Adequate"` \| `"Low Coverage ≤ 2"` \| `"No Authorised CS"` |
| `coveragePercentage` | `number` | เปอร์เซ็นต์สำหรับวาด Progress bar (`0` ถึง `100`) |
| `combinations` | `Array<Combination>` | รายการ Combinations ที่ผูกกับเครื่องยนต์นี้ (แสดงใน Drawer เมื่อคลิกขยาย) |

### 3.4 `combinations[]` (รายการใน Drawer ย่อย)

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `number` | รหัสอ้างอิง Combination ID ในระบบ Master Data |
| `familyCode` | `string` | รหัส Family เครื่องบิน (เช่น `"A320"`) |
| `series` | `string` | รหัส Series ย่อย (เช่น `"200"`, `"neo"` หรือ `""`) |
| `engineCode` | `string` | รหัสเครื่องยนต์ (เช่น `"CFM56"`) |
| `displayLabel` | `string` | ชื่อฉลากสำหรับแสดงผล (เช่น `"A320-200 (CFM56)"`) |
| `similarTechnology` | `string \| null` | กลุ่มเทคโนโลยีเทียบเคียง (เช่น `"Group 1"`, `"Group 2"`) |

---

## 4. TypeScript Interface Definitions

```typescript
// ==========================================
// Base Response Envelope
// ==========================================
export interface ApiResponse<T> {
  message: string;
  error: string | null;
  responseData: T;
}

// ==========================================
// Top KPI Summary
// ==========================================
export interface EngineKpiSummary {
  fleetModelsCount: number;      // e.g. 8 Models
  engineVariantsCount: number;   // e.g. 14 Types
  licenceHoldersCount: number;   // e.g. 42 Staff
  activeCsCount: number;          // e.g. 28 Authorized
  coveragePercentage: number;    // e.g. 82 (% Coverage)
}

// ==========================================
// Aircraft Engine Combination (Drawer List)
// ==========================================
export interface AircraftEngineCombinationItem {
  id: number;
  familyCode: string;
  series: string;
  engineCode: string;
  displayLabel: string;
  similarTechnology?: string | null;
}

// ==========================================
// Engine Variant Row
// ==========================================
export type EngineReadinessStatus = 'ADEQUATE' | 'LOW_COVERAGE' | 'NO_AUTHORISED_CS';

export interface EngineVariantItem {
  engineCode: string;
  engineName: string;
  licensedCount: number;
  certifyingCount: number;
  status: EngineReadinessStatus;
  statusLabel: string;
  coveragePercentage: number;
  combinations: AircraftEngineCombinationItem[];
}

// ==========================================
// Aircraft Model / Family Row
// ==========================================
export interface AircraftFamilySummary {
  familyCode: string;
  familyName: string;
  summary: {
    licensedCount: number;
    certifyingCount: number;
  };
  engines: EngineVariantItem[];
}

// ==========================================
// Root Response Data
// ==========================================
export interface EngineSummaryResponseData {
  kpiSummary: EngineKpiSummary;
  families: AircraftFamilySummary[];
}

export type EngineSummaryApiResponse = ApiResponse<EngineSummaryResponseData>;
```

---

## 5. กฎทางธุรกิจสำหรับการคำนวณของ Backend (Backend Calculation Rules)

1. **การคำนวณ `status` และ `coveragePercentage`:**
   ```typescript
   if (certifyingCount === 0) {
     status = "NO_AUTHORISED_CS";
     statusLabel = "No Authorised CS";
     coveragePercentage = 0;
   } else if (certifyingCount <= 2) {
     status = "LOW_COVERAGE";
     statusLabel = "Low Coverage ≤ 2";
     coveragePercentage = Math.min(45, Math.max(25, Math.round((certifyingCount / Math.max(1, licensedCount)) * 100)));
   } else {
     status = "ADEQUATE";
     statusLabel = "Adequate";
     coveragePercentage = Math.min(95, Math.max(60, Math.round((certifyingCount / Math.max(1, licensedCount)) * 100)));
   }
   ```

2. **การจัดกลุ่ม `combinations` ในแต่ละ Engine:**
   - นำ Combination ทั้งหมดที่มีสถานะ Active (`validTo === null`)
   - จับคู่ด้วย `familyCode` และ `engineCode` เพื่อนำมาฝังไว้ในแต่ละ `engine.combinations`
   - ทำให้ Frontend สามารถเปิด Drawer แสดง List ได้ทันทีโดยไม่ต้องทำการ Call API เพิ่มเติม (Single Request Render)
