import React from 'react';
import { C, BadgeProps, StatusBadgeProps, TypeBadgeProps, SectionCardProps, InfoRowProps } from './types';

// ── Badge ──
export function Badge({ children, color, bg, border }: BadgeProps) {
    return (
        <span style={{
            padding: '2px 9px', borderRadius: 10, background: bg, color,
            fontSize: 10, fontWeight: 700, border: `1px solid ${border}`,
        }}>
            {children}
        </span>
    );
}

// ── Status Badge (Valid / Expired / Permanent) ──
export function StatusBadge({ status, days }: StatusBadgeProps) {
    if (status === 'valid' && days !== null)
        return <Badge color={C.green} bg={C.greenL} border="#86efac">{days}d left</Badge>;
    if (status === 'expired' && days !== null)
        return <Badge color={C.red} bg={C.redL} border="#fca5a5">EXPIRED {Math.abs(days)}d</Badge>;
    if (status === 'perm')
        return <Badge color={C.primary} bg={C.primary5} border={C.primary4}>PERMANENT</Badge>;
    return null;
}

// ── Training Type Badge (Recurrent / Initial) ──
export function TypeBadge({ type }: TypeBadgeProps) {
    return type === 'R2Y'
        ? <Badge color={C.orange} bg={C.orangeL} border="#fcd34d">RECURRENT 2Y</Badge>
        : <Badge color={C.primary} bg={C.primary5} border={C.primary4}>INITIAL</Badge>;
}

// ── Section Card ──
export function SectionCard({ title, icon, children, style = {} }: SectionCardProps) {
    return (
        <div style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
            overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.04)', ...style,
        }}>
            {title && (
                <div style={{
                    padding: '12px 18px', borderBottom: `1px solid ${C.border}`, background: C.bg,
                    display: 'flex', alignItems: 'center', gap: 8,
                }}>
                    {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1.5 }}>
                        {title.toUpperCase()}
                    </span>
                </div>
            )}
            <div style={{ padding: 18 }}>{children}</div>
        </div>
    );
}

// ── Info Row (label → value) ──
export function InfoRow({ label, value }: InfoRowProps) {
    return (
        <div style={{
            display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8,
            padding: '8px 0', borderBottom: `1px solid ${C.border}`,
        }}>
            <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, letterSpacing: 0.5, paddingTop: 1 }}>
                {label}
            </div>
            <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>
                {value}
            </div>
        </div>
    );
}
