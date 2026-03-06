import React from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import { C, MatrixItem, TrainingMatrixTabProps } from './types';
import { StatusBadge, TypeBadge } from './ui-primitives';
import { PIE_DATA } from './data';

export function TrainingMatrixTab({ matrix, categories }: TrainingMatrixTabProps) {
    const valid = matrix.filter(m => m.status === 'valid').length;
    const expired = matrix.filter(m => m.status === 'expired').length;
    const perm = matrix.filter(m => m.status === 'perm').length;
    const score = Math.round(((valid + perm) / matrix.length) * 100);

    const legendItems: Array<{ label: string; value: number; color: string }> = [
        { label: 'Valid', value: valid, color: C.green },
        { label: 'Expired', value: expired, color: C.red },
        { label: 'Permanent', value: perm, color: C.primary3 },
    ];

    return (
        <div>
            {/* Summary Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 250px', gap: 16, marginBottom: 16 }}>
                {/* Donut Chart */}
                <div style={{
                    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
                    padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center',
                    boxShadow: '0 2px 12px rgba(0,0,0,.04)',
                }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1.5, marginBottom: 10 }}>
                        COMPLIANCE
                    </div>
                    <div style={{ position: 'relative', width: 130, height: 130 }}>
                        <PieChart width={130} height={130}>
                            <Pie data={PIE_DATA} cx={60} cy={60} innerRadius={42} outerRadius={62}
                                dataKey="value" startAngle={90} endAngle={-270} paddingAngle={3}>
                                {PIE_DATA.map((d, i) => <Cell key={i} fill={d.color} />)}
                            </Pie>
                        </PieChart>
                        <div style={{
                            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
                        }}>
                            <div style={{ fontSize: 22, fontWeight: 900, color: C.primary, lineHeight: 1 }}>{score}%</div>
                            <div style={{ fontSize: 8, color: C.muted, letterSpacing: 1 }}>COMPLIANT</div>
                        </div>
                    </div>
                    <div style={{ width: '100%', marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {legendItems.map(({ label, value, color }) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                                    <span style={{ color: C.muted }}>{label}</span>
                                </div>
                                <span style={{ fontWeight: 700, color }}>{value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Category Progress */}
                <div style={{
                    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
                    padding: 18, boxShadow: '0 2px 12px rgba(0,0,0,.04)',
                }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1.5, marginBottom: 14 }}>
                        PROGRESS BY CATEGORY
                    </div>
                    {categories.map(cat => {
                        const pct = Math.round((cat.d / cat.t) * 100);
                        const ok = pct === 100;
                        return (
                            <div key={cat.l} style={{ marginBottom: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{cat.l}</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: ok ? C.green : C.red }}>{cat.d}/{cat.t}</span>
                                </div>
                                <div style={{ height: 7, background: C.primary5, borderRadius: 4, overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%', width: `${pct}%`, borderRadius: 4, transition: 'width 1s ease',
                                        background: `linear-gradient(90deg,${ok ? C.primary : C.orange},${ok ? C.primary3 : '#f59e0b'})`,
                                    }} />
                                </div>
                                <div style={{ marginTop: 5, fontSize: 9, color: ok ? C.green : C.red }}>
                                    {ok ? 'All courses completed ✓' : '⚠ 1 course expired — enroll required'}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Alerts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{
                        background: C.redL, border: '1.5px solid #fca5a5', borderRadius: 14,
                        padding: 16, borderLeft: `4px solid ${C.red}`, flex: 1,
                    }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: C.red, letterSpacing: 1, marginBottom: 8 }}>⚠ ACTION REQUIRED</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 6 }}>RVSM/PBN/RNP CAT II/III</div>
                        <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
                            Expired: <span style={{ color: C.red, fontWeight: 600 }}>18-Feb-2026</span><br />
                            Overdue: <span style={{ color: C.red, fontWeight: 600 }}>16 days</span><br />
                            Last by: SAMS Co., Ltd.
                        </div>
                        <button style={{
                            marginTop: 12, width: '100%', padding: '8px 0', borderRadius: 8, border: 'none',
                            background: `linear-gradient(135deg,${C.primary},${C.primary2})`,
                            color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                            boxShadow: `0 2px 8px ${C.primary}44`, fontFamily: 'inherit',
                        }}>
                            Enroll Now →
                        </button>
                    </div>
                    <div style={{ background: C.primary5, border: `1px solid ${C.primary4}`, borderRadius: 12, padding: 14 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: C.primary, letterSpacing: 1, marginBottom: 6 }}>NEXT EXPIRY</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Aircraft Parts & Material</div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>09-Oct-2026 · 217 days</div>
                    </div>
                </div>
            </div>

            {/* Training Matrix Table */}
            <div style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
                overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.04)',
            }}>
                <div style={{
                    padding: '12px 18px', borderBottom: `1px solid ${C.border}`, background: C.bg,
                    display: 'flex', alignItems: 'center', gap: 8,
                }}>
                    <span style={{ fontSize: 14 }}>📋</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1.5 }}>
                        TRAINING NEEDS MATRIX — SAMS-FM-CM-014 REV.03
                    </span>
                    <div style={{
                        marginLeft: 'auto', padding: '2px 10px', borderRadius: 5,
                        background: C.primary5, border: `1px solid ${C.primary4}`,
                        fontSize: 10, color: C.primary, fontWeight: 600,
                    }}>
                        Aircraft Certifying Staff
                    </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: C.bg }}>
                            {['#', 'Training Course', 'Type', 'Completed', 'Valid Until', 'Days Left', 'Status'].map(h => (
                                <th key={h} style={{
                                    padding: '10px 14px', fontSize: 10, fontWeight: 700, color: C.muted,
                                    textAlign: 'left', letterSpacing: 1, borderBottom: `1px solid ${C.border}`,
                                }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {matrix.map((m: MatrixItem) => (
                            <tr
                                key={m.no}
                                style={{ borderBottom: `1px solid ${C.border}`, cursor: 'default' }}
                                onMouseEnter={(e: React.MouseEvent<HTMLTableRowElement>) => (e.currentTarget.style.background = C.bg)}
                                onMouseLeave={(e: React.MouseEvent<HTMLTableRowElement>) => (e.currentTarget.style.background = '#fff')}
                            >
                                <td style={{ padding: '10px 14px', fontSize: 11, color: C.muted, fontFamily: 'monospace' }}>
                                    {String(m.no).padStart(2, '0')}
                                </td>
                                <td style={{
                                    padding: '10px 14px', fontSize: 12, maxWidth: 260,
                                    color: m.status === 'expired' ? C.red : C.text,
                                    fontWeight: m.status === 'expired' ? 700 : 400,
                                }}>
                                    {m.course}
                                </td>
                                <td style={{ padding: '10px 14px' }}><TypeBadge type={m.type} /></td>
                                <td style={{ padding: '10px 14px', fontSize: 11, color: C.muted, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                                    {m.completed}
                                </td>
                                <td style={{
                                    padding: '10px 14px', fontSize: 11, fontFamily: 'monospace', whiteSpace: 'nowrap',
                                    color: m.status === 'expired' ? C.red : C.text,
                                }}>
                                    {m.validUntil}
                                </td>
                                <td style={{ padding: '10px 14px' }}>
                                    {m.daysLeft !== null ? (
                                        <div>
                                            <div style={{ height: 4, width: 80, background: C.primary5, borderRadius: 2, marginBottom: 3, overflow: 'hidden' }}>
                                                <div style={{
                                                    height: '100%', borderRadius: 2,
                                                    width: m.daysLeft < 0 ? '100%' : `${Math.min((m.daysLeft / 730) * 100, 100)}%`,
                                                    background: m.daysLeft < 0 ? C.red : `linear-gradient(90deg,${C.primary},${C.primary3})`,
                                                }} />
                                            </div>
                                            <div style={{
                                                fontSize: 10, fontFamily: 'monospace',
                                                color: m.daysLeft < 0 ? C.red : C.muted,
                                                fontWeight: m.daysLeft < 0 ? 700 : 400,
                                            }}>
                                                {m.daysLeft < 0 ? `-${Math.abs(m.daysLeft)}d` : m.daysLeft > 0 ? `${m.daysLeft}d` : '—'}
                                            </div>
                                        </div>
                                    ) : (
                                        <span style={{ fontSize: 11, color: C.mutedL }}>—</span>
                                    )}
                                </td>
                                <td style={{ padding: '10px 14px' }}>
                                    <StatusBadge status={m.status} days={m.daysLeft} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
