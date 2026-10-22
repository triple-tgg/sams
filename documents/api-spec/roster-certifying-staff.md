# API Specification: Roster Certifying Staff (AMEL & Aircraft Licence Matrix)

เอกสารนี้ระบุการออกแบบโครงสร้าง API สำหรับหน้าจอ **Certifying Staff** (`/roster/certifying-staff`) ซึ่งประกอบด้วย 2 Tab หลัก:
1. **AMEL** (Aircraft Maintenance Engineer Licence) — ตาราง 2-Tier Matrix (Fixed Info + Aircraft Series + Subtypes/Engine)
2. **Aircraft Licence** (Customer/Airline Authorizations) — ตาราง 3-Tier Matrix (Fixed Info + Customer Airlines + Aircraft Models + Subtypes/Engine)

---

## 1. Overview Endpoints

Endpoint สำหรับหน้าจอ Certifying Staff:

| Method | Endpoint Path | Description |
| :--- | :--- | :--- |
| `GET` | `/roster/certifying-staff-summary` | ดึงข้อมูลสรุป KPI การ์ดด้านบน (Valid CS, Licence Holders, Rotate/Transfer, No Station) |
| `POST` | `/roster/certifying-staff/amel` | ดึงข้อมูล Matrix คอลัมน์และรายชื่อ Staff ของ Tab **AMEL** |
| `POST` | `/roster/certifying-staff/aircraft-licence` | ดึงข้อมูล Matrix คอลัมน์ สายการบิน และสิทธิ์ของ Tab **Aircraft Licence** |

### Common Query Parameters (ทั้ง 2 Endpoints)

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `search` | `string` | No | - | ค้นหาจาก Staff No, Name, หรือ Licence No |
| `station` | `string` | No | `ALL` | กรองตามสถานี (เช่น `BKK`, `DMK`, `HKT`) |
| `aircraftType` | `string` | No | `ALL` | กรองตาม Aircraft Model (เช่น `A320`, `B737`) |
| `page` | `number` | No | `1` | เลขหน้า (Pagination) |
| `pageSize` | `number` | No | `20` | จำนวนรายการต่อหน้า (Pagination) |

---

## 2. API 1: AMEL Tab (`/api/v1/roster/certifying-staff/amel`)

### 2.1 Example Response JSON

```json
{
  "message": "Success",
  "error": null,
  "responseData": {
    "columns": {
      "fixedColumns": [
        { "id": "no", "label": "No.", "width": 64, "sticky": true },
        { "id": "name", "label": "Name", "width": 160, "sticky": true },
        { "id": "position", "label": "Position", "width": 110, "sticky": true },
        { "id": "actype", "label": "A/C Type", "width": 110, "sticky": true }
      ],
      "groups": [
        {
          "id": "A320",
          "aircraft": "A320",
          "columns": [
            { "id": "A320-IAE_V2500", "label": "IAE V2500", "code": "IAE V2500", "engine": "V2500", "width": 140 },
            { "id": "A320-CFM56", "label": "CFM56", "code": "CFM56", "engine": "CFM56", "width": 140 }
          ]
        },
        {
          "id": "A321",
          "aircraft": "A321",
          "columns": [
            { "id": "A321-CFM_LEAP_1A", "label": "CFM LEAP-1A", "code": "CFM LEAP-1A", "engine": "LEAP-1A", "width": 140 },
            { "id": "A321-PW1100G", "label": "PW1100G", "code": "PW1100G", "engine": "PW1100G", "width": 140 }
          ]
        }
      ]
    },
    "rows": [
      {
        "id": "staff-001",
        "staffNo": "001",
        "name": "Komsun Samart",
        "position": "EN",
        "aircraftType": "B1.1",
        "station": "BKK",
        "qualifications": {
          "A320-IAE_V2500": { "qualified": true, "licenceNo": "AMEL-2024-001", "expiryDate": "2026-12-31" },
          "A320-CFM56": { "qualified": true, "licenceNo": "AMEL-2024-001", "expiryDate": "2026-12-31" },
          "A321-CFM_LEAP_1A": { "qualified": false }
        }
      },
      {
        "id": "staff-002",
        "staffNo": "002",
        "name": "Nattawut Somchai",
        "position": "EN",
        "aircraftType": "B1.1, B2",
        "station": "DMK",
        "qualifications": {
          "A320-CFM56": { "qualified": true, "licenceNo": "AMEL-2024-089", "expiryDate": "2027-05-15" },
          "A321-CFM_LEAP_1A": { "qualified": true, "licenceNo": "AMEL-2024-089", "expiryDate": "2027-05-15" }
        }
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalRecords": 35,
      "totalPages": 2
    }
  }
}
```

