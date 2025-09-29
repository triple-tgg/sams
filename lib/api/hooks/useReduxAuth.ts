import { useSelector } from 'react-redux'
import { RootState } from '@/store/rootReducer'

/**
 * Custom hook for accessing Redux auth state
 * Replaces useAuth context with Redux-only approach
 */
export const useReduxAuth = () => {
  const { isAuth, users } = useSelector((state: RootState) => state.auth)

  return {
    // Auth status
    isAuthenticated: isAuth,
    isAuth,
    
    // User data
    user: users,
    users,
    
    // Helper methods
    isLoggedIn: () => isAuth,
    getUserData: () => users,
    getUserRole: () => users?.role,
    getUserName: () => users?.username, // Fixed: use username instead of userName
    getUserFullName: () => users?.fullName,
    getUserEmail: () => users?.email,
    
    // Permission checks
    hasRole: (role: string) => isAuth && users?.role === role,
    isAdmin: () => isAuth && users?.role === 'admin',
    isUser: () => isAuth && users?.role === 'user',
    
    // Validation with null check
    canAccess: (allowedRoles: string[]) => {
      return isAuth && users?.role && allowedRoles.includes(users.role)
    }
  }
}

export default useReduxAuth
