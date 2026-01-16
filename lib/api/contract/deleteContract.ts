import axiosConfig from "@/lib/axios.config";

// Interface for contract delete request
export interface ContractDeleteRequest {
    id: number;
    userName: string;
}

// Interface for contract delete API response
export interface ContractDeleteResponse {
    message: string;
    responseData: null;
    error: string;
}

/**
 * Delete a contract
 * @param data - Contract delete request data (id and userName)
 * @returns Promise<ContractDeleteResponse>
 */
export const deleteContract = async (data: ContractDeleteRequest): Promise<ContractDeleteResponse> => {
    try {
        console.log('Deleting contract:', data);
        const response = await axiosConfig.post('/contract/delete', data);
        console.log('Contract delete response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Contract delete error:', error);
        throw error;
    }
};

export default deleteContract;
