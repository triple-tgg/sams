import React from 'react';
import { C, StaffSummaryMetric } from './types';

interface HeroSectionProps {
    initials: string;
    nameEn: string;
    nameTh: string;
    empNo: string;
    tags: string[];
    metrics: StaffSummaryMetric[];
}

export function HeroSection({ initials, nameEn, nameTh, empNo, tags, metrics }: HeroSectionProps) {
    return (
        <div style={{
            background: `linear-gradient(135deg, hsl(206, 92%, 35%), ${C.primary})`, borderRadius: 16,
            padding: '24px 28px', marginBottom: 20, display: 'flex', gap: 24, alignItems: 'center',
            boxShadow: `0 4px 24px ${C.primary}44`,
        }}>
            {/* Avatar */}
            <div style={{
                width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,.2)',
                border: '3px solid rgba(255,255,255,.45)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 26, fontWeight: 800, color: '#fff', flexShrink: 0,
            }}>
                {initials}
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{nameEn}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.65)', marginTop: 2 }}>
                    {nameTh} &nbsp;·&nbsp; {empNo}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    {tags.map((t) => (
                        <span
                            key={t}
                            style={{
                                padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,.15)',
                                border: '1px solid rgba(255,255,255,.25)', fontSize: 11, color: '#fff',
                            }}
                        >
                            {t}
                        </span>
                    ))}
                </div>
            </div>

            {/* Metrics */}
            <div style={{ display: 'flex', gap: 14, flexShrink: 0 }}>
                {metrics.map((k) => (
                    <div
                        key={k.l}
                        style={{
                            textAlign: 'center', padding: '10px 16px', background: 'rgba(255,255,255,.12)',
                            borderRadius: 10, border: '1px solid rgba(255,255,255,.2)',
                        }}
                    >
                        <div style={{ fontSize: 24, fontWeight: 800, color: k.c, lineHeight: 1 }}>{k.v}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.6)', marginTop: 4 }}>{k.l}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
