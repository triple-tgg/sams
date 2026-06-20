import { useMutation } from '@tanstack/react-query'
import { postLogin, LoginRequest, LoginResponse } from '@/lib/api/auth/postLogin'
import { toast } from 'sonner'
import { useDispatch } from 'react-redux'
import { useRouter, usePathname } from 'next/navigation'
import { handleLogin } from '@/components/partials/auth/store'
import { setPermissionsLoading, setPermissions, clearPermissions } from '@/components/partials/auth/permissionSlice'
import { getFirstViewableRoute } from '@/lib/api/permission/getFirstViewableRoute'

interface UseLoginOptions {
  onSuccess?: (data: LoginResponse) => void
  onError?: (error: Error) => void
  showToast?: boolean
}

/**
 * Custom hook for user login - Redux only
 * Uses menuPermissions returned directly from login API response
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
  const pathname = usePathname()

  // Extract locale from current pathname (e.g. /en/auth/login -> en)
  const locale = pathname.match(/^\/(en|ar)/)?.[1] ?? 'en'

  return useMutation({
    mutationFn: (loginData: LoginRequest) => postLogin(loginData),

    onSuccess: async (data: LoginResponse) => {
      if (showToast) {
        toast.success(data.message || 'Login successful!')
      }

      // Store user data in localStorage
      if (data.responseData) {
        localStorage.setItem('user', JSON.stringify(data.responseData))
        localStorage.setItem('access_token', data.responseData.accessToken)
        localStorage.setItem('refresh_token', data.responseData.refreshToken)

        // Map API response to Redux auth format
        const userData = {
          id: data.responseData.id,
          fullName: data.responseData.fullName,
          email: data.responseData.email,
          username: data.responseData.userName,
          role: data.responseData.roleObj?.name ?? '',       // role name
          roleId: data.responseData.roleObj?.id,             // role id
          roleCode: data.responseData.roleObj?.code ?? '',   // role code
          token: data.responseData.accessToken
        }

        // Update Redux state
        dispatch(handleLogin({
          isAuth: true,
          users: userData
        }))

        // Use menuPermissions from login response directly (no separate API call)
        dispatch(setPermissionsLoading())
        const permissions = data.responseData.menuPermissions ?? []
        console.log('[useLogin] permissions from login response:', permissions.length, 'items')
        dispatch(setPermissions(permissions))

        // Navigate to the first menu the user can view
        const firstRoute = getFirstViewableRoute(permissions)
        console.log('[useLogin] firstRoute resolved:', firstRoute)
        console.log('[useLogin] navigating to:', `/${locale}${firstRoute}`)
        router.push(`/${locale}${firstRoute}`)
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
