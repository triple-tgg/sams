// Single flight data interface
export interface FlightItem {
  id: number;
  airlinesCode: string;
  stationsCode: string;
  acReg: string;
  acTypeCode: string;
  arrivalFlightNo: string;
  arrivalDate: string;
  arrivalStaTime: string;
  arrivalAtaTime: string;
  departureFlightNo: string;
  departureDate: string;
  departureStdTime: string;
  departureAtdTime: string;
  bayNo: string;
  thfNo: string;
  statusCode: string;
  note: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ResFlightItem {
  success: boolean;
  message: string;
  responseData: FlightItem;
}
