import axiosConfig from "@/lib/axios.config";

export interface LineMaintenanceThfParams {
  flightInfosId: number | string | null;
}

export interface StaffMember {
  id: number;
  code: string;
  name: string;
  staffsType: string;
  staffTypeCode: string;
  staffTypeId: string;
}

export interface Personnel {
  staff: StaffMember;
  formDate: string;
  toDate: string;
  formTime: string;
  toTime: string;
  note: string | null;
}

export interface AdditionalDefectAttachFile {
  additionalDefectId: string;
  storagePath: string;
  realName: string;
  fileType: string;
}

export interface AdditionalDefect {
  details: string;
  maintenancePerformed: string;
  ataChapter: string;
  lae: number;
  mech: number;
  attachFiles: AdditionalDefectAttachFile | null; // Changed to array type
}

export interface EngOil {
  leftOil: number;
  rightOil: number;
}

export interface FluidServicing {
  fluidName: string;
  hydraulicA: number | null; // Changed from optional to explicit null
  hydraulicB: number | null; // Changed from optional to explicit null
  hydraulicSTBY: number | null; // Changed from optional to explicit null
  engOil: EngOil[];
  otherOil: number | null; // Changed from optional to explicit null
}

export interface AircraftTowing {
  bayFrom: string | null; // Changed from optional to explicit null
  bayTo: string | null; // Changed from optional to explicit null
  onDate: string;
  offDate: string;
  onTime: string;
  offTime: string;
}

export interface CheckType {
  checkType: string;
  checkSubType: any[]; // Changed from string[] to any[] since it's empty array in response
}

export interface Aircraft {
  aircraftCheckType: CheckType[];
  personnels: Personnel[];
  additionalDefect: AdditionalDefect[];
  fluidServicing: FluidServicing;
  aircraftTowing: AircraftTowing[];
}

export interface Equipment {
  equipmentName: string;
  hrs: number;
  svc: number;
  formDate: string;
  formTime: string;
  toDate: string | null; // Changed from optional to explicit null
  toTime: string | null; // Changed from optional to explicit null
  isLoan: boolean;
  isSamsTool: boolean;
}

export interface PartsTool {
  isSamsTool: boolean;
  isLoan: boolean;
  pathToolName: string;
  pathToolNo: string;
  serialNoIn: string;
  serialNoOut: string;
  qty: number;
  equipmentNo: string;
  hrs: number;
  formDate: string | null; // Changed from optional to explicit null
  toDate: string | null; // Changed from optional to explicit null
  formTime: string | null; // Changed from optional to explicit null
  toTime: string | null; // Changed from optional to explicit null
}

export interface AttachFile {
  additionalDefectId: string;
  storagePath: string;
  realName: string;
  fileType: string;
}

export interface CodeObject {
  id: number;
  code: string;
  name: string;
  description: string;
  isdelete: boolean;
  createddate: string;
  createdby: string;
  updateddate: string;
  updatedby: string;
}

export interface Flight {
  flightsId: number; // Changed from id to flightsId
  flightInfosId: number | null; // Added this field
  airlineObj: CodeObject;
  stationObj: CodeObject;
  acReg: string;
  acTypeObj?: CodeObject; // Made optional since it's not in response
  arrivalFlightNo: string;
  arrivalDate: string;
  arrivalStatime: string;
  arrivalAtaTime: string;
  departureFlightNo: string;
  departureDate?: string | null; // Made explicitly nullable
  departureStdTime?: string | null; // Made explicitly nullable
  departureAtdtime?: string | null; // Made explicitly nullable
  bayNo: string;
  statusObj: CodeObject;
  note: string;
  datasource: string;
  isDelete: boolean;
  createdDate: string;
  createdBy: string;
  updatedDate: string;
  updatedBy: string;
  isFiles: boolean;
  isLlineMaintenances: boolean;
  state: string;
  routeForm?: string | null; // Fixed typo from routeFrom
  routeTo?: string | null; // Made explicitly nullable
  acTypeId?: number | null; // Added this field from response
}

export interface LineMaintenance {
  id: number;
  flightInfosId: number; // Changed from flightSid
  flightsId: number; // Added this field
  thfNumber: string;
  isPersonnels: boolean;
  isAdditionalDefect: boolean;
  isFluidServicing: boolean;
  isFlightdeck: boolean;
  isAircraftTowing: boolean;
}

export interface LineMaintenanceThfData {
  flight: Flight;
  lineMaintenance: LineMaintenance;
  aircraft: Aircraft;
  equipment: Equipment[];
  partsTool: PartsTool[];
  attachFilesOthers: AttachFile[];
}

export interface LineMaintenanceThfResponse {
  message: string;
  responseData: LineMaintenanceThfData;
  error: string;
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
