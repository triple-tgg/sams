# API Specification: Authorization Monitoring — CRS

**Document status:** Ready for Backend Implementation  
**Version:** 1.0  
**Last updated:** 2026-07-19  
**Frontend module:** Quality Assurance > Authorization Monitoring > Monitoring CRS  
**Base path:** `/authorization/monitoring-crs`

## 1. Objective

Provide one backend-owned read model for determining and displaying whether each
certifying staff member can issue a **Certificate of Release to Service (CRS)**
for each customer airline.

The backend must calculate eligibility. The frontend must not reconstruct the
compliance decision by joining SAMs and Customer Authorization responses itself.
This ensures that the matrix, dashboard, export, and any later release workflow
use the same rule and the same evaluation timestamp.

This specification provides three read endpoints:

1. `POST /authorization/monitoring-crs/listdata` — paginated monitoring matrix.
2. `GET /authorization/monitoring-crs/byid/{staffId}` — complete explanation for one staff member.
3. `GET /authorization/monitoring-crs/summary` — small aggregate payload for the dashboard.

No write endpoint is introduced. Source records continue to be maintained by
the existing SAMs Authorization and Customer Authorization APIs.

## 2. Source of Truth

The service must evaluate current records from these domains in one consistent
database read/snapshot:

- active staff master record;
- SAMs Authorization, including `isCrs`, expiry date, and authorized aircraft types;
- Customer Authorization per airline, including status, expiry date, and authorized aircraft types;
- active customer-airline master data;
- active aircraft-type-license master data.

Only non-deleted records may participate. If duplicate active records exist for
the same staff/airline, the API must not silently choose one; see `DATA_CONFLICT`
under reason codes.

## 3. Eligibility Model

### 3.1 Evaluation time

- The backend evaluates all dates against one `evaluatedAtUtc` value.
- Default: current server time in UTC.
- Date-only expiry values are valid through `23:59:59.999` in the configured
  business timezone (`Asia/Bangkok`) and then converted to UTC for comparison.
- The same `evaluatedAtUtc` must be returned in the response.
- `expiryWarningDays` defaults to `90` and affects warning display only. It does
  not make an otherwise valid authorization ineligible.

### 3.2 Staff-airline eligibility

A staff member is eligible for one airline only when all conditions below are true:

1. The staff record is active.
2. An active, non-deleted SAMs Authorization exists.
3. The SAMs Authorization has `isCrs = true`.
4. The SAMs Authorization has not expired at `evaluatedAtUtc`.
5. An active, non-deleted Customer Authorization exists for the airline.
6. Customer Authorization status code is `VAL`.
7. Customer Authorization has not expired at `evaluatedAtUtc`.
8. SAMs and Customer Authorization share at least one active aircraft type.

The backend must return the aircraft intersection in `eligibleAircraftTypes`.
Eligibility is scoped to those aircraft types only.

A required expiry date that is null, empty, or invalid is blocking. The service
must not interpret a missing expiry date as unlimited validity.

### 3.3 Airline scope for version 1

All active customer airlines returned by the Customer Airline master are treated
as in scope. A missing Customer Authorization is therefore `NOT_ISSUED`, not
silently excluded.

If a staff-to-airline scope table is introduced later, `isInScope` may be driven
by that table without changing the response contract. Airlines with
`isInScope = false` must return `NOT_IN_SCOPE` and must not affect staff coverage.

### 3.4 Staff coverage status

Coverage and operational eligibility are separate fields:

| Code | Meaning |
|---|---|
| `FULL` | Eligible for every in-scope airline. |
| `PARTIAL` | Eligible for at least one, but not every, in-scope airline. |
| `NONE` | Not eligible for any in-scope airline. |

`hasAnyCrsEligibility` answers whether the staff member can issue CRS for at
least one airline. It is `true` for both `FULL` and `PARTIAL`.

### 3.5 Cell eligibility status

