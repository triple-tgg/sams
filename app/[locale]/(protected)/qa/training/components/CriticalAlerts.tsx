'use client';

import React, { useState } from 'react';
import { CriticalAlert, C } from './types';

interface CriticalAlertsProps {
    alerts: CriticalAlert[];
}

const DEPT_TABS = ['all', 'maintenance', 'compliance', 'safety'] as const;

export function CriticalAlerts({ alerts }: CriticalAlertsProps) {
    const [alertTab, setAlertTab] = useState<string>('all');

    const filtered = alerts.filter(
        (a) => alertTab === 'all' || a.dept.toLowerCase() === alertTab
    );

    return (
        <div style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
            overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.04)', marginBottom: 20,
        }}>
            {/* Header + Filter Tabs */}
            <div style={{
                padding: '16px 20px', borderBottom: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', gap: 12,
            }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.red }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: C.text, letterSpacing: 1 }}>
                    CRITICAL ALERTS — LICENSE EXPIRED
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    {DEPT_TABS.map((t) => (
                        <button
                            key={t}
                            onClick={() => setAlertTab(t)}
                            style={{
                                padding: '3px 10px', borderRadius: 5, fontSize: 10, fontWeight: 600,
                                cursor: 'pointer', letterSpacing: 0.5, textTransform: 'uppercase',
                                fontFamily: 'inherit',
                                background: alertTab === t
                                    ? `linear-gradient(135deg,${C.primary},${C.primary2})`
                                    : C.primary5,
                                border: alertTab === t ? 'none' : `1px solid ${C.primary4}`,
                                color: alertTab === t ? '#fff' : C.primary,
                            }}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ background: C.bg }}>
                        {['Employee', 'Course', 'Dept', 'Expired Since', 'Days Overdue', 'Action'].map((h) => (
                            <th
                                key={h}
                                style={{
                                    padding: '10px 16px', fontSize: 10, fontWeight: 700,
                                    color: C.muted, textAlign: 'left', letterSpacing: 1,
                                    borderBottom: `1px solid ${C.border}`,
                                }}
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {filtered.map((a, i) => (
                        <tr
                            key={i}
                            style={{ borderBottom: `1px solid ${C.border}` }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = C.bg)}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                        >
                            <td style={{ padding: '12px 16px' }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{a.emp}</div>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                                <div style={{ fontSize: 12, color: C.text }}>{a.course}</div>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                                <span style={{
                                    padding: '2px 8px', borderRadius: 4,
                                    background: C.primary5, border: `1px solid ${C.primary4}`,
                                    fontSize: 10, color: C.primary, fontWeight: 600,
                                }}>
                                    {a.dept}
                                </span>
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted, fontFamily: 'monospace' }}>
                                {a.since}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                                <span style={{
                                    padding: '3px 10px', borderRadius: 12,
                                    background: a.days > 50 ? C.redL : '#fff7ed',
                                    border: `1px solid ${a.days > 50 ? '#fca5a5' : '#fdba74'}`,
                                    fontSize: 11, fontWeight: 700,
                                    color: a.days > 50 ? C.red : C.orange,
                                }}>
                                    {a.days}d overdue
                                </span>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                                <button style={{
                                    padding: '5px 12px', borderRadius: 6,
                                    background: `linear-gradient(135deg,${C.primary},${C.primary2})`,
                                    border: 'none', color: '#fff', fontSize: 11, fontWeight: 600,
                                    cursor: 'pointer', boxShadow: `0 2px 6px ${C.primary}44`,
                                    fontFamily: 'inherit',
                                }}>
                                    Enroll Now
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
