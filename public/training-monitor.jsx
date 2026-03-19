import { useState, useMemo } from "react";

const TODAY = new Date("2026-03-19");

// ── Course definitions ─────────────────────────────────────────────────────
const MANDATORY = [
  { id: "hf",   short: "HF",    label: "Human Factors",         interval: 24 },
  { id: "sms",  short: "SMS",   label: "Safety Mgmt System",    interval: 24 },
  { id: "dga",  short: "DGA",   label: "Dangerous Goods",       interval: 24 },
  { id: "cp",   short: "CP",    label: "Company Policy / MOE",  interval: 24 },
  { id: "fts",  short: "FTS",   label: "Fuel Tank Safety",      interval: 24 },
  { id: "ewis", short: "EWIS",  label: "EWIS",                  interval: 24 },
  { id: "rvsm", short: "RVSM",  label: "Spec Ops RVSM",         interval: 12 },
  { id: "edto", short: "EDTO",  label: "Spec Ops EDTO",         interval: 24 },
];
const TYPE_COURSES = [
  { id: "tb737cfm",  short: "B737",  label: "B737 CFM56",  interval: 24 },
  { id: "tb737leap", short: "B737M", label: "B737 LEAP",   interval: 24 },
  { id: "ta320",     short: "A320",  label: "A320 fam",    interval: 24 },
  { id: "tb777",     short: "B777",  label: "B777",        interval: 24 },
  { id: "ta330",     short: "A330",  label: "A330",        interval: 24 },
  { id: "tb787",     short: "B787",  label: "B787",        interval: 24 },
];
const ALL_COURSES = [...MANDATORY, ...TYPE_COURSES];

