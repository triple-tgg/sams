import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  getlineMaintenancesThfByFlightId,
  LineMaintenanceThfParams,
  LineMaintenanceThfResponse,
  Flight
} from "../lineMaintenances/flight/getlineMaintenancesThfByFlightId";

// Form data interface for flight information
export interface FlightFormData {
  customer: { value: string; label: string } | null;
  station: { value: string; label: string } | null;
  acReg: string;
  acTypeCode: { value: string; label: string } | null;
  flightArrival: string;
  arrivalDate: string;
  sta: string;
  ata: string;
  flightDeparture: string;
  departureDate: string;
  std: string;
  atd: string;
  bay: string;
  thfNumber: string;
  status: { value: string; label: string } | null;
  note: string;
  delayCode: string;
  // routeFrom: string;
  // routeTo: string;
}

// Mapping function to convert API flight data to form data
export const mapFlightToFormData = (flightItem: Flight | null): FlightFormData | null => {
  if (!flightItem) return null;

  console.log(`Mapping flight data to form data:`, flightItem);
  return {
    // Customer dropdown - ใช้ airlines data
    customer: flightItem.airlineObj?.code ?
      { value: flightItem.airlineObj.code, label: flightItem.airlineObj.code } :
      null,

    // Station dropdown
    station: flightItem.stationObj?.code ?
      { value: flightItem.stationObj.code, label: flightItem.stationObj.code } :
      null,

    // Aircraft information
    acReg: flightItem.acReg || '',
    acTypeCode: flightItem.acTypeObj?.code ?
      { value: flightItem.acTypeObj.code, label: flightItem.acTypeObj.code } :
      null,

    // Arrival information
    flightArrival: flightItem.arrivalFlightNo || '',
    arrivalDate: flightItem.arrivalDate || '',
    sta: flightItem.arrivalStatime || '',
    ata: flightItem.arrivalAtaTime || '',

    // Departure information
    flightDeparture: flightItem.departureFlightNo || '',
    departureDate: flightItem.departureDate || '',
    std: flightItem.departureStdTime || '',
    atd: flightItem.departureAtdtime || '',

    // Other fields
    bay: flightItem.bayNo || '',
    thfNumber: '', // THF number comes from lineMaintenance object, not flight

    // Status dropdown
    status: flightItem.statusObj?.code ?
      { value: flightItem.statusObj.code, label: flightItem.statusObj.code } :
      null,

    // Note and additional fields
    note: flightItem.note || '',
    delayCode: '', // Default empty as it's not in API response
    // routeFrom: flightItem.routeForm || '',
    // routeTo: flightItem.routeTo || '',
  };
};

// Main hook for line maintenance THF data with form mapping
export const useLineMaintenancesQueryThfByFlightId = (params: LineMaintenanceThfParams) => {
  const query = useQuery<LineMaintenanceThfResponse, Error>({
    queryKey: ["lineMaintenancesThf", "flight", params.flightInfosId],
    queryFn: () => getlineMaintenancesThfByFlightId(params),
    enabled: !!params.flightInfosId, // Only run query if flightId exists
    // staleTime: 5 * 60 * 1000, // 5 minutes
    // gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    // retry: 2,
    // 🔥 ปิดการ cache ทั้งหมด
    staleTime: 0,     // ข้อมูลหมดอายุทันที
    gcTime: 0,        // ลบทิ้งจาก memory ทันทีเมื่อไม่ใช้งาน
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Memoized form data mapping
  const formData = useMemo(() => {
    if (!query.data?.responseData?.flight) return null;

    const mappedData = mapFlightToFormData(query.data.responseData.flight);

    // Add THF number from lineMaintenance if available
    if (mappedData && query.data.responseData.lineMaintenance?.thfNumber) {
      mappedData.thfNumber = query.data.responseData.lineMaintenance.thfNumber;
    }

    return mappedData;
  }, [query.data]);

  return {
    ...query,
    formData, // Mapped form data ready to use
    flightData: query.data?.responseData?.flight || null,
    lineMaintenanceData: query.data?.responseData?.lineMaintenance || null,
    aircraftData: query.data?.responseData?.aircraft || null,
    equipmentData: query.data?.responseData?.equipment || [],
    partsToolData: query.data?.responseData?.partsTool || [],
    attachFilesData: query.data?.responseData?.attachFilesOthers || [],
  };
};

// Alias for backward compatibility and clearer naming
export const useFlightInfoToFormData = useLineMaintenancesQueryThfByFlightId;
