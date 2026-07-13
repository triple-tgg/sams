// Mock data for Manager Mapping
import type { StaffOption, ManagerMappingItem } from "./managerMapping.interface";

export const MOCK_STAFF: StaffOption[] = [
  {
    id: 1,
    employeeId: "EMP-0101",
    fullNameTh: "สมชาย ประเสริฐ",
    fullNameEn: "Somchai Prasert",
    nationality: "Thai",
    phone: "081-234-5678",
    email: "somchai@sams.aero",
    department: "Maintenance",
    position: "Chief Station Engineer",
    startDate: "2020-03-15",
  },
  {
    id: 2,
    employeeId: "EMP-0102",
    fullNameTh: "อภิญญา สุขสวัสดิ์",
    fullNameEn: "Apinya Suksawat",
    nationality: "Thai",
    phone: "082-345-6789",
    email: "apinya@sams.aero",
    department: "Compliance Monitoring",
    position: "Compliance Manager",
    startDate: "2019-08-01",
  },
  {
    id: 3,
    employeeId: "EMP-0103",
    fullNameTh: "วิชัย คุ้มค่า",
    fullNameEn: "Wichai Khumkha",
    nationality: "Thai",
    phone: "083-456-7890",
    email: "wichai@sams.aero",
    department: "Safety Management",
    position: "Safety Manager",
    startDate: "2021-01-10",
  },
  {
    id: 4,
    employeeId: "EMP-0104",
    fullNameTh: "ณัฐธยาน์ เลิศชัย",
    fullNameEn: "Nattaya Lertchai",
    nationality: "Thai",
    phone: "084-567-8901",
    email: "nattaya@sams.aero",
    department: "Maintenance",
    position: "Duty Engineer",
    startDate: "2022-05-20",
  },
  {
    id: 5,
    employeeId: "EMP-0163",
    fullNameTh: "อเล็กซ์ เรย์เมอร์",
    fullNameEn: "Aleks Reymer",
    nationality: "Thai",
    phone: "085-678-9012",
    email: "aleks@sams.aero",
    department: "Maintenance",
    position: "Commercial Manager",
    startDate: "2026-05-19",
  },
];

// D001 (MNT) is mapped to staff 1 (Somchai)
export const MOCK_MAPPINGS: ManagerMappingItem[] = [
  { departmentId: "D001", staffId: 1 },
];
