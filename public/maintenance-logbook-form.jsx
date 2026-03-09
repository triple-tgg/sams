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

// ─── Reusable Components ─────────────────────────────
function SectionHeader({ number, title, icon }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "18px 24px", marginBottom: 20, marginTop: 8,
      background: "linear-gradient(135deg, #0f2a44 0%, #1a3a5c 100%)",
      borderRadius: 10, position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: -20, right: -20, width: 80, height: 80,
        borderRadius: "50%", background: "rgba(255,255,255,0.04)",
      }} />
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: "linear-gradient(135deg, #f59e0b, #d97706)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 800, fontSize: 15, color: "#0f2a44", flexShrink: 0,
      }}>{number}</div>
      <span style={{ fontSize: 13, letterSpacing: 2.5, fontWeight: 700, color: "#f1f5f9", textTransform: "uppercase" }}>
        {icon && <span style={{ marginRight: 8, fontSize: 15 }}>{icon}</span>}
        {title}
      </span>
    </div>
  );
}

function FieldLabel({ label, required, number }) {
  return (
    <label style={{
      display: "flex", alignItems: "center", gap: 8,
      fontSize: 12.5, fontWeight: 600, color: "#64748b",
      letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 7,
    }}>
      {number && (
        <span style={{
          width: 22, height: 22, borderRadius: 5,
          background: "#e2e8f0", display: "inline-flex",
          alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, color: "#475569",
        }}>{number}</span>
      )}
      {label}
      {required && <span style={{ color: "#ef4444", fontSize: 14, marginLeft: 2 }}>*</span>}
    </label>
  );
}

function TextInput({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", padding: "12px 16px", borderRadius: 8,
        border: "1.5px solid #e2e8f0", background: "#f8fafc",
        fontSize: 14.5, color: "#1e293b", outline: "none",
        transition: "all 0.2s", boxSizing: "border-box",
        fontFamily: "'DM Sans', sans-serif",
      }}
      onFocus={e => { e.target.style.borderColor = "#3b82f6"; e.target.style.background = "#fff"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; }}
      onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; e.target.style.boxShadow = "none"; }}
    />
  );
}

function SelectInput({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: "100%", padding: "12px 16px", borderRadius: 8,
        border: "1.5px solid #e2e8f0", background: "#f8fafc",
        fontSize: 14.5, color: value ? "#1e293b" : "#94a3b8",
        outline: "none", cursor: "pointer", boxSizing: "border-box",
        fontFamily: "'DM Sans', sans-serif", appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center",
      }}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function RadioGroup({ options, value, onChange, columns = 1 }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: 8,
    }}>
      {options.map(opt => (
        <div
          key={opt}
          onClick={() => onChange(opt)}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 14px", borderRadius: 8, cursor: "pointer",
            border: `1.5px solid ${value === opt ? "#3b82f6" : "#e2e8f0"}`,
            background: value === opt ? "rgba(59,130,246,0.06)" : "#fafbfc",
            transition: "all 0.15s",
          }}
        >
          <div style={{
            width: 18, height: 18, borderRadius: "50%",
            border: `2px solid ${value === opt ? "#3b82f6" : "#cbd5e1"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s", flexShrink: 0,
          }}>
            {value === opt && (
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#3b82f6" }} />
            )}
          </div>
          <span style={{ fontSize: 13.5, color: "#334155", fontWeight: value === opt ? 600 : 400 }}>{opt}</span>
        </div>
      ))}
    </div>
  );
}

function CheckboxGroup({ options, values, onChange, columns = 1 }) {
  const toggle = (opt) => {
    onChange(values.includes(opt) ? values.filter(v => v !== opt) : [...values, opt]);
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 8 }}>
      {options.map(opt => {
        const checked = values.includes(opt);
        return (
          <div
            key={opt}
            onClick={() => toggle(opt)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px", borderRadius: 8, cursor: "pointer",
              border: `1.5px solid ${checked ? "#3b82f6" : "#e2e8f0"}`,
              background: checked ? "rgba(59,130,246,0.06)" : "#fafbfc",
              transition: "all 0.15s",
            }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: 5,
              border: `2px solid ${checked ? "#3b82f6" : "#cbd5e1"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: checked ? "#3b82f6" : "transparent",
              transition: "all 0.15s", flexShrink: 0,
            }}>
              {checked && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <span style={{ fontSize: 13.5, color: "#334155", fontWeight: checked ? 600 : 400 }}>{opt}</span>
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
        <div
          key={loc}
          onClick={() => onChange(loc)}
          style={{
            padding: "10px 20px", borderRadius: 8, cursor: "pointer",
            border: `1.5px solid ${value === loc ? "#3b82f6" : "#e2e8f0"}`,
            background: value === loc
              ? "linear-gradient(135deg, #3b82f6, #2563eb)"
              : "#fafbfc",
            color: value === loc ? "#fff" : "#475569",
            fontWeight: 700, fontSize: 13, letterSpacing: 1,
            transition: "all 0.15s", userSelect: "none",
          }}
        >{loc}</div>
      ))}
    </div>
  );
}