### 2.2 Field Descriptions: AMEL

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `columns.fixedColumns` | `Array<FixedCol>` | คอลัมน์ทางซ้ายที่ตรึงไว้ (`No`, `Name`, `Position`, `A/C Type`) |
| `columns.groups` | `Array<Group>` | กลุ่มคอลัมน์ระดับบน (Row 1): แต่ละรุ่นเครื่องบิน (เช่น `A320`, `A321`) |
| `columns.groups[].columns` | `Array<Col>` | คอลัมน์ย่อยระดับล่าง (Row 2): รุ่นย่อย/เครื่องยนต์ (`id`, `label`, `width`) |
| `rows[].id` | `string` | Unique ID ของพนักงาน |
| `rows[].staffNo` | `string` | รหัสพนักงาน แสดงในคอลัมน์ `No.` |
| `rows[].name` | `string` | ชื่อ-นามสกุลพนักงาน |
| `rows[].position` | `string` | ตำแหน่ง เช่น `EN`, `MEC`, `TC` |
| `rows[].aircraftType` | `string` | สิทธิ์ประเภท เช่น `B1.1`, `B2`, `C` |
| `rows[].qualifications` | `Record<string, Cell>` | Key-Value แมปด้วย `column.id` เพื่อให้ frontend lookup O(1) เร็วและไม่หลุด index |
| `qualifications[colId].qualified` | `boolean` | ผ่านการรับรองหรือไม่ (`true` แสดงเครื่องหมายติ๊กถูก หรือวันที่) |

---

## 3. API 2: Aircraft Licence Tab (`/api/v1/roster/certifying-staff/aircraft-licence`)

### 3.1 Example Response JSON

```json
{
  "message": "Success",
  "error": null,
  "responseData": {
    "columns": {
      "fixedColumns": [
        { "id": "no", "label": "No.", "width": 64, "sticky": true },
        { "id": "name", "label": "Name", "width": 160, "sticky": true },
        { "id": "position", "label": "Position", "width": 110, "sticky": true },
        { "id": "actype", "label": "A/C Type", "width": 110, "sticky": true }
      ],
      "airlines": [
        {
          "airlineId": "BKK_AIRWAYS",
          "airlineName": "BANGKOK AIRWAYS",
          "airlineCode": "PG",
          "aircraftTypes": [
            {
              "typeId": "A320",
              "typeName": "A320",
              "subtypes": [
                { "id": "PG_A320_V2500", "label": "A320 (IAE V2500)", "engine": "V2500", "width": 140 },
                { "id": "PG_A320_CFM56", "label": "A320 (CFM56)", "engine": "CFM56", "width": 140 }
              ]
            },
            {
              "typeId": "AT72",
              "typeName": "ATR 72",
              "subtypes": [
                { "id": "PG_AT72_PW127", "label": "ATR72 (PW127)", "engine": "PW127", "width": 140 }
              ]
            }
          ]
        },
        {
          "airlineId": "THAI_AIRASIA",
          "airlineName": "THAI AIRASIA",
          "airlineCode": "FD",
          "aircraftTypes": [
            {
              "typeId": "A320",
              "typeName": "A320",
              "subtypes": [
                { "id": "FD_A320_CFM56", "label": "A320 (CFM56)", "engine": "CFM56", "width": 140 },
                { "id": "FD_A320_LEAP", "label": "A320 (CFM LEAP-1A)", "engine": "LEAP-1A", "width": 140 }
              ]
            }
          ]
        }
      ]
    },
    "rows": [
      {
        "id": "staff-001",
        "staffNo": "001",
        "name": "Komsun Samart",
        "position": "EN",
        "aircraftType": "B1.1",
        "station": "BKK",
        "authorizations": {
          "BKK_AIRWAYS": {
            "PG_A320_V2500": { "status": "true", "authNo": "PG-AUTH-2024-01", "expiryDate": "2026-10-31" },
            "PG_A320_CFM56": { "status": "true", "authNo": "PG-AUTH-2024-02", "expiryDate": "2026-10-31" },
            "PG_AT72_PW127": { "status": "false" }
          },
          "THAI_AIRASIA": {
            "FD_A320_CFM56": { "status": "true", "authNo": "FD-AUTH-099", "expiryDate": "2026-08-15" },
            "FD_A320_LEAP": { "status": "pending", "authNo": "REQ-1204" }
          }
        }
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalRecords": 35,
      "totalPages": 2
    }
  }
}
```

