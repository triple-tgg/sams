import React, { useState, useRef } from 'react';
import { PendingLogbookEntry } from './LogbookTab';
import { C } from './types';

// ─── Dropdown Data ───────────────────────────────────
const LOCATIONS = ["BKK", "DMK", "HKT", "CNX", "HDY", "KBV", "CEI"];

const AIRCRAFT_TYPES = [
    "BOEING B737-600/700/800/900 (CFM56)",
    "BOEING B737-7/8/9 (CFM LEAP-1B)",
    "AIRBUS A318/A319/A320/A321 (CFM56)",
    "AIRBUS A319/A320/A321 (CFM LEAP-1A)",
    "AIRBUS A319/A320/A321 (IAE V2500)",
    "AIRBUS A319/A320/A321 (IAE PW1100G)",
    "BOEING 777-200/300 (RR RB211 Trent 800)",
    "BOEING 777-300ER (GE90-115B)",
    "AIRBUS A330-200/300 (RR TRENT 700)",
    "AIRBUS A330-200/300 (GE CF6)",
    "AIRBUS A330-200/300 (PW4000)",
    "AIRBUS A330-800/900 (Trent 7000)",
    "BOEING 787-8/9 (RR RB 211 Trent 1000)",
    "BOEING B787-8/9/10 (GEnx)",
    "AIRBUS A350-900/1000 (RR Trent XWB)",
    "BOEING B767-200/300 (PW4000, RB211)",
    "E190 (PW 1900)",
];

const LICENSE_CATEGORIES = ["A1 AIRCRAFT CERTIFYING STAFF", "AIRCRAFT MECHANIC", "AIRCRAFT INSPECTOR"];
const PRIVILEGES = ["B1/B2", "B1", "B2"];

const MAINTENANCE_TYPES = [
    "Transit check", "Schedule maintenance up to A-Check", "Daily check",
    "Weekly check", "Engine change", "APU change", "Engine Borescope",
];

const TASK_TYPES = [
    "Releasing aircraft to service (CRS)", "Servicing (SGH)",
    "Check / Visual Inspection (INSP)", "Operational and functional testing (FOT)",
    "Trouble shooting (TS)", "Minor repair (REP)",
    "Removal/Installation of components (R/I)", "Supervising these activities",
    "Defect rectification", "Borescope Inspection", "Training", "Other",
];

const ACTIVITY_TYPES = ["CRS", "Perform", "Supervise", "Training"];

const stepIcons: Record<number, React.ReactNode> = {
    1: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
    2: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" /></svg>,
    3: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>,
    4: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>,
    5: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
};

const STEPS = [
    { id: 1, title: "General Info", short: "Identity" },
    { id: 2, title: "Aircraft & Task", short: "Aircraft" },
    { id: 3, title: "Task Details", short: "Details" },
    { id: 4, title: "References", short: "Refs" },
    { id: 5, title: "Review", short: "Review" },
];

// ─── Reusable Sub-Components ────────────────────────
function FieldLabel({ label, required, number }: { label: string; required?: boolean; number?: string }) {
    return (
        <label style={{
            display: "flex", alignItems: "center", gap: 8,
            fontSize: 12, fontWeight: 700, color: C.muted,
            letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8,
        }}>
            {number && (
                <span style={{
                    width: 22, height: 22, borderRadius: 6,
                    background: C.primary5, display: "inline-flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800, color: C.primary,
                }}>{number}</span>
            )}
            {label}
            {required && <span style={{ color: C.red, fontSize: 15, marginLeft: 1 }}>*</span>}
        </label>
    );
}

function TextInput({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder: string; type?: string }) {
    return (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            style={{
                width: "100%", padding: "13px 16px", borderRadius: 10,
                border: `2px solid ${C.border}`, background: C.surface,
                fontSize: 14.5, color: C.text, outline: "none",
                transition: "all 0.2s", boxSizing: "border-box",
            }}
            onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = `0 0 0 3px ${C.primary}20`; }}
            onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
        />
    );
}

