import axios from '@/lib/axios.config'

export interface ThfValidateForDoneResponse {
  message: string | null
  /** Validation error messages. Empty = THF passed and the API moved it to Done (ready for Pre-Invoice mapping). */
  responseData: string[] | null
  error: string | null
}

export interface ThfValidateForDoneResult {
  isValid: boolean
  errors: string[]
}

const toErrorList = (data?: Partial<ThfValidateForDoneResponse> | null): string[] => {
  const list = Array.isArray(data?.responseData)
    ? data!.responseData.filter((m): m is string => typeof m === 'string' && m.trim() !== '')
    : []
  if (list.length > 0) return list
  if (data?.message === 'error') return [data.error || 'THF validation failed']
  return []
}

/**
 * Validate a THF before it is marked Done.
 * POST /lineMaintenances/{id}/thf-validate-for-done
 *
 * - Passed: API changes the THF status so Accounting can map it into a Pre-Invoice.
 * - Failed: responseData lists the reasons (returned either with HTTP 200 or an error status).
 * Network / server errors without a validation list are re-thrown.
 */
export const postThfValidateForDone = async (
  lineMaintenanceId: number
): Promise<ThfValidateForDoneResult> => {
  try {
    const response = await axios.post<ThfValidateForDoneResponse>(
      `/lineMaintenances/${lineMaintenanceId}/thf-validate-for-done`
    )
    const errors = toErrorList(response.data)
    return { isValid: errors.length === 0, errors }
  } catch (error: any) {
    const errors = toErrorList(error?.response?.data)
    if (errors.length > 0) return { isValid: false, errors }
    console.error('Error validating THF for done:', error)
    throw error
  }
}
