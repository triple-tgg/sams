import axiosInstance from '@/lib/axios.config';

// Types for THF Report API
export interface ThfReportItem {
  updateDate: string;
  acType: string;
  acReg: string;
  stationCode: string;
  arrivalFlightNo: string;
  departureFlightNo: string;
  iataAirlines: string;
  airlineName: string;
  stateOfOperator: string;
  route: string;
  arrivalStaTime: string;
  arrivalAtaTimeDiff30: string;
  arrivalAtaTime: string;
  departureStdTime: string;
  departureAtdTime: string;
  groundTime: string;
  aircraftDelay: string;
  aircraftTotalDelay: string;
  towingAircraftBayBay: string;
  towingTime: string;
  engOil_LR1: string;
  engOil_LR2: string;
  engOil_LR3: string;
  apuOilServicing: string;
  hydraulicServicingA: string;
  hydraulicServicingB: string;
  defectDetails: string | null;
  maintenancePerformed: string | null;
  ataChapter: string | null;
  flightDeck: string;
  nameCS: string;
  csId: string;
  nameMech: string;
  mechId: string;
  thfNumber: string;
}

export interface ThfReportRequest {
  dateStart: string; // Format: YYYY-MM-DD
  dateEnd: string;   // Format: YYYY-MM-DD
  airlineId: string | undefined;
}

export interface ThfReportResponse {
  message: string;
  responseData: ThfReportItem[];
  error: string;
}

/**
 * Get THF report data
 * POST /report/thf
 */
export const getThfReport = async (
  request: ThfReportRequest
): Promise<ThfReportResponse> => {
  try {
    if (!request.dateStart || !request.dateEnd) {
      throw new Error('Date range is required');
    }

    const response = await axiosInstance.post<ThfReportResponse>(
      '/report/thf',
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
    console.error('Error fetching THF report:', error);
    throw error;
  }
};

/**
 * Download THF report as Excel
 * POST /report/thf/download
 */
export const downloadThfReport = async (
  request: ThfReportRequest
): Promise<Blob> => {
  try {
    const response = await axiosInstance.post(
      '/report/thf/download',
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
    console.error('Error downloading THF report:', error);
    throw error;
  }
};

// Export all functions
const thfReportApi = {
  getThfReport,
  downloadThfReport,
};

export default thfReportApi;