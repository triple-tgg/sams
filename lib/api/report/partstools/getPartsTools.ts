import axiosInstance from '@/lib/axios.config';
import dayjs from "dayjs";
import "@/lib/dayjs";

// Types for Parts & Tools Report API
export interface PartsToolsReportItem {
  name: string;
  partNo: string;
  serialNoIn: string;
  serialNoOut: string;
  equipmentNo: string;
  thfNo: string;
  flightNo: string;
  customerAirline: string;
  formDate: string;
  formTime: string;
  toDate: string;
  toTime: string;
  qty: string;
  hrs: string;
  loan: string;
}

export interface PartsToolsReportRequest {
  dateStart: string; // Format: YYYY-MM-DD
  dateEnd: string;   // Format: YYYY-MM-DD
  airlineId: string | undefined;
}

export interface PartsToolsReportResponse {
  message: string;
  responseData: PartsToolsReportItem[];
  error: string;
}

/**
 * Get parts & tools report data
 * POST /report/partstools
 */
export const getPartsToolsReport = async (
  request: PartsToolsReportRequest
): Promise<PartsToolsReportResponse> => {
  try {
    if (!request.dateStart || !request.dateEnd) {
      throw new Error('Date range is required');
    }

    const utcParams = {
      ...request,
      dateStart: request.dateStart ? dayjs(request.dateStart).startOf('day').utc().format('YYYY-MM-DD HH:mm:ss') : request.dateStart,
      dateEnd: request.dateEnd ? dayjs(request.dateEnd).endOf('day').utc().format('YYYY-MM-DD HH:mm:ss') : request.dateEnd,
    };

    const response = await axiosInstance.post<PartsToolsReportResponse>(
      '/report/partstools',
      utcParams,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 seconds timeout
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching parts & tools report:', error);
    throw error;
  }
};

/**
 * Download parts & tools report as Excel
 * POST /report/partstools/download
 */
export const downloadPartsToolsReport = async (
  request: PartsToolsReportRequest
): Promise<Blob> => {
  try {
    const utcParams = {
      ...request,
      dateStart: request.dateStart ? dayjs(request.dateStart).startOf('day').utc().format('YYYY-MM-DD HH:mm:ss') : request.dateStart,
      dateEnd: request.dateEnd ? dayjs(request.dateEnd).endOf('day').utc().format('YYYY-MM-DD HH:mm:ss') : request.dateEnd,
    };

    const response = await axiosInstance.post(
      '/report/partstools/download',
      utcParams,
      {
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60 seconds for download
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error downloading parts & tools report:', error);
    throw error;
  }
};

// Export all functions
const partsToolsReportApi = {
  getPartsToolsReport,
  downloadPartsToolsReport,
};

export default partsToolsReportApi;