| Code | `isEligible` | Meaning |
|---|---:|---|
| `ELIGIBLE` | `true` | All rules pass and no authorization expires within the warning window. |
| `AT_RISK` | `true` | All rules pass, but SAMs or Customer Authorization expires within `expiryWarningDays`. |
| `INELIGIBLE` | `false` | One or more blocking rules fail. |
| `NOT_IN_SCOPE` | `false` | Airline is excluded from this staff member's scope. Reserved for future scoped operation. |

## 4. Endpoint 1 — Monitoring Matrix

### `POST /authorization/monitoring-crs/listdata`

Returns a paginated staff list and the per-airline CRS decision used by the
Monitoring CRS matrix.

### 4.1 Authorization

- Bearer token required.
- Route permission: `QA_AUTHORIZATION` with view permission.
- Return HTTP `403` when the caller lacks permission.

### 4.2 Request body

```json
{
  "searchKeyword": "",
  "coverageStatus": "",
  "samsStatus": "",
  "airlineId": null,
  "hasIssues": false,
  "expiryWarningDays": 90,
  "page": 1,
  "perPage": 20
}
```

| Field | Type | Required | Rules |
|---|---|---:|---|
| `searchKeyword` | string | Yes | Empty string means no search. Search employee name, employee ID, and SAMs Auth No. Trim whitespace; case-insensitive. |
| `coverageStatus` | string | Yes | `""`, `FULL`, `PARTIAL`, or `NONE`. |
| `samsStatus` | string | Yes | `""`, `VAL`, `EXPIRING`, `EXP`, or `NOT_ISSUED`. |
| `airlineId` | number/null | Yes | When provided, return/filter eligibility for that active airline. |
| `hasIssues` | boolean | Yes | When `true`, return staff with coverage `PARTIAL`/`NONE` or any `AT_RISK` cell. |
| `expiryWarningDays` | number | No | Default `90`; allowed range `1..365`. |
| `page` | number | Yes | 1-indexed; minimum `1`. |
| `perPage` | number | Yes | Allowed range `1..100`; default `20`. |

All filters are combined using logical `AND`.

### 4.3 Success response — HTTP 200

```json
{
  "message": "success",
  "responseData": {
    "evaluatedAtUtc": "2026-07-19T10:00:00.000Z",
    "expiryWarningDays": 90,
    "summary": {
      "totalStaff": 134,
      "fullCrs": 24,
      "partialCrs": 76,
      "noCrs": 34,
      "atRiskStaff": 12,
      "eligibleStaff": 100
    },
    "airlines": [
      {
        "airlineId": 1,
        "code": "JYH",
        "name": "9 Air",
        "colorForeground": "#ffffff",
        "colorBackground": "#ff8800",
        "displayOrder": 1
      }
    ],
    "staffRows": [
      {
        "staffId": 163,
        "employeeId": "EMP-0163",
        "staffName": "Aleks Reymer",
        "jobTitle": "Certifying Staff",
        "isActive": true,
        "samsAuthorization": {
          "authorizationSamsId": 1,
          "authNo": "34353233",
          "statusCode": "VAL",
          "statusName": "Valid",
          "isCrs": true,
          "initialIssueDate": "2022-07-19T00:00:00.000Z",
          "currentIssueDate": "2026-07-19T00:00:00.000Z",
          "expiryDate": "2027-07-19T00:00:00.000Z",
          "daysToExpiry": 365,
          "aircraftTypes": [
            { "id": 1, "code": "A320", "name": "A320 Family" }
          ]
        },
        "coverageStatus": "PARTIAL",
        "hasAnyCrsEligibility": true,
        "eligibleAirlineCount": 1,
        "inScopeAirlineCount": 2,
        "atRiskAirlineCount": 0,
        "blockingReasonCodes": ["CUSTOMER_AUTH_NOT_ISSUED"],
        "airlineEligibilities": [
          {
            "airlineId": 1,
            "airlineCode": "JYH",
            "isInScope": true,
            "eligibilityStatus": "ELIGIBLE",
            "isEligible": true,
            "customerAuthorizationId": 15,
            "customerStatusCode": "VAL",
            "customerStatusName": "Valid",
            "initialIssueDate": "2023-01-10T00:00:00.000Z",
            "currentIssueDate": "2026-01-10T00:00:00.000Z",
            "expiryDate": "2027-01-10T00:00:00.000Z",
            "daysToExpiry": 175,
            "eligibleAircraftTypes": [
              { "id": 1, "code": "A320", "name": "A320 Family" }
            ],
            "reasonCodes": []
          },
          {
            "airlineId": 2,
            "airlineCode": "AIC",
            "isInScope": true,
            "eligibilityStatus": "INELIGIBLE",
            "isEligible": false,
            "customerAuthorizationId": null,
            "customerStatusCode": "NOT_ISSUED",
            "customerStatusName": "Not Issued",
            "initialIssueDate": null,
            "currentIssueDate": null,
            "expiryDate": null,
            "daysToExpiry": null,
            "eligibleAircraftTypes": [],
            "reasonCodes": ["CUSTOMER_AUTH_NOT_ISSUED"]
          }
        ]
      }
    ]
  },
  "page": 1,
  "perPage": 20,
  "total": 134,
  "totalAll": 134,
  "error": ""
}
```

