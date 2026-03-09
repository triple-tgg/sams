'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Plus, Search, CalendarCheck, ClipboardList,
    CheckCircle2, AlertTriangle, FileText, MoreHorizontal, Eye, Pencil, Filter,
} from 'lucide-react';
import { TRAINING_PLANS, STATUS_CONFIG, TrainingPlan, PlanStatus } from './plan-data';
import { CreatePlanModal } from './CreatePlanModal';

// ── Color Palette (shared with dashboard) ──
const C = {
    primary: '#1a56db', primary2: '#1e40af', primary3: '#3b82f6',
    primary4: '#93c5fd', primary5: '#dbeafe', primary6: '#eff6ff',
    green: '#16a34a', greenL: '#dcfce7',
    orange: '#d97706', orangeL: '#fef3c7',
    red: '#dc2626', redL: '#fee2e2',
    bg: '#f0f4ff', surface: '#ffffff',
    border: '#e2e8f0', text: '#0f172a',
    muted: '#64748b', mutedL: '#94a3b8',
} as const;

const DEPARTMENTS = ['All', 'All Departments', 'Maintenance', 'Line Maintenance', 'Base Maintenance', 'Safety'];
const STATUSES: PlanStatus[] = ['draft', 'active', 'completed', 'overdue'];
const QUARTERS = ['All', 'Q1', 'Q2', 'Q3', 'Q4'];
const YEARS = ['2026', '2025'];

