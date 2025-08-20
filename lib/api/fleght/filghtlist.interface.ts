
export interface Pagination {
  page: number
  perPage: number
  total: number
}
export interface ResFlightItem extends Pagination {
  message: string
  error: string
  responseData: FlightItem[]
}


export interface FlightItem {
  id: number
  airlineObj: AirlineObj
  stationObj: StationObj
  acReg: string
  acType: string
  arrivalFlightNo: string
  arrivalDate: string
  arrivalStatime: string
  arrivalAtaTime: string
  departureFlightNo: string
  departureDate: any
  departureStdTime: any
  departureAtdtime: any
  bayNo: string
  thfNo: string
  statusObj: StatusObj
  note: string
  datasource: string
  isDelete: boolean
  createdDate: string
  createdBy: string
  updatedDate: string
  updatedBy: string
  isFiles: boolean
  isLlineMaintenances: boolean
  state: string
}
export interface AirlineObj {
  id: number
  code: string
  name: string
  description: string
  isdelete: boolean
  createddate: string
  createdby: string
  updateddate: string
  updatedby: string
}

export interface StationObj {
  id: number
  code: string
  name: string
  description: string
  isdelete: boolean
  createddate: string
  createdby: string
  updateddate: string
  updatedby: string
}

export interface StatusObj {
  id: number
  code: string
  name: string
  description: string
  isdelete: boolean
  createddate: string
  createdby: string
  updateddate: string
  updatedby: string
}