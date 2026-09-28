'use client'

import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Staff-profile card whose body can be collapsed by clicking the header.
 * - `collapsibleOn="below-xl"` (default): collapses on mobile / tablet only; always expanded on xl+.
 * - `collapsibleOn="always"`: collapsible at every screen size.
 */
export function CollapsibleCard({
    icon,
    iconClassName,
    title,
    action,
    defaultOpen = false,
    open: openProp,
    onOpenChange,
    collapsibleOn = 'below-xl',
    className,
    bodyClassName,
    children,
}: {
    icon: ReactNode
    iconClassName: string
    title: string
    /** Header-right content (e.g. Edit / Add buttons) — not part of the toggle. */
    action?: ReactNode
    defaultOpen?: boolean
    open?: boolean
    onOpenChange?: (open: boolean) => void
    collapsibleOn?: 'below-xl' | 'always'
    className?: string
    bodyClassName?: string
    children: ReactNode
}) {
    const [openState, setOpenState] = useState(defaultOpen)
    const open = openProp ?? openState
    const always = collapsibleOn === 'always'
    const toggle = () => {
        const next = !open
        setOpenState(next)
        onOpenChange?.(next)
    }

    return (
        <div className={cn('bg-white border border-[#e8ecf1] rounded-[14px] py-4 px-4 sm:py-6 sm:px-7 mb-4', className)}>
            <div className={cn(
                'flex flex-wrap items-center justify-between gap-2 border-slate-100',
                !always && 'xl:mb-5 xl:pb-3.5 xl:border-b',
                open && 'mb-4 sm:mb-5 pb-3.5 border-b'
            )}>
                <button
                    type="button"
                    onClick={toggle}
                    aria-expanded={open}
                    className={cn(
                        'flex min-w-0 flex-1 items-center gap-2.5 p-0 text-left text-base font-bold text-slate-800 bg-transparent border-none cursor-pointer',
                        !always && 'xl:cursor-default'
                    )}
                >
                    <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', iconClassName)}>
                        {icon}
                    </span>
                    <span className="min-w-0 truncate">{title}</span>
                    <ChevronDown className={cn(
                        'ml-auto h-4 w-4 shrink-0 text-slate-400 transition-transform',
                        !always && 'xl:hidden',
                        open && 'rotate-180'
                    )} />
                </button>
                {action}
            </div>
            <div className={cn(!open && (always ? 'hidden' : 'max-xl:hidden'), bodyClassName)}>
                {children}
            </div>
        </div>
    )
}
