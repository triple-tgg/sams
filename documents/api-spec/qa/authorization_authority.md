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

```json
{
  "searchKeyword": "",
  "authorityId": null,
  "status": "",
  "page": 1,
  "perPage": 200
}
```

### Response Payload

```json
{
    "message": "success",
    "responseData": {
        "authorities": [
            {
                "authorizationAuthorityMasterId": 2,
                "code": "CAAM",
                "name": "Civil Aviation Authority of Malaysia"
            },
            {
                "authorizationAuthorityMasterId": 1,
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
                        "authorizationAuthorityId": 15,
                        "staffId": 163,
                        "authorizationAuthorityMasterId": 2,
                        "authorizationAuthorityMaster": {
                            "id": 2,
                            "code": "CAAM",
                            "name": "Civil Aviation Authority of Malaysia"
                        },
                        "authorizationStatusId": 1,
                        "authorizationStatus": {
                            "id": 1,
                            "code": "VAL",
                            "name": "Valid"
                        },
                        "initialIssueDate": "2022-07-19T00:00:00",
                        "currentIssueDate": "2026-07-19T00:00:00",
                        "expireDate": "2026-07-21T00:00:00",
                        "isdelete": false,
                        "licenseNo": "CAAM-1234",
                        "licenseLevel": "B1",
                        "createdby": "system",
                        "createddate": "2026-06-06T17:47:47.056746",
                        "updatedby": null,
                        "updateddate": null,
                        "authorityCode": "CAAM",
                        "status": "Valid",
                        "aviationAuthorityLicenseAircrafts": [
                            {
                                "id": 1,
                                "authorizationAuthoritieId": 15,
                                "aircraftTypeLicenseId": 1,
                                "isdelete": false
                            }
                        ]
                    }
                ]
            }
        ],
        "page": 1,
        "perPage": 200,
        "total": 50,
        "totalAll": 50
    },
    "error": ""
}
```

### Field Notes

| Field | Description |
|:---|:---|
| `authorities[].authorizationAuthorityMasterId` | Primary key for authority columns |
| `licenses[].authorizationAuthorityId` | Unique ID of this license record |
| `licenses[].authorizationAuthorityMasterId` | Foreign key matching authority column |
| `licenses[].authorizationStatus` | Status object with `id`, `code`, `name` (may be null for legacy data) |
| `licenses[].status` | Legacy flat status string (e.g. "Valid", "Expiring", "Expired") |
| `licenses[].authorityCode` | Legacy flat authority code (e.g. "CAAM") |

> **Note**: The `status` field may appear as either a nested `authorizationStatus` object or a flat `status` string. The frontend handles both via fallback chains.

---

## 2. Get Authority License Detail

Retrieves full details of a specific authority license for editing.

- **Method**: `GET`
- **Endpoint**: `/authorization/authority/byid/{id}`

### Response Payload

```json
{
    "message": "success",
    "responseData": {
        "id": 15,
        "staffId": 163,
        "staffName": "Aleks Reymer",
        "employeeId": "EMP-0163",
        "aviationAuthorityId": 2,
        "aviationAuthorityCode": "CAAM",
        "aviationAuthorityName": "Civil Aviation Authority of Malaysia",
        "licenseNo": "CAAM-1234",
        "licenseLevel": "B1",
        "initialIssueDate": "2022-07-19T00:00:00",
        "currentIssueDate": "2026-07-19T00:00:00",
        "expireDate": "2026-07-21T00:00:00",
        "aircrafts": [
            {
                "id": 1,
                "aircraftTypeLicenseId": 1,
                "code": "A319",
                "name": "A319"
            }
        ]
    },
    "error": ""
}
```

---

## 3. Upsert Authority License

Updates or creates a specific authority authorization for a staff member.

- **Method**: `POST`
- **Endpoint**: `/authorization/authority-license/upsert`

### Request Body (JSON)

| Field | Type | Required | Description |
|:---|:---|:---|:---|
| `authorizationAuthorityId` | `number` | Yes | The ID of the existing license record (0 if new). |
| `staffId` | `number` | Yes | The ID of the staff member. |
| `authorizationAuthorityMasterId` | `number` | Yes | The master authority ID. |
| `licenseNo` | `string \| null` | No | License number. |
| `licenseLevel` | `string \| null` | No | License level (e.g. "B1", "B2"). |
| `initialIssueDate` | `string \| null` | No | ISO date for initial issue. |
| `currentIssueDate` | `string \| null` | No | ISO date for current issue. |
| `expireDate` | `string \| null` | No | ISO date for expiry. |
| `aircraftTypeLicenseIds` | `number[]` | No | Array of aircraft type license IDs. |
| `authorizationStatusId` | `number \| null` | No | Status ID (from master statuses). |

### Example Request (Updating)

```json
{
    "authorizationAuthorityId": 15,
    "staffId": 163,
    "authorizationAuthorityMasterId": 2,
    "licenseNo": "CAAM-1234",
    "licenseLevel": "B1",
    "initialIssueDate": "2022-05-10",
    "currentIssueDate": "2024-05-10",
    "expireDate": "2026-05-10",
    "aircraftTypeLicenseIds": [1, 2],
    "authorizationStatusId": 1
}
```

### Example Request (Rejecting)

```json
{
    "authorizationAuthorityId": 15,
    "staffId": 163,
    "authorizationAuthorityMasterId": 2,
    "licenseNo": null,
    "licenseLevel": null,
    "initialIssueDate": null,
    "currentIssueDate": null,
    "expireDate": null,
    "aircraftTypeLicenseIds": [],
    "authorizationStatusId": 3
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

## 4. Get All Authorities (Master List)

Retrieves the full list of aviation authorities for filtering and display.

- **Method**: `GET`
- **Endpoint**: `/authorization/authority/list`

### Response Payload

```json
{
    "message": "success",
    "responseData": [
        {
            "id": 1,
            "code": "CAAT",
            "name": "Civil Aviation Authority of Thailand",
            "colorCode": "#1d4ed8"
        },
        {
            "id": 2,
            "code": "CAAM",
            "name": "Civil Aviation Authority of Malaysia",
            "colorCode": "#7c3aed"
        }
    ],
    "error": ""
}
```
