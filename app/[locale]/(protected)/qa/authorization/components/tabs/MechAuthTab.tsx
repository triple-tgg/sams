import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, X, Search, Wrench, Loader2, MapPin, Briefcase } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useQAStaffList } from '@/lib/api/hooks/useQAStaffManagement'
import { QAStaffItem } from '@/lib/api/qa/staff-management'
import useDebounce from '@/hooks/useDebounce'

// ─── Main Component ──────────────────────────────────────────────────────────
export function MechAuthTab() {
    const [mech1, setMech1] = useState<QAStaffItem[]>([])
    const [mech2, setMech2] = useState<QAStaffItem[]>([])
    const [search, setSearch] = useState('')
    const debouncedSearch = useDebounce(search, 500)

    const { data, isLoading } = useQAStaffList({
        name: debouncedSearch,
        employeeId: "",
        positionId: 0,
        departmentId: 0,
        staffstypeId: 0,
        page: 1,
        perPage: 20
    })

    const apiStaff = data?.responseData || []

    const filteredAvailable = apiStaff.filter(staff =>
        !mech1.some(m => m.id === staff.id) && !mech2.some(m => m.id === staff.id)
    )

    const moveToMech1 = (staff: QAStaffItem) => {
        setMech1(prev => [...prev, staff])
    }
    const moveToMech2 = (staff: QAStaffItem) => {
        setMech2(prev => [...prev, staff])
    }
    const removeFromMech1 = (staff: QAStaffItem) => {
        setMech1(prev => prev.filter(s => s.id !== staff.id))
    }
    const removeFromMech2 = (staff: QAStaffItem) => {
        setMech2(prev => prev.filter(s => s.id !== staff.id))
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── Available Staff ── */}
            <Card className="flex flex-col h-[700px]">
                <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base font-semibold flex items-center justify-between">
                        Available Staff
                        <Badge color="secondary">{filteredAvailable.length}</Badge>
                    </CardTitle>
                    <div className="relative mt-3">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name..."
                            className="pl-9 h-9 text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-y-auto">
                    <div className="flex flex-col p-3 space-y-2.5">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                <p className="text-sm">Loading staff...</p>
                            </div>
                        ) : filteredAvailable.map(staff => (
                            <div
                                key={staff.id}
                                className="flex items-center gap-3 p-2.5 bg-white border rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-all"
                            >
                                {/* Avatar */}
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-500">
                                    <User className="h-6 w-6" />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 truncate">{staff.name}</p>
                                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                                        <span className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            ID: {staff.employeeId || staff.code}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Briefcase className="w-3 h-3" />
                                            {staff.positionObj?.name || staff.jobTitle || '–'}
                                        </span>
                                    </div>
                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 mt-2">
                                        <button
                                            className="px-3 py-1 text-[11px] font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                            onClick={() => moveToMech1(staff)}
                                        >
                                            MECH 1
                                        </button>
                                        <button
                                            className="px-3 py-1 text-[11px] font-semibold rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                                            onClick={() => moveToMech2(staff)}
                                        >
                                            MECH 2
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {!isLoading && filteredAvailable.length === 0 && (
                            <div className="text-center py-10 text-muted-foreground text-sm">
                                No staff found
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* ── Mech 1 ── */}
            <Card className="flex flex-col h-[700px] border-blue-200 shadow-sm">
                <CardHeader className="pb-3 border-b bg-blue-50/50">
                    <CardTitle className="text-base font-semibold flex items-center justify-between text-blue-700">
                        <div className="flex items-center gap-2">
                            <Wrench className="w-4 h-4" />
                            Mech 1
                        </div>
                        <Badge className="bg-blue-600 hover:bg-blue-700">{mech1.length}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-y-auto bg-slate-50/30">
                    <div className="flex flex-col p-3 space-y-2.5">
                        {mech1.map(staff => (
                            <div
                                key={staff.id}
                                className="flex items-center gap-3 p-3 bg-white border border-blue-100 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] group hover:shadow-md transition-all"
                            >
                                {/* Avatar */}
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-500">
                                    <User className="h-5 w-5" />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 truncate">{staff.name}</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">ID: {staff.employeeId || staff.code}</p>
                                </div>

                                {/* Remove */}
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 shrink-0 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600 rounded-full"
                                    onClick={() => removeFromMech1(staff)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                        {mech1.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                <User className="w-10 h-10 mb-2 opacity-20" />
                                <p className="text-sm">No staff assigned</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* ── Mech 2 ── */}
            <Card className="flex flex-col h-[700px] border-emerald-200 shadow-sm">
                <CardHeader className="pb-3 border-b bg-emerald-50/50">
                    <CardTitle className="text-base font-semibold flex items-center justify-between text-emerald-700">
                        <div className="flex items-center gap-2">
                            <Wrench className="w-4 h-4" />
                            Mech 2
                        </div>
                        <Badge className="bg-emerald-600 hover:bg-emerald-700">{mech2.length}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-y-auto bg-slate-50/30">
                    <div className="flex flex-col p-3 space-y-2.5">
                        {mech2.map(staff => (
                            <div
                                key={staff.id}
                                className="flex items-center gap-3 p-3 bg-white border border-emerald-100 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] group hover:shadow-md transition-all"
                            >
                                {/* Avatar */}
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-500">
                                    <User className="h-5 w-5" />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 truncate">{staff.name}</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">ID: {staff.employeeId || staff.code}</p>
                                </div>

                                {/* Remove */}
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 shrink-0 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600 rounded-full"
                                    onClick={() => removeFromMech2(staff)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                        {mech2.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                <User className="w-10 h-10 mb-2 opacity-20" />
                                <p className="text-sm">No staff assigned</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
