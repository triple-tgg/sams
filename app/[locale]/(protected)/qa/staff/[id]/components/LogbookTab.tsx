import React, { useState } from 'react';
import { LogbookFormModal } from './LogbookFormModal';

// ── Types ──
export type LogbookCategory = 'inspection' | 'scheduled' | 'engine' | 'unscheduled';

export interface LogbookEntry {
    id: number;
    date: string;
    day: string;
    month: string;
    year: string;
    type: string;
    subtype: string;
    aircraft: string;
    reg: string;
    station: string;
    ata: string;
    duration: number;
    flightRef: string;
    stamp: string;
    badge: string;
    hasAttachment: boolean;
    fileAttachment?: string;
    crs: boolean;
    category: LogbookCategory;
}

export interface PendingLogbookEntry {
    id: number;
    date: string;
    day: string;
    month: string;
    year: string;
    type: string;
    aircraft: string;
    station: string;
}

export interface LogbookTabProps {
    entries: LogbookEntry[];
    pendingEntries?: PendingLogbookEntry[];
}

// ── Config ──
const categoryConfig: Record<string, { color: string; bg: string; label: string }> = {
    inspection: { color: '#0EA5E9', bg: 'rgba(14,165,233,0.08)', label: 'INSP' },
    scheduled: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', label: 'SCHD' },
    engine: { color: '#F97316', bg: 'rgba(249,115,22,0.08)', label: 'ENG' },
    unscheduled: { color: '#EF4444', bg: 'rgba(239,68,68,0.08)', label: 'UNSC' },
};

