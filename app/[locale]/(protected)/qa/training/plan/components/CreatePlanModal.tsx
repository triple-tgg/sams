'use client';

import React, { useState } from 'react';
import {
    X, FileText, CalendarDays, Building2, BookOpen, Users, Plus, Trash2, CheckCircle2,
} from 'lucide-react';

// ── Color Palette ──
const C = {
    primary: '#1a56db', primary2: '#1e40af', primary3: '#3b82f6',
    primary4: '#93c5fd', primary5: '#dbeafe', primary6: '#eff6ff',
    green: '#16a34a', greenL: '#dcfce7',
    red: '#dc2626', redL: '#fee2e2',
    bg: '#f0f4ff', surface: '#ffffff',
    border: '#e2e8f0', text: '#0f172a',
    muted: '#64748b', mutedL: '#94a3b8',
} as const;

const DEPARTMENTS = [
    'All Departments', 'Maintenance', 'Line Maintenance', 'Base Maintenance',
    'Safety', 'Quality Assurance', 'Workshop', 'Planning',
];

const AVAILABLE_COURSES = [
    { id: 'c1', name: 'Human Factors', category: 'REGULATORY', type: 'R2Y', duration: '8 hrs' },
    { id: 'c2', name: 'SMS Awareness', category: 'REGULATORY', type: 'R2Y', duration: '4 hrs' },
    { id: 'c3', name: 'Fuel Tank Safety (FTS)', category: 'SAFETY', type: 'R2Y', duration: '8 hrs' },
    { id: 'c4', name: 'EWIS (Electrical Wiring)', category: 'TECHNICAL', type: 'R2Y', duration: '6 hrs' },
    { id: 'c5', name: 'RVSM / PBN / RNP', category: 'TECHNICAL', type: 'R2Y', duration: '8 hrs' },
    { id: 'c6', name: 'Engine Run-up Procedures', category: 'TECHNICAL', type: 'INI', duration: '16 hrs' },
    { id: 'c7', name: 'B737 NG Type Course', category: 'TYPE TRAINING', type: 'INI', duration: '40 hrs' },
    { id: 'c8', name: 'A320 Family Type Course', category: 'TYPE TRAINING', type: 'INI', duration: '40 hrs' },
    { id: 'c9', name: 'Dangerous Goods (DGR Cat.8)', category: 'REGULATORY', type: 'R2Y', duration: '4 hrs' },
    { id: 'c10', name: 'Emergency Procedures', category: 'SAFETY', type: 'R2Y', duration: '4 hrs' },
    { id: 'c11', name: 'Company Policy & Procedures', category: 'COMPANY', type: 'INI', duration: '8 hrs' },
    { id: 'c12', name: 'Aircraft Inspection Techniques', category: 'TECHNICAL', type: 'INI', duration: '16 hrs' },
];

// ── Sub Components ──
function FieldLabel({ label, required, icon }: { label: string; required?: boolean; icon?: React.ReactNode }) {
    return (
        <label style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 11, fontWeight: 700, color: C.muted,
            letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8,
        }}>
            {icon && <span style={{ color: C.primary, display: 'flex' }}>{icon}</span>}
            {label}
            {required && <span style={{ color: C.red, fontSize: 14 }}>*</span>}
        </label>
    );
}

function TextInput({ value, onChange, placeholder, type = 'text' }: {
    value: string; onChange: (v: string) => void; placeholder: string; type?: string;
}) {
    return (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            style={{
                width: '100%', padding: '11px 14px', borderRadius: 9,
                border: `1.5px solid ${C.border}`, background: C.surface,
                fontSize: 13.5, color: C.text, outline: 'none',
                transition: 'all .2s', boxSizing: 'border-box',
            }}
            onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = `0 0 0 3px ${C.primary}18`; }}
            onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }}
        />
    );
}

