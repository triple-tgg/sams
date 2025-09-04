# Services Step Data Mapping Function

## Overview
ฟังก์ชัน `mapDataThfToServicesStep` ใช้สำหรับแปลงข้อมูลจาก API response มาเป็น format ที่ใช้ใน Services Step form

## Function Signature
```typescript
export const mapDataThfToServicesStep = (
  queryData: LineMaintenanceThfResponse | null
): ServicesFormInputs | null
```

## Input Data Structure (API Response)
```typescript
interface LineMaintenanceThfResponse {
  responseData: {
    aircraft: Aircraft;
    lineMaintenance: LineMaintenance;
    // ... other fields
  }
}
```

## Output Data Structure (Form Data)
```typescript
interface ServicesFormInputs {
  aircraftChecks: Array<{
    maintenanceTypes: string;
    maintenanceSubTypes: string[];
    laeMH?: string;
    mechMH?: string;
  }>;
  additionalDefectRectification: boolean;
  additionalDefects?: Array<{...}>;
  servicingPerformed: boolean;
  fluid: {...};
  addPersonnels: boolean;
  personnel?: Personnel[];
  flightDeck: boolean;
  flightDeckInfo?: Array<{...}>;
  aircraftTowing: boolean;
  aircraftTowingInfo?: Array<{...}>;
}
```

## Mapping Logic

### 1. Aircraft Checks
- **Source**: `aircraft.aircraftCheckType`
- **Target**: `aircraftChecks`
- **Logic**: แปลง API checkType และ checkSubType เป็น form format
- **Default**: หากไม่มีข้อมูล จะสร้าง array เปล่า 1 รายการ

### 2. Additional Defects
- **Source**: `aircraft.additionalDefect`
- **Target**: `additionalDefects`
- **Logic**: แปลง defect details, ATA chapter, LAE/Mech hours
- **Controlled by**: `lineMaintenance.isAdditionalDefect`

### 3. Fluid Servicing
- **Source**: `aircraft.fluidServicing`
- **Target**: `fluid`
- **Logic**: 
  - แปลง fluid name เป็น dropdown option
  - แปลง engine oil arrays
  - แปลง hydraulic oil values
- **Controlled by**: `lineMaintenance.isFluidServicing`

### 4. Personnel
- **Source**: `aircraft.personnels`
- **Target**: `personnel`
- **Logic**: แปลง staff info, time ranges, notes
- **Controlled by**: `lineMaintenance.isPersonnels`

### 5. Flight Deck & Aircraft Towing
- **Source**: `aircraft.aircraftTowing`
- **Target**: `flightDeckInfo` และ `aircraftTowingInfo`
- **Logic**: แปลง date/time information
- **Controlled by**: `lineMaintenance.isFlightdeck` และ `lineMaintenance.isAircraftTowing`

## Usage Example

```typescript
// ใน useLineMaintenancesQueryThfByFlightId hook
const servicesData = useMemo(() => {
  return mapDataThfToServicesStep(query.data || null);
}, [query.data]);

// ใน component
const { servicesData } = useLineMaintenancesQueryThfByFlightId({ flightId });

// ส่งไปยัง ServicesStep component
<ServicesStep initialData={servicesData} />
```

## Key Features

1. **Null Safety**: จัดการกรณีที่ data เป็น null/undefined
2. **Type Safety**: ใช้ TypeScript interfaces ที่ครบถ้วน
3. **Default Values**: กำหนดค่า default สำหรับ field ที่ไม่มีข้อมูล
4. **Boolean Controls**: ใช้ flags จาก lineMaintenance เพื่อควบคุมการแสดงข้อมูล
5. **Data Transformation**: แปลงข้อมูล API format เป็น form format

## Error Handling
- ถ้า `queryData` เป็น null จะ return null
- ถ้า `responseData` ไม่มี จะ return null
- ทุก field มี fallback values

## Performance
- ใช้ `useMemo` ใน hook เพื่อ optimize การ re-calculation
- คำนวณใหม่เมื่อ `query.data` เปลี่ยนแปลงเท่านั้น

## Testing
สามารถ test ได้โดยส่ง mock data:
```typescript
const mockData = {
  responseData: {
    aircraft: { /* mock aircraft data */ },
    lineMaintenance: { /* mock line maintenance data */ }
  }
};

const result = mapDataThfToServicesStep(mockData);
expect(result.aircraftChecks).toBeDefined();
```