### 4.4 Pagination and summary semantics

- `totalAll`: all active certifying staff before filters.
- `total`: staff count after filters and before pagination.
- `summary`: aggregate after filters and before pagination. It must not summarize
  only the current page.
- `airlines`: unique active airlines in display order. When `airlineId` is set,
  this array may contain only the selected airline.
- `staffRows`: current page only.

### 4.5 Default sorting

1. `NONE` before `PARTIAL` before `FULL`.
2. Staff with blocking expired records before missing/pending records.
3. Earliest non-null expiry date first.
4. `staffName` ascending, then `staffId` ascending for stable pagination.

## 5. Endpoint 2 — Staff CRS Detail

### `GET /authorization/monitoring-crs/byid/{staffId}`

Returns the same backend decision for one staff member, with sufficient source
information to explain every eligible or blocked airline cell.

### Path parameter

| Field | Type | Required | Rules |
|---|---|---:|---|
| `staffId` | number | Yes | Positive existing staff ID. |

### Query parameters

| Field | Type | Required | Rules |
|---|---|---:|---|
| `expiryWarningDays` | number | No | Default `90`; range `1..365`. |

### Success response — HTTP 200

```json
{
  "message": "success",
  "responseData": {
    "evaluatedAtUtc": "2026-07-19T10:00:00.000Z",
    "staffRow": {
      "staffId": 163,
      "employeeId": "EMP-0163",
      "staffName": "Aleks Reymer",
      "jobTitle": "Certifying Staff",
      "isActive": true,
      "samsAuthorization": {},
      "coverageStatus": "PARTIAL",
      "hasAnyCrsEligibility": true,
      "eligibleAirlineCount": 1,
      "inScopeAirlineCount": 2,
      "atRiskAirlineCount": 0,
      "blockingReasonCodes": ["CUSTOMER_AUTH_NOT_ISSUED"],
      "airlineEligibilities": []
    }
  },
  "error": ""
}
```

`staffRow`, `samsAuthorization`, and `airlineEligibilities` use the full shapes
defined in Endpoint 1. Empty objects/arrays in this shortened example are not
permission to omit defined properties in the actual response.

## 6. Endpoint 3 — Dashboard Summary

### `GET /authorization/monitoring-crs/summary`

Returns a lightweight aggregate without fetching the matrix rows.

### Query parameters

| Field | Type | Required | Rules |
|---|---|---:|---|
| `expiryWarningDays` | number | No | Default `90`; range `1..365`. |

### Success response — HTTP 200

```json
{
  "message": "success",
  "responseData": {
    "evaluatedAtUtc": "2026-07-19T10:00:00.000Z",
    "expiryWarningDays": 90,
    "totalStaff": 134,
    "fullCrs": 24,
    "partialCrs": 76,
    "noCrs": 34,
    "eligibleStaff": 100,
    "atRiskStaff": 12,
    "eligibleAirlineCells": 421,
    "inScopeAirlineCells": 612,
    "coveragePercent": 69
  },
  "error": ""
}
```

