
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
  flightsId: number | null
  flightInfosId: number | null
  airlineObj: AirlineObj
  stationObj: StationObj
  acReg: string
  acType: string
  acTypeObj: {
    id: string
    code: string
    name: string
    isDelete: boolean
    createdDate: string
    createdBy: string
    updatedDate: string
    updatedBy: string
  },
  arrivalFlightNo: string
  arrivalDate: string
  arrivalStatime: string
  arrivalAtaTime: string
  departureFlightNo: string
  departureDate: string | null
  departureStdTime: string | null
  departureAtdtime: string | null
  bayNo: string
  statusObj: StatusObj
  note: string
  datasource: string
  isDelete: boolean
  createdDate: string
  createdBy: string
  updatedDate: string
  updatedBy: string
  thfNumber: string
  filePath: string
  isFiles: boolean
  isLlineMaintenances: boolean
  state: string
  routeForm: string | null
  routeTo: string | null
  csList?: CSList[]
  mechList?: MechList[]
}

export interface CSList {
  id: number
  code: string
  name: string
  staffstypeid: number
  isdelete: boolean
  createddate: string
  createdby: string
  updateddate: string
  updatedby: string
  displayName: string
}
export interface MechList {
  id: number
  code: string
  name: string
  staffstypeid: number
  isdelete: boolean
  createddate: string
  createdby: string
  updateddate: string
  updatedby: string
  displayName: string
}

export interface AirlineObj {
  id: number
  code: string
  colorBackground: string
  colorForeground: string
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