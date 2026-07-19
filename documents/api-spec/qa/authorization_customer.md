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
| `status` | `string` \| `null` | No | Filter staff by a specific authorization status (e.g., `"VAL"`, `"NAP"`). |
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
          }
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
          }
        }
      ]
    }
  ]
}
```

---

## 2. Update Customer Authorization (and Staff SAMS Dates)

Updates a specific customer authorization status (e.g. from `pending` to `not_approve`) and/or updates the staff's core SAMS authorization dates/ratings. Based on the UI, editing an airline cell allows updating the global staff validity dates (`initDate`, `currDate`, `samsExp`) and `rating`.

- **Method**: `PUT`
- **Endpoint**: `/api/qa/authorization/customer/:staffId/airline/:airlineCode`

### Path Parameters
- `staffId` (string): The ID of the staff member.
- `airlineCode` (string): The code of the airline (e.g., `MNA`).

### Request Body (JSON)

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `status` | `string` | No | Update the customer authorization status for the specified airline (e.g. `valid`, `not_approve`, `suspended`). |
| `initDate` | `string` | No | ISO Date for "Date of Initial Issue". |
| `currDate` | `string` | No | ISO Date for "Date of Current Issue". |
| `samsExp` | `string` | No | ISO Date for "Date of Expire" (SAMS Authorization Expire). |
| `rating` | `string[]` | No | Array of aircraft types authorized (AMEL rating). |

### Example Request (Rejecting an Authorization)
```json
{
  "status": "not_approve"
}
```

### Example Request (Updating Staff Dates from Cell Edit)
```json
{
  "status": "valid",
  "initDate": "2022-05-10",
  "currDate": "2024-05-10",
  "samsExp": "2026-05-10",
  "rating": ["A320", "A330"]
}
```

### Response Payload
```json
{
  "status": "success",
  "message": "Customer authorization updated successfully.",
  "data": {
    "staffId": "0012",
    "airlineCode": "MNA",
    "updatedStatus": "valid"
  }
}
```

---

## TypeScript Definitions (For React Hooks)

Following the project's 2-file pattern, the types should be placed in `lib/api/qa/customer-auth.ts`.

```typescript
export interface CustomerAuthListRequest {
  searchKeyword: string;
  status: string | null;
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