function SelectInput({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) {
    return (
        <select value={value} onChange={e => onChange(e.target.value)}
            style={{
                width: "100%", padding: "13px 16px", borderRadius: 10,
                border: `2px solid ${C.border}`, background: C.surface,
                fontSize: 14.5, color: value ? C.text : C.mutedL,
                outline: "none", cursor: "pointer", boxSizing: "border-box",
                appearance: "none" as const,
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center",
            }}
        >
            <option value="" disabled>{placeholder}</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
    );
}

function RadioGroup({ options, value, onChange, columns = 1 }: { options: string[]; value: string; onChange: (v: string) => void; columns?: number }) {
    return (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 8 }}>
            {options.map(opt => (
                <div key={opt} onClick={() => onChange(opt)} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "11px 14px", borderRadius: 9, cursor: "pointer",
                    border: `2px solid ${value === opt ? C.primary : C.border}`,
                    background: value === opt ? C.primary6 : C.surface,
                    transition: "all 0.15s",
                }}>
                    <div style={{
                        width: 18, height: 18, borderRadius: "50%",
                        border: `2px solid ${value === opt ? C.primary : C.mutedL}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, transition: "all 0.15s",
                    }}>
                        {value === opt && <div style={{ width: 9, height: 9, borderRadius: "50%", background: C.primary }} />}
                    </div>
                    <span style={{ fontSize: 13, color: value === opt ? C.primary : C.muted, fontWeight: value === opt ? 600 : 400 }}>{opt}</span>
                </div>
            ))}
        </div>
    );
}

function CheckboxGroup({ options, values, onChange, columns = 1 }: { options: string[]; values: string[]; onChange: (v: string[]) => void; columns?: number }) {
    const toggle = (opt: string) => onChange(values.includes(opt) ? values.filter(v => v !== opt) : [...values, opt]);
    return (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 8 }}>
            {options.map(opt => {
                const checked = values.includes(opt);
                return (
                    <div key={opt} onClick={() => toggle(opt)} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "11px 14px", borderRadius: 9, cursor: "pointer",
                        border: `2px solid ${checked ? C.primary : C.border}`,
                        background: checked ? C.primary6 : C.surface,
                        transition: "all 0.15s",
                    }}>
                        <div style={{
                            width: 18, height: 18, borderRadius: 5,
                            border: `2px solid ${checked ? C.primary : C.mutedL}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: checked ? C.primary : "transparent",
                            flexShrink: 0, transition: "all 0.15s",
                        }}>
                            {checked && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                        </div>
                        <span style={{ fontSize: 13, color: checked ? C.primary : C.muted, fontWeight: checked ? 600 : 400 }}>{opt}</span>
                    </div>
                );
            })}
        </div>
    );
}

function LocationChips({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {options.map(loc => (
                <div key={loc} onClick={() => onChange(loc)} style={{
                    padding: "11px 22px", borderRadius: 9, cursor: "pointer",
                    border: `2px solid ${value === loc ? C.primary : C.border}`,
                    background: value === loc ? `linear-gradient(135deg, ${C.primary}, ${C.primary2})` : C.surface,
                    color: value === loc ? "#ffffff" : C.muted,
                    fontWeight: 700, fontSize: 13, letterSpacing: 1.2,
                    transition: "all 0.15s", userSelect: "none",
                }}>{loc}</div>
            ))}
        </div>
    );
}

function ReviewRow({ label, value }: { label: string; value: string | string[] }) {
    if (!value || (Array.isArray(value) && value.length === 0)) return null;
    const display = Array.isArray(value) ? value.join(", ") : value;
    return (
        <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            padding: "12px 0", borderBottom: `1px solid ${C.border}`, gap: 16,
        }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.mutedL, letterSpacing: 1, textTransform: "uppercase", flexShrink: 0, minWidth: 120 }}>{label}</span>
            <span style={{ fontSize: 14, color: C.text, fontWeight: 500, textAlign: "right", wordBreak: "break-word" }}>{display}</span>
        </div>
    );
}

// ─── Modal Props ─────────────────────────────────────
interface LogbookFormModalProps {
    entry: PendingLogbookEntry;
    onClose: () => void;
    onSubmit?: (data: Record<string, unknown>) => void;
}

