'use client';

import React, { useState } from 'react';
import { MissingSkill, C } from './types';

interface MissingSkillsProps {
    skills: MissingSkill[];
}

export function MissingSkills({ skills }: MissingSkillsProps) {
    const [gapTab, setGapTab] = useState<'missing' | 'gap'>('missing');

    return (
        <div style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
            padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,.04)',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.text, letterSpacing: 1 }}>
                    TOP MISSING SKILLS
                </div>
                <button
                    onClick={() => setGapTab(gapTab === 'missing' ? 'gap' : 'missing')}
                    style={{
                        padding: '2px 10px', borderRadius: 5,
                        background: C.primary5, border: `1px solid ${C.primary4}`,
                        fontSize: 9, color: C.primary, fontWeight: 600,
                        cursor: 'pointer', letterSpacing: 1, fontFamily: 'inherit',
                    }}
                >
                    {gapTab === 'missing' ? 'GAP ANALYSIS ›' : 'MISSING SKILLS ›'}
                </button>
            </div>

            {/* Skill List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {skills.map((s) => (
                    <div key={s.rank} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        {/* Rank Badge */}
                        <div style={{
                            width: 22, height: 22, borderRadius: '50%',
                            background: C.primary5, border: `1.5px solid ${C.primary4}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700, color: C.primary, flexShrink: 0, marginTop: 1,
                        }}>
                            {s.rank}
                        </div>

                        {/* Info + Progress */}
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{s.name}</div>
                            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 0.5, marginBottom: 5 }}>{s.cat}</div>
                            <div style={{ height: 3, background: C.primary5, borderRadius: 2, overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%', width: `${s.pct}%`,
                                    background: `linear-gradient(90deg,${C.primary},${C.primary3})`,
                                    borderRadius: 2,
                                }} />
                            </div>
                        </div>

                        {/* Percentage */}
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.primary, flexShrink: 0 }}>
                            {s.pct}%
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
