// Department / Position interfaces for Organization management

export interface DepartmentItem {
  id: string;
  code: string;
  name: string;
  isdelete: boolean;
  createddate?: string;
  createdby?: string;
  updateddate?: string;
  updatedby?: string;
}

export interface PositionItem {
  id: string;
  departmentId: string; // belongs directly to a department
  positionCode: string;
  positionName: string;
  isdelete: boolean;
  createddate?: string;
  createdby?: string;
  updateddate?: string;
  updatedby?: string;
}

// Union type for tree node selection
export type OrgNodeType = "department" | "position";

export interface SelectedNode {
  type: OrgNodeType;
  id: string;
}


