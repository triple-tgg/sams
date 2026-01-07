// Station interfaces for paginated API

export interface StationItem {
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

// Legacy interface for backward compatibility with existing code
export interface ResStationItem {
  message: string;
  responseData: StationItem[];
  error: string;
}


// List request/response
export interface StationListRequest {
  page: number;
  perPage: number;
}

export interface StationListResponse {
  message: string;
  responseData: StationItem[];
  page: number;
  perPage: number;
  total: number;
  totalAll: number;
  error: string;
}

// Get by ID response
export interface StationByIdResponse {
  message: string;
  responseData: StationItem;
  error: string;
}

// Upsert (create/update) request
export interface StationUpsertRequest {
  id: number; // 0 for new, existing id for update
  code: string;
  name: string;
  description: string;
  userName: string;
  isdelete: boolean;
}

export interface StationUpsertResponse {
  message: string;
  responseData: StationItem | null;
  error: string;
}

// Delete request/response
export interface StationDeleteRequest {
  id: number;
  userName: string;
}

export interface StationDeleteResponse {
  message: string;
  responseData: null;
  error: string;
}
