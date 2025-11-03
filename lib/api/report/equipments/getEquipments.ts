import axiosInstance from '@/lib/axios.config';

// Types for Equipment Report API
export interface EquipmentReportItem {
  equipmentName: string;
  thfNo: string;
  flightNo: string;
  customerAirline: string;
  formDate: string;
  formTime: string;
  toDate: string;
  toTime: string;
  svc: string;
  hrs: string;
  loan: string;
}

export interface EquipmentReportRequest {
  dateStart: string; // Format: YYYY-MM-DD
  dateEnd: string;   // Format: YYYY-MM-DD
  airlineId: string | undefined;
}

export interface EquipmentReportResponse {
  message: string;
  responseData: EquipmentReportItem[];
  error: string;
}

/**
 * Get equipment report data
 * POST /report/equipments
 */
export const getEquipmentReport = async (
  request: EquipmentReportRequest
): Promise<EquipmentReportResponse> => {
  try {
    if (!request.dateStart || !request.dateEnd) {
      throw new Error('Date range is required');
    }

    const response = await axiosInstance.post<EquipmentReportResponse>(
      '/report/equipments',
      request,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 seconds timeout
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching equipment report:', error);
    throw error;
  }
};

/**
 * Download equipment report as Excel
 * POST /report/equipments/download
 */
export const downloadEquipmentReport = async (
  request: EquipmentReportRequest
): Promise<Blob> => {
  try {
    const response = await axiosInstance.post(
      '/report/equipments/download',
      request,
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
    console.error('Error downloading equipment report:', error);
    throw error;
  }
};

// Export all functions
const equipmentReportApi = {
  getEquipmentReport,
  downloadEquipmentReport,
};

export default equipmentReportApi;