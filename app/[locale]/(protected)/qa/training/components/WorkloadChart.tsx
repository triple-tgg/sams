'use client';

import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { WorkloadItem, C } from './types';

interface WorkloadChartProps {
    data: WorkloadItem[];
}

function WorkloadTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8,
            padding: '10px 14px', fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,.1)',
        }}>
            <div style={{ fontWeight: 700, marginBottom: 6, color: C.text }}>{label} 2026</div>
            {payload.map((p) => (
                <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, color: p.color }}>
                    <span>{p.name}</span>
                    <span style={{ fontWeight: 600 }}>{p.value}</span>
                </div>
            ))}
        </div>
    );
}

export function WorkloadChart({ data }: WorkloadChartProps) {
    return (
        <div style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
            padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,.04)',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.text, letterSpacing: 1 }}>
                    MONTHLY TRAINING WORKLOAD
                </div>
                <div style={{
                    padding: '2px 10px', borderRadius: 5,
                    background: C.primary5, border: `1px solid ${C.primary4}`,
                    fontSize: 10, color: C.primary, fontWeight: 600,
                }}>
                    2026
                </div>
            </div>

            {/* Sub-labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: C.muted }}>คอร์ส/เดือน</div>
                <div style={{ fontSize: 10, color: C.muted }}>CAPACITY MAX: 45</div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data} barSize={28} barCategoryGap="30%">
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 45]} tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} width={24} />
                    <Tooltip content={<WorkloadTooltip />} />
                    <Bar dataKey="available" name="Available Capacity" stackId="a" fill={C.primary5} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="scheduled" name="Scheduled" stackId="a" fill={C.primary} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="overload" name="Overload ⚠" stackId="a" fill={C.red} radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, marginTop: 8, justifyContent: 'center' }}>
                {([
                    ['Available Capacity', C.primary5, C.primary4],
                    ['Scheduled', C.primary, C.primary],
                    ['Overload ⚠', C.red, C.red],
                ] as const).map(([l, bg, bd]) => (
                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 12, height: 10, borderRadius: 2, background: bg, border: `1px solid ${bd}` }} />
                        <span style={{ fontSize: 10, color: C.muted }}>{l}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