`coveragePercent` is rounded to the nearest integer:

```text
eligibleAirlineCells / inScopeAirlineCells * 100
```

Return `0` when `inScopeAirlineCells` is zero.

## 7. Reason Codes

The API must return stable machine-readable reason codes. The frontend may map
them to localized text but must not parse human messages.

| Code | Blocking | Meaning |
|---|---:|---|
| `STAFF_INACTIVE` | Yes | Staff master record is inactive. |
| `SAMS_AUTH_NOT_ISSUED` | Yes | No active SAMs Authorization exists. |
| `SAMS_AUTH_NOT_CRS` | Yes | SAMs Authorization has `isCrs = false`. |
| `SAMS_AUTH_EXPIRED` | Yes | SAMs Authorization expiry is before the evaluation time. |
| `SAMS_AUTH_EXPIRY_MISSING` | Yes | SAMs Authorization expiry is null, empty, or invalid. |
| `SAMS_AUTH_EXPIRING` | No | SAMs Authorization expires within the warning window. |
| `CUSTOMER_AUTH_NOT_ISSUED` | Yes | No active Customer Authorization exists for the airline. |
| `CUSTOMER_AUTH_PENDING` | Yes | Customer status is `PEN` or empty. |
| `CUSTOMER_AUTH_NOT_APPROVED` | Yes | Customer status is `NAP`. |
| `CUSTOMER_AUTH_NOT_COMPLETE` | Yes | Customer status is `NCP`. |
| `CUSTOMER_AUTH_SUSPENDED` | Yes | Customer status is `SUS`. |
| `CUSTOMER_AUTH_EXPIRED` | Yes | Customer Authorization expiry is before the evaluation time. |
| `CUSTOMER_AUTH_EXPIRY_MISSING` | Yes | Customer Authorization expiry is null, empty, or invalid. |
| `CUSTOMER_AUTH_EXPIRING` | No | Customer Authorization expires within the warning window. |
| `AUTH_SCOPE_MISMATCH` | Yes | SAMs and Customer Authorization have no active aircraft type in common. |
| `AIRLINE_NOT_IN_SCOPE` | No | Airline is excluded from staff scope. Reserved for future use. |
| `DATA_CONFLICT` | Yes | Multiple active source records make the decision ambiguous. |

When multiple rules fail, return all applicable codes in deterministic order:
staff, SAMs, Customer Authorization, scope, warning.

## 8. Status Mapping

### 8.1 SAMs status returned by this API

| Code | Rule |
|---|---|
| `VAL` | Active, `isCrs = true`, and expiry is outside the warning window. |
| `EXPIRING` | Otherwise valid but expiry is within the warning window. |
| `EXP` | Expired. |
| `NOT_ISSUED` | No active record. |
| `NOT_CRS` | Active record exists but `isCrs = false`. |
| `DATA_CONFLICT` | Multiple active records prevent a deterministic result. |

### 8.2 Customer status source codes

The service must recognize these existing master codes:

| Code | Meaning |
|---|---|
| `VAL` | Valid |
| `NAP` | Not Approved |
| `NCP` | Not Complete |
| `SUS` | Suspended |
| `PEN` or empty | Pending |

An unknown stored status code is a data-quality error and must produce
`DATA_CONFLICT`; it must never default to Valid. A required date that cannot be
parsed must return the matching `*_EXPIRY_MISSING` reason.

## 9. Validation and Error Contract

Use the existing response envelope where possible.

### HTTP 400 — invalid filter

```json
{
  "message": "validation_error",
  "responseData": null,
  "error": {
    "code": "INVALID_REQUEST",
    "details": [
      { "field": "perPage", "message": "perPage must be between 1 and 100." }
    ]
  }
}
```

### HTTP 401 / 403