// ─── Main Form ───────────────────────────────────────
export default function MaintenanceLogbookForm() {
  const [form, setForm] = useState({
    name: "", employeeId: "", licenseCategory: "",
    date: "", location: "", aircraftType: "", aircraftReg: "",
    privilege: "", ataChapter: "", maintenanceType: "",
    taskTypes: [], activityType: "", maintenanceRef: "",
    duration: "", stampNo: "",
  });
  const [files, setFiles] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const fileRef = useRef(null);

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  const fieldGroup = { marginBottom: 22 };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles].slice(0, 8));
  };

  const removeFile = (idx) => setFiles(f => f.filter((_, i) => i !== idx));

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  if (submitted) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(160deg, #0c1929 0%, #132f4c 50%, #0f2a44 100%)",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ textAlign: "center", animation: "fadeUp 0.6s ease" }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%", margin: "0 auto 24px",
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 style={{ color: "#f1f5f9", fontSize: 26, fontWeight: 700, marginBottom: 10 }}>Record Submitted</h2>
          <p style={{ color: "#94a3b8", fontSize: 15 }}>Your maintenance experience has been logged successfully.</p>
        </div>
        <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #eef2f7 0%, #e2e8f0 100%)",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0c1929 0%, #1a3a5c 60%, #234e7a 100%)",
        padding: "36px 24px 32px", position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -60, right: -60, width: 200, height: 200,
          borderRadius: "50%", background: "rgba(245,158,11,0.08)",
        }} />
        <div style={{
          position: "absolute", bottom: -40, left: -40, width: 140, height: 140,
          borderRadius: "50%", background: "rgba(59,130,246,0.06)",
        }} />
        <div style={{ maxWidth: 680, margin: "0 auto", position: "relative" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(245,158,11,0.15)", padding: "6px 14px",
            borderRadius: 6, marginBottom: 16,
          }}>
            <span style={{ fontSize: 14 }}>✈</span>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 2,
              color: "#f59e0b", textTransform: "uppercase",
            }}>SAMS</span>
          </div>
          <h1 style={{
            fontSize: 28, fontWeight: 800, color: "#f1f5f9",
            lineHeight: 1.2, margin: "0 0 8px",
          }}>
            Maintenance Experiences<br />Logbook Record
          </h1>
          <p style={{
            fontSize: 13.5, color: "#94a3b8", margin: 0, lineHeight: 1.5,
          }}>
            Southeast Asia Aircraft Maintenance Services Co., Ltd.
          </p>
        </div>
      </div>

      {/* Form Body */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px 20px 60px" }}>

        {/* SECTION 1: General Information */}
        <SectionHeader number="I" title="General Information" icon="👤" />
        <div style={{
          background: "#fff", borderRadius: 12, padding: "24px 24px 8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)",
          marginBottom: 28, border: "1px solid #eef1f5",
        }}>
          <div style={fieldGroup}>
            <FieldLabel label="Name – Surname" required number="1" />
            <TextInput value={form.name} onChange={set("name")} placeholder="Enter full name" />
          </div>
          <div style={fieldGroup}>
            <FieldLabel label="Employee ID" required number="2" />
            <TextInput value={form.employeeId} onChange={set("employeeId")} placeholder="Enter employee ID" />
          </div>
          <div style={fieldGroup}>
            <FieldLabel label="License Category" required number="3" />
            <RadioGroup options={LICENSE_CATEGORIES} value={form.licenseCategory} onChange={set("licenseCategory")} />
          </div>
        </div>

        {/* SECTION 2: Experiences Record */}
        <SectionHeader number="II" title="Experiences Record" icon="🔧" />
        <div style={{
          background: "#fff", borderRadius: 12, padding: "24px 24px 8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)",
          marginBottom: 28, border: "1px solid #eef1f5",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 22 }}>
            <div>
              <FieldLabel label="Date to Perform Task" required number="4" />
              <input
                type="date"
                value={form.date}
                onChange={e => set("date")(e.target.value)}
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: 8,
                  border: "1.5px solid #e2e8f0", background: "#f8fafc",
                  fontSize: 14.5, color: "#1e293b", outline: "none",
                  boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif",
                }}
              />
            </div>
            <div>
              <FieldLabel label="Location" required number="5" />
              <LocationChips options={LOCATIONS} value={form.location} onChange={set("location")} />
            </div>
          </div>

          <div style={fieldGroup}>
            <FieldLabel label="Aircraft Type" required number="6" />
            <SelectInput
              value={form.aircraftType}
              onChange={set("aircraftType")}
              options={AIRCRAFT_TYPES}
              placeholder="Select aircraft type"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 22 }}>
            <div>
              <FieldLabel label="Aircraft Registration" required number="7" />
              <TextInput value={form.aircraftReg} onChange={set("aircraftReg")} placeholder="e.g. HS-XXX" />
            </div>
            <div>
              <FieldLabel label="Privilege Used" required number="8" />
              <RadioGroup options={PRIVILEGES} value={form.privilege} onChange={set("privilege")} columns={3} />
            </div>
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
        </div>

        {/* SECTION 3: References & Completion */}
        <SectionHeader number="III" title="References & Completion" icon="📋" />
        <div style={{
          background: "#fff", borderRadius: 12, padding: "24px 24px 8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)",
          marginBottom: 28, border: "1px solid #eef1f5",
        }}>
          <div style={fieldGroup}>
            <FieldLabel label="Maintenance References" required number="13" />
            <TextInput value={form.maintenanceRef} onChange={set("maintenanceRef")} placeholder="Technical Logbook No. or WO No." />
          </div>

          <div style={fieldGroup}>
            <FieldLabel label="File Attachment" required number="14" />
            <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 10px", lineHeight: 1.5 }}>
              Please name file by Technical Logbook No. or WO No. — Max 8 files (Word, Excel, PPT, PDF, Image, Video, Audio)
            </p>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: "2px dashed #cbd5e1", borderRadius: 10,
                padding: "28px 20px", textAlign: "center", cursor: "pointer",
                background: "#fafbfc", transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.background = "rgba(59,130,246,0.03)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.background = "#fafbfc"; }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>📎</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#3b82f6" }}>Click to upload files</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{files.length}/8 files attached</div>
            </div>
            <input ref={fileRef} type="file" multiple onChange={handleFileChange} style={{ display: "none" }} />
            {files.length > 0 && (
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                {files.map((f, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "8px 12px", background: "#f1f5f9", borderRadius: 7, fontSize: 13,
                  }}>
                    <span style={{ color: "#334155", fontWeight: 500 }}>{f.name}</span>
                    <span onClick={() => removeFile(i)} style={{ color: "#ef4444", cursor: "pointer", fontWeight: 700, fontSize: 16 }}>×</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 22 }}>
            <div>
              <FieldLabel label="Performed Duration (hrs)" required number="15" />
              <TextInput value={form.duration} onChange={set("duration")} placeholder="e.g. 2.5" />
            </div>
            <div>
              <FieldLabel label="Authorized Stamp No." required number="16" />
              <TextInput value={form.stampNo} onChange={set("stampNo")} placeholder="Enter stamp number" />
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          style={{
            width: "100%", padding: "16px 32px", borderRadius: 10,
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            color: "#0f2a44", border: "none", cursor: "pointer",
            fontSize: 15, fontWeight: 800, letterSpacing: 1.5,
            textTransform: "uppercase",
            boxShadow: "0 4px 14px rgba(245,158,11,0.35)",
            transition: "all 0.2s",
            fontFamily: "'DM Sans', sans-serif",
          }}
          onMouseEnter={e => { e.target.style.transform = "translateY(-1px)"; e.target.style.boxShadow = "0 6px 20px rgba(245,158,11,0.45)"; }}
          onMouseLeave={e => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 4px 14px rgba(245,158,11,0.35)"; }}
        >
          Submit Record
        </button>

        <p style={{ textAlign: "center", fontSize: 11.5, color: "#94a3b8", marginTop: 20, lineHeight: 1.6 }}>
          Southeast Asia Aircraft Maintenance Services Co., Ltd. (SAMS)<br />
          Maintenance Experiences Logbook Record — All fields marked with * are required.
        </p>
      </div>
    </div>
  );
}