// ── Helpers ────────────────────────────────────────────────────────────────
function status(dueStr) {
  if (!dueStr || dueStr === "-") return "missing";
  if (dueStr === "na") return "na";
  const due = new Date(dueStr);
  const diff = Math.floor((due - TODAY) / 86400000);
  if (diff < 0) return "expired";
  if (diff <= 90) return "warning";
  return "valid";
}
function daysLeft(dueStr) {
  if (!dueStr || dueStr === "-" || dueStr === "na") return null;
  const due = new Date(dueStr);
  return Math.floor((due - TODAY) / 86400000);
}
function fmtDate(dueStr) {
  if (!dueStr || dueStr === "-" || dueStr === "na") return null;
  const d = new Date(dueStr);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Real employee data (from SAMS-FM-CM-072 Current sheet, as of 19 Mar 2026)
// Each course value is the computed due date string, '-' for N/A-not-applicable,
// or 'na' for explicitly marked N/A in source
const EMPLOYEES = [
  { no:1,  id:"0012", name:"Mr. Sanmanas Ruangsri",          pos:"Certifying Staff",            posGroup:"CS",
    courses:{ hf:"2028-02-08",sms:"2028-01-05",dga:"2027-01-08",cp:"2026-06-03",fts:"2028-02-02",ewis:"2027-01-16",rvsm:"2027-02-15",edto:"2027-02-19", tb737cfm:"2027-05-04",tb737leap:"2027-05-04",ta320:"-",tb777:"-",ta330:"-",tb787:"-" }},
  { no:2,  id:"0013", name:"Mr. Pissanu Arunbutr",           pos:"Certifying Staff",            posGroup:"CS",
    courses:{ hf:"2028-02-08",sms:"2028-01-05",dga:"2027-01-08",cp:"2028-02-11",fts:"2027-05-22",ewis:"2027-05-13",rvsm:"2027-02-15",edto:"2027-02-19", tb737cfm:"2027-05-04",tb737leap:"2027-05-04",ta320:"-",tb777:"-",ta330:"-",tb787:"-" }},
  { no:3,  id:"0020", name:"Mr. Phaisal Sangasang",          pos:"Certifying Staff (A320)",     posGroup:"CS",
    courses:{ hf:"2027-05-14",sms:"2028-01-05",dga:"2027-01-08",cp:"2027-01-05",fts:"2028-02-02",ewis:"2027-05-13",rvsm:"2027-02-15",edto:"2027-02-19", tb737cfm:"2027-05-04",tb737leap:"-",ta320:"2027-05-03",tb777:"-",ta330:"-",tb787:"-" }},
  { no:4,  id:"0022", name:"Mr. Chalong Siri",               pos:"Certifying Staff (A320)",     posGroup:"CS",
    courses:{ hf:"2027-05-14",sms:"2028-01-05",dga:"2027-01-08",cp:"2027-01-05",fts:"2027-06-11",ewis:"2027-03-27",rvsm:"2027-02-15",edto:"2028-01-09", tb737cfm:"-",tb737leap:"-",ta320:"2026-11-17",tb777:"2027-06-03",ta330:"-",tb787:"-" }},
  { no:5,  id:"0028", name:"Mr. Papoj Imudom",               pos:"Certifying Staff (B737 NG/MAX)",posGroup:"CS",
    courses:{ hf:"2027-05-14",sms:"2028-01-05",dga:"2027-01-08",cp:"2027-06-12",fts:"2028-02-02",ewis:"2027-01-16",rvsm:"2027-02-15",edto:"2028-01-09", tb737cfm:"2027-05-04",tb737leap:"2027-05-04",ta320:"-",tb777:"-",ta330:"-",tb787:"-" }},
  { no:6,  id:"0032", name:"Mr. Puchong Suwannit",           pos:"Aircraft Mechanic",           posGroup:"AM",
    courses:{ hf:"2028-02-08",sms:"2028-01-05",dga:"2028-02-04",cp:"2028-02-11",fts:"2028-02-02",ewis:"2028-02-09",rvsm:"2027-02-15",edto:"2028-01-09", tb737cfm:"-",tb737leap:"-",ta320:"-",tb777:"-",ta330:"-",tb787:"-" }},
  { no:7,  id:"0036", name:"Ms. Orrachorn Itipi",            pos:"Compliance Monitoring Mgr",   posGroup:"QA",
    courses:{ hf:"2028-02-08",sms:"2028-01-05",dga:"2026-07-07",cp:"2028-02-11",fts:"2026-04-05",ewis:"2028-02-09",rvsm:"2027-02-15",edto:"2028-01-09", tb737cfm:"-",tb737leap:"-",ta320:"-",tb777:"-",ta330:"-",tb787:"-" }},
  { no:8,  id:"0039", name:"Mr. Nont Bhekasuta",             pos:"Aircraft Mechanic",           posGroup:"AM",
    courses:{ hf:"2026-04-10",sms:"2028-01-05",dga:"2028-02-04",cp:"2028-02-11",fts:"2028-02-02",ewis:"2028-02-09",rvsm:"2027-02-15",edto:"2027-02-19", tb737cfm:"-",tb737leap:"-",ta320:"-",tb777:"-",ta330:"-",tb787:"-" }},
  { no:9,  id:"0040", name:"Mr. Shiravut Butmart",           pos:"Aircraft Mechanic",           posGroup:"AM",
    courses:{ hf:"2028-02-08",sms:"2028-01-05",dga:"2028-02-04",cp:"2028-02-11",fts:"2028-02-02",ewis:"2026-04-18",rvsm:"2027-02-15",edto:"2027-02-19", tb737cfm:"-",tb737leap:"-",ta320:"-",tb777:"-",ta330:"-",tb787:"-" }},
  { no:10, id:"0041", name:"Mr. Prakarn Sribudh",            pos:"Certifying Staff (B737 CFM)", posGroup:"CS",
    courses:{ hf:"2028-02-08",sms:"2028-01-05",dga:"2028-02-04",cp:"2028-02-11",fts:"2028-02-02",ewis:"2028-02-09",rvsm:"2027-02-15",edto:"2027-02-19", tb737cfm:"2027-05-04",tb737leap:"-",ta320:"-",tb777:"-",ta330:"-",tb787:"-" }},
  { no:11, id:"0042", name:"Mr. Nuttawee Buaboon",           pos:"Aircraft Mechanic",           posGroup:"AM",
    courses:{ hf:"2028-02-08",sms:"2028-01-05",dga:"2028-02-04",cp:"2028-02-11",fts:"2028-02-02",ewis:"2028-02-09",rvsm:"2027-02-15",edto:"2027-02-19", tb737cfm:"-",tb737leap:"-",ta320:"-",tb777:"-",ta330:"-",tb787:"-" }},
  { no:12, id:"0044", name:"Mr. Pichai Kumprakorn",          pos:"Safety Management Manager",   posGroup:"MGR",
    courses:{ hf:"2026-06-06",sms:"2028-01-05",dga:"2026-07-07",cp:"2026-05-15",fts:"2026-06-16",ewis:"2026-06-18",rvsm:"2025-06-24",edto:"2028-01-09", tb737cfm:"-",tb737leap:"-",ta320:"-",tb777:"-",ta330:"-",tb787:"-" }},
  { no:13, id:"0047", name:"Mr. Trairattana Klinkaewboonvong",pos:"Certifying Staff",           posGroup:"CS",
    courses:{ hf:"2026-06-06",sms:"2026-06-13",dga:"2026-07-07",cp:"2026-06-03",fts:"2026-06-16",ewis:"2026-06-18",rvsm:"2026-03-31",edto:"2028-01-09", tb737cfm:"2027-05-04",tb737leap:"2027-05-04",ta320:"-",tb777:"-",ta330:"-",tb787:"-" }},
  { no:14, id:"0049", name:"Mr. Thawansak Bharmmano",        pos:"Certifying Staff (A320/B787)", posGroup:"CS",
    courses:{ hf:"2026-06-06",sms:"2026-06-13",dga:"2026-07-07",cp:"2026-06-03",fts:"2026-06-16",ewis:"2026-06-18",rvsm:"2026-03-31",edto:"2028-01-09", tb737cfm:"-",tb737leap:"-",ta320:"2028-02-19",tb777:"-",ta330:"-",tb787:"2027-02-25" }},
  { no:15, id:"0051", name:"Mr. Sirawit Saetang",            pos:"Aircraft Mechanic",           posGroup:"AM",
    courses:{ hf:"2026-06-06",sms:"2026-06-13",dga:"2026-07-07",cp:"2026-06-03",fts:"2026-06-16",ewis:"2026-06-18",rvsm:"2026-03-31",edto:"2028-01-09", tb737cfm:"-",tb737leap:"-",ta320:"-",tb777:"-",ta330:"-",tb787:"-" }},
  { no:16, id:"0052", name:"Mr. Pongsak Wongrak",            pos:"Certifying Staff (A320)",     posGroup:"CS",
    courses:{ hf:"2026-06-06",sms:"2026-06-13",dga:"2026-07-07",cp:"2026-06-03",fts:"2026-06-16",ewis:"2026-06-18",rvsm:"2026-03-31",edto:"2028-01-09", tb737cfm:"-",tb737leap:"-",ta320:"2027-06-19",tb777:"-",ta330:"-",tb787:"-" }},
  { no:17, id:"0053", name:"Mr. Chinnapat Nhurod",           pos:"Certifying Staff",            posGroup:"CS",
    courses:{ hf:"2026-06-06",sms:"2026-06-13",dga:"2026-07-07",cp:"2026-06-03",fts:"2026-06-16",ewis:"2026-06-18",rvsm:"2026-03-31",edto:"2028-01-09", tb737cfm:"2027-05-04",tb737leap:"2027-05-04",ta320:"-",tb777:"-",ta330:"-",tb787:"2027-02-25" }},
  { no:18, id:"0055", name:"Mr. Korkiat Fungsuk",            pos:"Certifying Staff",            posGroup:"CS",
    courses:{ hf:"2026-07-05",sms:"2026-06-13",dga:"2026-07-07",cp:"2026-06-25",fts:"2026-06-16",ewis:"2026-06-18",rvsm:"2026-03-31",edto:"2028-01-09", tb737cfm:"2027-05-04",tb737leap:"-",ta320:"-",tb777:"-",ta330:"-",tb787:"-" }},
  { no:19, id:"0056", name:"Mr. Paitoon Udompuech",          pos:"Certifying Staff (A320)",     posGroup:"CS",
    courses:{ hf:"2026-07-05",sms:"2026-07-04",dga:"2026-07-12",cp:"2026-06-25",fts:"2027-01-15",ewis:"2027-01-16",rvsm:"2026-05-07",edto:"2027-05-08", tb737cfm:"-",tb737leap:"-",ta320:"2027-06-19",tb777:"-",ta330:"-",tb787:"-" }},
  { no:20, id:"0057", name:"Mr. Montree Chacharoen",         pos:"Accountable Manager",         posGroup:"MGR",
    courses:{ hf:"2026-09-09",sms:"2026-09-08",dga:"2026-10-08",cp:"2026-09-05",fts:"2026-10-11",ewis:"2026-10-13",rvsm:"2026-05-07",edto:"2026-09-24", tb737cfm:"-",tb737leap:"-",ta320:"-",tb777:"-",ta330:"-",tb787:"-" }},
  { no:21, id:"0059", name:"Mr. Pathompong Bualuang",        pos:"Certifying Staff (B737NG)",   posGroup:"CS",
    courses:{ hf:"2026-10-06",sms:"2026-10-07",dga:"2026-10-08",cp:"2026-10-03",fts:"2026-10-11",ewis:"2026-10-13",rvsm:"2026-03-31",edto:"2026-09-24", tb737cfm:"2027-05-04",tb737leap:"2027-05-04",ta320:"-",tb777:"-",ta330:"-",tb787:"-" }},
  { no:22, id:"0060", name:"Mr. Jiroj Jirathan",             pos:"Certifying Staff (B737NG)",   posGroup:"CS",
    courses:{ hf:"2026-10-06",sms:"2026-10-07",dga:"2026-10-08",cp:"2026-10-03",fts:"2026-10-11",ewis:"2026-10-13",rvsm:"2026-03-31",edto:"2026-09-24", tb737cfm:"2027-05-04",tb737leap:"-",ta320:"-",tb777:"-",ta330:"-",tb787:"-" }},
  { no:23, id:"0061", name:"Mr. Santisucha Bunaram",         pos:"Aircraft Mechanic",           posGroup:"AM",
    courses:{ hf:"2026-10-06",sms:"2026-10-07",dga:"2026-10-08",cp:"2026-10-03",fts:"2026-10-11",ewis:"2026-10-13",rvsm:"2026-03-31",edto:"2026-09-24", tb737cfm:"-",tb737leap:"-",ta320:"-",tb777:"-",ta330:"-",tb787:"-" }},
  { no:24, id:"0063", name:"Mr. Veerapong Chivasakulchai",   pos:"Certifying Staff (A320/B777/A330)",posGroup:"CS",
    courses:{ hf:"2026-10-06",sms:"2026-10-07",dga:"2026-10-08",cp:"2026-10-03",fts:"2026-10-11",ewis:"2026-10-13",rvsm:"2026-03-31",edto:"2026-09-24", tb737cfm:"-",tb737leap:"-",ta320:"2027-05-03",tb777:"2027-06-03",ta330:"2027-06-12",tb787:"-" }},
  { no:25, id:"0064", name:"Mr. Wasan Preechamaj",           pos:"Certifying Staff (A320/B777)", posGroup:"CS",
    courses:{ hf:"2026-10-06",sms:"2026-10-07",dga:"2026-10-08",cp:"2026-10-03",fts:"2026-10-11",ewis:"2026-10-13",rvsm:"2026-03-31",edto:"2026-09-24", tb737cfm:"-",tb737leap:"-",ta320:"2027-05-03",tb777:"2027-06-03",ta330:"-",tb787:"-" }},
];

// ── Status cell component ──────────────────────────────────────────────────
const STATUS_META = {
  valid:   { bg:"#dcfce7", dot:"#16a34a", text:"#15803d", label:"Valid"    },
  warning: { bg:"#fef3c7", dot:"#d97706", text:"#92400e", label:"Warning"  },
  expired: { bg:"#fee2e2", dot:"#dc2626", text:"#991b1b", label:"Expired"  },
  missing: { bg:"#f1f5f9", dot:"#94a3b8", text:"#64748b", label:"—"        },
  na:      { bg:"#f8fafc", dot:"#cbd5e1", text:"#94a3b8", label:"N/A"      },
};

function StatusCell({ due, onClick }) {
  const s = status(due);
  const m = STATUS_META[s];
  const d = daysLeft(due);
  return (
    <td
      onClick={onClick}
      style={{
        padding: "6px 4px", textAlign: "center", cursor: "pointer",
        backgroundColor: m.bg, borderRight: "1px solid #e2e8f0",
        transition: "opacity .15s",
        minWidth: 38,
      }}
      title={due && due !== "-" && due !== "na" ? fmtDate(due) : s === "na" ? "N/A" : "No data"}
    >
      <div style={{
        width: 10, height: 10, borderRadius: "50%",
        background: m.dot, margin: "0 auto",
        boxShadow: s === "expired" ? `0 0 0 3px ${m.dot}33` :
                   s === "warning" ? `0 0 0 2px ${m.dot}44` : "none",
      }} />
      {s === "warning" && d !== null && (
        <div style={{ fontSize: 9, color: m.text, fontWeight: 700, marginTop: 1, lineHeight: 1 }}>{d}d</div>
      )}
      {s === "expired" && d !== null && (
        <div style={{ fontSize: 9, color: m.text, fontWeight: 700, marginTop: 1, lineHeight: 1 }}>EXP</div>
      )}
    </td>
  );
}

// ── Main dashboard ─────────────────────────────────────────────────────────
export default function TrainingMonitor() {
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [tab, setTab] = useState("mandatory");
  const [selected, setSelected] = useState(null);

  const courses = tab === "mandatory" ? MANDATORY : TYPE_COURSES;

  // Aggregate stats
  const stats = useMemo(() => {
    let expired = 0, warning = 0, valid = 0, missing = 0;
    EMPLOYEES.forEach(emp => {
      ALL_COURSES.forEach(c => {
        const s = status(emp.courses[c.id]);
        if (s === "expired") expired++;
        else if (s === "warning") warning++;
        else if (s === "valid") valid++;
        else if (s === "missing") missing++;
      });
    });
    return { expired, warning, valid, missing, total: EMPLOYEES.length };
  }, []);

  // Critical alerts (expiring within 30 days or expired)
  const alerts = useMemo(() => {
    const list = [];
    EMPLOYEES.forEach(emp => {
      ALL_COURSES.forEach(c => {
        const d = daysLeft(emp.courses[c.id]);
        const s = status(emp.courses[c.id]);
        if (s === "expired" || (s === "warning" && d !== null && d <= 30)) {
          list.push({ emp, course: c, daysLeft: d, status: s });
        }
      });
    });
    return list.sort((a, b) => (a.daysLeft ?? -999) - (b.daysLeft ?? -999));
  }, []);

  const filtered = useMemo(() => {
    return EMPLOYEES.filter(emp => {
      const nameMatch = emp.name.toLowerCase().includes(search.toLowerCase()) ||
                        emp.id.includes(search);
      const posMatch = posFilter === "All" ||
        (posFilter === "CS" && emp.posGroup === "CS") ||
        (posFilter === "AM" && emp.posGroup === "AM") ||
        (posFilter === "MGR/QA" && (emp.posGroup === "MGR" || emp.posGroup === "QA"));
      const statusMatch = statusFilter === "All" || courses.some(c => {
        const s = status(emp.courses[c.id]);
        return (statusFilter === "expired" && s === "expired") ||
               (statusFilter === "warning" && s === "warning") ||
               (statusFilter === "valid"   && s === "valid");
      });
      return nameMatch && posMatch && statusMatch;
    });
  }, [search, posFilter, statusFilter, courses]);

  const selEmp = selected ? EMPLOYEES.find(e => e.id === selected) : null;

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: "#f0f4f8", minHeight: "100vh" }}>
      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1a56db 100%)",
        padding: "16px 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", boxShadow: "0 2px 12px rgba(0,0,0,.3)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "6px 10px",
            fontSize: 11, fontWeight: 800, color: "#fff", letterSpacing: "0.05em",
            border: "1px solid rgba(255,255,255,.2)"
          }}>SAMS</div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
              Training Record Monitoring
            </div>
            <div style={{ color: "#93c5fd", fontSize: 11, fontWeight: 500 }}>
              SAMS-FM-CM-072 · Rev.01 · As of 19 Mar 2026
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { label: "Staff", val: stats.total, color: "#fff" },
            { label: "Expired", val: stats.expired, color: "#fca5a5" },
            { label: "Warning", val: stats.warning, color: "#fcd34d" },
            { label: "Valid",   val: stats.valid,   color: "#86efac" },
          ].map(k => (
            <div key={k.label} style={{
              background: "rgba(255,255,255,.1)", borderRadius: 8, padding: "6px 12px",
              textAlign: "center", border: "1px solid rgba(255,255,255,.15)"
            }}>
              <div style={{ color: k.color, fontWeight: 800, fontSize: 18, lineHeight: 1 }}>{k.val}</div>
              <div style={{ color: "rgba(255,255,255,.6)", fontSize: 10, fontWeight: 600, marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 24px", maxWidth: 1400, margin: "0 auto" }}>

        {/* ── Alerts ── */}
        {alerts.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>
              ⚠ Critical Alerts ({alerts.length})
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {alerts.map((a, i) => {
                const isExp = a.status === "expired";
                return (
                  <div key={i} onClick={() => setSelected(a.emp.id)} style={{
                    background: isExp ? "#fee2e2" : "#fef3c7",
                    border: `1px solid ${isExp ? "#fca5a5" : "#fcd34d"}`,
                    borderRadius: 8, padding: "5px 10px", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6, fontSize: 11
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: isExp ? "#dc2626" : "#d97706", flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, color: "#1e293b" }}>{a.emp.name.split(" ")[1]}</span>
                    <span style={{ color: "#64748b" }}>·</span>
                    <span style={{ color: isExp ? "#dc2626" : "#92400e", fontWeight: 600 }}>{a.course.short}</span>
                    <span style={{ color: isExp ? "#dc2626" : "#d97706", fontSize: 10 }}>
                      {isExp ? "EXPIRED" : `${a.daysLeft}d`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Filters ── */}
        <div style={{
          background: "#fff", borderRadius: 12, padding: "12px 16px",
          display: "flex", alignItems: "center", gap: 12, marginBottom: 12,
          boxShadow: "0 1px 4px rgba(0,0,0,.06)", flexWrap: "wrap"
        }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name or ID…"
            style={{
              border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 12px",
              fontSize: 13, outline: "none", width: 200, color: "#1e293b",
              background: "#f8fafc"
            }}
          />
          <div style={{ display: "flex", gap: 4 }}>
            {["All","CS","AM","MGR/QA"].map(p => (
              <button key={p} onClick={() => setPosFilter(p)} style={{
                border: "1px solid #e2e8f0", borderRadius: 6, padding: "5px 10px",
                fontSize: 11, fontWeight: 600, cursor: "pointer",
                background: posFilter === p ? "#1a56db" : "#f8fafc",
                color: posFilter === p ? "#fff" : "#475569",
              }}>
                {p === "All" ? "All Positions" : p === "CS" ? "Certifying Staff" : p === "AM" ? "Aircraft Mechanic" : "Manager/QA"}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
            {["All","expired","warning","valid"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{
                border: `1px solid ${s==="expired"?"#fca5a5":s==="warning"?"#fcd34d":s==="valid"?"#86efac":"#e2e8f0"}`,
                borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer",
                background: statusFilter === s ? (s==="expired"?"#fee2e2":s==="warning"?"#fef3c7":s==="valid"?"#dcfce7":"#1a56db") : "#f8fafc",
                color: statusFilter === s ? (s==="All"?"#fff":s==="expired"?"#991b1b":s==="warning"?"#92400e":"#15803d") : "#475569",
              }}>
                {s === "All" ? "All Status" : s.charAt(0).toUpperCase()+s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab row ── */}
        <div style={{ display: "flex", gap: 2, marginBottom: 0 }}>
          {[
            { key: "mandatory", label: `Mandatory (${MANDATORY.length})` },
            { key: "type",      label: `Type Courses (${TYPE_COURSES.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: "8px 18px", borderRadius: "8px 8px 0 0",
              border: "1px solid #e2e8f0", borderBottom: tab === t.key ? "1px solid #fff" : "1px solid #e2e8f0",
              background: tab === t.key ? "#fff" : "#e9eef5",
              fontWeight: 700, fontSize: 12, color: tab === t.key ? "#1a56db" : "#475569",
              cursor: "pointer", position: "relative", zIndex: tab === t.key ? 2 : 1,
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── Matrix table ── */}
        <div style={{
          background: "#fff", borderRadius: "0 12px 12px 12px",
          boxShadow: "0 2px 12px rgba(0,0,0,.06)", overflow: "hidden",
          border: "1px solid #e2e8f0", position: "relative", zIndex: 1
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left", color: "#475569", fontWeight: 700, whiteSpace: "nowrap", minWidth: 40 }}>#</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", color: "#475569", fontWeight: 700, whiteSpace: "nowrap", minWidth: 180 }}>Staff</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", color: "#475569", fontWeight: 700, whiteSpace: "nowrap", minWidth: 80 }}>ID</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", color: "#475569", fontWeight: 700, whiteSpace: "nowrap", minWidth: 160 }}>Position</th>
                  {courses.map(c => (
                    <th key={c.id} style={{
                      padding: "8px 4px", textAlign: "center", color: "#475569",
                      fontWeight: 700, minWidth: 42,
                      borderLeft: "1px solid #e2e8f0",
                    }}>
                      <div style={{ fontSize: 10, lineHeight: 1.3 }}>{c.short}</div>
                      <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 500 }}>{c.interval}m</div>
                    </th>
                  ))}
                  <th style={{ padding: "8px 12px", textAlign: "center", color: "#475569", fontWeight: 700, minWidth: 80, borderLeft: "2px solid #e2e8f0" }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp, ri) => {
                  const statuses = courses.map(c => status(emp.courses[c.id]));
                  const applicable = statuses.filter(s => s !== "na" && s !== "missing");
                  const validCount = applicable.filter(s => s === "valid").length;
                  const score = applicable.length > 0 ? Math.round(validCount / applicable.length * 100) : null;
                  const hasIssue = statuses.some(s => s === "expired" || s === "warning");

                  return (
                    <tr key={emp.id}
                      onClick={() => setSelected(selected === emp.id ? null : emp.id)}
                      style={{
                        background: selected === emp.id ? "#eff6ff" :
                                    hasIssue ? (ri % 2 === 0 ? "#fffbeb" : "#fff9f0") :
                                    ri % 2 === 0 ? "#fff" : "#fafbfc",
                        borderBottom: "1px solid #f1f5f9",
                        cursor: "pointer", transition: "background .1s",
                      }}
                    >
                      <td style={{ padding: "7px 12px", color: "#94a3b8", fontWeight: 600 }}>{emp.no}</td>
                      <td style={{ padding: "7px 12px", fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap" }}>
                        {emp.name}
                      </td>
                      <td style={{ padding: "7px 12px", color: "#1a56db", fontWeight: 700, fontFamily: "monospace", fontSize: 11 }}>
                        {emp.id}
                      </td>
                      <td style={{ padding: "7px 12px", color: "#475569", whiteSpace: "nowrap", fontSize: 11 }}>
                        {emp.pos}
                      </td>
                      {courses.map(c => (
                        <StatusCell key={c.id} due={emp.courses[c.id]}
                          onClick={e => { e.stopPropagation(); setSelected(emp.id); }} />
                      ))}
                      <td style={{ padding: "7px 12px", textAlign: "center", borderLeft: "2px solid #e2e8f0" }}>
                        {score !== null ? (
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: score === 100 ? "#16a34a" : score >= 70 ? "#d97706" : "#dc2626" }}>
                              {score}%
                            </div>
                            <div style={{ height: 3, background: "#f1f5f9", borderRadius: 2, marginTop: 2, width: 48, margin: "2px auto 0" }}>
                              <div style={{ height: "100%", borderRadius: 2, width: `${score}%`,
                                background: score === 100 ? "#16a34a" : score >= 70 ? "#f59e0b" : "#dc2626" }} />
                            </div>
                          </div>
                        ) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Detail panel ── */}
          {selEmp && (
            <div style={{
              borderTop: "2px solid #1a56db", background: "#eff6ff", padding: "16px 20px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#1e293b" }}>{selEmp.name}</div>
                  <div style={{ color: "#1a56db", fontSize: 12, fontWeight: 600 }}>
                    ID: {selEmp.id} · {selEmp.pos}
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{
                  border: "none", background: "none", cursor: "pointer",
                  color: "#94a3b8", fontSize: 18, fontWeight: 700
                }}>✕</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 6 }}>
                {ALL_COURSES.map(c => {
                  const due = selEmp.courses[c.id];
                  const s = status(due);
                  const m = STATUS_META[s];
                  const d = daysLeft(due);
                  return (
                    <div key={c.id} style={{
                      background: m.bg, border: `1px solid ${m.dot}44`,
                      borderRadius: 8, padding: "7px 10px"
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 2 }}>{c.label}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: m.dot, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: m.text }}>
                          {s === "na" ? "N/A" :
                           s === "missing" ? "No data" :
                           s === "expired" ? `Expired` : fmtDate(due)}
                        </span>
                      </div>
                      {d !== null && s !== "valid" && s !== "na" && s !== "missing" && (
                        <div style={{ fontSize: 10, color: m.text, fontWeight: 600, marginTop: 1 }}>
                          {d < 0 ? `${Math.abs(d)} days ago` : `${d} days left`}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Legend ── */}
        <div style={{ display: "flex", gap: 16, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
          {Object.entries(STATUS_META).map(([k, m]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#64748b" }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: m.dot, flexShrink: 0 }} />
              {k === "valid" ? "Valid (>90 days)" : k === "warning" ? "Warning (≤90 days)" :
               k === "expired" ? "Expired" : k === "na" ? "N/A" : "No data"}
            </div>
          ))}
          <div style={{ marginLeft: "auto", color: "#94a3b8", fontSize: 10 }}>
            Showing {filtered.length} of {EMPLOYEES.length} staff · Click row to expand
          </div>
        </div>
      </div>
    </div>
  );
}
