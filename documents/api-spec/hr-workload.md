# API Specification: HR Workload Management

> **Module**: HR → Workload  
> **Frontend Route**: `/hr/workload`  
> **Status**: Mock UI created — awaiting backend integration  
> **Last Updated**: 2026-08-10

---

## Overview

The Workload Management page shows **Aircraft Maintenance Workload Summary** data for a selected month. It consists of two main sections:

1. **Summary Dashboard** — aggregate KPIs, service-hour bar chart, and flights-by-time-slot breakdown
2. **Mechanic Detail Table** — per-mechanic workload detail with utilization rates

---

## 1. GET Workload Summary

> Fetches aggregate KPIs and time-slot distribution for a selected period.

### Endpoint

```
GET /hr/workload/summary
```

### Query Parameters

| Parameter   | Type     | Required | Description                           | Example      |
|-------------|----------|----------|---------------------------------------|--------------|
| `startDate` | `string` | ✅       | Start date (ISO 8601, `YYYY-MM-DD`)   | `2026-07-01` |
| `endDate`   | `string` | ✅       | End date (ISO 8601, `YYYY-MM-DD`)     | `2026-07-31` |
| `stationId` | `number` | ❌       | Filter by station                     | `1`          |

### Response

```json
{
  "success": true,
  "data": {
    "kpi": {
      "totalFlights": 248,
      "avgFlightsPerDay": 8.0,
      "totalServiceHr": 612.5,
      "totalMechanics": 12,
      "avgServiceHrPerPerson": 51.0,
      "peakTimeSlot": "18:00-22:00",
      "peakPercentage": 36
    },
    "timeSlots": [
      {
        "timeSlot": "00:00-06:00",
        "flights": 36,
        "percentage": 15,
        "workload": "Low"
      },
      {
        "timeSlot": "06:00-12:00",
        "flights": 61,
        "percentage": 25,
        "workload": "Normal"
      },
      {
        "timeSlot": "12:00-18:00",
        "flights": 62,
        "percentage": 25,
        "workload": "Normal"
      },
      {
        "timeSlot": "18:00-22:00",
        "flights": 72,
        "percentage": 29,
        "workload": "High"
      },
      {
        "timeSlot": "22:00-24:00",
        "flights": 17,
        "percentage": 6,
        "workload": "Low"
      }
    ]
  }
}
```

### Response Type Definitions

```typescript
type WorkloadLevel = "Very High" | "High" | "Normal" | "Low";

interface WorkloadSummaryKpi {
  /** Total flights serviced in the period */
  totalFlights: number;
  /** Average flights per day */
  avgFlightsPerDay: number;
  /** Total service hours across all mechanics */
  totalServiceHr: number;
  /** Number of active mechanics in the period */
  totalMechanics: number;
  /** Average service hours per person per month */
  avgServiceHrPerPerson: number;
  /** Time slot with highest service hour concentration */
  peakTimeSlot: string;
  /** Peak time slot percentage of total service hours */
  peakPercentage: number;
}

interface TimeSlotDistribution {
  /** Time range label, e.g. "06:00-12:00" */
  timeSlot: string;
  /** Number of flights handled in this slot */
  flights: number;
  /** Percentage of total flights */
  percentage: number;
  /** Computed workload level for this slot */
  workload: WorkloadLevel;
}

interface WorkloadSummaryResponse {
  success: boolean;
  data: {
    kpi: WorkloadSummaryKpi;
    timeSlots: TimeSlotDistribution[];
  };
}
```

---

## 2. GET Mechanic Workload Detail

> Fetches per-mechanic workload breakdown for a selected period.

### Endpoint

```
GET /hr/workload/mechanics
```

### Query Parameters

| Parameter   | Type     | Required | Description                           | Example      |
|-------------|----------|----------|---------------------------------------|--------------|
| `startDate` | `string` | ✅       | Start date (ISO 8601, `YYYY-MM-DD`)   | `2026-07-01` |
| `endDate`   | `string` | ✅       | End date (ISO 8601, `YYYY-MM-DD`)     | `2026-07-31` |
| `stationId` | `number` | ❌       | Filter by station                     | `1`          |
| `sortBy`    | `string` | ❌       | Sort column (default: `serviceHr`)    | `serviceHr`  |
| `sortOrder` | `string` | ❌       | Sort direction (default: `desc`)      | `desc`       |

### Response

```json
{
  "success": true,
  "data": {
    "summary": {
      "maxServiceMechanic": {
        "staffId": 1,
        "name": "สมชาย โชดี",
        "serviceHr": 73.5
      },
      "maxFlightsPerMechanic": 54,
      "avgServicePerFlight": 2.47,
      "highVeryHighCount": 4,
      "totalMechanics": 12
    },
    "mechanics": [
      {
        "staffId": 1,
        "employeeCode": "EMP-001",
        "name": "สมชาย โชดี",
        "flights": 54,
        "serviceHr": 73.5,
        "avgHrPerFlight": 1.36,
        "workload": "Very High",
        "utilization": 92,
        "remark": "ควรตรวจ OT / Fatigue"
      },
      {
        "staffId": 2,
        "employeeCode": "EMP-002",
        "name": "ณัฐพล วิสนนะ",
        "flights": 50,
        "serviceHr": 69.8,
        "avgHrPerFlight": 1.40,
        "workload": "High",
        "utilization": 87,
        "remark": "ภาระงานสูงต่อเนื่อง"
      }
    ]
  }
}
```

