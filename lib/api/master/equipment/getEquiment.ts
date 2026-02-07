import axiosInstance from '@/lib/axios.config';

// Types for Equipment API
export interface Equipment {
  id: number;
  code: string;
  name: string | null;
}

export interface EquipmentApiResponse {
  message: string;
  responseData: Equipment[];
  error: string;
}

export interface EquipmentByCodeApiResponse {
  message: string;
  responseData: Equipment;
  error: string;
}

/**
 * Get all equipment names
 * GET /master/EquipmentNames
 */
export const getEquipmentNames = async (): Promise<EquipmentApiResponse> => {
  try {
    const response = await axiosInstance.get<EquipmentApiResponse>('/master/EquipmentNames');
    return response.data;
  } catch (error) {
    console.error('Error fetching equipment names:', error);
    throw error;
  }
};

/**
 * Get equipment by specific equipment code
 * GET /master/EquipmentByNames/{equipmentCode}
 */
export const getEquipmentByCode = async (equipmentCode: string): Promise<EquipmentByCodeApiResponse> => {
  try {
    if (!equipmentCode || equipmentCode.trim() === '') {
      throw new Error('Equipment code is required');
    }

    const response = await axiosInstance.get<EquipmentByCodeApiResponse>(
      `/master/EquipmentByNames/${encodeURIComponent(equipmentCode)}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching equipment by code ${equipmentCode}:`, error);
    throw error;
  }
};

/**
 * Get multiple equipment by codes
 * Utility function to fetch multiple equipment at once
 */
export const getEquipmentByCodes = async (equipmentCodes: string[]): Promise<Equipment[]> => {
  try {
    if (!equipmentCodes || equipmentCodes.length === 0) {
      return [];
    }

    // Filter out empty codes
    const validCodes = equipmentCodes.filter(code => code && code.trim() !== '');

    if (validCodes.length === 0) {
      return [];
    }

    // Fetch all equipment in parallel
    const promises = validCodes.map(code => getEquipmentByCode(code));
    const responses = await Promise.allSettled(promises);

    // Extract successful responses
    const equipment: Equipment[] = [];
    responses.forEach((response, index) => {
      if (response.status === 'fulfilled' && response.value.responseData) {
        equipment.push(response.value.responseData);
      } else {
        console.warn(`Failed to fetch equipment for code: ${validCodes[index]}`, response);
      }
    });

    return equipment;
  } catch (error) {
    console.error('Error fetching equipment by codes:', error);
    throw error;
  }
};

// Export all functions
const equipmentApi = {
  getEquipmentNames,
  getEquipmentByCode,
  getEquipmentByCodes,
};

export default equipmentApi;