export default function TrainingPlanPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [quarterFilter, setQuarterFilter] = useState('All');
    const [deptFilter, setDeptFilter] = useState('All');
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Filtering logic
    const filtered = TRAINING_PLANS.filter(p => {
        const matchSearch = !search ||
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.id.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || p.status === statusFilter;
        const matchQuarter = quarterFilter === 'All' || p.quarter === quarterFilter;
        const matchDept = deptFilter === 'All' || p.department === deptFilter || p.department === 'All Departments';
        return matchSearch && matchStatus && matchQuarter && matchDept;
    });

    // Summary counts
    const total = TRAINING_PLANS.length;
    const active = TRAINING_PLANS.filter(p => p.status === 'active').length;
    const completed = TRAINING_PLANS.filter(p => p.status === 'completed').length;
    const overdue = TRAINING_PLANS.filter(p => p.status === 'overdue').length;

    const summaryCards = [
        { label: 'Total Plans', value: total, color: C.primary, bg: C.primary5, border: C.primary4, icon: <ClipboardList className="h-7 w-7" /> },
        { label: 'Active', value: active, color: C.primary3, bg: C.primary6, border: C.primary4, icon: <CalendarCheck className="h-7 w-7" /> },
        { label: 'Completed', value: completed, color: C.green, bg: C.greenL, border: '#86efac', icon: <CheckCircle2 className="h-7 w-7" /> },
        { label: 'Overdue', value: overdue, color: C.red, bg: C.redL, border: '#fca5a5', icon: <AlertTriangle className="h-7 w-7" /> },
    ];

    return (
        <div style={{
            flex: 1, overflowY: 'auto', padding: '24px 28px',
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        }}>
            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <button
                            onClick={() => router.push('/en/qa/training')}
                            style={{
                                width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${C.border}`,
                                background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', transition: 'all .2s', color: C.muted,
                            }}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        <div style={{ fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: -0.5 }}>
                            Training <span style={{ color: C.primary }}>Plan</span>
                        </div>
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, marginLeft: 42 }}>
                        จัดการและติดตามแผนการฝึกอบรมทั้งหมด
                    </div>
                </div>
                <button onClick={() => setShowCreateModal(true)} style={{
                    padding: '8px 18px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
                    background: `linear-gradient(135deg,${C.primary},${C.primary2})`,
                    color: '#fff', border: 'none',
                    boxShadow: `0 2px 8px ${C.primary}55`, transition: 'all .2s',
                    letterSpacing: 0.3,
                }}>
                    <Plus className="h-4 w-4" /> Create Plan
                </button>
            </div>

            {/* ── Summary Cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
                {summaryCards.map(c => (
                    <div key={c.label} style={{
                        background: C.surface, border: `1px solid ${c.border}`,
                        borderRadius: 12, padding: '18px 20px',
                        display: 'flex', alignItems: 'center', gap: 14,
                        boxShadow: '0 2px 8px rgba(0,0,0,.03)',
                    }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: 12,
                            background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: c.color, flexShrink: 0,
                        }}>
                            {c.icon}
                        </div>
                        <div>
                            <div style={{ fontSize: 28, fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value}</div>
                            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: 0.5, marginTop: 2 }}>{c.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Filter Bar ── */}
            <div style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
                padding: '14px 20px', marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                boxShadow: '0 2px 8px rgba(0,0,0,.03)',
            }}>
                {/* Search */}
                <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 280 }}>
                    <Search style={{
                        position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                        width: 15, height: 15, color: C.mutedL,
                    }} />
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search plans..."
                        style={{
                            width: '100%', padding: '8px 12px 8px 32px', borderRadius: 8,
                            border: `1.5px solid ${C.border}`, fontSize: 12, color: C.text,
                            outline: 'none', background: C.bg,
                        }}
                    />
                </div>

                {/* Divider */}
                <div style={{ width: 1, height: 28, background: C.border }} />

                {/* Filter icon */}
                <Filter className="h-4 w-4" style={{ color: C.mutedL }} />

                {/* Status Tabs */}
                <div style={{ display: 'flex', gap: 6 }}>
                    <button
                        onClick={() => setStatusFilter('all')}
                        style={{
                            padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                            cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 0.5,
                            background: statusFilter === 'all' ? `linear-gradient(135deg,${C.primary},${C.primary2})` : C.primary6,
                            border: statusFilter === 'all' ? 'none' : `1px solid ${C.primary4}`,
                            color: statusFilter === 'all' ? '#fff' : C.primary,
                            transition: 'all .15s',
                        }}
                    >
                        ALL
                    </button>
                    {STATUSES.map(s => {
                        const cfg = STATUS_CONFIG[s];
                        const isActive = statusFilter === s;
                        return (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                style={{
                                    padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                                    cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 0.5,
                                    textTransform: 'capitalize',
                                    background: isActive ? cfg.bg : C.surface,
                                    border: `1px solid ${isActive ? cfg.border : C.border}`,
                                    color: isActive ? cfg.color : C.muted,
                                    transition: 'all .15s',
                                }}
                            >
                                {cfg.label}
                            </button>
                        );
                    })}
                </div>

                {/* Quarter Select */}
                <select
                    value={quarterFilter} onChange={e => setQuarterFilter(e.target.value)}
                    style={{
                        padding: '6px 10px', borderRadius: 6, border: `1.5px solid ${C.border}`,
                        fontSize: 11, fontWeight: 600, color: C.text, cursor: 'pointer',
                        background: C.surface, outline: 'none',
                    }}
                >
                    {QUARTERS.map(q => <option key={q} value={q}>{q === 'All' ? 'All Quarters' : q}</option>)}
                </select>

                {/* Department Select */}
                <select
                    value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                    style={{
                        padding: '6px 10px', borderRadius: 6, border: `1.5px solid ${C.border}`,
                        fontSize: 11, fontWeight: 600, color: C.text, cursor: 'pointer',
                        background: C.surface, outline: 'none',
                    }}
                >
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>)}
                </select>
            </div>

            {/* ── Plans Table ── */}
            <div style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
                overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.04)',
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: C.bg }}>
                            {['Plan ID', 'Plan Name', 'Period', 'Department', 'Courses', 'Enrolled', 'Completion', 'Status', 'Action'].map(h => (
                                <th key={h} style={{
                                    padding: '12px 16px', fontSize: 10, fontWeight: 700,
                                    color: C.muted, textAlign: 'left', letterSpacing: 1,
                                    borderBottom: `1px solid ${C.border}`, textTransform: 'uppercase',
                                }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={9} style={{
                                    padding: '48px 16px', textAlign: 'center', color: C.mutedL, fontSize: 13,
                                }}>
                                    No training plans found
                                </td>
                            </tr>
                        ) : (
                            filtered.map(plan => {
                                const sc = STATUS_CONFIG[plan.status];
                                return (
                                    <tr
                                        key={plan.id}
                                        style={{ borderBottom: `1px solid ${C.border}`, cursor: 'pointer' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = C.bg)}
                                        onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                                    >
                                        {/* Plan ID */}
                                        <td style={{ padding: '14px 16px' }}>
                                            <span style={{
                                                fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                                                color: C.primary, fontWeight: 600,
                                            }}>
                                                {plan.id}
                                            </span>
                                        </td>

                                        {/* Plan Name */}
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{
                                                    width: 28, height: 28, borderRadius: 7,
                                                    background: C.primary5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: C.primary, flexShrink: 0,
                                                }}>
                                                    <FileText className="h-3.5 w-3.5" />
                                                </div>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{plan.name}</div>
                                            </div>
                                        </td>

                                        {/* Period */}
                                        <td style={{ padding: '14px 16px', fontSize: 12, color: C.muted, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                                            {plan.period}
                                        </td>

                                        {/* Department */}
                                        <td style={{ padding: '14px 16px' }}>
                                            <span style={{
                                                padding: '2px 10px', borderRadius: 5,
                                                background: C.primary6, border: `1px solid ${C.primary4}`,
                                                fontSize: 11, color: C.primary, fontWeight: 600,
                                            }}>
                                                {plan.department}
                                            </span>
                                        </td>

                                        {/* Courses */}
                                        <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600, color: C.text, textAlign: 'center' }}>
                                            {plan.courses}
                                        </td>

                                        {/* Enrolled */}
                                        <td style={{ padding: '14px 16px', fontSize: 12, color: C.muted, textAlign: 'center' }}>
                                            {plan.enrolled}/{plan.totalStaff}
                                        </td>

                                        {/* Completion Progress */}
                                        <td style={{ padding: '14px 16px', minWidth: 120 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{
                                                    flex: 1, height: 6, background: C.border, borderRadius: 3, overflow: 'hidden',
                                                }}>
                                                    <div style={{
                                                        height: '100%', borderRadius: 3,
                                                        width: `${plan.completion}%`,
                                                        background: plan.completion === 100
                                                            ? `linear-gradient(90deg, ${C.green}, #22c55e)`
                                                            : plan.completion > 0
                                                                ? `linear-gradient(90deg, ${C.primary}, ${C.primary3})`
                                                                : 'transparent',
                                                        transition: 'width 0.4s ease',
                                                    }} />
                                                </div>
                                                <span style={{
                                                    fontSize: 11, fontWeight: 700, minWidth: 32, textAlign: 'right',
                                                    color: plan.completion === 100 ? C.green : plan.completion > 0 ? C.primary : C.mutedL,
                                                }}>
                                                    {plan.completion}%
                                                </span>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td style={{ padding: '14px 16px' }}>
                                            <span style={{
                                                padding: '3px 10px', borderRadius: 12,
                                                background: sc.bg, border: `1px solid ${sc.border}`,
                                                fontSize: 11, fontWeight: 700, color: sc.color,
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {sc.label}
                                            </span>
                                        </td>

                                        {/* Action */}
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <button style={{
                                                    width: 28, height: 28, borderRadius: 6,
                                                    border: `1px solid ${C.border}`, background: C.surface,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    cursor: 'pointer', color: C.muted, transition: 'all .15s',
                                                }}
                                                    title="View"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                </button>
                                                <button style={{
                                                    width: 28, height: 28, borderRadius: 6,
                                                    border: `1px solid ${C.border}`, background: C.surface,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    cursor: 'pointer', color: C.muted, transition: 'all .15s',
                                                }}
                                                    title="Edit"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>

                {/* Footer */}
                <div style={{
                    padding: '12px 20px', borderTop: `1px solid ${C.border}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: C.bg,
                }}>
                    <div style={{ fontSize: 12, color: C.muted }}>
                        Showing {filtered.length} of {TRAINING_PLANS.length} plans
                    </div>
                    <div style={{ fontSize: 10, color: C.mutedL, fontFamily: 'monospace' }}>
                        SAMS-FM-TR-012 Rev.01
                    </div>
                </div>
            </div>

            {/* ── Create Plan Modal ── */}
            {showCreateModal && (
                <CreatePlanModal onClose={() => setShowCreateModal(false)} />
            )}
        </div>
    );
}
