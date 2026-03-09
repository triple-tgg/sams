import { useState, useRef } from "react";

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

const LICENSE_CATEGORIES = [
  "A1 AIRCRAFT CERTIFYING STAFF",
  "AIRCRAFT MECHANIC",
  "AIRCRAFT INSPECTOR",
];

const PRIVILEGES = ["B1/B2", "B1", "B2"];

const MAINTENANCE_TYPES = [
  "Transit check",
  "Schedule maintenance up to A-Check",
  "Daily check",
  "Weekly check",
  "Engine change",
  "APU change",
  "Engine Borescope",
];

const TASK_TYPES = [
  "Releasing aircraft to service (CRS)",
  "Servicing (SGH)",
  "Check / Visual Inspection (INSP)",
  "Operational and functional testing (FOT)",
  "Trouble shooting (TS)",
  "Minor repair (REP)",
  "Removal/Installation of components (R/I)",
  "Supervising these activities",
  "Defect rectification",
  "Borescope Inspection",
  "Training",
  "Other",
];

const ACTIVITY_TYPES = ["CRS", "Perform", "Supervise", "Training"];

const STEPS = [
  { id: 1, title: "General Info", icon: "👤", short: "Identity" },
  { id: 2, title: "Aircraft & Task", icon: "✈", short: "Aircraft" },
  { id: 3, title: "Task Details", icon: "🔧", short: "Details" },
  { id: 4, title: "References", icon: "📋", short: "Refs" },
  { id: 5, title: "Review", icon: "✓", short: "Review" },
];

// ─── Reusable Components ─────────────────────────────
function FieldLabel({ label, required, number }) {
  return (
    <label style={{
      display: "flex", alignItems: "center", gap: 8,
      fontSize: 12, fontWeight: 700, color: "#8597ad",
      letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8,
    }}>
      {number && (
        <span style={{
          width: 22, height: 22, borderRadius: 6,
          background: "rgba(59,130,246,0.1)", display: "inline-flex",
          alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 800, color: "#3b82f6",
        }}>{number}</span>
      )}
      {label}
      {required && <span style={{ color: "#f43f5e", fontSize: 15, marginLeft: 1 }}>*</span>}
    </label>
  );
}

function TextInput({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", padding: "13px 16px", borderRadius: 10,
        border: "2px solid #1e3a5f", background: "rgba(15,42,68,0.4)",
        fontSize: 14.5, color: "#e2e8f0", outline: "none",
        transition: "all 0.2s", boxSizing: "border-box",
        fontFamily: "'DM Sans', sans-serif",
      }}
      onFocus={e => { e.target.style.borderColor = "#f59e0b"; e.target.style.boxShadow = "0 0 0 3px rgba(245,158,11,0.15)"; }}
      onBlur={e => { e.target.style.borderColor = "#1e3a5f"; e.target.style.boxShadow = "none"; }}
    />
  );
}

function SelectInput({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: "100%", padding: "13px 16px", borderRadius: 10,
        border: "2px solid #1e3a5f", background: "rgba(15,42,68,0.6)",
        fontSize: 14.5, color: value ? "#e2e8f0" : "#5a7a9a",
        outline: "none", cursor: "pointer", boxSizing: "border-box",
        fontFamily: "'DM Sans', sans-serif", appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235a7a9a' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center",
      }}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map(o => <option key={o} value={o} style={{ background: "#0f2a44", color: "#e2e8f0" }}>{o}</option>)}
    </select>
  );
}

