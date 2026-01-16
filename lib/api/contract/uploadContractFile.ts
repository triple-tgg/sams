import axiosConfig from "@/lib/axios.config";

// Interface for contract file upload request
export interface ContractFileUploadRequest {
    FileBase64: string;
    FileType: string;
    ExtensionFile: string;
    FileName: string;
}

// Interface for uploaded file response
export interface ContractUploadedFile {
    filePath: string;
    fileName: string;
    fileType: string;
}

// Interface for file upload API response
export interface ContractFileUploadResponse {
    message: string;
    responseData: ContractUploadedFile[];
    error: string | null;
}

/**
 * Upload contract file to server
 * @param fileData - File upload request data containing base64 and file info
 * @returns Promise<ContractFileUploadResponse> - Upload response with file paths
 */
export const uploadContractFile = async (fileData: ContractFileUploadRequest): Promise<ContractFileUploadResponse> => {
    try {
        console.log('Uploading contract file...');

        const response = await axiosConfig.post('/contract/uploadfile', fileData, {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 60000, // 60 seconds timeout for file uploads
        });

        console.log('Contract file upload response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Contract file upload error:', error);
        throw error;
    }
};

/**
 * Helper function to convert File object to base64 string
 * @param file - File object to convert
 * @returns Promise<string> - Base64 encoded string
 */
export const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
            const base64 = result.split(',')[1];
            resolve(base64);
        };

        reader.onerror = () => {
            reject(new Error('Failed to convert file to base64'));
        };

        reader.readAsDataURL(file);
    });
};

/**
 * Get file extension from filename
 * @param filename - Name of the file
 * @returns File extension without the dot
 */
export const getFileExtension = (filename: string): string => {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
};

/**
 * Get filename without extension
 * @param filename - Name of the file
 * @returns Filename without extension
 */
export const getFileNameWithoutExtension = (filename: string): string => {
    const parts = filename.split('.');
    if (parts.length > 1) {
        parts.pop();
    }
    return parts.join('.');
};

/**
 * Combined function to upload a contract File object
 * @param file - File object to upload
 * @returns Promise<ContractFileUploadResponse> - Upload response
 */
export const uploadContractDocument = async (file: File): Promise<ContractFileUploadResponse> => {
    try {
        const base64 = await convertFileToBase64(file);
        const extension = getFileExtension(file.name);
        const fileNameWithoutExt = getFileNameWithoutExtension(file.name);

        const uploadData: ContractFileUploadRequest = {
            FileBase64: base64,
            FileType: "contract",
            ExtensionFile: extension,
            FileName: fileNameWithoutExt,
        };

        return await uploadContractFile(uploadData);
    } catch (error) {
        console.error('Upload contract document error:', error);
        throw error;
    }
};

export default uploadContractFile;
