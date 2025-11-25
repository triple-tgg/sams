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
/**
 * Get THF number report data
 * POST /report/thf
 */
export const getThfNumberReport = async (
  request: ThfReportRequest
): Promise<ThfReportResponse> => {
  try {
    if (!request.dateStart || !request.dateEnd) {
      throw new Error('Date range is required');
    }

    const response = await axiosInstance.post<ThfReportResponse>(
      '/report/thfnumber',
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
 * Download THF number report as Excel
 * POST /report/thfnumber/download
 */
export const downloadThfNumberReport = async (
  request: ThfReportRequest
): Promise<Blob> => {
  try {
    const response = await axiosInstance.post(
      '/report/thfnumber/download',
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
    console.error('Error downloading THF number report:', error);
    throw error;
  }
};

/**
 * Response interface for THF File Report
 */
export interface ThfFileReportResponse {
  message: string;
  responseData: {
    haveFile: boolean;
    fileName: string;
    url: string;
  };
  error: string;
}

/**
 * Get THF file report (zip file URL)
 * POST /report/files
 */
export const getThfFileReport = async (
  request: ThfReportRequest
): Promise<ThfFileReportResponse> => {
  try {
    if (!request.dateStart || !request.dateEnd) {
      throw new Error('Date range is required');
    }

    const response = await axiosInstance.post<ThfFileReportResponse>(
      '/report/files',
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
    console.error('Error fetching THF file report:', error);
    throw error;
  }
};

/**
 * Download THF file report (.zip)
 * Downloads the zip file from the provided URL
 */
export const downloadThfFileReport = async (
  request: ThfReportRequest
): Promise<void> => {
  try {
    // First, get the file information
    const fileInfo = await getThfFileReport(request);

    if (!fileInfo.responseData.haveFile) {
      throw new Error('No files available for the selected date range');
    }

    // Download the file from the URL
    const response = await fetch(fileInfo.responseData.url);
    console.log("response", response)
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const blob = await response.blob();

    // Create download link
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileInfo.responseData.fileName || 'thf-files.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Error downloading THF file report:', error);
    throw error;
  }
};

// Export all functions
const thfReportApi = {
  getThfReport,
  downloadThfReport,
  getThfNumberReport,
  downloadThfNumberReport,
  getThfFileReport,
  downloadThfFileReport
};

export default thfReportApi;