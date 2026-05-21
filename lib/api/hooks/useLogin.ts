import { useMutation } from '@tanstack/react-query'
import { postLogin, LoginRequest, LoginResponse } from '@/lib/api/auth/postLogin'
import { toast } from 'sonner'
import { useDispatch } from 'react-redux'
import { useRouter, usePathname } from 'next/navigation'
import { handleLogin } from '@/components/partials/auth/store'
import { setPermissionsLoading, setPermissions, clearPermissions } from '@/components/partials/auth/permissionSlice'
import { getMenuPermissions } from '@/lib/api/permission/getMenuPermissions'
import { getFirstViewableRoute } from '@/lib/api/permission/getFirstViewableRoute'

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
        localStorage.setItem('access_token', 'authenticated-user-token')

        // Map API response to Redux auth format
        const userData = {
          id: data.responseData.id,
          fullName: data.responseData.fullName,
          email: data.responseData.email,
          username: data.responseData.userName,
          role: data.responseData.roleObj?.name ?? '',       // role name
          roleId: data.responseData.roleObj?.id,             // role id
          roleCode: data.responseData.roleObj?.code ?? '',   // role code
          token: 'authenticated-user-token'
        }

        // Update Redux state
        dispatch(handleLogin({
          isAuth: true,
          users: userData
        }))

        // Fetch menu permissions BEFORE navigating
        const roleId = data.responseData.roleObj?.id
        if (roleId) {
          dispatch(setPermissionsLoading())
          try {
            const permRes = await getMenuPermissions(roleId)
            console.log('[useLogin] permissions fetched:', permRes.responseData?.length, 'items')
            const permissions = permRes.responseData ?? []
            dispatch(setPermissions(permissions))

            // Navigate to the first menu the user can view
            const firstRoute = getFirstViewableRoute(permissions)
            console.log('[useLogin] firstRoute resolved:', firstRoute)
            console.log('[useLogin] navigating to:', `/${locale}${firstRoute}`)
            router.push(`/${locale}${firstRoute}`)
          } catch (err) {
            console.error('[useLogin] permission fetch failed:', err)
            dispatch(setPermissions([]))
            router.push(`/${locale}/flight/list`)
          }
        } else {
          dispatch(setPermissions([]))
          router.push(`/${locale}/flight/list`)
        }
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
