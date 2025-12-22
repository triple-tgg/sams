'use client'
import { SessionProvider } from "next-auth/react"
import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch, Provider } from "react-redux"
import { RootState } from "@/store/rootReducer"
import { useRouter, usePathname } from "next/navigation"
import store from "@/store"
import { handleLogin } from "@/components/partials/auth/store"

// Public routes that don't require authentication
const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password'
]

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter()
    const pathname = usePathname()
    const dispatch = useDispatch()
    const [isLoading, setIsLoading] = useState(true)

    // Redux state
    const { isAuth, users } = useSelector((state: RootState) => state.auth)

    // Check if current route is public
    const isPublicRoute = publicRoutes.includes(pathname)

    // Initialize auth state from localStorage
    useEffect(() => {
        const initializeAuth = () => {
            try {
                const storedUser = localStorage.getItem('user')
                const accessToken = localStorage.getItem('access_token')

                if (storedUser && accessToken) {
                    const userData = JSON.parse(storedUser)

                    // Map stored user data to Redux format
                    const mappedUserData = {
                        id: userData.id,
                        fullName: userData.fullName,
                        email: userData.email,
                        username: userData.userName || userData.username, // Handle both formats
                        role: userData.role,
                        token: accessToken
                    }

                    // Sync with Redux
                    dispatch(handleLogin({
                        isAuth: true,
                        users: mappedUserData
                    }))
                } else {
                    // Clear any stale data
                    localStorage.removeItem('user')
                    localStorage.removeItem('access_token')
                    localStorage.removeItem('refresh_token')
                }
            } catch (error) {
                console.error('Error initializing auth:', error)
                // Clear corrupted data
                localStorage.removeItem('user')
                localStorage.removeItem('access_token')
                localStorage.removeItem('refresh_token')
            } finally {
                setIsLoading(false)
            }
        }

        initializeAuth()
    }, [dispatch])

    // Auth guard - redirect based on authentication status
    useEffect(() => {
        if (isLoading) return // Wait for initialization

        if (!isAuth && !isPublicRoute) {
            // User is not authenticated and trying to access protected route
            router.push(`/`)
        } else if (isAuth && pathname === '/auth/login') {
            // User is authenticated and on login page - redirect to dashboard
            router.push('/dashboard')
        }
    }, [isAuth, pathname, isPublicRoute, router, isLoading])

    // Show loading during initialization
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    return <>{children}</>
}

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <Provider store={store}>
            <SessionProvider>
                <AuthGuard>
                    {children}
                </AuthGuard>
            </SessionProvider>
        </Provider>
    )
}

export default AuthProvider