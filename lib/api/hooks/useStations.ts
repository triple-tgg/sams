// src/lib/api/hooks/useStations.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import getStations from "@/lib/api/master/stations/getStations";
import type { ResStationItem, StationItem } from "@/lib/api/master/stations/stations.interface";

export function useStations() {
  return useQuery<ResStationItem, Error>({
    queryKey: ["stations"],
    queryFn: getStations,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in newer versions)
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

// Hook สำหรับ options ที่พร้อมใช้กับ react-select
export function useStationsOptions() {
  const { data, isLoading, error } = useStations();
  
  // Fallback options กรณี API ล้มเหลว
  const fallbackOptions = [
    { value: "BKK", label: "BKK" },
    { value: "DMK", label: "DMK" },
    { value: "HKT", label: "HKT" },
    { value: "HDY", label: "HDY" },
    { value: "CNX", label: "CNX" },
    { value: "CEI", label: "CEI" },
    { value: "UTH", label: "UTH" },
    { value: "KBV", label: "KBV" },
  ];
  
  const apiOptions = data?.responseData?.map((station: StationItem) => ({
    value: station.code,
    label: station.code,
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
