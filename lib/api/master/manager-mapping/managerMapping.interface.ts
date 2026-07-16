// Manager Mapping interfaces
// Maps one Staff (Manager) to one Department (1:1)

export interface StaffOption {
  id: number;
  employeeId: string; // e.g. "EMP-0163"
  fullNameTh: string;
  fullNameEn: string;
  nationality: string;
  phone: string;
  email: string;
  department: string;
  position: string;
  startDate: string; // ISO date
}

export interface ManagerMappingItem {
  chiefId: number;          // id of the chief record (for upsert/delete)
  departmentId: string;     // staffDepartmentId as string (for matching)
  staffId: number;
}
