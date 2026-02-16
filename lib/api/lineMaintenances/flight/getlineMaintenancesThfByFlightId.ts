import axiosConfig from "@/lib/axios.config";

export interface LineMaintenanceThfParams {
  flightInfosId: number | string | null;
}

// ── Base Objects ──

export interface CodeObject {
  id: number;
  code: string | null;
  name: string | null;
  description: string | null;
  isdelete: boolean | null;
  createddate: string | null;
  createdby: string | null;
  updateddate: string | null;
  updatedby: string | null;
}

export interface AirlineCodeObject extends CodeObject {
  colorForeground: string | null;
  colorBackground: string | null;
}

export interface AcTypeCodeObject {
  id: number;
  code: string | null;
  name: string | null;
  modelName: string | null;
  modelSubName: string | null;
  classicOrNeo: string | null;
  flagEnging1: boolean | null;
  flagEnging2: boolean | null;
  flagEnging3: boolean | null;
  flagEnging4: boolean | null;
  flagCsd1: boolean | null;
  flagCsd2: boolean | null;
  flagCsd3: boolean | null;
  flagCsd4: boolean | null;
  flagHydrolicGreen: boolean | null;
  flagHydrolicBlue: boolean | null;
  flagHydrolicYellow: boolean | null;
  flagApu: boolean | null;
  isDelete: boolean | null;
  createdDate: string | null;
  createdBy: string | null;
  updatedDate: string | null;
  updatedBy: string | null;
}

export interface MaintenanceStatus {
  id: number;
  code: string | null;
  name: string | null;
  description: string | null;
  isdelete: boolean | null;
  createddate: string | null;
  createdby: string | null;
  updateddate: string | null;
  updatedby: string | null;
}

export interface StaffDisplay {
  id: number;
  code: string | null;
  name: string | null;
  staffstypeid: number | null;
  isdelete: boolean | null;
  createddate: string | null;
  createdby: string | null;
  updateddate: string | null;
  updatedby: string | null;
  displayName: string | null;
}

// ── Flight ──

export interface Flight {
  flightsId: number | null;
  flightInfosId: number | null;
  airlineObj: AirlineCodeObject;
  stationObj: CodeObject;
  acReg: string | null;
  arrivalFlightNo: string | null;
  arrivalDate: string | null;
  arrivalStatime: string | null;
  arrivalAtaTime: string | null;
  departureFlightNo: string | null;
  departureDate: string | null;
  departureStdTime: string | null;
  departureAtdtime: string | null;
  bayNo: string | null;
  statusObj: CodeObject;
  note: string | null;
  datasource: string | null;
  isDelete: boolean | null;
  createdDate: string | null;
  createdBy: string | null;
  updatedDate: string | null;
  updatedBy: string | null;
  isFiles: boolean | null;
  isLlineMaintenances: boolean | null;
  state: string | null;
  routeForm: string | null;
  routeTo: string | null;
  acTypeObj: AcTypeCodeObject | null;
  filePath: string | null;
  thfNumber: string | null;
  csList: StaffDisplay[] | null;
  mechList: StaffDisplay[] | null;
  etaDate: string | null;
  etaTime: string | null;
  maintenanceStatusObj: MaintenanceStatus | null;
}

// ── Line Maintenance ──

export interface LineMaintenance {
  id: number;
  flightInfosId: number | null;
  flightsId: number | null;
  thfNumber: string | null;
  isPersonnels: boolean | null;
  isAdditionalDefect: boolean | null;
  isFluidServicing: boolean | null;
  isFlightdeck: boolean | null;
  isAircraftTowing: boolean | null;
}

// ── Aircraft Data ──

export interface CheckType {
  checkType: string | null;
  checkSubType: string[] | null;
}

export interface StaffData {
  id: number;
  code: string | null;
  name: string | null;
  staffTypeId: number | null;
  staffTypeCode: string | null;
}

export interface Personnel {
  staff: StaffData;
  formDate: string | null;
  toDate: string | null;
  formTime: string | null;
  toTime: string | null;
  note: string | null;
}

export interface AdditionalDefectAttachFile {
  id: string | null;
  additionalDefectId: string | null;
  storagePath: string | null;
  realName: string | null;
  fileType: string | null;
  isDelete: boolean | null;
}

export interface AdditionalDefect {
  details: string | null;
  maintenancePerformed: string | null;
  ataChapter: string | null;
  lae: number | null;
  mech: number | null;
  attachFiles: AdditionalDefectAttachFile | null;
  acDefect: string | null;
  action: string | null;
  technicalDelay: string | null;
}

export interface FluidServicing {
  hydraulicA: number | null;
  hydraulicB: number | null;
  hydraulicSTBY: number | null;
  engOil: number[] | null;
  csdOil: number[] | null;
  apuOil: number | null;
}

export interface AircraftTowing {
  bayFrom: string | null;
  bayTo: string | null;
  onDate: string | null;
  offDate: string | null;
  onTime: string | null;
  offTime: string | null;
}

export interface Aircraft {
  aircraftCheckType: CheckType[] | null;
  personnels: Personnel[] | null;
  additionalDefect: AdditionalDefect[] | null;
  fluidServicing: FluidServicing | null;
  aircraftTowing: AircraftTowing[] | null;
}

// ── Equipment & Parts ──

export interface Equipment {
  isSamsTool: boolean | null;
  isLoan: boolean | null;
  equipmentName: string | null;
  svc: number | null;
  formDate: string | null;
  toDate: string | null;
  formTime: string | null;
  toTime: string | null;
  hrs: number | null;
  loanRemark: string | null;
}

export interface PartsTool {
  isSamsTool: boolean | null;
  isLoan: boolean | null;
  pathToolName: string | null;
  pathToolNo: string | null;
  serialNoIn: string | null;
  serialNoOut: string | null;
  qty: number | null;
  equipmentNo: string | null;
  hrs: number | null;
  formDate: string | null;
  toDate: string | null;
  formTime: string | null;
  toTime: string | null;
  loanRemark: string | null;
}

export interface AttachFile {
  id: string | null;
  additionalDefectId: string | null;
  storagePath: string | null;
  realName: string | null;
  fileType: string | null;
  isDelete: boolean | null;
}

// ── Top-level Response ──

export interface LineMaintenanceThfData {
  flight: Flight;
  lineMaintenance: LineMaintenance | null;
  aircraft: Aircraft;
  equipment: Equipment[] | null;
  partsTool: PartsTool[] | null;
  attachFilesOthers: AttachFile[] | null;
  rampFuel: number | null;
  actualUplift: number | null;
}

export interface LineMaintenanceThfResponse {
  message: string | null;
  responseData: LineMaintenanceThfData;
  error: string | null;
}

export const getlineMaintenancesThfByFlightId = async (
  params: LineMaintenanceThfParams
): Promise<LineMaintenanceThfResponse> => {
  try {
    const response = await axiosConfig.get(`/lineMaintenances/flightInfo/${params.flightInfosId}`);
    return response.data;
  } catch (error) {
    console.error("Get line maintenances THF by flight ID error:", error);
    throw error;
  }
};


