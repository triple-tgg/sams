import axiosInstance from '@/lib/axios.config'

// Logout request interface
export interface LogoutRequest {
  refreshToken: string
}

// Logout response interface
export interface LogoutResponse {
  message: string
  responseData: {
    loggedOut: boolean
  }
  error: string
}

/**
 * Logout API function - invalidates refresh token on server
 * @param data - Contains the refresh token to invalidate
 * @returns Promise with logout response
 */
export const postLogout = async (data: LogoutRequest): Promise<LogoutResponse> => {
  try {
    const response = await axiosInstance.post<LogoutResponse>('/user/logout', data)
    return response.data
  } catch (error: any) {
    // Even if API fails, we still want to clear local state
    console.error('Logout API error:', error)
    throw error
  }
}
