import axiosInstance from '@/lib/axios.config'

// Login request interface
export interface LoginRequest {
  email: string
  password: string
}

// Login response interface
export interface LoginResponse {
  message: string
  responseData: {
    id: number
    userName: string
    email: string
    fullName: string
    role: string
  }
  error: string
}

/**
 * Login API function
 * @param loginData - User credentials
 * @returns Promise with login response
 */
export const postLogin = async (loginData: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await axiosInstance.post<LoginResponse>('/user/login', {
      email: loginData.email,
      password: loginData.password
    })

    return response.data
  } catch (error: any) {
    // Handle API errors
    if (error.response?.data) {
      throw new Error(error.response.data.message || error.response.data.error || 'Login failed')
    }
    throw new Error('Network error occurred during login')
  }
}
