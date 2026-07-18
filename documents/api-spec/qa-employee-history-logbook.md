# QA API Specification - Employee History Logbook

## 1. List Employee History Logbook Records

- **Endpoint:** `GET /training/employee-logbook/list`
- **Method:** `GET`
- **Description:** Returns a paginated list of maintenance experiences logbook records for staff.
- **Category:** QA / Employee History

### Request Parameters (Query String)

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | string | Optional | Filter by staff name |
| `employeeId` | string | Optional | Filter by employee ID |
| `dateStart` | string | Optional | Filter by task start date (YYYY-MM-DD) |
| `dateEnd` | string | Optional | Filter by task end date (YYYY-MM-DD) |
| `page` | number | Optional | Page number (default: 1) |
| `perPage` | number | Optional | Number of items per page (default: 10) |

### Response Schema

```json
{
  "status": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "nameSurname": "PHAISAL SANGASANG",
        "employeeId": "0020",
        "licenseCategory": "A1",
        "dateToPerformTask": "30-Jun-24",
        "location": "BKK",
        "aircraftType": "AIRBUS A319/A320/A321 (IAE V2500)",
        "aircraftRegistration": "VT-IFN",
        "privilegedUsed": "B1/B2",
        "ataChapter": "5",
        "typeOfMaintenanceRating": "Transit Check",
        "typeOfTask": "Releasing aircraft to service (CRS)",
        "typeOfActivity": "CRS",
        "maintenanceReferences": "1115945/N030",
        "fileAttachmentUrl": "https://samsaero.sharepoint.com/...",
        "performedDuration": "2 Hr.",
        "authorizedStampNo": "LD06"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "perPage": 10,
      "totalPages": 10
    }
  }
}
```

### Field Descriptions

- `nameSurname` (string): Full name of the employee.
- `employeeId` (string): Employee ID.
- `licenseCategory` (string): License category (e.g., A1, B1).
- `dateToPerformTask` (string): Formatted date when the task was performed.
- `location` (string): Station or location (e.g., BKK).
- `aircraftType` (string): The type and engine of the aircraft.
- `aircraftRegistration` (string): Registration number of the aircraft.
- `privilegedUsed` (string): Privilege used (e.g., B1/B2, B1, B2).
- `ataChapter` (string): ATA chapter number.
- `typeOfMaintenanceRating` (string): The maintenance rating (e.g., Transit Check, Daily Check).
- `typeOfTask` (string): The specific task description.
- `typeOfActivity` (string): Activity code (e.g., CRS).
- `maintenanceReferences` (string): Log number or reference ID.
- `fileAttachmentUrl` (string): URL to the SharePoint or file attachment for reference.
- `performedDuration` (string): Duration of the task (e.g., '2 Hr.').
- `authorizedStampNo` (string): The authorized stamp number (e.g., LD06).
