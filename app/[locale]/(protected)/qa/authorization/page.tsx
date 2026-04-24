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

// ─── Tab Definitions ─────────────────────────────────────────────────────────

type TabKey = 'dashboard' | 'monitoring' | 'sams' | 'customer' | 'authority'

const TABS: { key: TabKey; label: string; icon: ReactNode }[] = [
    { key: 'dashboard',   label: 'Dashboard',       icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { key: 'monitoring',  label: 'Monitoring CRS',  icon: <Shield className="w-3.5 h-3.5" /> },
    { key: 'sams',        label: 'SAMs Auth',       icon: <Building2 className="w-3.5 h-3.5" /> },
    { key: 'customer',    label: 'Customer',        icon: <Plane className="w-3.5 h-3.5" /> },
    { key: 'authority',   label: 'Authority',       icon: <Globe className="w-3.5 h-3.5" /> },
]

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AuthorizationPage() {
    const [activeTab, setActiveTab] = useState<TabKey>('dashboard')

    const now = useMemo(() => new Date(), [])
    const lastUpdated = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

    return (
        <div>
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-primary" />
                        Authorization Monitoring
                    </CardTitle>
                    <CardDescription>
                        Part-145 Dual-Authorization compliance tracking for Certifying Staff
                        <span className="inline-flex items-center gap-1 ml-3 text-xs text-muted-foreground/70">
                            <RefreshCw className="w-3 h-3" />
                            As of {lastUpdated}
                        </span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* ── Tab Bar ── */}
                    <div className="flex items-center gap-0 border-b border-border">
                        {TABS.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                                    activeTab === tab.key
                                        ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* ── Content ── */}
                    <div>
                        {activeTab === 'dashboard' && <OverviewTab />}
                        {activeTab === 'monitoring' && <MonitoringCrsTab />}
                        {activeTab === 'sams' && <SamsAuthTab />}
                        {activeTab === 'customer' && <CustomerAuthTab />}
                        {activeTab === 'authority' && <AuthorityAuthTab />}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
