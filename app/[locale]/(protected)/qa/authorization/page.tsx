'use client'

import { useState, useMemo, type ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ShieldCheck, RefreshCw, BarChart3, Shield, Building2, Plane, Globe } from 'lucide-react'

// ─── Tab Components ──────────────────────────────────────────────────────────
import { OverviewTab } from './components/tabs/OverviewTab'
import { MonitoringCrsTab } from './components/tabs/MonitoringCrsTab'
import { SamsAuthTab } from './components/tabs/SamsAuthTab'
import { CustomerAuthTab } from './components/tabs/CustomerAuthTab'
import { AuthorityAuthTab } from './components/tabs/AuthorityAuthTab'
import { MechAuthTab } from './components/tabs/MechAuthTab'

// ─── Tab Definitions ─────────────────────────────────────────────────────────

type TabKey = 'dashboard' | 'monitoring' | 'sams' | 'customer' | 'authority'

const TABS: { key: TabKey; label: string; shortLabel?: string; icon: ReactNode }[] = [
    { key: 'dashboard',   label: 'Dashboard',       icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { key: 'monitoring',  label: 'Monitoring CRS',  shortLabel: 'CRS', icon: <Shield className="w-3.5 h-3.5" /> },
    // { key: 'sams',        label: 'SAMS Auth',       icon: <Building2 className="w-3.5 h-3.5" /> },  // Hidden — not active yet
    { key: 'customer',    label: 'Customer',        icon: <Plane className="w-3.5 h-3.5" /> },
    { key: 'authority',   label: 'Authority',       icon: <Globe className="w-3.5 h-3.5" /> },
    // { key: 'mech',        label: 'Mech',            icon: <Wrench className="w-3.5 h-3.5" /> },
]

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AuthorizationPage() {
    const [activeTab, setActiveTab] = useState<TabKey>('dashboard')

    const now = useMemo(() => new Date(), [])
    const lastUpdated = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

    return (
        <div className="w-full min-w-0 overflow-x-clip">
            <Card className="w-full min-w-0 overflow-x-clip border-border/80 shadow-sm">
                <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-xl">
                        <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                        <span>Authorization Monitoring</span>
                    </CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm">
                        <span>Part-145 Dual-Authorization compliance tracking for Certifying Staff</span>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/70 shrink-0">
                            <RefreshCw className="w-3 h-3" />
                            As of {lastUpdated}
                        </span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4 sm:space-y-6 min-w-0">
                    {/* ── Tab Bar ── */}
                    <div className="overflow-x-auto no-scrollbar -mx-4 sm:mx-0 border-b border-border">
                        <div className="flex items-stretch min-w-full sm:w-max">
                            {TABS.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex flex-1 sm:flex-none flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                                        activeTab === tab.key
                                            ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                                            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
                                    }`}
                                >
                                    {tab.icon}
                                    <span className="sm:hidden">{tab.shortLabel ?? tab.label}</span>
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Content ── */}
                    <div className="min-w-0 w-full overflow-x-clip">
                        {activeTab === 'dashboard' && <OverviewTab onNavigate={setActiveTab} />}
                        {activeTab === 'monitoring' && <MonitoringCrsTab />}
                        {/* {activeTab === 'sams' && <SamsAuthTab />} */}
                        {activeTab === 'customer' && <CustomerAuthTab />}
                        {activeTab === 'authority' && <AuthorityAuthTab />}
                        {/* {activeTab === 'mech' && <MechAuthTab />} */}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
