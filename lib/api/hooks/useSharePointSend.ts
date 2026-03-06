import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
    postSharePointSend,
    SharePointSendResponse,
} from '../lineMaintenances/sharepoint/postSharePointSend'

export interface UseSharePointSendParams {
    lineMaintenancesId: number
    onSuccess?: (data: SharePointSendResponse) => void
    onError?: (error: Error) => void
}

/**
 * Hook for calling POST /sharepoint/send/{lineMaintenanceId}
 * Sends the THF file to SharePoint after successful submission.
 */
export const useSharePointSend = ({
    lineMaintenancesId,
    onSuccess,
    onError,
}: UseSharePointSendParams) => {
    const mutation = useMutation({
        mutationFn: () => postSharePointSend(lineMaintenancesId),
        onSuccess: (data) => {
            if (data.responseData?.sharePointUrl) {
                toast.success('File sent to SharePoint successfully', {
                    description: data.responseData.fileName || undefined,
                })
            }
            onSuccess?.(data)
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to send file to SharePoint')
            onError?.(error)
        },
    })

    return {
        sendToSharePoint: mutation.mutateAsync,
        isSharePointLoading: mutation.isPending,
        isSharePointSuccess: mutation.isSuccess,
        isSharePointError: mutation.isError,
        sharePointError: mutation.error,
        resetSharePoint: mutation.reset,
    }
}
