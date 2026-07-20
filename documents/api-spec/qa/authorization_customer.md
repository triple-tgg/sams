# API Specification: Customer Authorization (QA)

This document outlines the API endpoints required for the **Customer Authorization** tab in the SAMS Engineering Maintenance System. 

## Base URL
`/api/qa/authorization/customer`

---

## 1. Get Customer Authorization Matrix (List Staff)

Retrieves a paginated list of staff members along with their customer authorizations (matrix format across airlines).

- **Method**: `POST`
- **Endpoint**: `/api/authorization/customer-auth/listdata`

### Request Body (JSON)

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `page` | `number` | Yes | The page number (1-indexed). |
| `perPage` | `number` | Yes | Number of records per page (default: 20). |
| `searchKeyword` | `string` | No | Keyword to search by staff name or staff ID. |
| `status` | `number` \| `null` | No | Authorization status master ID. Select All sends `null`. |
| `airlineId` | `number` \| `null` | No | Filter by a specific airline ID. |

### Response payload
```json
{
  "message": "success",
  "responseData": [
    {
      "staffId": 163,
      "employeeName": "Aleks Reymer",
      "employeeId": "EMP-0163",
      "staff": {
        "id": 163,
        "code": "EMP-0163",
        "name": "Aleks Reymer",
        "title": "Mr.",
        "jobTitle": "Commercial Manager",
        "email": "Aleks@sams.aero",
        "startDate": "2026-05-19"
      },
      "airlineStatuses": [
        {
          "airlineId": 1,
          "airlineCode": "JYH",
          "status": "VAL",
          "airlineStatus": {
            "id": 1,
            "code": "VAL",
            "name": "Valid"
          },
          "airline": {
            "id": 1,
            "code": "JYH",
            "name": "9 Air",
            "colorForeground": "#E5E7EB",
            "colorBackground": "#ff8800"
          },
          "initialIssueDate": "2026-05-19T00:00:00",
          "currentIssueDate": "2026-05-19T00:00:00",
          "expiryDate": "2027-05-19T00:00:00",
          "aircrafts": [
            {
              "id": 6,
              "aircraftTypeLicensId": 1,
              "code": "A319",
              "name": "A319"
            }
          ]
        },
        {
          "airlineId": 3,
          "airlineCode": "AIC",
          "status": "",
          "airlineStatus": null,
          "airline": {
            "id": 3,
            "code": "AIC",
            "name": "Air India",
            "colorForeground": "#ffffff",
            "colorBackground": "#ff0000"
          },
          "initialIssueDate": null,
          "currentIssueDate": null,
          "expiryDate": null,
          "aircrafts": []
        }
      ]
    }
  ]
}
```

---

## 1.1 Get Customer Authorization Records

Returns one record per staff and airline authorization. The frontend joins this response to `/listdata` with `staffId + airlineId` so that each Matrix cell has the correct `authorizationCustomerId` for detail and upsert operations.

- **Method**: `POST`
- **Endpoint**: `/api/authorization/customer-auth/list`

```json
{
  "searchKeyword": "",
  "status": null,
  "airlineId": null
}
```

Compatibility rules:

- `/listdata` supplies the Matrix roster and airline columns.
- `/list` is authoritative for existing records: `authorizationCustomerId`, status, dates, and aircraft type license IDs.
- Join key: `authorizationCustomer.staffId + authorizationCustomer.airlineId` to `/listdata.staffId + airlineStatuses[].airlineId`.
- `authorizationCustomerAircraftTypeLicenses[].aircraftTypeLicensId` matches `/listdata.airlineStatuses[].aircrafts[].aircraftTypeLicensId`.
- Aircraft labels are resolved from `/master/aircraft-type-licenses` by ID so Matrix, tooltip, modal, and upsert use the same value. If `/listdata` returns a conflicting label for the same ID, the master label wins.
- Current observed `/listdata` response reports `perPage: 134` after requesting `perPage: 20`; the frontend applies defensive client-side pagination until the API honors the requested page size.

---

The Matrix and tooltip read display fields from `/listdata`. The edit modal uses dates, status, record ID, and aircraft type IDs already joined from `/list`; no separate `/byid` request is required.

## 2. Update Customer Authorization (and Staff SAMS Dates)

Creates or updates an airline-specific Customer Authorization record.

- **Method**: `POST`
- **Endpoint**: `/api/authorization/customer-auth/upsert`

### Request Body (JSON)

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `number` | Yes | Customer Authorization record ID; use `0` when creating. |
| `staffId` | `number` | Yes | Staff ID. |
| `airlineId` | `number` | Yes | Airline ID. |
| `authorizationStatusId` | `number` | Yes | Authorization status master ID. |
| `initialIssueDate` | `string` | Yes | Initial issue date. |
| `currentIssueDate` | `string` | Yes | Current issue date. |
| `expiryDate` | `string` | Yes | Expiry date. |
| `aircraftTypeIds` | `number[]` | Yes | Aircraft type license IDs. |

Authorization dates are calendar dates, not instants. The frontend reads the `YYYY-MM-DD` portion without converting between UTC and local time, and sends `initialIssueDate`, `currentIssueDate`, and `expiryDate` as `YYYY-MM-DD`.

### Example Request
```json
{
  "id": 1,
  "staffId": 163,
  "airlineId": 48,
  "authorizationStatusId": 1,
  "initialIssueDate": "2026-05-19",
  "currentIssueDate": "2026-05-19",
  "expiryDate": "2027-05-19",
  "aircraftTypeIds": [1, 2]
}
```

### Response Payload
```json
{
  "message": "success",
  "responseData": "Saved successfully.",
  "error": ""
}
```

---

## TypeScript Definitions (For React Hooks)

Following the project's 2-file pattern, the types should be placed in `lib/api/qa/customer-auth.ts`.

```typescript
export interface CustomerAuthListRequest {
  searchKeyword: string;
  status: number | null;
  airlineId: number | null;
  page: number;
  perPage: number;
}

export interface CustomerAuthStaffItem {
  staffId: number;
  employeeName: string;
  employeeId: string;
  staff: {
    id: number;
    code: string;
    name: string;
    title: string;
    jobTitle: string;
    email: string;
    startDate: string;
    [key: string]: any;
  };
  airlineStatuses: Array<{
    airlineId: number;
    airlineCode: string;
    status: string; // e.g., "VAL", "NAP", ""
    airlineStatus: {
      id: number;
      code: string;
      name: string;
      [key: string]: any;
    } | null;
    airline: {
      id: number;
      code: string;
      name: string;
      colorForeground: string;
      colorBackground: string;
      [key: string]: any;
    };
  }>;
}

export interface CustomerAuthListResponse {
  message: string;
  responseData: CustomerAuthStaffItem[];
}

export interface UpdateCustomerAuthRequest {
  status?: string;
  initDate?: string;
  currDate?: string;
  samsExp?: string;
  rating?: string[];
}
```
