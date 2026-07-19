# API Specification: Authority Authorization (QA)

This document outlines the API endpoints required for the **Authority Authorization** tab under Authorization Monitoring in the SAMS Engineering Maintenance System. 

## Base URL
`/api/authorization/authority`

---

## 1. Get Authority Authorization List (Matrix)

Retrieves a list of staff members along with their aviation authority licenses (matrix format across authorities).

- **Method**: `POST`
- **Endpoint**: `/authorization/authority/listdata`

### Request Body (JSON)

*Currently, the UI sends an empty object, but it can be expanded for pagination or filtering in the future.*

```json
{}
```

### Response Payload

```json
{
    "message": "success",
    "responseData": {
        "authorities": [
            {
                "aviationAuthorityId": 2,
                "code": "CAAM",
                "name": "Civil Aviation Authority of Malaysia"
            },
            {
                "aviationAuthorityId": 1,
                "code": "CAAT",
                "name": "Civil Aviation Authority of Thailand"
            }
        ],
        "staffRows": [
            {
                "staffId": 163,
                "staffName": "Aleks Reymer",
                "employeeId": "EMP-0163",
                "profileImagePath": "",
                "licenses": [
                    {
                        "authorityId": 2,
                        "aviationAuthorityId": 2,
                        "authorityCode": "CAAM",
                        "currentIssueDate": "2026-07-19T00:00:00",
                        "expireDate": "2026-07-21T00:00:00",
                        "status": "VAL",
                        "aviationAuthorityLicense": {
                            "initialIssueDate": "2022-07-19T00:00:00",
                            "licenseNo": "CAAM-1234"
                        },
                        "aviationAuthorityLicenseAircrafts": [
                            {
                                "aircraftTypeLicenseId": 1
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

## 2. Upsert Authority Authorization (Proposed)

Updates or creates a specific authority authorization for a staff member (e.g. from `pending` to `not_approve` or updating dates/aircrafts). This is triggered when saving from the Edit Modal in the UI.

- **Method**: `POST`
- **Endpoint**: `/authorization/authority/upsert`

### Request Body (JSON)

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `number` | Yes | The ID of the existing license record (0 if new). |
| `staffId` | `number` | Yes | The ID of the staff member. |
| `aviationAuthorityId` | `number` | Yes | The ID of the aviation authority. |
| `status` | `string` | No | Status code (e.g., `"VAL"` for valid, `"NAP"` for not approved). |
| `initialIssueDate` | `string` | No | ISO Date for "Date of Initial Issue". |
| `currentIssueDate` | `string` | No | ISO Date for "Date of Current Issue". |
| `expireDate` | `string` | No | ISO Date for "Date of Expire". |
| `aircraftTypeIds` | `number[]` | No | Array of authorized aircraft type IDs. |

### Example Request (Updating from Cell Edit)

```json
{
  "id": 15,
  "staffId": 163,
  "aviationAuthorityId": 2,
  "status": "VAL",
  "initialIssueDate": "2022-05-10T00:00:00",
  "currentIssueDate": "2024-05-10T00:00:00",
  "expireDate": "2026-05-10T00:00:00",
  "aircraftTypeIds": [1, 2]
}
```

### Example Request (Rejecting an Authorization)

```json
{
  "id": 15,
  "staffId": 163,
  "aviationAuthorityId": 2,
  "status": "NAP"
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

Following the project's 2-file pattern, the types should be placed in `lib/api/qa/authorization/authority-auth.ts`.

```typescript
export interface AuthorityAuthResponse {
  message: string;
  responseData: {
    authorities: Array<{
      aviationAuthorityId: number;
      code: string;
      name: string;
    }>;
    staffRows: Array<{
      staffId: number;
      staffName: string;
      employeeId: string;
      profileImagePath: string | null;
      licenses: Array<{
        authorityId: number;
        aviationAuthorityId: number;
        authorityCode: string;
        currentIssueDate: string | null;
        expireDate: string | null;
        status: string;
        aviationAuthorityLicense: {
          initialIssueDate?: string | null;
          licenseNo?: string | null;
          [key: string]: any;
        } | null;
        aviationAuthorityLicenseAircrafts: Array<{
          aircraftTypeLicenseId: number;
          [key: string]: any;
        }> | null;
      }>;
    }>;
  };
}

export interface UpsertAuthorityAuthRequest {
  id: number;
  staffId: number;
  aviationAuthorityId: number;
  status?: string;
  initialIssueDate?: string;
  currentIssueDate?: string;
  expireDate?: string;
  aircraftTypeIds?: number[];
}
```
