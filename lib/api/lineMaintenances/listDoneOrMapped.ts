import axiosConfig from "@/lib/axios.config";
import type {
    AcTypeObj,
    AirlineObj,
    FlightItem,
    StationObj,
    StatusObj,
} from "@/lib/api/flight/filghtlist.interface";

// ── Request ──────────────────────────────────────────────
export interface ListDoneOrMappedRequest {
    airline: string;     // airline code – "" = all
    station: string;     // station code – "" = all
    thhNumber: string;   // THF number (API spells it "thhNumber") – "" = all
    thfNumber?: string;  // also pass thfNumber in case backend expects it
    acType: string;      // aircraft type code – "" = all
    startDate: string;   // "YYYY-MM-DD"
    endDate: string;     // "YYYY-MM-DD"
    page: number;
    perPage: number;
}

// ── Response ─────────────────────────────────────────────
export interface DoneOrMappedFlightObj {
    id: number;
    flightInfoId: number | null;
    airlinesId: number | null;
    stationId: number | null;
    acReg: string | null;
    acTypeId: number | null;
    arrivalFlightNo: string | null;
    arrivalStadate: string | null;    // UTC datetime
    arrivalAtadate: string | null;    // UTC datetime
    departureFlightNo: string | null;
    departureStddate: string | null;  // UTC datetime
    departureAtddate: string | null;  // UTC datetime
    bayNo: string | null;
    statusId: number | null;
    note: string | null;
    routeForm: string | null;
    routeTo: string | null;
    datasource: string | null;
    isDelete: boolean | null;
    createdDate: string | null;
    createdBy: string | null;
    updatedDate: string | null;
    updatedBy: string | null;
    csId: string | null;
    mechId: string | null;
    etaDate: string | null;
    maintenanceStatusId: number | null;
    series: string | null;
    engineCode: string | null;
}

export interface DoneOrMappedLineMaintenanceObj {
    id: number;
    flightInfosId: number | null;
    flightsId: number | null;
    thfNumber: string | null;
    isPersonnels: boolean | null;
    isAdditionalDefect: boolean | null;
    isFluidServicing: boolean | null;
    isFlightDeck: boolean | null;
    isAircraftTowing: boolean | null;
    createdDate: string | null;
    createdBy: string | null;
    updatedDate: string | null;
    updatedBy: string | null;
    rampFuel: number | null;
    actualUplift: number | null;
}

export interface DoneOrMappedContractObj {
    id: number;
    contractNo: string | null;
    airlineId: number | null;
    effectiveFrom: string | null;
    validFrom: string | null;
    expiresOn: string | null;
    isNoExpiryDate: boolean | null;
    creditTerms: string | null;
    statusId: number | null;
    contractTypeId: number | null;
    isDelete: boolean | null;
    createdDate: string | null;
    createdBy: string | null;
    updatedDate: string | null;
    updatedBy: string | null;
    domicileCountry: string | null;
    currencyType: string | null;
}

export interface DoneOrMappedItem {
    flightsObj: DoneOrMappedFlightObj | null;
    lineMaintenancesObj: DoneOrMappedLineMaintenanceObj | null;
    contractsObj: DoneOrMappedContractObj | null;
    isMapping: boolean;
}

export interface ResDoneOrMappedList {
    message: string;
    responseData: DoneOrMappedItem[];
    page: number;
    perPage: number;
    total: number;
    totalAll: number;
    error: string;
}

// ── Request builder ──────────────────────────────────────
// The endpoint takes a single station / acType code, while the Invoice filters
// are multi-select – send the first selection, "" means "all".
export const buildListDoneOrMappedRequest = (
    filters: {
        dateStart: string;
        dateEnd: string;
        airlineCode?: string;
        stationCodeList?: string[];
        airCraftTypeCodeList?: string[];
        thfNumber?: string;
    },
    page: number,
    perPage: number
): ListDoneOrMappedRequest => ({
    airline: filters.airlineCode ?? "",
    station: filters.stationCodeList?.[0] ?? "",
    thhNumber: filters.thfNumber ?? "",
    thfNumber: filters.thfNumber ?? "",
    acType: filters.airCraftTypeCodeList?.[0] ?? "",
    startDate: filters.dateStart,
    endDate: filters.dateEnd,
    page,
    perPage,
});

