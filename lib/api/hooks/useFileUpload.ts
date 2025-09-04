import { useMutation } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";
import { 
  fileUpload, 
  uploadFile, 
  type FileUploadRequest, 
  type FileUploadResponse 
} from "../uploadFile/fileUpload";

/**
 * Hook for uploading files using base64 data
 * @returns Mutation object for file upload
 */
export const useFileUpload = () => {
  return useMutation<FileUploadResponse, Error, FileUploadRequest>({
    mutationFn: fileUpload,
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: `File uploaded successfully. ${data.responseData.length} file(s) processed.`,
      });
      console.log("File upload successful:", data);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || "Failed to upload file. Please try again.",
      });
      console.error("File upload failed:", error);
    },
  });
};

/**
 * Hook for uploading File objects directly
 * @returns Mutation object for File upload
 */
export const useUploadFile = () => {
  return useMutation<
    FileUploadResponse, 
    Error, 
    { file: File; fileType?: "other" | "service" }
  >({
    mutationFn: async ({ file, fileType = "other" }) => {
      return await uploadFile(file, fileType);
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: `File uploaded successfully. ${data.responseData.length} file(s) processed.`,
      });
      console.log("File upload successful:", data);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || "Failed to upload file. Please try again.",
      });
      console.error("File upload failed:", error);
    },
  });
};

/**
 * Hook for uploading multiple files
 * @returns Mutation object for multiple file upload
 */
export const useUploadMultipleFiles = () => {
  return useMutation<
    FileUploadResponse[], 
    Error, 
    { files: File[]; fileType?: "other" | "service" }
  >({
    mutationFn: async ({ files, fileType = "other" }) => {
      const uploadPromises = files.map(file => uploadFile(file, fileType));
      return await Promise.all(uploadPromises);
    },
    onSuccess: (data) => {
      const totalFiles = data.reduce((acc, response) => acc + response.responseData.length, 0);
      toast({
        title: "Upload Successful",
        description: `${totalFiles} file(s) uploaded successfully.`,
      });
      console.log("Multiple files upload successful:", data);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || "Failed to upload files. Please try again.",
      });
      console.error("Multiple files upload failed:", error);
    },
  });
};
