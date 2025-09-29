import { useMutation, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { 
  getEquipmentReport, 
  downloadEquipmentReport,
  EquipmentReportRequest,
  EquipmentReportResponse 
} from '../report/equipments/getEquipments';
import { 
  getPartsToolsReport, 
  downloadPartsToolsReport,
  PartsToolsReportRequest,
  PartsToolsReportResponse 
} from '../report/partstools/getPartsTools';
import { 
  getThfReport, 
  downloadThfReport,
  ThfReportRequest,
  ThfReportResponse 
} from '../report/thf/getThf';
import { 
  exportEquipmentReport, 
  exportPartsToolsReport, 
  exportThfReport 
} from '../../utils/excelExport';

// Define the download result interface for validation
interface DownloadResult {
  hasData: boolean;
  dataCount: number;
  reportType: 'equipment' | 'partstools' | 'thf';
}

// Query keys for React Query caching
export const REPORT_QUERY_KEYS = {
  all: ['reports'] as const,
  equipment: (params: EquipmentReportRequest) => [...REPORT_QUERY_KEYS.all, 'equipment', params] as const,
  partstools: (params: PartsToolsReportRequest) => [...REPORT_QUERY_KEYS.all, 'partstools', params] as const,
  thf: (params: ThfReportRequest) => [...REPORT_QUERY_KEYS.all, 'thf', params] as const,
};

// Equipment Report Hook
export const useEquipmentReport = (
  params: EquipmentReportRequest,
  options?: Omit<UseQueryOptions<EquipmentReportResponse>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: REPORT_QUERY_KEYS.equipment(params),
    queryFn: () => getEquipmentReport(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Equipment Report Download Mutation
export const useEquipmentReportDownload = () => {
  return useMutation<DownloadResult, Error, { params: EquipmentReportRequest; format: 'xlsx' | 'csv'; directDownload?: boolean }>({
    mutationFn: async ({ params, format, directDownload = false }) => {
      if (directDownload) {
        // Direct download for non-Excel formats
        await downloadEquipmentReport(params);
        return { hasData: true, dataCount: 0, reportType: 'equipment' }; // Can't check blob content easily
      } else {
        // Get data and export using xlsx library
        const response = await getEquipmentReport(params);
        
        // Check if responseData is empty or null
        if (!response.responseData || response.responseData.length === 0) {
          return { hasData: false, dataCount: 0, reportType: 'equipment' };
        }
        
        exportEquipmentReport(response.responseData, format);
        return { hasData: true, dataCount: response.responseData.length, reportType: 'equipment' };
      }
    },
  });
};

// Parts & Tools Report Hook
export const usePartsToolsReport = (
  params: PartsToolsReportRequest,
  options?: Omit<UseQueryOptions<PartsToolsReportResponse>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: REPORT_QUERY_KEYS.partstools(params),
    queryFn: () => getPartsToolsReport(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Parts & Tools Report Download Mutation
export const usePartsToolsReportDownload = () => {
  return useMutation<DownloadResult, Error, { params: PartsToolsReportRequest; format: 'xlsx' | 'csv'; directDownload?: boolean }>({
    mutationFn: async ({ params, format, directDownload = false }) => {
      if (directDownload) {
        // Direct download for non-Excel formats
        await downloadPartsToolsReport(params);
        return { hasData: true, dataCount: 0, reportType: 'partstools' }; // Can't check blob content easily
      } else {
        // Get data and export using xlsx library
        const response = await getPartsToolsReport(params);
        
        // Check if responseData is empty or null
        if (!response.responseData || response.responseData.length === 0) {
          return { hasData: false, dataCount: 0, reportType: 'partstools' };
        }
        
        exportPartsToolsReport(response.responseData, format);
        return { hasData: true, dataCount: response.responseData.length, reportType: 'partstools' };
      }
    },
  });
};

// THF Report Hook
export const useThfReport = (
  params: ThfReportRequest,
  options?: Omit<UseQueryOptions<ThfReportResponse>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: REPORT_QUERY_KEYS.thf(params),
    queryFn: () => getThfReport(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// THF Report Download Mutation
export const useThfReportDownload = () => {
  return useMutation<DownloadResult, Error, { params: ThfReportRequest; format: 'xlsx' | 'csv'; directDownload?: boolean }>({
    mutationFn: async ({ params, format, directDownload = false }) => {
      if (directDownload) {
        // Direct download for non-Excel formats
        await downloadThfReport(params);
        return { hasData: true, dataCount: 0, reportType: 'thf' }; // Can't check blob content easily
      } else {
        // Get data and export using xlsx library
        const response = await getThfReport(params);
        
        // Check if responseData is empty or null
        if (!response.responseData || response.responseData.length === 0) {
          return { hasData: false, dataCount: 0, reportType: 'thf' };
        }
        
        exportThfReport(response.responseData, format);
        return { hasData: true, dataCount: response.responseData.length, reportType: 'thf' };
      }
    },
  });
};

// Generic download hook that combines all report types
export const useReportDownload = () => {
  const equipmentMutation = useEquipmentReportDownload();
  const partsToolsMutation = usePartsToolsReportDownload();
  const thfMutation = useThfReportDownload();

  const downloadReport = async (
    reportType: 'equipment' | 'partstools' | 'thf',
    dateRange: { dateStart: string; dateEnd: string },
    format: 'xlsx' | 'csv',
    directDownload?: boolean
  ): Promise<DownloadResult> => {
    const params = {
      dateStart: dateRange.dateStart,
      dateEnd: dateRange.dateEnd,
    };

    switch (reportType) {
      case 'equipment':
        return equipmentMutation.mutateAsync({ params, format, directDownload });
      case 'partstools':
        return partsToolsMutation.mutateAsync({ params, format, directDownload });
      case 'thf':
        return thfMutation.mutateAsync({ params, format, directDownload });
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  };

  return {
    downloadReport,
    downloadEquipment: equipmentMutation.mutateAsync,
    downloadPartsTools: partsToolsMutation.mutateAsync,
    downloadThf: thfMutation.mutateAsync,
    isLoading: equipmentMutation.isPending || partsToolsMutation.isPending || thfMutation.isPending,
    error: equipmentMutation.error || partsToolsMutation.error || thfMutation.error,
  };
};

// Export the DownloadResult type for use in components
export type { DownloadResult };