### Response Type Definitions

```typescript
interface MechanicWorkloadSummary {
  maxServiceMechanic: {
    staffId: number;
    name: string;
    serviceHr: number;
  };
  /** Maximum flights handled by a single mechanic */
  maxFlightsPerMechanic: number;
  /** Average service hours per flight across all mechanics */
  avgServicePerFlight: number;
  /** Number of mechanics at High or Very High workload */
  highVeryHighCount: number;
  /** Total active mechanics */
  totalMechanics: number;
}

interface MechanicWorkloadItem {
  /** Staff ID from staff table */
  staffId: number;
  /** Employee code */
  employeeCode: string;
  /** Full name (Thai) */
  name: string;
  /** Number of flights handled */
  flights: number;
  /** Total service hours */
  serviceHr: number;
  /** Average hours per flight (serviceHr / flights) */
  avgHrPerFlight: number;
  /** Computed workload level based on thresholds */
  workload: WorkloadLevel;
  /** Utilization percentage (serviceHr / maxPossibleHr * 100) */
  utilization: number;
  /** Manager/system remark for anomalies */
  remark: string;
}

interface MechanicWorkloadResponse {
  success: boolean;
  data: {
    summary: MechanicWorkloadSummary;
    mechanics: MechanicWorkloadItem[];
  };
}
```

---

## 3. GET Service Hour Chart Data (Top N Mechanics)

> Fetches top N mechanics by service hours for the horizontal bar chart.

### Endpoint

```
GET /hr/workload/top-mechanics
```

### Query Parameters

| Parameter   | Type     | Required | Description                           | Example      |
|-------------|----------|----------|---------------------------------------|--------------|
| `startDate` | `string` | ✅       | Start date (ISO 8601, `YYYY-MM-DD`)   | `2026-07-01` |
| `endDate`   | `string` | ✅       | End date (ISO 8601, `YYYY-MM-DD`)     | `2026-07-31` |
| `limit`     | `number` | ❌       | Number of results (default: `8`)      | `8`          |
| `stationId` | `number` | ❌       | Filter by station                     | `1`          |

### Response

```json
{
  "success": true,
  "data": [
    {
      "staffId": 1,
      "name": "สมชาย โชดี",
      "serviceHr": 73.5,
      "workload": "Very High"
    },
    {
      "staffId": 2,
      "name": "ณัฐพล วิสนนะ",
      "serviceHr": 69.8,
      "workload": "High"
    }
  ]
}
```

### Response Type Definitions

```typescript
interface TopMechanicItem {
  staffId: number;
  name: string;
  serviceHr: number;
  workload: WorkloadLevel;
}

interface TopMechanicsResponse {
  success: boolean;
  data: TopMechanicItem[];
}
```

---

## Workload Level Thresholds

The backend computes `workload` level per mechanic based on their monthly service hours:

| Level     | Service Hr / Person / Month | Color Code |
|-----------|----------------------------|------------|
| Low       | < 40 hr                    | Blue       |
| Normal    | 40 – 60 hr                | Green      |
| High      | 60 – 70 hr                | Orange     |
| Very High | > 70 hr                    | Red        |

> [!NOTE]  
> These thresholds should ideally be configurable via system settings rather than hardcoded.

---

## Utilization Calculation

```
utilization = (mechanic.serviceHr / maxPossibleServiceHr) * 100
```

Where `maxPossibleServiceHr` is the expected monthly working hours (e.g., 80 hr/month for standard shift).

---

## Future Filter Extensions (Recommended)

The mockup notes recommend the following additional filters for production use:

| Filter              | Type              | Purpose                                    |
|---------------------|-------------------|--------------------------------------------|
| `stationId`         | `number`          | Filter by maintenance station              |
| `aircraftTypeId`    | `number`          | Filter by aircraft type                    |
| `customerAirlineId` | `number`          | Filter by customer airline                 |
| `shift`             | `string`          | Filter by shift (Morning/Evening/Night)    |
| `staffType`         | `string`          | Mechanic vs Certifying Staff               |
| `isWorkday`         | `boolean`         | Working day vs Holiday                     |

---

## Frontend Integration Files (to be created)

Following the project's **2-file API pattern**:

| File                                      | Purpose                              |
|-------------------------------------------|--------------------------------------|
| `lib/api/hr/workload.ts`                  | Pure API functions + TypeScript types |
| `lib/api/hr/workload.hooks.ts`            | React Query hooks                    |

### Planned Query Keys

```typescript
export const workloadKeys = {
  summary: (startDate: string, endDate: string) =>
    ["workload", "summary", startDate, endDate] as const,
  mechanics: (startDate: string, endDate: string) =>
    ["workload", "mechanics", startDate, endDate] as const,
  topMechanics: (startDate: string, endDate: string, limit: number) =>
    ["workload", "topMechanics", startDate, endDate, limit] as const,
};
```
