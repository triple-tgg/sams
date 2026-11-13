import axiosInstance from '@/lib/axios.config'

// Login request interface
export interface LoginRequest {
  email: string
  password: string
}

// Role object returned inside login response
export interface LoginRoleObj {
  id: number
  code: string
  name: string
  description: string
  isdelete: boolean
  createddate: string
  createdby: string
  updateddate: string
  updatedby: string
}

// Login response interface
// On failure the API answers { message: "error", responseData: null, error: "<reason>" }.
export interface LoginResponse {
  message: string
  responseData: {
    id: number
    userName: string
    email: string
    fullName: string
    /** true = internal account linked to a staff member. */
    flagInternal: boolean
    /** Employee ID the account is linked to (internal accounts; null otherwise). */
    staffEmployeeId: string | null
    /** Linked staff record id (null when not linked). */
    staffId: number | null
    /** Linked staff employee ID as stored on the staff record (null when not linked). */
    employeeId: string | null
    /** Linked staff English full name (null when not linked). */
    fullNameEn: string | null
    roleObj: LoginRoleObj
    menuPermissions: import('@/lib/api/permission/menuPermissions.interface').MenuPermissionItem[]
    accessToken: string
    refreshToken: string
    expiresIn: number
  } | null
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

    if (response.data.error) {
      throw new Error(response.data.error || response.data.message || 'Login failed')
    }

    return response.data
  } catch (error: any) {
    // Handle API errors
    if (error.response?.data) {
      throw new Error(error.response.data.error || error.response.data.message || 'Login failed')
    }
    // If we threw a manual error above, re-throw it
    if (error instanceof Error && error.message !== 'Network error occurred during login') {
      throw error;
    }
    throw new Error('Network error occurred during login')
  }
}
