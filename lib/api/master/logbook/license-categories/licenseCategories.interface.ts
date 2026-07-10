// License Categories interfaces
export interface LicenseCategory {
  id: number;
  code: string;
  name: string;
}

export interface LicenseCategoriesResponse {
  message: string;
  responseData: LicenseCategory[];
  error: string;
}

// For dropdown/select components
export interface LicenseCategoryOption {
  value: number;
  label: string;
  code: string;
}
