import { useDispatch, useSelector } from 'react-redux'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { RootState } from '@/store/rootReducer'
import { handleLogout as logout } from '@/components/partials/auth/store'
import { clearPermissions } from '@/components/partials/auth/permissionSlice'
import { postLogout } from '@/lib/api/auth/postLogout'
import { useState } from 'react'

/**
 * Custom hook for logout functionality
 * Calls logout API to invalidate refresh token on server,
 * then clears auth state, localStorage, and Redux
 */
export const useLogout = () => {
  const router = useRouter()
  const pathname = usePathname()
  const dispatch = useDispatch()
  const { isAuth } = useSelector((state: RootState) => state.auth)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Extract locale from current pathname
  const locale = pathname.match(/^\/(en|ar)/)?.[1] ?? 'en'

  const handleLogout = async () => {
    if (isLoggingOut) return // ป้องกันกดซ้ำ
    setIsLoggingOut(true)

    try {
      // เรียก API logout เพื่อ invalidate refresh token บน server
      const refreshToken = localStorage.getItem('refresh_token') ?? ''
      if (refreshToken) {
        await postLogout({ refreshToken })
      }
    } catch (error) {
      // ถ้า API fail ก็ยังให้ logout ฝั่ง client ต่อได้
      console.error('Logout API error:', error)
    } finally {
      // Clear localStorage
      localStorage.removeItem('user')
      localStorage.removeItem('users')
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('isAuth')

      // Clear Redux state
      dispatch(logout())
      dispatch(clearPermissions())

      setIsLoggingOut(false)

      toast.success('Logged out successfully')

      // Redirect to login
      router.push(`/${locale}/auth/login`)
    }
  }

  return {
    handleLogout,
    isAuthenticated: isAuth,
    isLoggingOut
  }
}
