export interface StatusItem {
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

export interface ResStatusItem {
  message: string;
  responseData: StatusItem[];
  error: string;
}