function RadioGroup({ options, value, onChange, columns = 1 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 8 }}>
      {options.map(opt => (
        <div
          key={opt}
          onClick={() => onChange(opt)}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "11px 14px", borderRadius: 9, cursor: "pointer",
            border: `2px solid ${value === opt ? "#f59e0b" : "#1e3a5f"}`,
            background: value === opt ? "rgba(245,158,11,0.1)" : "rgba(15,42,68,0.3)",
            transition: "all 0.15s",
          }}
        >
          <div style={{
            width: 18, height: 18, borderRadius: "50%",
            border: `2px solid ${value === opt ? "#f59e0b" : "#3a5a7a"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, transition: "all 0.15s",
          }}>
            {value === opt && <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#f59e0b" }} />}
          </div>
          <span style={{ fontSize: 13, color: value === opt ? "#fbbf24" : "#94a3b8", fontWeight: value === opt ? 600 : 400 }}>{opt}</span>
        </div>
      ))}
    </div>
  );
}

function CheckboxGroup({ options, values, onChange, columns = 1 }) {
  const toggle = (opt) => onChange(values.includes(opt) ? values.filter(v => v !== opt) : [...values, opt]);
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 8 }}>
      {options.map(opt => {
        const checked = values.includes(opt);
        return (
          <div key={opt} onClick={() => toggle(opt)} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "11px 14px", borderRadius: 9, cursor: "pointer",
            border: `2px solid ${checked ? "#f59e0b" : "#1e3a5f"}`,
            background: checked ? "rgba(245,158,11,0.1)" : "rgba(15,42,68,0.3)",
            transition: "all 0.15s",
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: 5,
              border: `2px solid ${checked ? "#f59e0b" : "#3a5a7a"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: checked ? "#f59e0b" : "transparent",
              flexShrink: 0, transition: "all 0.15s",
            }}>
              {checked && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0f2a44" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
            </div>
            <span style={{ fontSize: 13, color: checked ? "#fbbf24" : "#94a3b8", fontWeight: checked ? 600 : 400 }}>{opt}</span>
          </div>
        );
      })}
    </div>
  );
}

function LocationChips({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map(loc => (
        <div key={loc} onClick={() => onChange(loc)} style={{
          padding: "11px 22px", borderRadius: 9, cursor: "pointer",
          border: `2px solid ${value === loc ? "#f59e0b" : "#1e3a5f"}`,
          background: value === loc ? "linear-gradient(135deg, #f59e0b, #d97706)" : "rgba(15,42,68,0.3)",
          color: value === loc ? "#0f2a44" : "#7a9ab8",
          fontWeight: 700, fontSize: 13, letterSpacing: 1.2,
          transition: "all 0.15s", userSelect: "none",
        }}>{loc}</div>
      ))}
    </div>
  );
}

function ReviewRow({ label, value }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  const display = Array.isArray(value) ? value.join(", ") : value;
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      padding: "12px 0", borderBottom: "1px solid rgba(30,58,95,0.5)", gap: 16,
    }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: "#5a7a9a", letterSpacing: 1, textTransform: "uppercase", flexShrink: 0, minWidth: 120 }}>{label}</span>
      <span style={{ fontSize: 14, color: "#e2e8f0", fontWeight: 500, textAlign: "right", wordBreak: "break-word" }}>{display}</span>
    </div>
  );
}