// ── Component ──
export function LogbookTab({ entries, pendingEntries = [] }: LogbookTabProps) {
    const [filter, setFilter] = useState<string>('all');
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'compact'>('compact');
    const [formEntry, setFormEntry] = useState<PendingLogbookEntry | null>(null);

    const filtered = filter === 'all' ? entries : entries.filter(t => t.category === filter);
    const totalHours = filtered.reduce((a, t) => a + t.duration, 0);

    const stats = {
        inspection: entries.filter(t => t.category === 'inspection').length,
        scheduled: entries.filter(t => t.category === 'scheduled').length,
        engine: entries.filter(t => t.category === 'engine').length,
        unscheduled: entries.filter(t => t.category === 'unscheduled').length,
    };

    return (
        <div style={{
            fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
            color: '#E2E8F0', position: 'relative',
        }}>
            <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />

            {/* ── Header ── */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #0EA5E9, #6366F1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 20px rgba(14,165,233,0.3)',
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                        </svg>
                    </div>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0, letterSpacing: '-0.02em', color: '#0f172a' }}>
                            Maintenance Experiences Logbook
                        </h2>
                        <div style={{ fontSize: '12px', color: '#64748B', fontFamily: "'JetBrains Mono', monospace", marginTop: '2px' }}>
                            SAMS-FM-CM-041 Rev.03 &nbsp;·&nbsp; 5 AUG 2025
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Pending Entries (ยังไม่กรอกฟอร์ม) ── */}
            {pendingEntries.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#92400E' }}>
                            รอบันทึกข้อมูล ({pendingEntries.length} รายการ)
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {pendingEntries.map((p) => (
                            <div key={p.id} style={{
                                display: 'flex', alignItems: 'center', gap: '16px',
                                background: '#FFFBEB', border: '1px solid #FDE68A',
                                borderRadius: '12px', padding: '12px 16px',
                                transition: 'all 0.2s ease',
                            }}>
                                {/* Date */}
                                <div style={{
                                    textAlign: 'center', minWidth: '52px',
                                }}>
                                    <div style={{
                                        fontSize: '22px', fontWeight: '700', color: '#D97706',
                                        fontFamily: "'JetBrains Mono', monospace", lineHeight: 1,
                                    }}>{p.day}</div>
                                    <div style={{
                                        fontSize: '10px', color: '#92400E', fontWeight: '600',
                                        letterSpacing: '0.04em', textTransform: 'uppercase',
                                    }}>{p.month} {p.year}</div>
                                </div>

                                {/* Divider */}
                                <div style={{ width: '1px', height: '36px', background: '#FDE68A' }} />

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#92400E' }}>
                                        {p.type}
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '12px', color: '#A16207', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span style={{ display: 'inline-flex' }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" /></svg></span>
                                            <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{p.aircraft}</span>
                                        </span>
                                        <span style={{ fontSize: '12px', color: '#A16207', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span style={{ display: 'inline-flex' }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg></span>
                                            <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{p.station}</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Fill Form Button */}
                                <button
                                    onClick={() => setFormEntry(p)}
                                    style={{
                                        padding: '8px 16px', borderRadius: '8px', border: 'none',
                                        background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                                        color: '#fff', fontSize: '12px', fontWeight: '600',
                                        cursor: 'pointer', transition: 'all 0.2s ease',
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
                                        whiteSpace: 'nowrap', fontFamily: 'inherit',
                                    }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                    Fill Form
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Stats Row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
                {[
                    { label: 'Total Tasks', value: entries.length, accent: '#0EA5E9' },
                    { label: 'Total Hours', value: `${totalHours}`, accent: '#8B5CF6' },
                    { label: 'Aircraft Types', value: [...new Set(entries.map(e => e.aircraft))].length, accent: '#F97316' },
                    { label: 'CRS Completed', value: `${entries.filter(t => t.crs).length}/${entries.length}`, accent: '#10B981' },
                ].map((stat, i) => (
                    <div key={i} style={{
                        background: '#f8fafc', border: '1px solid #e2e8f0',
                        borderRadius: '14px', padding: '18px 16px',
                        position: 'relative', overflow: 'hidden',
                        transition: 'all 0.2s ease', cursor: 'default',
                    }}>
                        <div style={{
                            position: 'absolute', top: '-10px', right: '-10px',
                            width: '60px', height: '60px',
                            background: `radial-gradient(circle, ${stat.accent}15, transparent 70%)`,
                        }} />
                        <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '6px', fontWeight: '500', letterSpacing: '0.05em' }}>
                            {stat.label}
                        </div>
                        <div style={{
                            fontSize: '26px', fontWeight: '700', color: stat.accent,
                            fontFamily: "'JetBrains Mono', monospace", lineHeight: 1,
                        }}>
                            {stat.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Filter Bar ── */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '20px', flexWrap: 'wrap', gap: '12px',
            }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[
                        { key: 'all', label: 'All', count: entries.length },
                        { key: 'inspection', label: 'Inspection', count: stats.inspection },
                        { key: 'scheduled', label: 'Scheduled', count: stats.scheduled },
                        { key: 'engine', label: 'Engine', count: stats.engine },
                        { key: 'unscheduled', label: 'Unscheduled', count: stats.unscheduled },
                    ].map((f) => {
                        const isActive = filter === f.key;
                        const accent = f.key === 'all' ? '#0EA5E9' : categoryConfig[f.key]?.color || '#0EA5E9';
                        return (
                            <button
                                key={f.key}
                                onClick={() => setFilter(f.key)}
                                style={{
                                    padding: '7px 14px', borderRadius: '8px',
                                    border: isActive ? `1px solid ${accent}` : '1px solid #e2e8f0',
                                    background: isActive ? `${accent}12` : '#fff',
                                    color: isActive ? accent : '#94A3B8',
                                    fontSize: '13px', fontWeight: '500', cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    fontFamily: 'inherit',
                                }}
                            >
                                {f.label}
                                <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", opacity: 0.7 }}>
                                    {f.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', borderRadius: '8px', padding: '3px' }}>
                    {(['list', 'compact'] as const).map(m => (
                        <button key={m} onClick={() => setViewMode(m)} style={{
                            padding: '6px 12px', borderRadius: '6px', border: 'none',
                            background: viewMode === m ? '#fff' : 'transparent',
                            color: viewMode === m ? '#0f172a' : '#64748B',
                            fontSize: '12px', fontWeight: '500', cursor: 'pointer',
                            textTransform: 'capitalize', transition: 'all 0.15s ease',
                            fontFamily: 'inherit',
                            boxShadow: viewMode === m ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                        }}>{m}</button>
                    ))}
                </div>
            </div>

            {/* ── Task List ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: viewMode === 'compact' ? '2px' : '10px' }}>
                {filtered.map((task, idx) => {
                    const cat = categoryConfig[task.category];
                    const isExpanded = expandedId === task.id;

                    // ── Compact View ──
                    if (viewMode === 'compact') {
                        return (
                            <div key={task.id}
                                onClick={() => setExpandedId(isExpanded ? null : task.id)}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '80px 1fr 120px 80px 60px 70px',
                                    alignItems: 'center', padding: '10px 16px',
                                    background: idx % 2 === 0 ? '#f8fafc' : '#fff',
                                    borderRadius: '6px', cursor: 'pointer',
                                    fontSize: '13px', transition: 'background 0.15s ease', gap: '12px',
                                    border: '1px solid transparent',
                                }}
                            >
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#64748B', fontSize: '12px' }}>{task.date}</span>
                                <span style={{ color: '#0f172a', fontWeight: '500' }}>{task.type} — {task.subtype}</span>
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#64748B', fontSize: '12px' }}>{task.reg}</span>
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#64748B', fontSize: '12px' }}>ATA {task.ata}</span>
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: cat.color, fontSize: '12px', fontWeight: '600' }}>{task.duration}h</span>
                                <span style={{
                                    fontSize: '10px', fontWeight: '600', color: cat.color,
                                    background: cat.bg, padding: '3px 8px', borderRadius: '4px',
                                    textAlign: 'center', letterSpacing: '0.05em',
                                }}>{cat.label}</span>
                            </div>
                        );
                    }

                    // ── List View (Card) ──
                    return (
                        <div
                            key={task.id}
                            onClick={() => setExpandedId(isExpanded ? null : task.id)}
                            style={{
                                background: '#fff',
                                border: `1px solid ${isExpanded ? cat.color + '40' : '#e2e8f0'}`,
                                borderRadius: '16px', padding: '0', overflow: 'hidden',
                                cursor: 'pointer', transition: 'all 0.25s ease',
                                boxShadow: isExpanded ? `0 4px 20px ${cat.color}15` : '0 1px 3px rgba(0,0,0,0.04)',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'stretch' }}>
                                {/* Date Column */}
                                <div style={{
                                    width: '80px', minWidth: '80px',
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center',
                                    padding: '20px 0',
                                    borderRight: '1px solid #e2e8f0',
                                    background: `linear-gradient(180deg, ${cat.color}08, transparent)`,
                                }}>
                                    <div style={{
                                        fontSize: '28px', fontWeight: '700', lineHeight: 1,
                                        color: cat.color,
                                        fontFamily: "'JetBrains Mono', monospace",
                                    }}>{task.day}</div>
                                    <div style={{
                                        fontSize: '11px', color: '#64748B', marginTop: '2px',
                                        fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase',
                                    }}>{task.month} {task.year}</div>
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1, padding: '16px 20px', minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                <h3 style={{
                                                    margin: 0, fontSize: '15px', fontWeight: '600',
                                                    color: '#0f172a', lineHeight: 1.3,
                                                }}>{task.type}</h3>
                                                <span style={{
                                                    fontSize: '10px', fontWeight: '600',
                                                    color: cat.color, background: cat.bg,
                                                    padding: '2px 8px', borderRadius: '4px',
                                                    letterSpacing: '0.06em',
                                                }}>{cat.label}</span>
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#94A3B8', marginTop: '2px' }}>
                                                {task.subtype}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                                            {/* Duration */}
                                            <div style={{
                                                fontFamily: "'JetBrains Mono', monospace",
                                                fontSize: '14px', fontWeight: '600',
                                                color: cat.color, background: cat.bg,
                                                padding: '4px 10px', borderRadius: '8px', whiteSpace: 'nowrap',
                                            }}>{task.duration}h</div>
                                            {/* CRS */}
                                            {task.crs && (
                                                <div style={{
                                                    display: 'flex', alignItems: 'center', gap: '4px',
                                                    color: '#10B981', fontSize: '12px', fontWeight: '600',
                                                }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                        <polyline points="22 4 12 14.01 9 11.01" />
                                                    </svg>
                                                    CRS
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Meta Row */}
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '16px',
                                        marginTop: '10px', flexWrap: 'wrap',
                                    }}>
                                        {[
                                            { icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" /></svg>, text: `${task.aircraft} · ${task.reg}` },
                                            { icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>, text: task.station },
                                            { icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>, text: `ATA ${task.ata}` },
                                        ].map((meta, mi) => (
                                            <div key={mi} style={{
                                                display: 'flex', alignItems: 'center', gap: '5px',
                                                fontSize: '12px', color: '#64748B',
                                            }}>
                                                <span style={{ display: 'inline-flex' }}>{meta.icon}</span>
                                                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{meta.text}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Expanded Detail */}
                                    {isExpanded && (
                                        <div style={{
                                            marginTop: '14px', paddingTop: '14px',
                                            borderTop: '1px solid #e2e8f0',
                                            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
                                        }}>
                                            {[
                                                { label: 'Flight / WO Ref', value: task.flightRef },
                                                { label: 'Stamp', value: task.stamp },
                                                { label: 'License', value: task.badge },
                                                {
                                                    label: 'Attachment',
                                                    value: task.hasAttachment ? 'Available' : 'None',
                                                    isLink: task.hasAttachment && !!task.fileAttachment,
                                                    href: task.fileAttachment,
                                                },
                                            ].map((d, di) => (
                                                <div key={di}>
                                                    <div style={{
                                                        fontSize: '10px', color: '#94A3B8', fontWeight: '600',
                                                        letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px',
                                                    }}>{d.label}</div>
                                                    {d.isLink ? (
                                                        <a
                                                            href={d.href}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            style={{
                                                                fontSize: '13px', color: '#0EA5E9',
                                                                fontFamily: "'JetBrains Mono', monospace",
                                                                textDecoration: 'none',
                                                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                            }}
                                                        >
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                                <polyline points="15 3 21 3 21 9" />
                                                                <line x1="10" y1="14" x2="21" y2="3" />
                                                            </svg>
                                                            View PDF
                                                        </a>
                                                    ) : (
                                                        <div style={{
                                                            fontSize: '13px', color: '#475569',
                                                            fontFamily: "'JetBrains Mono', monospace",
                                                        }}>{d.value}</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Footer Summary ── */}
            <div style={{
                marginTop: '24px',
                background: 'linear-gradient(135deg, rgba(14,165,233,0.06), rgba(99,102,241,0.06))',
                border: '1px solid rgba(14,165,233,0.15)',
                borderRadius: '14px', padding: '18px 24px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: '12px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div>
                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                            Showing
                        </div>
                        <div style={{
                            fontSize: '22px', fontWeight: '700', color: '#0EA5E9',
                            fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.2,
                        }}>
                            {filtered.length} <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>tasks</span>
                        </div>
                    </div>
                    <div style={{ width: '1px', height: '36px', background: '#e2e8f0' }} />
                    <div>
                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                            Total Duration
                        </div>
                        <div style={{
                            fontSize: '22px', fontWeight: '700', color: '#8B5CF6',
                            fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.2,
                        }}>
                            {totalHours} <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>hours</span>
                        </div>
                    </div>
                </div>
                <div style={{
                    fontSize: '11px', color: '#94A3B8',
                    fontFamily: "'JetBrains Mono', monospace",
                }}>
                    SAMS-FM-CM-041 Rev.03
                </div>
            </div>

            {/* ── Form Modal ── */}
            {formEntry && (
                <LogbookFormModal
                    entry={formEntry}
                    onClose={() => setFormEntry(null)}
                />
            )}
        </div>
    );
}
