import React from 'react';
import { User, GraduationCap, Zap, Briefcase } from 'lucide-react';
import { C, EmploymentItem, EducationItem, ProfileTabProps } from './types';
import { SectionCard, InfoRow } from './ui-primitives';
import { STAFF_INFO, LICENSE, EDUCATION, EMPLOYMENT } from './data';

export function ProfileTab({ employment, ratings }: ProfileTabProps) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Personal Information */}
            <SectionCard title="Personal Information" icon={<User className="h-4 w-4 text-blue-500" />}>
                <InfoRow label="Date of Birth" value={STAFF_INFO.dob} />
                <InfoRow label="Place of Birth" value={STAFF_INFO.pob} />
                <InfoRow label="Nationality" value={STAFF_INFO.nationality} />
                <InfoRow label="Thai ID" value={<code style={{ fontSize: 12, background: C.bg, padding: '1px 6px', borderRadius: 4 }}>{STAFF_INFO.thaiId}</code>} />
                <InfoRow label="Phone" value={STAFF_INFO.phone} />
                <InfoRow label="Address" value={<span style={{ fontSize: 11 }}>{STAFF_INFO.address}</span>} />
            </SectionCard>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Education */}
                <SectionCard title="Education" icon={<GraduationCap className="h-4 w-4 text-purple-500" />}>
                    {EDUCATION.map((e: EducationItem) => (
                        <div key={e.deg} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
                            <span style={{
                                padding: '3px 8px', borderRadius: 5, background: C.primary5,
                                border: `1px solid ${C.primary4}`, fontSize: 9, fontWeight: 700,
                                color: C.primary, flexShrink: 0, marginTop: 2,
                            }}>
                                {e.deg.toUpperCase()}
                            </span>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{e.inst}</div>
                                <div style={{ fontSize: 11, color: C.muted }}>{e.period}</div>
                            </div>
                        </div>
                    ))}
                </SectionCard>

                {/* AMEL License */}
                <SectionCard title="AMEL License" icon={<Zap className="h-4 w-4 text-amber-500" />}>
                    <div style={{
                        background: `linear-gradient(135deg,${C.primary6},${C.primary5})`,
                        border: `1.5px solid ${C.primary4}`, borderRadius: 10, padding: 16,
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div>
                                <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1 }}>LICENSE NO.</div>
                                <div style={{ fontSize: 30, fontWeight: 900, color: C.primary, letterSpacing: 3, lineHeight: 1 }}>{LICENSE.no}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 9, color: C.muted }}>VALID</div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{LICENSE.validFrom}</div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: C.green }}>→ {LICENSE.validTo}</div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                            {ratings.map((r: string) => (
                                <div key={r} style={{
                                    padding: '4px 8px', background: '#fff', border: `1px solid ${C.primary4}`,
                                    borderRadius: 5, fontSize: 9, color: C.primary2, fontWeight: 500,
                                }}>
                                    ✓ {r}
                                </div>
                            ))}
                        </div>
                    </div>
                </SectionCard>
            </div>

            {/* Employment History */}
            <SectionCard title="Employment History" icon={<Briefcase className="h-4 w-4 text-gray-500" />} style={{ gridColumn: 'span 2' }}>
                <div style={{ position: 'relative', paddingLeft: 8 }}>
                    {employment.map((e: EmploymentItem, i: number) => (
                        <div key={i} style={{
                            display: 'grid', gridTemplateColumns: '110px 24px 1fr', gap: '0 16px',
                            paddingBottom: i < employment.length - 1 ? 20 : 0,
                        }}>
                            <div style={{ textAlign: 'right', paddingTop: 2 }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{e.from}</div>
                                <div style={{ fontSize: 11, color: C.muted }}>{e.to}</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{
                                    width: 14, height: 14, borderRadius: '50%',
                                    background: e.active ? C.primary : C.primary4,
                                    border: `2px solid ${e.active ? C.primary2 : C.primary4}`,
                                    boxShadow: e.active ? `0 0 8px ${C.primary}66` : 'none', flexShrink: 0,
                                }} />
                                {i < employment.length - 1 && (
                                    <div style={{
                                        flex: 1, width: 2,
                                        background: `linear-gradient(180deg,${C.primary4},${C.primary5})`,
                                        minHeight: 18, marginTop: 2,
                                    }} />
                                )}
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: e.active ? C.primary : C.text }}>{e.org}</div>
                                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{e.role}</div>
                                {e.active && (
                                    <span style={{
                                        display: 'inline-block', marginTop: 4, padding: '1px 8px', borderRadius: 10,
                                        background: C.primary5, border: `1px solid ${C.primary4}`,
                                        fontSize: 9, color: C.primary, fontWeight: 700,
                                    }}>
                                        CURRENT
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </SectionCard>
        </div>
    );
}
