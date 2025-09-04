// Interface for Aircraft Check Types
export interface AircraftCheckType {
  id: number;
  code: string;
  name: string;
  description: string;
  isdelete: boolean;
  createddate: string;
  createdby: string;
  updateddate: string;
  updatedby: string;
}

// Interface for Aircraft Check Sub Types
export interface AircraftCheckSubType {
  id: number;
  code: string;
  name: string;
  description: string;
  isdelete: boolean;
  createddate: string;
  createdby: string;
  updateddate: string;
  updatedby: string;
}

// Response interface for master data
export interface MasterDataResponse<T> {
  message: string;
  responseData: T[];
  error: string | null;
}