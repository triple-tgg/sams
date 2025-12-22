'use client'
import { useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { RootState } from '@/store/rootReducer'

interface WithAuthProps {
  allowedRoles?: string[]
  fallbackPath?: string
}

/**
 * Higher-Order Component for protecting routes - Redux only
 * @param WrappedComponent - Component to protect
 * @param options - Auth options
 * @returns Protected component
 */
export function withAuth<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  options: WithAuthProps = {}
) {
  const { allowedRoles, fallbackPath = '/auth/login' } = options

  return function ProtectedComponent(props: T) {
    const { isAuth, users } = useSelector((state: RootState) => state.auth)
    const router = useRouter()

    useEffect(() => {
      if (!isAuth) {
        router.push(fallbackPath)
        return
      }

      // Check role-based access
      if (allowedRoles && users && users.role && !allowedRoles.includes(users.role)) {
        router.push('/unauthorized')
        return
      }
    }, [isAuth, users, router])

    // Show nothing while redirecting
    if (!isAuth) {
      return null
    }

    // Show unauthorized if role doesn't match
    if (allowedRoles && users && users.role && !allowedRoles.includes(users.role)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
          </div>
        </div>
      )
    }

    // Render the protected component
    return <WrappedComponent {...props} />
  }
}

/**
 * Hook for checking specific permissions - Redux only
 */
export const usePermissions = () => {
  const { isAuth, users } = useSelector((state: RootState) => state.auth)

  const hasRole = (role: string) => {
    return isAuth && users?.role === role
  }

  const hasAnyRole = (roles: string[]) => {
    return isAuth && users?.role && roles.includes(users.role)
  }

  const isAdmin = () => hasRole('admin')
  const isUser = () => hasRole('user')

  return {
    hasRole,
    hasAnyRole,
    isAdmin,
    isUser,
    currentRole: users?.role,
    isAuthenticated: isAuth,
    user: users
  }
}
