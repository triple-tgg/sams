import React from 'react';
import { KpiItem, C } from './types';

interface KpiCardsProps {
    items: KpiItem[];
}

export function KpiCards({ items }: KpiCardsProps) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
            {items.map((k) => (
                <div
                    key={k.label}
                    style={{
                        background: k.bg, border: `1.5px solid ${k.border}`, borderRadius: 14,
                        padding: '18px 20px', position: 'relative', overflow: 'hidden',
                        boxShadow: '0 2px 12px rgba(0,0,0,.05)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: k.dotColor }} />
                        <div style={{ fontSize: 10, fontWeight: 700, color: k.dotColor, letterSpacing: 1.5 }}>
                            {k.label}
                        </div>
                    </div>
                    <div style={{ fontSize: 38, fontWeight: 900, color: k.color, lineHeight: 1, marginBottom: 6 }}>
                        {k.val}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted }}>{k.sub}</div>
                    <div style={{ position: 'absolute', right: 14, bottom: 12, fontSize: 32, opacity: 0.12 }}>
                        {k.icon}
                    </div>
                </div>
            ))}
        </div>
    );
}