// ─── Main Modal Component ────────────────────────────
export function LogbookFormModal({ entry, onClose, onSubmit }: LogbookFormModalProps) {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        name: "", employeeId: "", licenseCategory: "",
        date: "", location: entry.station, aircraftType: "", aircraftReg: "",
        privilege: "", ataChapter: "", maintenanceType: entry.type,
        taskTypes: [] as string[], activityType: "", maintenanceRef: "",
        duration: "", stampNo: "",
    });
    const [files, setFiles] = useState<File[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [direction, setDirection] = useState(1);
    const fileRef = useRef<HTMLInputElement>(null);

    const set = (key: string) => (val: string | string[]) => setForm(f => ({ ...f, [key]: val }));
    const fieldGroup = { marginBottom: 24 };

    const goNext = () => { setDirection(1); setStep(s => Math.min(s + 1, 5)); };
    const goPrev = () => { setDirection(-1); setStep(s => Math.max(s - 1, 1)); };
    const goToStep = (s: number) => { setDirection(s > step ? 1 : -1); setStep(s); };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(e.target.files || []);
        setFiles(prev => [...prev, ...newFiles].slice(0, 8));
    };
    const removeFile = (idx: number) => setFiles(f => f.filter((_, i) => i !== idx));

    const handleSubmit = () => {
        setSubmitted(true);
        onSubmit?.({ ...form, files });
    };

    // ─── Step Content ──────────────────────────────
    const renderStep = () => {
        const wrap = (children: React.ReactNode) => (
            <div key={step} style={{ animation: `modalSlideIn 0.35s ease` }}>
                {children}
                <style>{`
          @keyframes modalSlideIn {
            from { opacity: 0; transform: translateX(${direction * 40}px); }
            to { opacity: 1; transform: translateX(0); }
          }
        `}</style>
            </div>
        );

        switch (step) {
            case 1:
                return wrap(
                    <>
                        <div style={{ marginBottom: 28 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: "0 0 6px" }}>General Information</h2>
                            <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Enter your personal and license details</p>
                        </div>
                        <div style={fieldGroup}>
                            <FieldLabel label="Name – Surname (Full Name)" required number="1" />
                            <TextInput value={form.name} onChange={set("name")} placeholder="Enter your full name" />
                        </div>
                        <div style={fieldGroup}>
                            <FieldLabel label="Employee ID" required number="2" />
                            <TextInput value={form.employeeId} onChange={set("employeeId")} placeholder="Enter employee ID" />
                        </div>
                        <div style={fieldGroup}>
                            <FieldLabel label="License Category" required number="3" />
                            <RadioGroup options={LICENSE_CATEGORIES} value={form.licenseCategory} onChange={set("licenseCategory") as (v: string) => void} />
                        </div>
                    </>
                );

            case 2:
                return wrap(
                    <>
                        <div style={{ marginBottom: 28 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: "0 0 6px" }}>Aircraft & Location</h2>
                            <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Specify where and which aircraft</p>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                            <div>
                                <FieldLabel label="Date to Perform Task" required number="4" />
                                <input type="date" value={form.date} onChange={e => set("date")(e.target.value)}
                                    style={{
                                        width: "100%", padding: "13px 16px", borderRadius: 10,
                                        border: `2px solid ${C.border}`, background: C.surface,
                                        fontSize: 14.5, color: C.text, outline: "none",
                                        boxSizing: "border-box" as const,
                                    }}
                                />
                            </div>
                            <div>
                                <FieldLabel label="Privilege Used" required number="8" />
                                <RadioGroup options={PRIVILEGES} value={form.privilege} onChange={set("privilege") as (v: string) => void} columns={3} />
                            </div>
                        </div>
                        <div style={fieldGroup}>
                            <FieldLabel label="Location" required number="5" />
                            <LocationChips options={LOCATIONS} value={form.location} onChange={set("location") as (v: string) => void} />
                        </div>
                        <div style={fieldGroup}>
                            <FieldLabel label="Aircraft Type" required number="6" />
                            <SelectInput value={form.aircraftType} onChange={set("aircraftType") as (v: string) => void} options={AIRCRAFT_TYPES} placeholder="Select aircraft type" />
                        </div>
                        <div style={fieldGroup}>
                            <FieldLabel label="Aircraft Registration" required number="7" />
                            <TextInput value={form.aircraftReg} onChange={set("aircraftReg")} placeholder="e.g. HS-XXX" />
                        </div>
                    </>
                );

            case 3:
                return wrap(
                    <>
                        <div style={{ marginBottom: 28 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: "0 0 6px" }}>Task Details</h2>
                            <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Define the maintenance work performed</p>
                        </div>
                        <div style={fieldGroup}>
                            <FieldLabel label="ATA Chapter" required number="9" />
                            <TextInput value={form.ataChapter} onChange={set("ataChapter")} placeholder="Enter ATA chapter" />
                        </div>
                        <div style={fieldGroup}>
                            <FieldLabel label="Type of Maintenance (Rating)" required number="10" />
                            <RadioGroup options={MAINTENANCE_TYPES} value={form.maintenanceType} onChange={set("maintenanceType") as (v: string) => void} columns={2} />
                        </div>
                        <div style={fieldGroup}>
                            <FieldLabel label="Type of Task" required number="11" />
                            <CheckboxGroup options={TASK_TYPES} values={form.taskTypes} onChange={set("taskTypes") as (v: string[]) => void} columns={2} />
                        </div>
                        <div style={fieldGroup}>
                            <FieldLabel label="Type of Activity" required number="12" />
                            <RadioGroup options={ACTIVITY_TYPES} value={form.activityType} onChange={set("activityType") as (v: string) => void} columns={4} />
                        </div>
                    </>
                );

            case 4:
                return wrap(
                    <>
                        <div style={{ marginBottom: 28 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: "0 0 6px" }}>References & Completion</h2>
                            <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Attach documents and finalize</p>
                        </div>
                        <div style={fieldGroup}>
                            <FieldLabel label="Maintenance References" required number="13" />
                            <TextInput value={form.maintenanceRef} onChange={set("maintenanceRef")} placeholder="Technical Logbook No. or WO No." />
                        </div>
                        <div style={fieldGroup}>
                            <FieldLabel label="File Attachment" required number="14" />
                            <p style={{ fontSize: 12, color: C.mutedL, margin: "0 0 10px", lineHeight: 1.5 }}>
                                Name files by Technical Logbook No. or WO No. — Max 8 files
                            </p>
                            <div onClick={() => fileRef.current?.click()}
                                style={{
                                    border: `2px dashed ${C.border}`, borderRadius: 12,
                                    padding: "30px 20px", textAlign: "center", cursor: "pointer",
                                    background: C.primary6, transition: "all 0.2s",
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.background = C.primary5; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.primary6; }}
                            >
                                <div style={{ marginBottom: 8, color: C.primary }}>
                                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: C.primary }}>Click to upload files</div>
                                <div style={{ fontSize: 12, color: C.mutedL, marginTop: 4 }}>{files.length}/8 files attached</div>
                            </div>
                            <input ref={fileRef} type="file" multiple onChange={handleFileChange} style={{ display: "none" }} />
                            {files.length > 0 && (
                                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                                    {files.map((f, i) => (
                                        <div key={i} style={{
                                            display: "flex", alignItems: "center", justifyContent: "space-between",
                                            padding: "9px 14px", background: C.primary6, borderRadius: 8,
                                            border: `1px solid ${C.border}`, fontSize: 13,
                                        }}>
                                            <span style={{ color: C.text, fontWeight: 500 }}>{f.name}</span>
                                            <span onClick={() => removeFile(i)} style={{ color: C.red, cursor: "pointer", fontWeight: 700, fontSize: 17 }}>×</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                            <div>
                                <FieldLabel label="Performed Duration (hrs)" required number="15" />
                                <TextInput value={form.duration} onChange={set("duration")} placeholder="e.g. 2.5" />
                            </div>
                            <div>
                                <FieldLabel label="Authorized Stamp No." required number="16" />
                                <TextInput value={form.stampNo} onChange={set("stampNo")} placeholder="Enter stamp number" />
                            </div>
                        </div>
                    </>
                );

            case 5:
                const reviewSectionStyle = {
                    background: C.primary6, borderRadius: 12,
                    border: `1px solid ${C.border}`, padding: "4px 20px", marginBottom: 16,
                };
                const sectionHeaderStyle = {
                    padding: "10px 0", borderBottom: `1px solid ${C.border}`, marginBottom: 2,
                };
                return wrap(
                    <>
                        <div style={{ marginBottom: 28 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: "0 0 6px" }}>Review & Submit</h2>
                            <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Please verify all information before submitting</p>
                        </div>
                        <div style={reviewSectionStyle}>
                            <div style={sectionHeaderStyle}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: C.primary, letterSpacing: 2, textTransform: "uppercase" }}>General Information</span>
                            </div>
                            <ReviewRow label="Name" value={form.name} />
                            <ReviewRow label="Employee ID" value={form.employeeId} />
                            <ReviewRow label="License" value={form.licenseCategory} />
                        </div>
                        <div style={reviewSectionStyle}>
                            <div style={sectionHeaderStyle}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: C.primary, letterSpacing: 2, textTransform: "uppercase" }}>Aircraft & Location</span>
                            </div>
                            <ReviewRow label="Date" value={form.date} />
                            <ReviewRow label="Location" value={form.location} />
                            <ReviewRow label="Aircraft" value={form.aircraftType} />
                            <ReviewRow label="Registration" value={form.aircraftReg} />
                            <ReviewRow label="Privilege" value={form.privilege} />
                        </div>
                        <div style={reviewSectionStyle}>
                            <div style={sectionHeaderStyle}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: C.primary, letterSpacing: 2, textTransform: "uppercase" }}>Task Details</span>
                            </div>
                            <ReviewRow label="ATA Chapter" value={form.ataChapter} />
                            <ReviewRow label="Maintenance" value={form.maintenanceType} />
                            <ReviewRow label="Task Types" value={form.taskTypes} />
                            <ReviewRow label="Activity" value={form.activityType} />
                        </div>
                        <div style={reviewSectionStyle}>
                            <div style={sectionHeaderStyle}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: C.primary, letterSpacing: 2, textTransform: "uppercase" }}>References</span>
                            </div>
                            <ReviewRow label="Reference" value={form.maintenanceRef} />
                            <ReviewRow label="Files" value={files.length > 0 ? `${files.length} file(s) attached` : ""} />
                            <ReviewRow label="Duration" value={form.duration ? `${form.duration} hrs` : ""} />
                            <ReviewRow label="Stamp No." value={form.stampNo} />
                        </div>
                    </>
                );
            default: return null;
        }
    };

    // ─── Success Screen ────────────────────────────
    if (submitted) {
        return (
            <div style={{
                position: "fixed", inset: 0, zIndex: 9999,
                background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)",
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                <div style={{
                    textAlign: "center", animation: "modalFadeUp 0.6s ease",
                    background: C.surface, borderRadius: 20,
                    padding: "48px 40px", border: `1px solid ${C.border}`,
                    maxWidth: 420, width: "90%",
                    boxShadow: "0 24px 60px rgba(0,0,0,0.15)",
                }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: "50%", margin: "0 auto 24px",
                        background: `linear-gradient(135deg, ${C.green}, #15803d)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: `0 0 40px ${C.green}40`,
                    }}>
                        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <h2 style={{ color: C.text, fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Record Submitted</h2>
                    <p style={{ color: C.muted, fontSize: 14, marginBottom: 28 }}>Your maintenance experience has been logged successfully.</p>
                    <button onClick={onClose} style={{
                        padding: "12px 32px", borderRadius: 10, border: `2px solid ${C.border}`,
                        background: "transparent", color: C.muted, cursor: "pointer",
                        fontSize: 14, fontWeight: 700,
                    }}>Close</button>
                </div>
                <style>{`@keyframes modalFadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }`}</style>
            </div>
        );
    }

    // ─── Modal Overlay ─────────────────────────────
    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
        }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div style={{
                width: "90%", maxWidth: 760, maxHeight: "90vh",
                background: C.bg, borderRadius: 20,
                border: `1px solid ${C.border}`,
                display: "flex", flexDirection: "column", overflow: "hidden",
                boxShadow: "0 24px 80px rgba(0,0,0,0.15)",
                animation: "modalFadeUp 0.35s ease",
            }}>
                {/* ─── Top Bar ────────────────────────────── */}
                <div style={{
                    background: `linear-gradient(135deg, hsl(206, 92%, 35%), ${C.primary})`,
                    padding: "14px 24px", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: "rgba(255,255,255,0.2)",
                            display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" /></svg>
                        </div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: "#ffffff" }}>Maintenance Logbook Form</div>
                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{entry.type} · {entry.date}</div>
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>Step {step}/{STEPS.length}</span>
                        <button onClick={onClose} style={{
                            width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(255,255,255,0.3)",
                            background: "rgba(255,255,255,0.15)", color: "#ffffff", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                            fontFamily: "inherit", transition: "all 0.15s",
                        }}>×</button>
                    </div>
                </div>

                {/* ─── Stepper ────────────────────────────── */}
                <div style={{ padding: "20px 24px 0", flexShrink: 0, background: C.surface }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 16 }}>
                        {STEPS.map((s, i) => (
                            <div key={s.id} style={{ display: "flex", alignItems: "center" }}>
                                <div onClick={() => goToStep(s.id)} style={{
                                    display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                                    cursor: "pointer", position: "relative", minWidth: 56,
                                }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 9,
                                        background: step === s.id ? `linear-gradient(135deg, ${C.primary}, ${C.primary2})`
                                            : step > s.id ? C.greenL : C.primary6,
                                        border: step === s.id ? "none" : step > s.id ? `2px solid ${C.green}40` : `2px solid ${C.border}`,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        color: step === s.id ? "#ffffff" : step > s.id ? C.green : C.mutedL,
                                        fontWeight: 800, transition: "all 0.3s",
                                        boxShadow: step === s.id ? `0 0 16px ${C.primary}40` : "none",
                                    }}>
                                        {step > s.id
                                            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                            : stepIcons[s.id]}
                                    </div>
                                    <span style={{
                                        fontSize: 9.5, fontWeight: 700, letterSpacing: 0.8,
                                        color: step === s.id ? C.primary : step > s.id ? C.green : C.mutedL,
                                        textTransform: "uppercase", transition: "all 0.3s",
                                    }}>{s.short}</span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div style={{
                                        width: 32, height: 2, margin: "0 3px", marginBottom: 18,
                                        background: step > s.id + 1 ? C.green : step > s.id ? `linear-gradient(90deg, ${C.green}, ${C.border})` : C.border,
                                        borderRadius: 1, transition: "all 0.3s",
                                    }} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Progress Bar */}
                    <div style={{ height: 3, background: C.border, borderRadius: 2, marginBottom: 0, overflow: "hidden" }}>
                        <div style={{
                            height: "100%", borderRadius: 2,
                            background: `linear-gradient(90deg, ${C.primary}, ${C.primary3})`,
                            width: `${(step / STEPS.length) * 100}%`,
                            transition: "width 0.4s ease",
                        }} />
                    </div>
                </div>

                {/* ─── Step Content ─────────────────────── */}
                <div style={{ flex: 1, overflowY: "auto", padding: "24px", background: C.bg }}>
                    <div style={{
                        background: C.surface, borderRadius: 14,
                        border: `1px solid ${C.border}`,
                        padding: "28px 24px",
                    }}>
                        {renderStep()}
                    </div>
                </div>

                {/* ─── Navigation ───────────────────────── */}
                <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "16px 24px", borderTop: `1px solid ${C.border}`,
                    background: C.surface, flexShrink: 0,
                }}>
                    {step > 1 ? (
                        <button onClick={goPrev} style={{
                            padding: "11px 24px", borderRadius: 10,
                            border: `2px solid ${C.border}`, background: "transparent",
                            color: C.muted, cursor: "pointer", fontSize: 13,
                            fontWeight: 700,
                            display: "flex", alignItems: "center", gap: 8,
                        }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><polyline points="12 19 5 12 12 5" /></svg>
                            Back
                        </button>
                    ) : <div />}

                    {step < 5 ? (
                        <button onClick={goNext} style={{
                            padding: "11px 28px", borderRadius: 10, border: "none",
                            background: `linear-gradient(135deg, ${C.primary}, ${C.primary2})`,
                            color: "#fff", cursor: "pointer", fontSize: 13,
                            fontWeight: 800,
                            display: "flex", alignItems: "center", gap: 8,
                            boxShadow: `0 4px 16px ${C.primary}40`,
                            letterSpacing: 0.5,
                        }}>
                            Continue
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><polyline points="12 5 19 12 12 19" /></svg>
                        </button>
                    ) : (
                        <button onClick={handleSubmit} style={{
                            padding: "11px 32px", borderRadius: 10, border: "none",
                            background: `linear-gradient(135deg, ${C.green}, #15803d)`,
                            color: "#fff", cursor: "pointer", fontSize: 13,
                            fontWeight: 800,
                            display: "flex", alignItems: "center", gap: 8,
                            boxShadow: `0 4px 16px ${C.green}40`,
                            letterSpacing: 0.5,
                        }}>
                            Submit Record
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        </button>
                    )}
                </div>
            </div>

            <style>{`@keyframes modalFadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }`}</style>
        </div>
    );
}