- `401`: missing, invalid, or expired token.
- `403`: authenticated but missing `QA_AUTHORIZATION` view permission.

### HTTP 404 — detail endpoint only

```json
{
  "message": "not_found",
  "responseData": null,
  "error": {
    "code": "STAFF_NOT_FOUND",
    "details": []
  }
}
```

### HTTP 500

Return a correlation ID. Do not return SQL, stack traces, tokens, or internal
exception messages.

## 10. Consistency with Existing APIs

The monitoring service is derived from, and must be invalidated/recomputed after,
successful writes to:

- `POST /authorization/sams-auth/upsert`
- `POST /authorization/customer-auth/upsert`
- relevant staff, airline, aircraft-type, and authorization-status master writes

The monitoring service must use the same records and status codes exposed by:

- `POST /authorization/sams-auth/listdata`
- `POST /authorization/customer-auth/listdata`
- `POST /authorization/customer-auth/byid`
- `GET /master/authorization-statuses`

No response from this service may report a source record as Valid when its source
API reports the same record as expired, deleted, suspended, or not approved at
the same evaluation time.

## 11. Performance and Query Requirements

- Do not execute one query per staff-airline cell.
- Load the current page of staff IDs first, then batch-load SAMs, Customer
  Authorization, aircraft scopes, and airline master data.
- Summary counts must be calculated in the database or from an equivalent set-based query.
- Target response time: p95 below `1.5 seconds` for `perPage = 20` and up to 200 active airlines.
- Suggested indexes:
  - SAMs Authorization: `(staffId, isdelete, expiryDate)`;
  - Customer Authorization: `(staffId, airlineId, isdelete, expiryDate)`;
  - Customer status foreign key;
  - SAMs/Customer aircraft junction tables by parent ID and aircraft type ID.
- A short cache of at most 60 seconds is acceptable only if invalidated after the
  source writes listed in Section 10.

## 12. Acceptance Criteria

Backend implementation is accepted when all cases below pass at a fixed
`evaluatedAtUtc`.

1. Valid SAMs + Valid Customer + shared aircraft scope returns `ELIGIBLE`.
2. The same records expiring within 90 days return `AT_RISK` and remain eligible.
3. Expired SAMs makes every in-scope airline `INELIGIBLE` with `SAMS_AUTH_EXPIRED`.
4. `isCrs = false` makes every in-scope airline ineligible with `SAMS_AUTH_NOT_CRS`.
5. Missing Customer Authorization returns `CUSTOMER_AUTH_NOT_ISSUED`.
6. Customer status `NAP`, `NCP`, `SUS`, and `PEN` maps to the matching reason code.
7. Missing or invalid SAMs/Customer expiry returns the matching `*_EXPIRY_MISSING` reason and is ineligible.
8. Valid SAMs and Customer records with no shared aircraft type return `AUTH_SCOPE_MISMATCH`.
9. One eligible cell and one ineligible cell returns `PARTIAL` and `hasAnyCrsEligibility = true`.
10. All in-scope cells eligible returns `FULL`.
11. Zero eligible cells returns `NONE` and `hasAnyCrsEligibility = false`.
12. Summary values do not change when only `page` changes.
13. Search/filter totals are calculated before pagination.
14. Duplicate active source records return `DATA_CONFLICT` and never Valid.
15. A source upsert is reflected immediately after successful cache invalidation.
16. A user without `QA_AUTHORIZATION` view permission receives HTTP `403`.

## 13. Out of Scope

- Creating or editing SAMs Authorization.
- Creating or editing Customer Authorization.
- Authority Authorization maintenance.
- Issuing or signing an actual CRS document.
- Evaluating training-course completion, recency, work experience, or logbook
  requirements. These require separately approved business rules before they can
  become blocking conditions.
- Historical reconstruction before the source tables support effective dating.

If any out-of-scope condition later becomes part of CRS eligibility, it must be
added as a new explicit reason code and covered by acceptance tests. It must not
be introduced as an undocumented rule.