// ─── Main Form ───────────────────────────────────────
export default function MaintenanceLogbookForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", employeeId: "", licenseCategory: "",
    date: "", location: "", aircraftType: "", aircraftReg: "",
    privilege: "", ataChapter: "", maintenanceType: "",
    taskTypes: [], activityType: "", maintenanceRef: "",
    duration: "", stampNo: "",
  });
  const [files, setFiles] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [direction, setDirection] = useState(1);
  const fileRef = useRef(null);

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));
  const fieldGroup = { marginBottom: 24 };

  const goNext = () => { setDirection(1); setStep(s => Math.min(s + 1, 5)); };
  const goPrev = () => { setDirection(-1); setStep(s => Math.max(s - 1, 1)); };
  const goToStep = (s) => { setDirection(s > step ? 1 : -1); setStep(s); };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles].slice(0, 8));
  };
  const removeFile = (idx) => setFiles(f => f.filter((_, i) => i !== idx));

  const handleSubmit = () => {
    setSubmitted(true);
  };

  // ─── Success Screen ────────────────────────────
  if (submitted) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(160deg, #060e18 0%, #0f2a44 50%, #0a1f35 100%)",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <div style={{ textAlign: "center", animation: "fadeUp 0.6s ease" }}>
          <div style={{
            width: 88, height: 88, borderRadius: "50%", margin: "0 auto 28px",
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 40px rgba(34,197,94,0.3)",
          }}>
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <h2 style={{ color: "#f1f5f9", fontSize: 28, fontWeight: 800, marginBottom: 10 }}>Record Submitted</h2>
          <p style={{ color: "#64748b", fontSize: 15, marginBottom: 32 }}>Your maintenance experience has been logged successfully.</p>
          <button onClick={() => { setSubmitted(false); setStep(1); setForm({ name: "", employeeId: "", licenseCategory: "", date: "", location: "", aircraftType: "", aircraftReg: "", privilege: "", ataChapter: "", maintenanceType: "", taskTypes: [], activityType: "", maintenanceRef: "", duration: "", stampNo: "" }); setFiles([]); }}
            style={{
              padding: "14px 36px", borderRadius: 10, border: "2px solid #1e3a5f",
              background: "transparent", color: "#94a3b8", cursor: "pointer",
              fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.2s",
            }}
          >Submit Another Record</button>
        </div>
        <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }`}</style>
      </div>
    );
  }

  // ─── Step Content ──────────────────────────────
  const renderStep = () => {
    const wrap = (children) => (
      <div key={step} style={{ animation: `slideIn 0.35s ease` }}>
        {children}
        <style>{`
          @keyframes slideIn {
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
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", margin: "0 0 6px" }}>General Information</h2>
              <p style={{ fontSize: 14, color: "#5a7a9a", margin: 0 }}>Enter your personal and license details</p>
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
              <RadioGroup options={LICENSE_CATEGORIES} value={form.licenseCategory} onChange={set("licenseCategory")} />
            </div>
          </>
        );

      case 2:
        return wrap(
          <>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", margin: "0 0 6px" }}>Aircraft & Location</h2>
              <p style={{ fontSize: 14, color: "#5a7a9a", margin: 0 }}>Specify where and which aircraft</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              <div>
                <FieldLabel label="Date to Perform Task" required number="4" />
                <input type="date" value={form.date} onChange={e => set("date")(e.target.value)}
                  style={{
                    width: "100%", padding: "13px 16px", borderRadius: 10,
                    border: "2px solid #1e3a5f", background: "rgba(15,42,68,0.4)",
                    fontSize: 14.5, color: "#e2e8f0", outline: "none",
                    boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif",
                    colorScheme: "dark",
                  }}
                />
              </div>
              <div>
                <FieldLabel label="Privilege Used" required number="8" />
                <RadioGroup options={PRIVILEGES} value={form.privilege} onChange={set("privilege")} columns={3} />
              </div>
            </div>
            <div style={fieldGroup}>
              <FieldLabel label="Location" required number="5" />
              <LocationChips options={LOCATIONS} value={form.location} onChange={set("location")} />
            </div>
            <div style={fieldGroup}>
              <FieldLabel label="Aircraft Type" required number="6" />
              <SelectInput value={form.aircraftType} onChange={set("aircraftType")} options={AIRCRAFT_TYPES} placeholder="Select aircraft type" />
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
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", margin: "0 0 6px" }}>Task Details</h2>
              <p style={{ fontSize: 14, color: "#5a7a9a", margin: 0 }}>Define the maintenance work performed</p>
            </div>
            <div style={fieldGroup}>
              <FieldLabel label="ATA Chapter" required number="9" />
              <TextInput value={form.ataChapter} onChange={set("ataChapter")} placeholder="Enter ATA chapter" />
            </div>
            <div style={fieldGroup}>
              <FieldLabel label="Type of Maintenance (Rating)" required number="10" />
              <RadioGroup options={MAINTENANCE_TYPES} value={form.maintenanceType} onChange={set("maintenanceType")} columns={2} />
            </div>
            <div style={fieldGroup}>
              <FieldLabel label="Type of Task" required number="11" />
              <CheckboxGroup options={TASK_TYPES} values={form.taskTypes} onChange={set("taskTypes")} columns={2} />
            </div>
            <div style={fieldGroup}>
              <FieldLabel label="Type of Activity" required number="12" />
              <RadioGroup options={ACTIVITY_TYPES} value={form.activityType} onChange={set("activityType")} columns={4} />
            </div>
          </>
        );

      case 4:
        return wrap(
          <>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", margin: "0 0 6px" }}>References & Completion</h2>
              <p style={{ fontSize: 14, color: "#5a7a9a", margin: 0 }}>Attach documents and finalize</p>
            </div>
            <div style={fieldGroup}>
              <FieldLabel label="Maintenance References" required number="13" />
              <TextInput value={form.maintenanceRef} onChange={set("maintenanceRef")} placeholder="Technical Logbook No. or WO No." />
            </div>
            <div style={fieldGroup}>
              <FieldLabel label="File Attachment" required number="14" />
              <p style={{ fontSize: 12, color: "#4a6a8a", margin: "0 0 10px", lineHeight: 1.5 }}>
                Name files by Technical Logbook No. or WO No. — Max 8 files
              </p>
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  border: "2px dashed #1e3a5f", borderRadius: 12,
                  padding: "30px 20px", textAlign: "center", cursor: "pointer",
                  background: "rgba(15,42,68,0.2)", transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#f59e0b"; e.currentTarget.style.background = "rgba(245,158,11,0.05)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e3a5f"; e.currentTarget.style.background = "rgba(15,42,68,0.2)"; }}
              >
                <div style={{ fontSize: 30, marginBottom: 8 }}>📎</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b" }}>Click to upload files</div>
                <div style={{ fontSize: 12, color: "#4a6a8a", marginTop: 4 }}>{files.length}/8 files attached</div>
              </div>
              <input ref={fileRef} type="file" multiple onChange={handleFileChange} style={{ display: "none" }} />
              {files.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                  {files.map((f, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "9px 14px", background: "rgba(15,42,68,0.4)", borderRadius: 8,
                      border: "1px solid #1e3a5f", fontSize: 13,
                    }}>
                      <span style={{ color: "#94a3b8", fontWeight: 500 }}>{f.name}</span>
                      <span onClick={() => removeFile(i)} style={{ color: "#f43f5e", cursor: "pointer", fontWeight: 700, fontSize: 17 }}>×</span>
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
        return wrap(
          <>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", margin: "0 0 6px" }}>Review & Submit</h2>
              <p style={{ fontSize: 14, color: "#5a7a9a", margin: 0 }}>Please verify all information before submitting</p>
            </div>
            <div style={{
              background: "rgba(15,42,68,0.35)", borderRadius: 12,
              border: "1px solid #1e3a5f", padding: "4px 20px", marginBottom: 16,
            }}>
              <div style={{ padding: "10px 0", borderBottom: "1px solid rgba(30,58,95,0.7)", marginBottom: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#f59e0b", letterSpacing: 2, textTransform: "uppercase" }}>General Information</span>
              </div>
              <ReviewRow label="Name" value={form.name} />
              <ReviewRow label="Employee ID" value={form.employeeId} />
              <ReviewRow label="License" value={form.licenseCategory} />
            </div>
            <div style={{
              background: "rgba(15,42,68,0.35)", borderRadius: 12,
              border: "1px solid #1e3a5f", padding: "4px 20px", marginBottom: 16,
            }}>
              <div style={{ padding: "10px 0", borderBottom: "1px solid rgba(30,58,95,0.7)", marginBottom: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#f59e0b", letterSpacing: 2, textTransform: "uppercase" }}>Aircraft & Location</span>
              </div>
              <ReviewRow label="Date" value={form.date} />
              <ReviewRow label="Location" value={form.location} />
              <ReviewRow label="Aircraft" value={form.aircraftType} />
              <ReviewRow label="Registration" value={form.aircraftReg} />
              <ReviewRow label="Privilege" value={form.privilege} />
            </div>
            <div style={{
              background: "rgba(15,42,68,0.35)", borderRadius: 12,
              border: "1px solid #1e3a5f", padding: "4px 20px", marginBottom: 16,
            }}>
              <div style={{ padding: "10px 0", borderBottom: "1px solid rgba(30,58,95,0.7)", marginBottom: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#f59e0b", letterSpacing: 2, textTransform: "uppercase" }}>Task Details</span>
              </div>
              <ReviewRow label="ATA Chapter" value={form.ataChapter} />
              <ReviewRow label="Maintenance" value={form.maintenanceType} />
              <ReviewRow label="Task Types" value={form.taskTypes} />
              <ReviewRow label="Activity" value={form.activityType} />
            </div>
            <div style={{
              background: "rgba(15,42,68,0.35)", borderRadius: 12,
              border: "1px solid #1e3a5f", padding: "4px 20px", marginBottom: 8,
            }}>
              <div style={{ padding: "10px 0", borderBottom: "1px solid rgba(30,58,95,0.7)", marginBottom: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#f59e0b", letterSpacing: 2, textTransform: "uppercase" }}>References</span>
              </div>
              <ReviewRow label="Reference" value={form.maintenanceRef} />
              <ReviewRow label="Files" value={files.length > 0 ? `${files.length} file(s) attached` : ""} />
              <ReviewRow label="Duration" value={form.duration ? `${form.duration} hrs` : ""} />
              <ReviewRow label="Stamp No." value={form.stampNo} />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #060e18 0%, #0d2137 40%, #0a1c30 100%)",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* ─── Top Bar ────────────────────────────── */}
      <div style={{
        background: "rgba(10,28,48,0.85)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(30,58,95,0.5)",
        padding: "16px 24px", position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16,
            }}>✈</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#f1f5f9", letterSpacing: 0.5 }}>SAMS</div>
              <div style={{ fontSize: 10.5, color: "#4a6a8a", fontWeight: 600, letterSpacing: 0.5 }}>Maintenance Logbook</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#4a6a8a", fontWeight: 600 }}>
            Step {step} of {STEPS.length}
          </div>
        </div>
      </div>

      {/* ─── Stepper ────────────────────────────── */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 24px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 36 }}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center" }}>
              <div
                onClick={() => goToStep(s.id)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  cursor: "pointer", position: "relative", minWidth: 64,
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: step === s.id
                    ? "linear-gradient(135deg, #f59e0b, #d97706)"
                    : step > s.id
                      ? "rgba(34,197,94,0.2)"
                      : "rgba(15,42,68,0.5)",
                  border: step === s.id
                    ? "none"
                    : step > s.id
                      ? "2px solid rgba(34,197,94,0.4)"
                      : "2px solid #1e3a5f",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: step > s.id ? 16 : 15,
                  color: step === s.id ? "#0f2a44" : step > s.id ? "#22c55e" : "#3a5a7a",
                  fontWeight: 800, transition: "all 0.3s",
                  boxShadow: step === s.id ? "0 0 20px rgba(245,158,11,0.3)" : "none",
                }}>
                  {step > s.id ? "✓" : s.icon}
                </div>
                <span style={{
                  fontSize: 10.5, fontWeight: 700, letterSpacing: 0.8,
                  color: step === s.id ? "#f59e0b" : step > s.id ? "#22c55e" : "#3a5a7a",
                  textTransform: "uppercase", transition: "all 0.3s",
                }}>{s.short}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  width: 40, height: 2, margin: "0 4px",
                  marginBottom: 20,
                  background: step > s.id + 1
                    ? "#22c55e"
                    : step > s.id
                      ? "linear-gradient(90deg, #22c55e, #1e3a5f)"
                      : "#1e3a5f",
                  borderRadius: 1, transition: "all 0.3s",
                }} />
              )}
            </div>
          ))}
        </div>

        {/* ─── Progress Bar ─────────────────────── */}
        <div style={{
          height: 3, background: "rgba(30,58,95,0.5)", borderRadius: 2,
          marginBottom: 32, overflow: "hidden",
        }}>
          <div style={{
            height: "100%", borderRadius: 2,
            background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
            width: `${(step / STEPS.length) * 100}%`,
            transition: "width 0.4s ease",
          }} />
        </div>

        {/* ─── Step Content ─────────────────────── */}
        <div style={{
          background: "rgba(12,25,40,0.6)", borderRadius: 16,
          border: "1px solid rgba(30,58,95,0.5)",
          padding: "32px 28px", marginBottom: 24,
          backdropFilter: "blur(8px)",
          minHeight: 320,
        }}>
          {renderStep()}
        </div>

        {/* ─── Navigation ───────────────────────── */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          paddingBottom: 48,
        }}>
          {step > 1 ? (
            <button onClick={goPrev} style={{
              padding: "13px 28px", borderRadius: 10,
              border: "2px solid #1e3a5f", background: "transparent",
              color: "#94a3b8", cursor: "pointer", fontSize: 14,
              fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
              display: "flex", alignItems: "center", gap: 8,
              transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#3a5a7a"; e.currentTarget.style.color = "#e2e8f0"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e3a5f"; e.currentTarget.style.color = "#94a3b8"; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><polyline points="12 19 5 12 12 5" /></svg>
              Back
            </button>
          ) : <div />}

          {step < 5 ? (
            <button onClick={goNext} style={{
              padding: "13px 32px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              color: "#0f2a44", cursor: "pointer", fontSize: 14,
              fontWeight: 800, fontFamily: "'DM Sans', sans-serif",
              display: "flex", alignItems: "center", gap: 8,
              boxShadow: "0 4px 16px rgba(245,158,11,0.3)",
              transition: "all 0.2s", letterSpacing: 0.5,
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(245,158,11,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(245,158,11,0.3)"; }}
            >
              Continue
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><polyline points="12 5 19 12 12 19" /></svg>
            </button>
          ) : (
            <button onClick={handleSubmit} style={{
              padding: "13px 36px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "#fff", cursor: "pointer", fontSize: 14,
              fontWeight: 800, fontFamily: "'DM Sans', sans-serif",
              display: "flex", alignItems: "center", gap: 8,
              boxShadow: "0 4px 16px rgba(34,197,94,0.3)",
              transition: "all 0.2s", letterSpacing: 0.5,
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(34,197,94,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(34,197,94,0.3)"; }}
            >
              Submit Record
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
