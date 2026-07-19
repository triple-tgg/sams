# Print Preview — Employee Profile and Training Record

This document details the API specifications used for generating the **Print Preview — Employee Profile and Training Record** in the Human Resources > Staff List > Staff by id page.

## 1. Get Staff Details
Used to retrieve personal information, employment history, education, and licenses for the Staff Profile section.

- **Method:** `GET`
- **Endpoint:** `/master/staff-management/byid/{id}`

### Response Data Structure (JSON)
```json
{
  "message": "success",
  "responseData": {
    "id": 1,
    "employeeId": "EMP-001",
    "name": "John",
    "fullNameEn": "John Doe",
    "title": "Mr.",
    "dateOfBirth": "1990-01-01",
    "placeOfBirth": "Bangkok",
    "nationality": "Thai",
    "idCardNo": "1234567890123",
    "phone": "0800000000",
    "email": "john.doe@sams.aero",
    "address": "123 Street, Bangkok",
    "isActive": true,
    "startDate": "2020-01-01",
    "profileImagePath": "https://url-to-image",
    "jobTitle": "Engineer",
    "departmentObj": { "id": 1, "name": "Engineering" },
    "positionObj": { "id": 1, "name": "Senior Mechanic" },
    "educations": [
      {
        "degree": "Bachelor of Engineering",
        "institution": "University of Aviation",
        "fieldOfStudy": "Aerospace",
        "year": 2012,
        "isdelete": false
      }
    ],
    "workExperiences": [
      {
        "jobTitle": "Junior Mechanic",
        "company": "Aviation Services Co.",
        "periodFrom": "2013-01-01",
        "periodTo": "2019-12-31",
        "description": "General maintenance",
        "isdelete": false
      }
    ],
    "staffAmelLicenseList": [
      {
        "licenseNumber": "AMEL-123",
        "aircraftRatings": "A320, B737",
        "issuedDate": "2015-01-01",
        "expiryDate": "2025-01-01",
        "limitations": "None",
        "isdelete": false
      }
    ]
  },
  "error": null
}
```

## 2. Get Staff Training Dashboard
Used to retrieve the previous and current training records for the Training Record section of the Print Preview.

- **Method:** `GET`
- **Endpoint:** `/staffs/{staffId}/trainings/dashboard`

### Response Data Structure (JSON)
```json
{
  "message": "success",
  "responseData": {
    "summary": {
      "totalCourses": 10,
      "expired": 0,
      "permanent": 1,
      "expiringSoon": 0
    },
    "records": [
      {
        "id": 1,
        "courseName": "Human Factors",
        "dateFrom": "2024-01-01",
        "dateTo": "2024-01-02",
        "validUntil": "2026-01-01",
        "providedBy": "SAMS Academy",
        "status": "Completed"
      }
    ],
    "histories": [
      {
        "id": 2,
        "courseName": "A320 Familiarization",
        "academyName": "Airbus Training Center",
        "dateFrom": "2021-01-01",
        "dateTo": "2021-01-10"
      }
    ]
  },
  "error": null
}
```

## 3. Print and PDF Export

- **Print** waits for document fonts and images, then opens the browser print
  dialog. Print CSS keeps the Next.js root mounted and reveals only the preview
  overlay; hiding the root with `display: none` also hides the nested document.
- **Download PDF** renders each `.pp-page` separately at 2× resolution and adds
  it to a portrait A4 PDF. The generated filename is
  `Employee-Profile-{employeeId}.pdf`.
- PDF generation is client-side and makes no additional API request. Remote
  profile images require CORS permission from their storage host to be embedded.
