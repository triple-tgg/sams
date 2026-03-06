import React from 'react';
import { C, ExperienceTabProps, TrainingHighlight } from './types';
import { SectionCard } from './ui-primitives';

interface TaskGroup {
    l: string;
    v: number;
    t: number;
    c: string;
}

export function ExperienceTab({ highlights }: ExperienceTabProps) {
    const taskGroups: TaskGroup[] = [
        { l: 'Group 1 Tasks', v: 370, t: 378, c: C.primary },
        { l: 'Group 2 Tasks', v: 6, t: 378, c: C.primary3 },
        { l: 'Training/Mgmt (max 20%)', v: 2, t: 378, c: C.green },
    ];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Maintenance Task Summary */}
            <SectionCard title="Maintenance Task Summary (SAMS-FM-CM-062)" icon="📊">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
                    <div style={{
                        textAlign: 'center', padding: '16px 36px',
                        background: `linear-gradient(135deg,${C.primary6},${C.primary5})`,
                        border: `1.5px solid ${C.primary4}`, borderRadius: 12,
                    }}>
                        <div style={{ fontSize: 52, fontWeight: 900, color: C.primary, lineHeight: 1 }}>378</div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 4, letterSpacing: 0.5 }}>TOTAL TASKS COMPLETED</div>
                    </div>
                </div>

                {taskGroups.map((t: TaskGroup) => (
                    <div key={t.l} style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                            <span style={{ fontSize: 12, color: C.text }}>{t.l}</span>
                            <span style={{ fontWeight: 700, color: t.c }}>{t.v}</span>
                        </div>
                        <div style={{ height: 6, background: C.primary5, borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{
                                height: '100%', width: `${(t.v / t.t) * 100}%`,
                                background: `linear-gradient(90deg,${t.c},${t.c}bb)`, borderRadius: 3,
                            }} />
                        </div>
                    </div>
                ))}

                <div style={{
                    marginTop: 14, padding: 11, background: C.greenL, border: '1px solid #86efac',
                    borderRadius: 8, fontSize: 11, color: C.green, fontWeight: 600, textAlign: 'center',
                }}>
                    ✓ Exceeds minimum 180 tasks requirement (MOE 3.9.1)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
                    {[['Start', '07 Jan 2024'], ['End', '21 Nov 2025']].map(([l, v]) => (
                        <div key={l} style={{
                            padding: '10px 12px', background: C.primary5, border: `1px solid ${C.primary4}`,
                            borderRadius: 8, textAlign: 'center',
                        }}>
                            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1 }}>{l}</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginTop: 3 }}>{v}</div>
                        </div>
                    ))}
                </div>
            </SectionCard>

            {/* Previous Training Highlights */}
            <SectionCard title="Previous Training Highlights" icon="📚">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 500, overflowY: 'auto' }}>
                    {highlights.map((r: TrainingHighlight, i: number) => (
                        <div key={i} style={{
                            display: 'flex', gap: 12, padding: '10px 12px',
                            background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
                        }}>
                            <div style={{ width: 58, flexShrink: 0, fontSize: 10, fontFamily: 'monospace', color: C.primary, fontWeight: 600, paddingTop: 1 }}>
                                {r.d}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12, color: C.text, fontWeight: 500, lineHeight: 1.4 }}>{r.c}</div>
                                <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{r.by}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </SectionCard>
        </div>
    );
}
