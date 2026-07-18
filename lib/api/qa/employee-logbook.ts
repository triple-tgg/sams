import axiosConfig from "@/lib/axios.config";

export interface LogbookRecord {
  id: number;
  nameSurname: string;
  employeeId: string;
  licenseCategory: string;
  dateToPerformTask: string;
  location: string;
  aircraftType: string;
  aircraftRegistration: string;
  privilegedUsed: string;
  ataChapter: string;
  typeOfMaintenanceRating: string;
  typeOfTask: string;
  typeOfActivity: string;
  maintenanceReferences: string;
  fileAttachmentUrl: string;
  performedDuration: string;
  authorizedStampNo: string;
}

export interface GetLogbookParams {
  name?: string;
  employeeId?: string;
  dateStart?: string;
  dateEnd?: string;
  page?: number;
  perPage?: number;
}

export interface GetLogbookResponse {
  list: LogbookRecord[];
  pagination: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export const getEmployeeLogbookRecords = async (params: GetLogbookParams): Promise<GetLogbookResponse> => {
  // Using a mock implementation until the real API is ready
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        list: [
          {
            id: 1,
            nameSurname: "PHAISAL SANGASANG",
            employeeId: "0020",
            licenseCategory: "A1",
            dateToPerformTask: "30-Jun-24",
            location: "BKK",
            aircraftType: "AIRBUS A319/A320/A321 (IAE V2500)",
            aircraftRegistration: "VT-IFN",
            privilegedUsed: "B1/B2",
            ataChapter: "5",
            typeOfMaintenanceRating: "Transit Check",
            typeOfTask: "Releasing aircraft to service (CRS)",
            typeOfActivity: "CRS",
            maintenanceReferences: "1115945/N030",
            fileAttachmentUrl: "https://samsaero.sharepoint.com/...",
            performedDuration: "2 Hr.",
            authorizedStampNo: "LD06"
          },
          {
            id: 2,
            nameSurname: "PHAISAL SANGASANG",
            employeeId: "0020",
            licenseCategory: "A1",
            dateToPerformTask: "06-Jul-24",
            location: "BKK",
            aircraftType: "AIRBUS A319/A320/A321 (CFM LEAP-1A)",
            aircraftRegistration: "VT-IQY",
            privilegedUsed: "B1/B2",
            ataChapter: "5",
            typeOfMaintenanceRating: "Transit Check",
            typeOfTask: "Releasing aircraft to service (CRS)",
            typeOfActivity: "CRS",
            maintenanceReferences: "LOG NO.596125/N017",
            fileAttachmentUrl: "https://samsaero.sharepoint.com/...",
            performedDuration: "2 Hr.",
            authorizedStampNo: "LD06"
          },
          {
            id: 3,
            nameSurname: "PHAISAL SANGASANG",
            employeeId: "0020",
            licenseCategory: "A1",
            dateToPerformTask: "07-Jul-24",
            location: "BKK",
            aircraftType: "AIRBUS A319/A320/A321 (IAE V2500)",
            aircraftRegistration: "VT-IFH",
            privilegedUsed: "B1/B2",
            ataChapter: "5",
            typeOfMaintenanceRating: "Transit Check",
            typeOfTask: "Releasing aircraft to service (CRS)",
            typeOfActivity: "CRS",
            maintenanceReferences: "LOG NO.568315/N037",
            fileAttachmentUrl: "https://samsaero.sharepoint.com/...",
            performedDuration: "2 Hr.",
            authorizedStampNo: "LD06"
          },
          {
            id: 4,
            nameSurname: "PHAISAL SANGASANG",
            employeeId: "0020",
            licenseCategory: "A1",
            dateToPerformTask: "16-Jul-24",
            location: "BKK",
            aircraftType: "AIRBUS A319/A320/A321 (CFM LEAP-1A)",
            aircraftRegistration: "VT-IPW",
            privilegedUsed: "B1/B2",
            ataChapter: "5",
            typeOfMaintenanceRating: "Transit Check",
            typeOfTask: "Releasing aircraft to service (CRS)",
            typeOfActivity: "CRS",
            maintenanceReferences: "LOG NO.1445326",
            fileAttachmentUrl: "https://samsaero.sharepoint.com/...",
            performedDuration: "2 Hr.",
            authorizedStampNo: "LD06"
          },
          {
            id: 5,
            nameSurname: "PHAISAL SANGASANG",
            employeeId: "0020",
            licenseCategory: "A1",
            dateToPerformTask: "17-Jul-24",
            location: "BKK",
            aircraftType: "AIRBUS A319/A320/A321 (IAE V2500)",
            aircraftRegistration: "VT-IFQ",
            privilegedUsed: "B1/B2",
            ataChapter: "5",
            typeOfMaintenanceRating: "Transit Check",
            typeOfTask: "Releasing aircraft to service (CRS)",
            typeOfActivity: "CRS",
            maintenanceReferences: "LOG NO.452414",
            fileAttachmentUrl: "https://samsaero.sharepoint.com/...",
            performedDuration: "2 Hr.",
            authorizedStampNo: "LD06"
          },
          {
            id: 6,
            nameSurname: "PHAISAL SANGASANG",
            employeeId: "0020",
            licenseCategory: "A1",
            dateToPerformTask: "17-Jul-24",
            location: "BKK",
            aircraftType: "AIRBUS A319/A320/A321 (CFM LEAP-1A)",
            aircraftRegistration: "VT-IPK",
            privilegedUsed: "B1/B2",
            ataChapter: "5",
            typeOfMaintenanceRating: "Transit Check",
            typeOfTask: "Releasing aircraft to service (CRS)",
            typeOfActivity: "CRS",
            maintenanceReferences: "LOG NO.413841",
            fileAttachmentUrl: "https://samsaero.sharepoint.com/...",
            performedDuration: "2 Hr.",
            authorizedStampNo: "LD06"
          }
        ],
        pagination: {
          total: 6,
          page: 1,
          perPage: 10,
          totalPages: 1
        }
      });
    }, 500); // simulate network delay
  });
  
  // Real implementation will look like this:
  /*
  const res = await axiosConfig.get("/training/employee-logbook/list", { params });
  return res.data.data;
  */
};