### 3.2 Field Descriptions: Aircraft Licence

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `columns.airlines` | `Array<Airline>` | แถวบนสุด (Row 1): รายชื่อ Customer Airlines แต่ละสายการบิน (`colSpan` = ผลรวมคอลัมน์ย่อยทั้งหมดของสายการบินนั้น) |
| `columns.airlines[].aircraftTypes` | `Array<Type>` | แถวกลาง (Row 2): รุ่นเครื่องบินภายใต้สายการบินนั้น (`colSpan` = `subtypes.length`) |
| `columns.airlines[].aircraftTypes[].subtypes` | `Array<Subtype>` | แถวล่าง (Row 3): คอลัมน์แสดงจริงของแต่ละ Engine/Subtype |
| `rows[].authorizations` | `Record<string, Record<string, Cell>>` | โครงสร้าง 2 ระดับ: `[airlineId][subtypeId]` เพื่อ lookup ตรงกับคอลัมน์ได้อย่างแม่นยำ |
| `status` | `"true" \| "false" \| "pending"` | สถานะการถือสิทธิ์: `"true"` (อนุมัติ/มีสิทธิ์), `"false"` (ไม่มีสิทธิ์), `"pending"` (อยู่ระหว่างดำเนินการ) |
| `authNo` | `string?` | เลขที่ใบ Authorized Certificate ของสายการบินนั้น |
| `expiryDate` | `string?` | วันหมดอายุสิทธิ์ (ISO format `YYYY-MM-DD`) |

---

## 4. TypeScript Interface Definitions

คัดลอก Type เหล่านี้ไปใช้งานที่ Frontend (`lib/api/roster/certifying-staff.ts` หรือ `types/roster.ts`):