// ── Response → FlightItem (so the flight columns keep working) ──
export interface DoneOrMappedLookups {
    airlineCodeById?: Map<number, string>;
    stationCodeById?: Map<number, string>;
    acTypeById?: Map<number, { code: string; familyCode?: string | null }>;
    statusCodeById?: Map<number, string>;
}

export const mapDoneOrMappedToFlightItem = (
    item: DoneOrMappedItem,
    lookups: DoneOrMappedLookups = {}
): FlightItem => {
    const flight = item.flightsObj;
    const lineMaintenance = item.lineMaintenancesObj;

    const airlinesId = flight?.airlinesId ?? null;
    const stationId = flight?.stationId ?? null;
    const acTypeId = flight?.acTypeId ?? null;
    const statusId = flight?.statusId ?? null;

    const airlineCode = airlinesId != null ? lookups.airlineCodeById?.get(airlinesId) : undefined;
    const stationCode = stationId != null ? lookups.stationCodeById?.get(stationId) : undefined;
    const acType = acTypeId != null ? lookups.acTypeById?.get(acTypeId) : undefined;
    const statusCode = statusId != null ? lookups.statusCodeById?.get(statusId) : undefined;

    return {
        flightsId: lineMaintenance?.flightsId ?? flight?.id ?? null,
        flightInfosId: lineMaintenance?.flightInfosId ?? null,
        airlineObj: airlinesId != null && airlineCode
            ? ({ id: airlinesId, code: airlineCode } as AirlineObj)
            : null,
        stationObj: stationId != null && stationCode
            ? ({ id: stationId, code: stationCode } as StationObj)
            : null,
        acReg: flight?.acReg ?? "",
        acType: acType?.code ?? "",
        acTypeObj: acTypeId != null && acType
            ? ({ id: acTypeId, code: acType.code, familyCode: acType.familyCode ?? null } as AcTypeObj)
            : null,
        arrivalFlightNo: flight?.arrivalFlightNo ?? "",
        arrivalStaDate: flight?.arrivalStadate ?? null,
        arrivalAtaDate: flight?.arrivalAtadate ?? null,
        departureFlightNo: flight?.departureFlightNo ?? "",
        departureStdDate: flight?.departureStddate ?? null,
        departureAtdDate: flight?.departureAtddate ?? null,
        bayNo: flight?.bayNo ?? "",
        statusObj: statusId != null && statusCode
            ? ({ id: statusId, code: statusCode } as StatusObj)
            : null,
        note: flight?.note ?? "",
        datasource: flight?.datasource ?? "",
        isDelete: flight?.isDelete ?? false,
        createdDate: flight?.createdDate ?? "",
        createdBy: flight?.createdBy ?? "",
        updatedDate: flight?.updatedDate ?? "",
        updatedBy: flight?.updatedBy ?? "",
        thfNumber: lineMaintenance?.thfNumber ?? null,
        filePath: null,
        isFiles: false,
        isLlineMaintenances: Boolean(lineMaintenance),
        lineMaintenancesId: lineMaintenance?.id ?? null,
        isMapping: item.isMapping,
        // Every row of this endpoint already has a done/mapped THF
        state: "save",
        routeForm: flight?.routeForm ?? null,
        routeFrom: flight?.routeForm ?? null,
        routeTo: flight?.routeTo ?? null,
        csList: null,
        mechList: null,
        etaDate: flight?.etaDate ?? null,
        maintenanceStatusObj: null,
        emailSuccessCount: 0,
    };
};

// ── API function ─────────────────────────────────────────
export const getListDoneOrMapped = async (
    params: ListDoneOrMappedRequest
): Promise<ResDoneOrMappedList> => {
    const res = await axiosConfig.post("/lineMaintenances/list-done-or-mapped", params);
    return res.data as ResDoneOrMappedList;
};

export default getListDoneOrMapped;
