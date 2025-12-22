import axiosConfig from "@/lib/axios.config";

// Interface for file upload request
export interface FileUploadRequest {
  FileBase64: string;
  FileName: string;
  FileType: "thfnumber" | "service"; // Based on your example
  ExtensionFile: string;
}

// Interface for uploaded file response
export interface UploadedFile {
  filePath: string;
  fileName: string;
  fileType: string;
}

// Interface for file upload API response
export interface FileUploadResponse {
  message: string;
  responseData: UploadedFile[];
  error: string | null;
}

/**
 * Upload file to server
 * @param fileData - File upload request data containing base64, type, and extension
 * @returns Promise<FileUploadResponse> - Upload response with file paths
 */
export const fileUpload = async (fileData: FileUploadRequest): Promise<FileUploadResponse> => {
  try {
    console.log('Uploading file with data:', {
      FileType: fileData.FileType,
      ExtensionFile: fileData.ExtensionFile,
      FileBase64Length: fileData.FileBase64?.length || 0
    });

    const response = await axiosConfig.post('/lineMaintenances/uploadfile', fileData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 seconds timeout for file uploads
    });

    console.log('File upload response:', response.data);
    return response.data;
  } catch (error) {
    console.error('File upload error:', error);
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
 * Helper function to get file extension from filename
 * @param filename - Name of the file
 * @returns string - File extension without dot
 */
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

/**
 * Combined function to upload a File object
 * @param file - File object to upload
 * @param fileType - Type of file ("other" or "service")
 * @returns Promise<FileUploadResponse> - Upload response
 */
export const uploadFile = async (
  file: File,
  fileType: "thfnumber" | "service" = "thfnumber",
  fileName: string,
): Promise<FileUploadResponse> => {
  try {
    const base64 = await convertFileToBase64(file);
    const extension = getFileExtension(file.name);

    const uploadData: FileUploadRequest = {
      FileBase64: base64,
      FileType: fileType,
      FileName: fileName,
      ExtensionFile: extension
    };

    return await fileUpload(uploadData);
  } catch (error) {
    console.error('Upload file error:', error);
    throw error;
  }
};

export default fileUpload;
