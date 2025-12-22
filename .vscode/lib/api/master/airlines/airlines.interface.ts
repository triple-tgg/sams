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
}

export interface ResAirlineItem {
  message: string;
  responseData: AirlineItem[];
  error: string;
}
