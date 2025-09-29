import { useMutation } from '@tanstack/react-query'
import { postLogin, LoginRequest, LoginResponse } from '@/lib/api/auth/postLogin'
import { toast } from 'sonner'
import { useDispatch } from 'react-redux'
import { useRouter } from 'next/navigation'
import { handleLogin } from '@/components/partials/auth/store'

interface UseLoginOptions {
  onSuccess?: (data: LoginResponse) => void
  onError?: (error: Error) => void
  showToast?: boolean
}

/**
 * Custom hook for user login - Redux only
 * @param options - Configuration options for the mutation
 * @returns React Query mutation object
 */
export const useLogin = (options: UseLoginOptions = {}) => {
  const {
    onSuccess,
    onError,
    showToast = true
  } = options

  const dispatch = useDispatch()
  const router = useRouter()

  return useMutation({
    mutationFn: (loginData: LoginRequest) => postLogin(loginData),

    onSuccess: (data: LoginResponse) => {
      if (showToast) {
        toast.success(data.message || 'Login successful!')
      }

      // Store user data and access token in localStorage
      if (data.responseData) {
        localStorage.setItem('user', JSON.stringify(data.responseData))
        localStorage.setItem('access_token', 'authenticated-user-token')

        // Map API response to Redux auth format
        const userData = {
          id: data.responseData.id,
          fullName: data.responseData.fullName,
          email: data.responseData.email,
          username: data.responseData.userName, // Map userName to username
          role: data.responseData.role,
          token: 'authenticated-user-token'
        }

        // Update Redux state
        dispatch(handleLogin({
          isAuth: true,
          users: userData
        }))

        // Navigate to dashboard
        router.push('/dashboard')
      }

      // Call custom success handler
      onSuccess?.(data)
    },

    onError: (error: Error) => {
      if (showToast) {
        toast.error(error.message || 'Login failed. Please try again.')
      }

      // Clear any existing auth data on error
      localStorage.removeItem('user')
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')

      // Call custom error handler
      onError?.(error)
    }
  })
}
