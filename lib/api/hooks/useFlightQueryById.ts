"use client";
import { useQuery } from "@tanstack/react-query";
import getFlightById from "@/lib/api/fleght/getFlightById";
import type { ResFlightItem } from "@/lib/api/fleght/flight.interface";

// Type สำหรับ form data ที่แปลงแล้ว
export interface FlightFormData {
  customer: { value: string; label: string } | null;
  station: { value: string; label: string } | null;
  acReg: string;
  acType: string;
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
}

// Type สำหรับข้อมูลพื้นฐานของ flight
export interface FlightBasicInfo {
  id: number;
  arrivalFlight: string;
  departureFlight: string;
  airline?: string;
  station?: string;
  status?: string;
}

export function useFlightQueryById(id: number | null) {
  return useQuery<ResFlightItem, Error>({
    queryKey: ["flight", id],
    queryFn: () => {
      if (!id) throw new Error("Flight ID is required");
      return getFlightById(id);
    },
    enabled: !!id && id > 0, // Only run query if ID exists and is valid
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

// Helper hook สำหรับแปลงข้อมูล API เป็นรูปแบบที่ใช้ในฟอร์ม
export function useFlightFormData(id: number | null): {
  data: ResFlightItem | undefined;
  formData: FlightFormData | null;
  isLoading: boolean;
  error: Error | null;
  isFound: boolean;
  isEmpty: boolean;
  flightInfo: FlightBasicInfo | null;
} {
  const { data, isLoading, error } = useFlightQueryById(id);
  
  // แสดงข้อมูลการดึงข้อมูลสำหรับ debug
  console.log("Flight data loading:", { id, isLoading, hasData: !!data, error });
  
  // ตรวจสอบว่ามีข้อมูลและมี responseData
  const hasValidData = data?.responseData && Array.isArray(data.responseData) && data.responseData.length > 0;
  const flightItem = hasValidData ? data.responseData[0] : null;
  
  // แปลงข้อมูลเป็นรูปแบบที่ใช้ในฟอร์ม
  const formData = flightItem ? {
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
    acType: flightItem.acType || '',
    
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
    thfNumber: flightItem.thfNo || '',
    
    // Status dropdown
    status: flightItem.statusObj?.code ? 
      { value: flightItem.statusObj.code, label: flightItem.statusObj.code } : 
      null,
    
    // Note and additional fields
    note: flightItem.note || '',
    delayCode: '', // Default empty as it's not in API response
  } : null;

  return {
    // Raw API data
    data,
    
    // Transformed form data
    formData,
    
    // Loading and error states
    isLoading,
    error,
    
    // Status flags
    isFound: !!hasValidData,
    isEmpty: !isLoading && !hasValidData && !error,
    
    // Flight basic info for display
    flightInfo: flightItem ? {
      id: flightItem.id,
      arrivalFlight: flightItem.arrivalFlightNo,
      departureFlight: flightItem.departureFlightNo,
      airline: flightItem.airlineObj?.code,
      station: flightItem.stationObj?.code,
      status: flightItem.statusObj?.code,
    } : null,
  };
}
