import { useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { RootState } from '@/store/rootReducer'

/**
 * Custom hook for logout functionality - Redux only
 * Handles clearing auth state, localStorage, and Redux
 */
export const useLogout = () => {
  const router = useRouter()
  // const dispatch = useDispatch()
  const { isAuth } = useSelector((state: RootState) => state.auth)

  const handleLogout = () => {
    try {
      // Clear localStorage
      localStorage.removeItem('user')
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')

      // Clear Redux state - you'll need to implement logout action
      // dispatch(handleLogout()) // Uncomment when you have logout action

      // Redirect to login
      router.push('/auth/login')

      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Error during logout')
    }
  }

  return {
    handleLogout,
    // isAuthenticated: isAuth
  }
}
