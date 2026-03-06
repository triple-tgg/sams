'use client';

import React from 'react';
import { PieChart, Pie, Cell, Label } from 'recharts';
import { AuthItem, C } from './types';

interface AuthorizationStatusProps {
    data: AuthItem[];
}

function DonutLabel({ viewBox }: { viewBox?: { cx: number; cy: number } }) {
    if (!viewBox) return null;
    const { cx, cy } = viewBox;
    return (
        <g>
            <text x={cx} y={cy - 8} textAnchor="middle" fill={C.primary} fontSize={28} fontWeight={800}>
                87%
            </text>
            <text x={cx} y={cy + 14} textAnchor="middle" fill={C.muted} fontSize={11} letterSpacing={1}>
                COMPLIANT
            </text>
        </g>
    );
}

export function AuthorizationStatus({ data }: AuthorizationStatusProps) {
    return (
        <div style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
            padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,.04)',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.text, letterSpacing: 1 }}>
                    AUTHORIZATION STATUS
                </div>
                <div style={{
                    padding: '2px 8px', borderRadius: 5,
                    background: `linear-gradient(135deg,${C.primary},${C.primary2})`,
                    fontSize: 9, color: '#fff', fontWeight: 700, letterSpacing: 1,
                }}>
                    LIVE
                </div>
            </div>

            {/* Donut Chart */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <PieChart width={190} height={190}>
                    <Pie
                        data={data} cx={90} cy={90} innerRadius={60} outerRadius={88}
                        dataKey="value" paddingAngle={2} startAngle={90} endAngle={-270}
                        labelLine={false}
                    >
                        {data.map((d, i) => (
                            <Cell key={i} fill={d.color} />
                        ))}
                        <Label content={<DonutLabel />} position="center" />
                    </Pie>
                </PieChart>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.map((d) => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 2, background: d.color }} />
                            <span style={{ fontSize: 12, color: C.muted }}>{d.name}</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: d.color }}>{d.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
