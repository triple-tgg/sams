import React from 'react';
import { QuickStatItem, C } from './types';

interface QuickStatsProps {
    items: QuickStatItem[];
}

export function QuickStats({ items }: QuickStatsProps) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            {items.map((k) => (
                <div
                    key={k.label}
                    style={{
                        background: k.bg, border: `1.5px solid ${k.border}`, borderRadius: 12,
                        padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center',
                    }}
                >
                    <div style={{ fontSize: 24 }}>{k.icon}</div>
                    <div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: k.color, lineHeight: 1 }}>
                            {k.val}
                        </div>
                        <div style={{ fontSize: 10, color: C.muted, marginTop: 3, lineHeight: 1.3 }}>
                            {k.label}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
