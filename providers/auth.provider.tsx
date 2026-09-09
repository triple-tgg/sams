'use client'
import { SessionProvider } from "next-auth/react"
import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch, Provider } from "react-redux"
import { RootState } from "@/store/rootReducer"
import { useRouter, usePathname } from "next/navigation"
import store from "@/store"
import { handleLogin } from "@/components/partials/auth/store"
import { resolveAuthRedirect } from "@/lib/auth/resolveAuthRedirect"
import { usePermissionHydration } from "@/hooks/use-permission-hydration"

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter()
    const pathname = usePathname()
    const dispatch = useDispatch()
    const [isInitializing, setIsInitializing] = useState(true)

    // Redux state
    const { isAuth } = useSelector((state: RootState) => state.auth)
    const permMenus = useSelector((state: RootState) => state.permission.menus)
    const isPermLoaded = useSelector((state: RootState) => state.permission.isLoaded)

    // Keep permissions in the store on every route, not just the protected
    // layouts — the root route needs them to decide where to send the user.
    usePermissionHydration()

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
                        role: userData.roleObj?.name || userData.role || '',
                        roleId: userData.roleObj?.id || userData.roleId,
                        roleCode: userData.roleObj?.code || userData.roleCode || '',
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
                setIsInitializing(false)
            }
        }

        initializeAuth()
    }, [dispatch])

    // Auth guard — redirect based on authentication status and permissions.
    useEffect(() => {
        if (isInitializing) return // Wait for initialization

        const decision = resolveAuthRedirect({
            pathname,
            isAuth,
            isPermLoaded,
            permissions: permMenus,
        })

        // `replace`, not `push`: the login page and the root spinner must not
        // stay in history, or Back drops the user onto a page that only
        // redirects again.
        if (decision.action === 'redirect' && decision.href !== pathname) {
            router.replace(decision.href)
        }
    }, [isAuth, pathname, router, isInitializing, isPermLoaded, permMenus])

    // Show loading during initialization
    if (isInitializing) {
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
