'use client'
import { SessionProvider } from "next-auth/react"
import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch, Provider } from "react-redux"
import { RootState } from "@/store/rootReducer"
import { useRouter, usePathname } from "next/navigation"
import store from "@/store"
import { handleLogin } from "@/components/partials/auth/store"

// Public routes that don't require authentication (without locale prefix)
const publicRoutesBase = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password'
]

// Root routes that should redirect based on auth status
const rootRoutes = ['/', '/en', '/ar']

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter()
    const pathname = usePathname()
    const dispatch = useDispatch()
    const [isLoading, setIsLoading] = useState(true)

    // Redux state
    const { isAuth } = useSelector((state: RootState) => state.auth)

    // Extract locale from pathname (e.g., /en/dashboard -> en, /ar/auth/login -> ar)
    const getLocale = () => {
        const match = pathname.match(/^\/(en|ar)/)
        return match ? match[1] : 'en'
    }
    const locale = getLocale()

    // Get the path without locale prefix for matching
    const pathWithoutLocale = pathname.replace(/^\/(en|ar)/, '') || '/'

    // Check if current route is public
    const isPublicRoute = publicRoutesBase.includes(pathWithoutLocale)

    // Check if current route is a root route
    const isRootRoute = rootRoutes.includes(pathname) || pathWithoutLocale === '/'

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

        // Handle root routes (/, /en, /ar)
        if (isRootRoute) {
            if (isAuth) {
                // User is authenticated - redirect to dashboard
                router.push(`/${locale}/dashboard`)
            } else {
                // User is not authenticated - redirect to login
                router.push(`/${locale}/auth/login`)
            }
            return
        }

        // Handle login page redirect when already authenticated
        if (isAuth && pathWithoutLocale === '/auth/login') {
            router.push(`/${locale}/dashboard`)
            return
        }

        // Handle protected routes
        if (!isAuth && !isPublicRoute) {
            // User is not authenticated and trying to access protected route
            router.push(`/${locale}/auth/login`)
        }
    }, [isAuth, pathname, pathWithoutLocale, isPublicRoute, isRootRoute, router, isLoading, locale])

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