import axiosInstance from '@/lib/axios.config';

// Types for Parts/Tools API
export interface PartsTool {
  id: number;
  code: string;
}

export interface PartsToolsApiResponse {
  message: string;
  responseData: PartsTool[];
  error: string;
}

export interface PartsToolByNameApiResponse {
  message: string;
  responseData: PartsTool;
  error: string;
}

/**
 * Get all parts/tools names
 * GET /master/PartsToolsNames
 */
export const getPartsToolsNames = async (): Promise<PartsToolsApiResponse> => {
  try {
    const response = await axiosInstance.get<PartsToolsApiResponse>('/master/PartsToolsNames');
    return response.data;
  } catch (error) {
    console.error('Error fetching parts/tools names:', error);
    throw error;
  }
};

/**
 * Get parts/tools by specific name
 * GET /master/PartsToolsByNames/{name}
 */
export const getPartsToolsByName = async (name: string): Promise<PartsToolsApiResponse> => {
  try {
    if (!name || name.trim() === '') {
      throw new Error('Parts/Tools name is required');
    }

    const response = await axiosInstance.get<PartsToolsApiResponse>(
      `/master/PartsToolsByNames/${encodeURIComponent(name)}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching parts/tools by name ${name}:`, error);
    throw error;
  }
};

/**
 * Get multiple parts/tools by names
 * Utility function to fetch multiple parts/tools at once
 */
export const getPartsToolsByNames = async (names: string[]): Promise<PartsTool[]> => {
  try {
    if (!names || names.length === 0) {
      return [];
    }

    // Filter out empty names
    const validNames = names.filter(name => name && name.trim() !== '');
    
    if (validNames.length === 0) {
      return [];
    }

    // Fetch all parts/tools in parallel
    const promises = validNames.map(name => getPartsToolsByName(name));
    const responses = await Promise.allSettled(promises);

    // Extract successful responses and flatten arrays
    const partsTools: PartsTool[] = [];
    responses.forEach((response, index) => {
      if (response.status === 'fulfilled' && response.value.responseData) {
        // Since API returns array, we need to spread it
        if (Array.isArray(response.value.responseData)) {
          partsTools.push(...response.value.responseData);
        } else {
          partsTools.push(response.value.responseData);
        }
      } else {
        console.warn(`Failed to fetch parts/tools for name: ${validNames[index]}`, response);
      }
    });

    return partsTools;
  } catch (error) {
    console.error('Error fetching parts/tools by names:', error);
    throw error;
  }
};

/**
 * Search parts/tools by partial name match
 * Utility function for search functionality
 */
export const searchPartsToolsByName = async (searchTerm: string): Promise<PartsTool[]> => {
  try {
    if (!searchTerm || searchTerm.trim() === '') {
      return [];
    }

    const trimmedSearchTerm = searchTerm.trim();
    const response = await getPartsToolsByName(trimmedSearchTerm);
    
    return Array.isArray(response.responseData) ? response.responseData : [response.responseData];
  } catch (error) {
    // If exact match fails, return empty array (could implement fuzzy search here)
    console.warn(`No exact match found for search term: ${searchTerm}`);
    return [];
  }
};

/**
 * Get parts/tools by ID
 * Utility function to get specific parts/tools by ID from a list
 */
export const getPartsToolsById = async (ids: number[]): Promise<PartsTool[]> => {
  try {
    // This would require getting all parts/tools first and then filtering
    // Since there's no direct API endpoint for IDs, we'd need to implement this differently
    // For now, this is a placeholder that could be implemented based on business needs
    
    console.warn('getPartsToolsById not implemented - requires all parts/tools endpoint');
    return [];
  } catch (error) {
    console.error('Error fetching parts/tools by IDs:', error);
    throw error;
  }
};

// Export all functions
const partsToolsApi = {
  getPartsToolsNames,
  getPartsToolsByName,
  getPartsToolsByNames,
  searchPartsToolsByName,
  getPartsToolsById,
};

export default partsToolsApi;