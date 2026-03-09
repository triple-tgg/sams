'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Search, ScrollText, CalendarCheck } from 'lucide-react';
import { C } from './types';
import { KPI_ITEMS, AUTH_DATA, WORKLOAD_DATA, MISSING_SKILLS, CRITICAL_ALERTS, QUICK_STATS } from './data';
import { KpiCards } from './KpiCards';
import { AuthorizationStatus } from './AuthorizationStatus';
import { WorkloadChart } from './WorkloadChart';
import { MissingSkills } from './MissingSkills';
import { CriticalAlerts } from './CriticalAlerts';
import { QuickStats } from './QuickStats';

export default function TrainingDashboard() {
    const router = useRouter();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
    }).toUpperCase();
    const timeStr = now.toLocaleTimeString('en-GB', {
        hour: '2-digit', minute: '2-digit', hour12: false,
    });

    return (
        <div style={{
            flex: 1, overflowY: 'auto', padding: '24px 28px',
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        }}>
            {/* ── Page Header ── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
                <div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: -0.5 }}>
                        Training &amp; <span style={{ color: C.primary }}>Compliance</span>
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
                        SAMS · อัปเดตล่าสุด: {dateStr}, {timeStr} ICT
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                    <button style={{
                        padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
                        background: '#fff', color: C.text, border: `1.5px solid ${C.border}`,
                        transition: 'all .2s',
                    }}>
                        <Search className="h-4 w-4" /> ตรวจ Conflict
                    </button>
                    <button
                        onClick={() => router.push('/en/qa/training/plan')}
                        style={{
                            padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                            cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
                            background: '#fff', color: C.text, border: `1.5px solid ${C.border}`,
                            transition: 'all .2s',
                        }}>
                        <CalendarCheck className="h-4 w-4" /> Training Plan
                    </button>
                    <button style={{
                        padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
                        background: `linear-gradient(135deg,${C.primary},${C.primary2})`,
                        color: '#fff', border: 'none',
                        boxShadow: `0 2px 8px ${C.primary}55`, transition: 'all .2s',
                    }}>
                        <ScrollText className="h-4 w-4" /> สร้าง Certificate
                    </button>
                </div>
            </div>

            {/* ── KPI Cards ── */}
            <KpiCards items={KPI_ITEMS} />

            {/* ── Row 2: Donut + Bar Chart + Missing Skills ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 280px', gap: 16, marginBottom: 20 }}>
                <AuthorizationStatus data={AUTH_DATA} />
                <WorkloadChart data={WORKLOAD_DATA} />
                <MissingSkills skills={MISSING_SKILLS} />
            </div>

            {/* ── Critical Alerts Table ── */}
            <CriticalAlerts alerts={CRITICAL_ALERTS} />

            {/* ── Quick Stats ── */}
            <QuickStats items={QUICK_STATS} />
        </div>
    );
}
