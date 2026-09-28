'use client'

import { Home, LayoutGrid, LogOut, UserRound } from 'lucide-react'
import { useSelector } from 'react-redux'
import { Link, usePathname } from '@/i18n/routing'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useMobileMenuConfig } from '@/hooks/use-mobile-menu'
import { useConfig } from '@/hooks/use-config'
import { useLogout } from '@/lib/api/hooks/useLogout'
import { RootState } from '@/store/rootReducer'
import { cn } from '@/lib/utils'

const HOME_HREF = '/flight/list'

function getInitials(name?: string | null) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
}

const itemClass = 'flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[11px] font-medium transition-colors'

export default function MobileBottomNav() {
  const pathname = usePathname()
  const [mobileMenuConfig, setMobileMenuConfig] = useMobileMenuConfig()
  const [config, setConfig] = useConfig()
  const { handleLogout } = useLogout()
  const { users } = useSelector((state: RootState) => state.auth)

  const isHome = pathname === HOME_HREF
  const menuOpen = mobileMenuConfig.isOpen

  const openMenu = () => {
    setConfig({ ...config, collapsed: false })
    setMobileMenuConfig({ isOpen: true })
  }

  return (
    <nav className="flex items-stretch justify-around" aria-label="Mobile navigation">
      <Link
        href={HOME_HREF}
        className={cn(itemClass, isHome ? 'text-primary' : 'text-default-600 hover:text-foreground')}
        aria-current={isHome ? 'page' : undefined}
      >
        <Home className="h-5 w-5" />
        Home
      </Link>

      <button
        type="button"
        onClick={openMenu}
        className={cn(itemClass, 'border-none bg-transparent cursor-pointer', menuOpen ? 'text-primary' : 'text-default-600 hover:text-foreground')}
        aria-expanded={menuOpen}
      >
        <LayoutGrid className="h-5 w-5" />
        Menu
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(itemClass, 'border-none bg-transparent cursor-pointer text-default-600 hover:text-foreground data-[state=open]:text-primary')}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
              {getInitials(users?.fullName)}
            </span>
            Account
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" sideOffset={12} className="w-60 p-0">
          <DropdownMenuLabel className="flex items-center gap-2.5 p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium capitalize text-default-800">{users?.fullName || '—'}</div>
              <div className="truncate text-xs font-normal text-default-600">{users?.email}</div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="mb-0 dark:bg-background" />
          <DropdownMenuItem
            onClick={handleLogout}
            className="flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm font-medium capitalize text-default-600 dark:hover:bg-background"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  )
}
