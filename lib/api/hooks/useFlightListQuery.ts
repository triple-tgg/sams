// 'src/hooks/useFlightListQuery.ts'
'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import getFlightList, { GetFlightListParams } from '@/lib/api/flight/getFlightList';

export function useFlightListQuery(params: GetFlightListParams) {
  return useQuery({
    queryKey: ['flightList', params],         // ผูก cache ตามเงื่อนไขค้นหา + หน้า
    queryFn: () => getFlightList(params),     // ใช้ axios.post ตามเดิม
    enabled: Boolean(params.dateStart && params.dateEnd),
    placeholderData: keepPreviousData,        // v5: แทน keepPreviousData: true แบบเดิม
    // staleTime: 30_000,                        // ปรับได้ตามความสดของข้อมูล
    refetchOnWindowFocus: false,
    // Prevent concurrent queries
    refetchOnMount: false,
    refetchOnReconnect: false,
    // Increase retry delay to reduce concurrent requests
    retry: (failureCount, error) => {
      if (failureCount < 3) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
