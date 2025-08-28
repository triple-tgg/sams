// src/lib/api/hooks/useAirlines.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import getAirlines from "@/lib/api/master/airlines/getAirlines";
import type { ResAirlineItem, AirlineItem } from "@/lib/api/master/airlines/airlines.interface";

export function useAirlines() {
  return useQuery<ResAirlineItem, Error>({
    queryKey: ["airlines"],
    queryFn: getAirlines,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in newer versions)
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

// Hook สำหรับ options ที่พร้อมใช้กับ react-select
export function useAirlineOptions() {
  const { data, isLoading, error } = useAirlines();

  // Fallback options กรณี API ล้มเหลว
  const fallbackOptions = [
    { value: "SEJ", label: "SEJ" },
    { value: "KZR", label: "KZR" },
    { value: "CEB", label: "CEB" },
    { value: "AIX", label: "AIX" },
    { value: "AIC", label: "AIC" },
    { value: "QDA", label: "QDA" },
    { value: "IGO", label: "IGO" },
    { value: "FFM", label: "FFM" },
    { value: "JDL", label: "JDL" },
    { value: "MAS", label: "MAS" },
    { value: "PAL", label: "PAL" },
    { value: "RLH", label: "RLH" },
    { value: "JYH", label: "JYH" },
    { value: "MNA", label: "MNA" },
    { value: "TGW", label: "TGW" },
    { value: "NOK", label: "NOK" },
    { value: "DRK", label: "DRK" },
  ];

  const apiOptions = data?.responseData?.map((airline: AirlineItem) => ({
    value: airline.code,
    label: airline.code,
  })) ?? [];

  // ใช้ API options ถ้ามีข้อมูล ไม่งั้นใช้ fallback
  const options = apiOptions.length > 0 ? apiOptions : (error ? fallbackOptions : []);

  return {
    options,
    isLoading,
    error,
    isEmpty: options.length === 0 && !isLoading,
    usingFallback: error && options.length > 0,
  };
}
