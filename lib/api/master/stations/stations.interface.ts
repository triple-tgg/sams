export interface StationItem {
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

export interface ResStationItem {
  message: string;
  responseData: StationItem[];
  error: string;
}