```typescript
// ==========================================
// Base Envelope Pattern
// ==========================================
export interface ApiResponse<T> {
  message: string;
  error: string | null;
  responseData: T;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}

export interface FixedColumn {
  id: string;
  label: string;
  width: number;
  sticky: boolean;
}

// ==========================================
// 1. AMEL Tab Models
// ==========================================
export interface AmelSubColumn {
  id: string;          // e.g. "A320-IAE_V2500"
  label: string;       // e.g. "IAE V2500"
  code: string;
  engine: string;
  width: number;
}

export interface AmelGroupColumn {
  id: string;          // e.g. "A320"
  aircraft: string;    // e.g. "A320"
  columns: AmelSubColumn[];
}

export interface AmelStaffQualification {
  qualified: boolean;
  licenceNo?: string;
  issueDate?: string;
  expiryDate?: string;
}

export interface AmelStaffRow {
  id: string;
  staffNo: string;
  name: string;
  position: string;
  aircraftType: string;
  station?: string;
  qualifications: Record<string, AmelStaffQualification>; // key: AmelSubColumn.id
}

export interface AmelMatrixResponseData {
  columns: {
    fixedColumns: FixedColumn[];
    groups: AmelGroupColumn[];
  };
  rows: AmelStaffRow[];
  pagination: PaginationMeta;
}

export type AmelApiResponse = ApiResponse<AmelMatrixResponseData>;

// ==========================================
// 2. Aircraft Licence Tab Models
// ==========================================
export interface AircraftLicenceSubtypeColumn {
  id: string;          // e.g. "PG_A320_V2500"
  label: string;       // e.g. "A320 (IAE V2500)"
  engine: string;
  width: number;
}

export interface AircraftLicenceTypeGroup {
  typeId: string;      // e.g. "A320"
  typeName: string;    // e.g. "A320"
  subtypes: AircraftLicenceSubtypeColumn[];
}

export interface AircraftLicenceAirlineGroup {
  airlineId: string;   // e.g. "BKK_AIRWAYS"
  airlineName: string; // e.g. "BANGKOK AIRWAYS"
  airlineCode: string; // e.g. "PG"
  aircraftTypes: AircraftLicenceTypeGroup[];
}

export type AuthorizationStatus = 'true' | 'false' | 'pending';

export interface AircraftLicenceAuthCell {
  status: AuthorizationStatus;
  authNo?: string;
  expiryDate?: string;
}

export interface AircraftLicenceStaffRow {
  id: string;
  staffNo: string;
  name: string;
  position: string;
  aircraftType: string;
  station?: string;
  authorizations: Record<string, Record<string, AircraftLicenceAuthCell>>; // [airlineId][subtypeId]
}

export interface AircraftLicenceMatrixResponseData {
  columns: {
    fixedColumns: FixedColumn[];
    airlines: AircraftLicenceAirlineGroup[];
  };
  rows: AircraftLicenceStaffRow[];
  pagination: PaginationMeta;
}

export type AircraftLicenceApiResponse = ApiResponse<AircraftLicenceMatrixResponseData>;
```

---

## 5. จุดเด่นของการออกแบบนี้ (Key Architecture Benefits)

1. **Dynamic Column Rendering**:
   - หน้าจอ Frontend ไม่ต้อง Hardcode รายการสายการบิน หรือรุ่นเครื่องบินลงในโค้ด
   - หากในอนาคตมีสายการบินลูกค้าใหม่ หรือแบบเครื่องบินใหม่ (เช่น A350, B787) Backend เพียงแค่เพิ่มรายการใน `columns` หน้าจอจะวาดตารางและจัดแถว Header หลายชั้นให้อัตโนมัติ

2. **O(1) Cell Value Lookup**:
   - ฝั่งข้อมูลพนักงาน (`rows`) เก็บข้อมูลสิทธิ์ด้วย Dictionary/Map Key (`qualifications[colId]` และ `authorizations[airlineId][colId]`)
   - ทำให้การเรนเดอร์ในแต่ละ Cell ไม่ต้องทำการวนลูป `.find()` ซ้ำๆ ช่วยให้ Table ขนาดใหญ่เลื่อนและแสดงผลได้อย่างรวดเร็ว (60 FPS)

3. **Multi-tier Colspan Calculation**:
   - `colSpan` ของแถวที่ 1 (Airlines) สามารถคำนวณได้ทันทีจาก:
     ```typescript
     const colSpan = airline.aircraftTypes.reduce((sum, t) => sum + t.subtypes.length, 0);
     ```
   - `colSpan` ของแถวที่ 2 (Aircraft Model):
     ```typescript
     const colSpan = typeGroup.subtypes.length;
     ```
   - สอดคล้อง 100% กับโครงสร้าง Table HTML Header ใน `page.tsx` ที่ได้ทำไว้แล้ว
