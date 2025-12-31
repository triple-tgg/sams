export interface AirlineItem {
  id: number;
  code: string;
  name?: string;
  description?: string;
  isdelete?: boolean;
  createddate?: string;
  createdby?: string;
  updateddate?: string;
  updatedby?: string;
  colorForeground?: string;
  colorBackground?: string;
}

export interface ResAirlineItem {
  message: string;
  responseData: AirlineItem[];
  error: string;
}

// For paginated list
export interface AirlineListRequest {
  page: number;
  perPage: number;
}

export interface AirlineListResponse {
  message: string;
  responseData: AirlineItem[];
  page: number;
  perPage: number;
  total: number;
  totalAll: number;
  error: string;
}

// For upsert (create/update)
export interface AirlineUpsertRequest {
  id: number; // 0 for new, existing id for update
  code: string;
  name: string;
  description: string;
  isdelete: boolean;
  userName: string;
  colorForeground: string;
  colorBackground: string;
}

export interface AirlineUpsertResponse {
  message: string;
  responseData: AirlineItem | null;
  error: string;
}

// For get by ID
export interface AirlineByIdResponse {
  message: string;
  responseData: AirlineItem;
  error: string;
}

// For delete
export interface AirlineDeleteRequest {
  id: number;
  userName: string;
}

export interface AirlineDeleteResponse {
  message: string;
  responseData: null;
  error: string;
}
