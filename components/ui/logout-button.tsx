'use client'
import React from 'react'
import { useLogout } from '@/lib/api/hooks/useLogout'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/rootReducer'

/**
 * Logout Button Component - Redux only
 */
export const LogoutButton = () => {
  const { handleLogout } = useLogout()
  const { isAuth, users } = useSelector((state: RootState) => state.auth)
  
  // Don't render if not authenticated
  if (!isAuth) {
    return null
  }
  
  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
    >
      <LogOut className="w-4 h-4" />
      Logout
      {users?.fullName && (
        <span className="text-xs text-gray-500">({users.fullName})</span>
      )}
    </Button>
  )
}

export default LogoutButton
