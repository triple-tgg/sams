// Privilege interfaces
export interface Privilege {
  id: number;
  code: string;
  name: string;
}

export interface PrivilegesResponse {
  message: string;
  responseData: Privilege[];
  error: string;
}

// For dropdown/select components
export interface PrivilegeOption {
  value: number;
  label: string;
  code: string;
}
