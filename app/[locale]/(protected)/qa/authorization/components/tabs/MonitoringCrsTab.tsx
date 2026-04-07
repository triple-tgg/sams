'use client'

import { useState, useMemo } from 'react'
import { Search, Filter, AlertTriangle } from 'lucide-react'
import {
    AuthStatus,
    getAuthStatus, isCrsEligible,
    AUTH_STATUS_META,
} from '../../types'
import { STAFF_AUTHORIZATIONS, CUSTOMERS } from '../../data'
import { AuthMatrix } from '../AuthMatrix'

export function MonitoringCrsTab() {
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState<'all' | 'issues' | 'crs-eligible' | 'crs-ineligible'>('all')

    const filteredStaff = useMemo(() => {
        let list = [...STAFF_AUTHORIZATIONS]

        if (searchTerm) {
            const q = searchTerm.toLowerCase()
            list = list.filter(s =>
                s.name.toLowerCase().includes(q) ||
                s.staffId.includes(q) ||
                s.position.toLowerCase().includes(q)
            )
        }

        if (filterStatus === 'issues') {
            list = list.filter(s => {
                const ss = getAuthStatus(s.samsAuth)
                if (ss === 'expired' || ss === 'suspended') return true
                return Object.values(s.customerAuths).some(r => {
                    const st = getAuthStatus(r)
                    return st === 'expired' || st === 'suspended'
                })
            })
        } else if (filterStatus === 'crs-eligible') {
            list = list.filter(s => isCrsEligible(s))
        } else if (filterStatus === 'crs-ineligible') {
            list = list.filter(s => !isCrsEligible(s))
        }

        return list
    }, [searchTerm, filterStatus])

    return (
        <div className="space-y-4">
            {/* Status Legend */}
            <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Status Legend:</span>
                        {(['active', 'expiring', 'expired', 'suspended', 'not-issued'] as AuthStatus[]).map(st => {
                            const m = AUTH_STATUS_META[st]
                            return (
                                <div key={st} className="flex items-center gap-1.5 text-[11px]">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: m.dot }} />
                                    <span className="font-semibold" style={{ color: m.text }}>{m.label}</span>
                                </div>
                            )
                        })}
                    </div>
                    <div className="text-[10px] text-muted-foreground max-w-sm text-right">
                        <AlertTriangle className="w-3 h-3 inline mr-1 text-amber-500" />
                        CRS requires <strong>both</strong> active SAMS + ≥1 Customer authorization
                    </div>
                </div>
            </div>

            {/* Search + Filter + Matrix Table */}
            <div>
                <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-sm font-semibold text-foreground">
                        Authorization Matrix — Certifying Staff ({filteredStaff.length})
                    </h3>
                    <div className="ml-auto flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search staff…"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-56"
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <select
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value as any)}
                                className="pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer"
                            >
                                <option value="all">All Staff</option>
                                <option value="issues">⚠ Has Issues</option>
                                <option value="crs-eligible">✓ CRS Eligible</option>
                                <option value="crs-ineligible">✗ CRS Ineligible</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border border-border overflow-hidden">
                    <AuthMatrix staff={filteredStaff} customers={CUSTOMERS} />
                </div>
            </div>
        </div>
    )
}
