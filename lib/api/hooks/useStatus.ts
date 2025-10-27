// src/lib/api/hooks/useStatus.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import getStatus from "@/lib/api/master/status/getStatus";
import type { ResStatusItem, StatusItem } from "@/lib/api/master/status/status.interface";

export function useStatus() {
  return useQuery<ResStatusItem, Error>({
    queryKey: ["status"],
    queryFn: getStatus,
    // staleTime: 5 * 60 * 1000, // 5 minutes
    // gcTime: 10 * 60 * 1000, // 10 minutes
    staleTime: 0,
    gcTime: 0,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

// Hook สำหรับ options ที่พร้อมใช้กับ react-select
export function useStatusOptions() {
  const { data, isLoading, error } = useStatus();

  // Fallback options กรณี API ล้มเหลว
  const fallbackOptions = [
    { value: "Normal", label: "Normal" },
    { value: "Divert/Reroute", label: "Divert/Reroute" },
    { value: "EOB", label: "EOB" },
    { value: "AOG", label: "AOG" },
    { value: "Cancel", label: "Cancel" },
  ];

  const apiOptions = data?.responseData?.map((status: StatusItem) => ({
    value: status.code,
    label: status.code,
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