function SelectInput({ value, onChange, options, placeholder }: {
    value: string; onChange: (v: string) => void; options: string[]; placeholder: string;
}) {
    return (
        <select value={value} onChange={e => onChange(e.target.value)}
            style={{
                width: '100%', padding: '11px 14px', borderRadius: 9,
                border: `1.5px solid ${C.border}`, background: C.surface,
                fontSize: 13.5, color: value ? C.text : C.mutedL,
                outline: 'none', cursor: 'pointer', boxSizing: 'border-box',
                appearance: 'none' as const,
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
            }}
        >
            <option value="" disabled>{placeholder}</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
    );
}

// ── Modal Props ──
interface CreatePlanModalProps {
    onClose: () => void;
    onSubmit?: (data: Record<string, unknown>) => void;
}

// ── Main Modal Component ──
export function CreatePlanModal({ onClose, onSubmit }: CreatePlanModalProps) {
    const [form, setForm] = useState({
        name: '', department: '', description: '',
        startDate: '', endDate: '', targetStaff: '',
    });
    const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
    const [courseSearch, setCourseSearch] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const set = (key: string) => (val: string) => setForm(f => ({ ...f, [key]: val }));

    const filteredCourses = AVAILABLE_COURSES.filter(c =>
        !selectedCourses.includes(c.id) && (
            c.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
            c.category.toLowerCase().includes(courseSearch.toLowerCase())
        )
    );

    const toggleCourse = (id: string) => {
        setSelectedCourses(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const handleSubmit = () => {
        setSubmitted(true);
        onSubmit?.({ ...form, courses: selectedCourses });
    };

    // ── Success Screen ──
    if (submitted) {
        return (
            <div style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <div style={{
                    textAlign: 'center', animation: 'cpFadeUp 0.5s ease',
                    background: C.surface, borderRadius: 20,
                    padding: '48px 40px', border: `1px solid ${C.border}`,
                    maxWidth: 420, width: '90%',
                    boxShadow: '0 24px 60px rgba(0,0,0,0.15)',
                }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
                        background: `linear-gradient(135deg, ${C.green}, #15803d)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 0 40px ${C.green}40`,
                    }}>
                        <CheckCircle2 className="h-8 w-8" style={{ color: '#fff' }} />
                    </div>
                    <h2 style={{ color: C.text, fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Plan Created</h2>
                    <p style={{ color: C.muted, fontSize: 13, marginBottom: 6 }}>
                        <strong>{form.name || 'Untitled Plan'}</strong>
                    </p>
                    <p style={{ color: C.mutedL, fontSize: 12, marginBottom: 28 }}>
                        {selectedCourses.length} course(s) · {form.department || 'All Departments'}
                    </p>
                    <button onClick={onClose} style={{
                        padding: '10px 28px', borderRadius: 9, border: `1.5px solid ${C.border}`,
                        background: 'transparent', color: C.muted, cursor: 'pointer',
                        fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                    }}>Close</button>
                </div>
                <style>{`@keyframes cpFadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`}</style>
            </div>
        );
    }

    // ── Modal ──
    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div style={{
                width: '90%', maxWidth: 680, maxHeight: '90vh',
                background: C.bg, borderRadius: 18,
                border: `1px solid ${C.border}`,
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                boxShadow: '0 24px 80px rgba(0,0,0,0.15)',
                animation: 'cpFadeUp 0.3s ease',
            }}>
                {/* ── Header ── */}
                <div style={{
                    background: `linear-gradient(135deg, hsl(206, 92%, 35%), ${C.primary})`,
                    padding: '14px 22px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: 'rgba(255,255,255,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                        }}>
                            <Plus className="h-4 w-4" />
                        </div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Create Training Plan</div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>กำหนดแผนการฝึกอบรมใหม่</div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)',
                        background: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                        fontFamily: 'inherit',
                    }}>×</button>
                </div>

                {/* ── Form Content ── */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '22px' }}>
                    <div style={{
                        background: C.surface, borderRadius: 14,
                        border: `1px solid ${C.border}`, padding: '24px 22px',
                    }}>
                        {/* Plan Name */}
                        <div style={{ marginBottom: 22 }}>
                            <FieldLabel label="Plan Name" required icon={<FileText className="h-3.5 w-3.5" />} />
                            <TextInput value={form.name} onChange={set('name')} placeholder="e.g. Q2 Recurrent Training Program" />
                        </div>

                        {/* Description */}
                        <div style={{ marginBottom: 22 }}>
                            <FieldLabel label="Description" icon={<FileText className="h-3.5 w-3.5" />} />
                            <textarea
                                value={form.description} onChange={e => set('description')(e.target.value)}
                                placeholder="Brief description of the training plan objectives..."
                                rows={3}
                                style={{
                                    width: '100%', padding: '11px 14px', borderRadius: 9,
                                    border: `1.5px solid ${C.border}`, background: C.surface,
                                    fontSize: 13.5, color: C.text, outline: 'none', resize: 'vertical',
                                    boxSizing: 'border-box', fontFamily: 'inherit',
                                    transition: 'all .2s',
                                }}
                                onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = `0 0 0 3px ${C.primary}18`; }}
                                onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>

                        {/* Row: Department + Target Staff */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 22 }}>
                            <div>
                                <FieldLabel label="Department" required icon={<Building2 className="h-3.5 w-3.5" />} />
                                <SelectInput value={form.department} onChange={set('department')} options={DEPARTMENTS} placeholder="Select department" />
                            </div>
                            <div>
                                <FieldLabel label="Target Staff" required icon={<Users className="h-3.5 w-3.5" />} />
                                <TextInput value={form.targetStaff} onChange={set('targetStaff')} placeholder="e.g. 45" type="number" />
                            </div>
                        </div>

                        {/* Row: Start Date + End Date */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 22 }}>
                            <div>
                                <FieldLabel label="Start Date" required icon={<CalendarDays className="h-3.5 w-3.5" />} />
                                <input type="date" value={form.startDate} onChange={e => set('startDate')(e.target.value)}
                                    style={{
                                        width: '100%', padding: '11px 14px', borderRadius: 9,
                                        border: `1.5px solid ${C.border}`, background: C.surface,
                                        fontSize: 13.5, color: C.text, outline: 'none',
                                        boxSizing: 'border-box',
                                    }}
                                />
                            </div>
                            <div>
                                <FieldLabel label="End Date" required icon={<CalendarDays className="h-3.5 w-3.5" />} />
                                <input type="date" value={form.endDate} onChange={e => set('endDate')(e.target.value)}
                                    style={{
                                        width: '100%', padding: '11px 14px', borderRadius: 9,
                                        border: `1.5px solid ${C.border}`, background: C.surface,
                                        fontSize: 13.5, color: C.text, outline: 'none',
                                        boxSizing: 'border-box',
                                    }}
                                />
                            </div>
                        </div>

                        {/* ── Course Selection ── */}
                        <div>
                            <FieldLabel label="Courses" required icon={<BookOpen className="h-3.5 w-3.5" />} />

                            {/* Selected Courses */}
                            {selectedCourses.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                                    {selectedCourses.map(id => {
                                        const c = AVAILABLE_COURSES.find(x => x.id === id)!;
                                        return (
                                            <div key={id} style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '10px 14px', borderRadius: 9,
                                                background: C.primary6, border: `1.5px solid ${C.primary4}`,
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{
                                                        width: 24, height: 24, borderRadius: 6,
                                                        background: C.primary5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: C.primary,
                                                    }}>
                                                        <BookOpen className="h-3 w-3" />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{c.name}</div>
                                                        <div style={{ fontSize: 10, color: C.muted }}>
                                                            {c.category} · {c.type} · {c.duration}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button onClick={() => toggleCourse(id)} style={{
                                                    width: 24, height: 24, borderRadius: 6, border: 'none',
                                                    background: C.redL, color: C.red, cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Course Search + Add */}
                            <div style={{
                                border: `1.5px solid ${C.border}`, borderRadius: 9,
                                overflow: 'hidden',
                            }}>
                                <div style={{ position: 'relative' }}>
                                    <BookOpen style={{
                                        position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                                        width: 14, height: 14, color: C.mutedL,
                                    }} />
                                    <input
                                        value={courseSearch} onChange={e => setCourseSearch(e.target.value)}
                                        placeholder="Search courses to add..."
                                        style={{
                                            width: '100%', padding: '10px 14px 10px 34px', border: 'none',
                                            fontSize: 12.5, color: C.text, outline: 'none',
                                            background: C.surface, boxSizing: 'border-box',
                                        }}
                                    />
                                </div>
                                <div style={{
                                    maxHeight: 180, overflowY: 'auto',
                                    borderTop: `1px solid ${C.border}`,
                                }}>
                                    {filteredCourses.map(c => (
                                        <div
                                            key={c.id}
                                            onClick={() => toggleCourse(c.id)}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '10px 14px', cursor: 'pointer',
                                                borderBottom: `1px solid ${C.border}`,
                                                transition: 'background .15s',
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.background = C.bg)}
                                            onMouseLeave={e => (e.currentTarget.style.background = C.surface)}
                                        >
                                            <div>
                                                <div style={{ fontSize: 12.5, fontWeight: 600, color: C.text }}>{c.name}</div>
                                                <div style={{ fontSize: 10, color: C.muted }}>
                                                    {c.category} · {c.type} · {c.duration}
                                                </div>
                                            </div>
                                            <div style={{
                                                width: 22, height: 22, borderRadius: 6,
                                                border: `1.5px solid ${C.primary4}`, background: C.primary6,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: C.primary, flexShrink: 0,
                                            }}>
                                                <Plus className="h-3 w-3" />
                                            </div>
                                        </div>
                                    ))}
                                    {filteredCourses.length === 0 && (
                                        <div style={{ padding: '16px 14px', textAlign: 'center', fontSize: 12, color: C.mutedL }}>
                                            {courseSearch ? 'No courses found' : 'All courses selected'}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={{ fontSize: 10, color: C.mutedL, marginTop: 6 }}>
                                {selectedCourses.length} course(s) selected
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Footer ── */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 22px', borderTop: `1px solid ${C.border}`,
                    background: C.surface, flexShrink: 0,
                }}>
                    <button onClick={onClose} style={{
                        padding: '10px 22px', borderRadius: 9,
                        border: `1.5px solid ${C.border}`, background: 'transparent',
                        color: C.muted, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                        fontFamily: 'inherit',
                    }}>
                        Cancel
                    </button>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={handleSubmit} style={{
                            padding: '10px 20px', borderRadius: 9,
                            border: `1.5px solid ${C.border}`, background: C.surface,
                            color: C.text, cursor: 'pointer', fontSize: 13,
                            fontWeight: 700, fontFamily: 'inherit',
                            display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                            <FileText className="h-3.5 w-3.5" style={{ color: C.muted }} />
                            Save as Draft
                        </button>
                        <button onClick={handleSubmit} style={{
                            padding: '10px 24px', borderRadius: 9, border: 'none',
                            background: `linear-gradient(135deg, ${C.primary}, ${C.primary2})`,
                            color: '#fff', cursor: 'pointer', fontSize: 13,
                            fontWeight: 800, fontFamily: 'inherit',
                            display: 'flex', alignItems: 'center', gap: 6,
                            boxShadow: `0 4px 14px ${C.primary}40`,
                            letterSpacing: 0.3,
                        }}>
                            <Plus className="h-4 w-4" />
                            Create Plan
                        </button>
                    </div>
                </div>
            </div>
            <style>{`@keyframes cpFadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`}</style>
        </div>
    );
}
