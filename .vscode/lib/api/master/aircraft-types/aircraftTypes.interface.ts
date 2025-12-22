// Aircraft Types interfaces
export interface AircraftType {
  id: number;
  code: string;
}

export interface AircraftTypesResponse {
  message: string;
  responseData: AircraftType[];
  error: string;
}

// For dropdown/select components
export interface AircraftTypeOption {
  value: string;
  label: string;
  id: number;
}
