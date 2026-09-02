// 'src/lib/api/hooks/useThfDocumentListQuery.ts'
'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import getListDoneOrMapped, {
  type ListDoneOrMappedRequest,
} from '@/lib/api/lineMaintenances/listDoneOrMapped';

/**
 * THF DOCUMENT list (Invoice) — POST /lineMaintenances/list-done-or-mapped
 * คืนเฉพาะ THF ที่ done หรือถูก mapping contract แล้ว
 */
export function useThfDocumentListQuery(params: ListDoneOrMappedRequest, enabled = true) {
  return useQuery({
    queryKey: ['thfDocumentList', params],
    queryFn: () => getListDoneOrMapped(params),
    enabled: enabled && Boolean(params.startDate && params.endDate),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 0,
    gcTime: 0,
    retry: (failureCount) => failureCount < 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
