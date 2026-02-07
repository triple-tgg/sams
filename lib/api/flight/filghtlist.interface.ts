
export interface Pagination {
  page: number
  perPage: number
  total: number
  totalAll?: number
}
export interface ResFlightItem extends Pagination {
  message: string
  error: string
  responseData: FlightItem[]
}


export interface FlightItem {
  flightsId: number | null
  flightInfosId: number | null
  airlineObj: AirlineObj | null
  stationObj: StationObj | null
  acReg: string
  acType?: string
  acTypeObj: {
    id: string
    code: string
    name: string
    isDelete: boolean
    createdDate: string
    createdBy: string
    updatedDate: string
    updatedBy: string
  } | null
  arrivalFlightNo: string
  arrivalDate: string
  arrivalStatime: string
  arrivalAtaTime: string
  departureFlightNo: string
  departureDate: string | null
  departureStdTime: string | null
  departureAtdtime: string | null
  bayNo: string
  statusObj: StatusObj | null
  note: string
  datasource: string
  isDelete: boolean
  createdDate: string
  createdBy: string
  updatedDate: string
  updatedBy: string
  thfNumber: string | null
  filePath: string | null
  isFiles: boolean
  isLlineMaintenances: boolean
  state: string
  routeForm: string | null
  routeTo: string | null
  // csList and mechList can be array of IDs (number[]) or array of staff objects
  csList?: StaffItem[] | null
  mechList?: StaffItem[] | null
  // New fields for ETA
  etaDate?: string | null
  etaTime?: string | null
  // Maintenance status object
  maintenanceStatusObj?: MaintenanceStatusObj | null
}

// Staff item (for csList and mechList when returned as objects)
export interface StaffItem {
  id: number
  code: string
  name: string
  staffstypeid: number
  isdelete: boolean | null
  createddate: string
  createdby: string
  updateddate: string
  updatedby: string
  displayName: string
}

// Legacy interfaces for backwards compatibility
export interface CSList extends StaffItem { }
export interface MechList extends StaffItem { }

// Maintenance status object
export interface MaintenanceStatusObj {
  id: number
  code: string
  name: string
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