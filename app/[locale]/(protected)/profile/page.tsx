'use client'

import { UserX } from 'lucide-react'
import { useReduxAuth } from '@/lib/api/hooks/useReduxAuth'
import { StaffProfileView } from '../hr/staff/[id]/components/StaffProfileView'

/**
 * My Profile — the signed-in user's own staff profile.
 *
 * Opened from the header profile menu (shown only when the account is linked
 * to a staff record) and the landing page for a staff-linked user whose role
 * has no viewable menu. Not in ROUTE_PERMISSION_MAP on purpose: every
 * signed-in user may view their own profile. `isSelf` lets the owner edit
 * their profile image, Documents, AMEL Attachment, Contact (Email locked) and
 * Logbook Records; every other edit still follows HR_STAFF permissions.
 */
export default function MyProfilePage() {
    const { user } = useReduxAuth()
    const staffId = Number(user?.staffId) || 0

    if (!staffId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 px-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <UserX className="h-7 w-7 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-700">No staff profile linked</p>
                <p className="text-xs text-slate-400 max-w-xs">
                    Your account is not linked to a staff record. Please contact IT Support if this is incorrect.
                </p>
            </div>
        )
    }

    return <StaffProfileView staffId={staffId} backPath={null} isSelf />
}
