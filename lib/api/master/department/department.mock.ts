// Mock data for Department / Position
// Replace with real API calls when backend is ready

import type { DepartmentItem, PositionItem } from "./department.interface";

export const MOCK_DEPARTMENTS: DepartmentItem[] = [
  {
    id: "D001",
    code: "MNT",
    name: "Maintenance",
    isdelete: false,
    createddate: "2025-01-15T10:00:00Z",
    createdby: "admin",
  },
  {
    id: "D002",
    code: "CMD",
    name: "Compliance Monitoring",
    isdelete: false,
    createddate: "2025-01-15T10:00:00Z",
    createdby: "admin",
  },
  {
    id: "D003",
    code: "SMD",
    name: "Safety Management",
    isdelete: false,
    createddate: "2025-01-15T10:00:00Z",
    createdby: "admin",
  },
];

export const MOCK_POSITIONS: PositionItem[] = [
  {
    id: "P001",
    departmentId: "D001",
    positionCode: "CSE",
    positionName: "Chief Station Engineer",
    isdelete: false,
    createddate: "2025-03-01T10:00:00Z",
    createdby: "admin",
  },
  {
    id: "P002",
    departmentId: "D001",
    positionCode: "DE",
    positionName: "Duty Engineer",
    isdelete: false,
    createddate: "2025-03-01T10:00:00Z",
    createdby: "admin",
  },
  {
    id: "P003",
    departmentId: "D001",
    positionCode: "ACS",
    positionName: "Aircraft Certifying Staff",
    isdelete: false,
    createddate: "2025-03-01T10:00:00Z",
    createdby: "admin",
  },
];

// Helper: generate next ID
export function generateId(prefix: string, items: { id: string }[]): string {
  const maxNum = items.reduce((max, item) => {
    const num = parseInt(item.id.replace(prefix, ""), 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);
  return `${prefix}${String(maxNum + 1).padStart(3, "0")}`;
}
