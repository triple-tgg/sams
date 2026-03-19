import { useState, useMemo } from "react";

// ─── Data ───────────────────────────────────────────────────────────────────

const COURSES_REF = [
  { id: 1, code: "HF-001", name: "Human Factors in Aviation Maintenance", category: "Core", recurrent: true },
  { id: 2, code: "SMS-001", name: "Safety Management System", category: "Core", recurrent: true },
  { id: 3, code: "DG-001", name: "Dangerous Goods Awareness", category: "Core", recurrent: true },
  { id: 4, code: "CP-001", name: "Company Policy, Procedures (MOE & TPM)", category: "Core", recurrent: false },
  { id: 13, code: "AT-B737", name: "Aircraft Type: B737 & Relevant Technology", category: "Aircraft Type", recurrent: false },
  { id: 14, code: "AT-A320", name: "Aircraft Type: A318/319/320", category: "Aircraft Type", recurrent: false },
  { id: 15, code: "AT-B777", name: "Aircraft Type: B777", category: "Aircraft Type", recurrent: false },
  { id: 22, code: "SP-FTS1", name: "Fuel Tank Safety (Phase 1)", category: "Specialized", recurrent: true },
  { id: 24, code: "SP-EWIS", name: "Electrical Wiring Interconnection System", category: "Specialized", recurrent: true },
  { id: 25, code: "SP-RVSM", name: "Special Operations (RVSM, PBN/RNP, CAT II/III)", category: "Specialized", recurrent: true },
  { id: 26, code: "SP-ETOPS", name: "Special Operations (EDTO/ETOPS)", category: "Specialized", recurrent: true },
  { id: 31, code: "CM-AUDIT", name: "Internal Audit", category: "Compliance", recurrent: false },
  { id: 33, code: "CM-TTT", name: "Train the Trainer", category: "Compliance", recurrent: false },
];

const INSTRUCTORS = [
  { id: 1, name: "Capt. Somchai W.", dept: "Technical Services" },
  { id: 2, name: "Eng. Priya N.", dept: "Maintenance" },
  { id: 3, name: "Mr. Thanakorn L.", dept: "Compliance Monitoring" },
  { id: 4, name: "Ms. Siriporn K.", dept: "Safety Management" },
  { id: 5, name: "External Instructor", dept: "External" },
];

const VENUES = ["Training Room A", "Training Room B", "Hangar 1 – Classroom", "Hangar 2 – Classroom", "Online (MS Teams)", "External Facility"];

const DEPTS = ["All Departments", "Executive", "Maintenance", "Compliance Monitoring", "Safety Management", "Technical Services", "Store & Purchase"];

// Mock sessions – 2026 Mar–Jun
const INITIAL_SESSIONS = [
  {
    id: 1, courseId: 1, courseName: "Human Factors in Aviation Maintenance",
    courseCode: "HF-001", category: "Core",
    dateStart: "2026-03-10", dateEnd: "2026-03-10",
    timeStart: "09:00", timeEnd: "16:00",
    instructor: "Mr. Thanakorn L.", venue: "Training Room A",
    dept: "All Departments", maxParticipants: 30, enrolled: 24,
    status: "Completed", type: "Recurrent",
  },
  {
    id: 2, courseId: 2, courseName: "Safety Management System",
    courseCode: "SMS-001", category: "Core",
    dateStart: "2026-03-17", dateEnd: "2026-03-17",
    timeStart: "09:00", timeEnd: "16:00",
    instructor: "Ms. Siriporn K.", venue: "Training Room B",
    dept: "All Departments", maxParticipants: 25, enrolled: 20,
    status: "Completed", type: "Recurrent",
  },
  {
    id: 3, courseId: 13, courseName: "Aircraft Type: B737 & Relevant Technology",
    courseCode: "AT-B737", category: "Aircraft Type",
    dateStart: "2026-03-24", dateEnd: "2026-03-27",
    timeStart: "08:00", timeEnd: "17:00",
    instructor: "Capt. Somchai W.", venue: "Hangar 1 – Classroom",
    dept: "Maintenance", maxParticipants: 15, enrolled: 12,
    status: "Completed", type: "Initial",
  },
  {
    id: 4, courseId: 3, courseName: "Dangerous Goods Awareness",
    courseCode: "DG-001", category: "Core",
    dateStart: "2026-04-02", dateEnd: "2026-04-02",
    timeStart: "13:00", timeEnd: "17:00",
    instructor: "External Instructor", venue: "Online (MS Teams)",
    dept: "All Departments", maxParticipants: 50, enrolled: 38,
    status: "Scheduled", type: "Recurrent",
  },
  {
    id: 5, courseId: 22, courseName: "Fuel Tank Safety (Phase 1)",
    courseCode: "SP-FTS1", category: "Specialized",
    dateStart: "2026-04-08", dateEnd: "2026-04-09",
    timeStart: "08:00", timeEnd: "17:00",
    instructor: "Capt. Somchai W.", venue: "Hangar 2 – Classroom",
    dept: "Maintenance", maxParticipants: 12, enrolled: 8,
    status: "Scheduled", type: "Recurrent",
  },
  {
    id: 6, courseId: 24, courseName: "Electrical Wiring Interconnection System",
    courseCode: "SP-EWIS", category: "Specialized",
    dateStart: "2026-04-14", dateEnd: "2026-04-16",
    timeStart: "08:00", timeEnd: "17:00",
    instructor: "Eng. Priya N.", venue: "Hangar 1 – Classroom",
    dept: "Maintenance", maxParticipants: 15, enrolled: 15,
    status: "Full", type: "Recurrent",
  },
  {
    id: 7, courseId: 14, courseName: "Aircraft Type: A318/319/320",
    courseCode: "AT-A320", category: "Aircraft Type",
    dateStart: "2026-04-22", dateEnd: "2026-04-25",
    timeStart: "08:00", timeEnd: "17:00",
    instructor: "Capt. Somchai W.", venue: "Hangar 1 – Classroom",
    dept: "Maintenance", maxParticipants: 15, enrolled: 10,
    status: "Scheduled", type: "Initial",
  },
  {
    id: 8, courseId: 25, courseName: "Special Operations (RVSM, PBN/RNP, CAT II/III)",
    courseCode: "SP-RVSM", category: "Specialized",
    dateStart: "2026-05-06", dateEnd: "2026-05-07",
    timeStart: "09:00", timeEnd: "17:00",
    instructor: "External Instructor", venue: "External Facility",
    dept: "Maintenance", maxParticipants: 10, enrolled: 7,
    status: "Scheduled", type: "Recurrent",
  },
  {
    id: 9, courseId: 31, courseName: "Internal Audit",
    courseCode: "CM-AUDIT", category: "Compliance",
    dateStart: "2026-05-12", dateEnd: "2026-05-13",
    timeStart: "09:00", timeEnd: "17:00",
    instructor: "Mr. Thanakorn L.", venue: "Training Room A",
    dept: "Compliance Monitoring", maxParticipants: 8, enrolled: 5,
    status: "Scheduled", type: "Initial",
  },
  {
    id: 10, courseId: 26, courseName: "Special Operations (EDTO/ETOPS)",
    courseCode: "SP-ETOPS", category: "Specialized",
    dateStart: "2026-05-20", dateEnd: "2026-05-21",
    timeStart: "09:00", timeEnd: "17:00",
    instructor: "Capt. Somchai W.", venue: "Hangar 2 – Classroom",
    dept: "Maintenance", maxParticipants: 12, enrolled: 9,
    status: "Scheduled", type: "Recurrent",
  },
  {
    id: 11, courseId: 4, courseName: "Company Policy, Procedures (MOE & TPM)",
    courseCode: "CP-001", category: "Core",
    dateStart: "2026-06-03", dateEnd: "2026-06-03",
    timeStart: "09:00", timeEnd: "12:00",
    instructor: "Ms. Siriporn K.", venue: "Training Room B",
    dept: "All Departments", maxParticipants: 40, enrolled: 28,
    status: "Scheduled", type: "Initial",
  },
  {
    id: 12, courseId: 33, courseName: "Train the Trainer",
    courseCode: "CM-TTT", category: "Compliance",
    dateStart: "2026-06-15", dateEnd: "2026-06-17",
    timeStart: "09:00", timeEnd: "17:00",
    instructor: "External Instructor", venue: "External Facility",
    dept: "Technical Services", maxParticipants: 6, enrolled: 4,
    status: "Scheduled", type: "Initial",
  },
];

// ─── Constants ──────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  Scheduled: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500", label: "Scheduled" },
  Completed:  { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", label: "Completed" },
  Full:       { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-500",   label: "Full" },
  Cancelled:  { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     dot: "bg-red-400",     label: "Cancelled" },
  InProgress: { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200",  dot: "bg-purple-500",  label: "In Progress" },
};

const CAT_COLOR = {
  "Core":                   { bar: "#1a56db", light: "#eff6ff", text: "#1e40af" },
  "Aircraft Familiarization":{ bar: "#0ea5e9", light: "#f0f9ff", text: "#0369a1" },
  "Aircraft Type":          { bar: "#6366f1", light: "#eef2ff", text: "#3730a3" },
  "Specialized":            { bar: "#f59e0b", light: "#fffbeb", text: "#92400e" },
  "Compliance":             { bar: "#10b981", light: "#f0fdf4", text: "#065f46" },
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ─── Helpers ────────────────────────────────────────────────────────────────

function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function firstDayOfMonth(y, m) { return new Date(y, m, 1).getDay(); }
function toYMD(d) { return d.toISOString().slice(0, 10); }
function parseYMD(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
function formatDate(s) {
  const d = parseYMD(s);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function sessionDays(s) {
  const a = parseYMD(s.dateStart), b = parseYMD(s.dateEnd);
  return Math.round((b - a) / 86400000) + 1;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TrainingScheduler() {
  const today = new Date(2026, 2, 19); // March 19 2026
  const [view, setView] = useState("calendar"); // calendar | list | gantt
  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(2); // 0-indexed March
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDept, setFilterDept] = useState("All Departments");
  const [filterCat, setFilterCat] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedSession, setSelectedSession] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editSession, setEditSession] = useState(null);

  const BLANK_FORM = {
    courseId: "", courseName: "", courseCode: "", category: "Core",
    dateStart: "", dateEnd: "", timeStart: "09:00", timeEnd: "17:00",
    instructor: "", venue: "", dept: "All Departments",
    maxParticipants: 20, enrolled: 0, status: "Scheduled", type: "Initial",
  };
  const [form, setForm] = useState(BLANK_FORM);

  // Filtered sessions
  const filtered = useMemo(() => sessions.filter(s => {
    if (filterStatus !== "All" && s.status !== filterStatus) return false;
    if (filterDept !== "All Departments" && s.dept !== filterDept && s.dept !== "All Departments") return false;
    if (filterCat !== "All" && s.category !== filterCat) return false;
    if (search && !s.courseName.toLowerCase().includes(search.toLowerCase()) && !s.courseCode.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [sessions, filterStatus, filterDept, filterCat, search]);

  // Stats
  const stats = useMemo(() => ({
    total: sessions.length,
    scheduled: sessions.filter(s => s.status === "Scheduled").length,
    completed: sessions.filter(s => s.status === "Completed").length,
    full: sessions.filter(s => s.status === "Full").length,
    upcoming: sessions.filter(s => s.dateStart >= toYMD(today) && s.status === "Scheduled").length,
  }), [sessions]);

  // Calendar grid
  const calSessions = useMemo(() => {
    return sessions.filter(s => {
      const sm = parseInt(s.dateStart.slice(5, 7)) - 1;
      const sy = parseInt(s.dateStart.slice(0, 4));
      const em = parseInt(s.dateEnd.slice(5, 7)) - 1;
      const ey = parseInt(s.dateEnd.slice(0, 4));
      return (sy < calYear || (sy === calYear && sm <= calMonth)) &&
             (ey > calYear || (ey === calYear && em >= calMonth));
    });
  }, [sessions, calYear, calMonth]);

  function sessionsOnDay(day) {
    const ymd = `${calYear}-${String(calMonth + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return calSessions.filter(s => s.dateStart <= ymd && s.dateEnd >= ymd);
  }

  function openAdd() {
    setEditSession(null);
    setForm(BLANK_FORM);
    setShowForm(true);
  }
  function openEdit(s) {
    setEditSession(s);
    setForm({ ...s });
    setShowForm(true);
    setSelectedSession(null);
  }
  function handleSave() {
    if (!form.dateStart || !form.courseName) return;
    if (editSession) {
      setSessions(prev => prev.map(s => s.id === editSession.id ? { ...form, id: s.id } : s));
    } else {
      const newId = Math.max(...sessions.map(s => s.id)) + 1;
      setSessions(prev => [...prev, { ...form, id: newId }]);
    }
    setShowForm(false);
  }
  function handleDelete(id) {
    setSessions(prev => prev.filter(s => s.id !== id));
    setSelectedSession(null);
  }
  function handleCourseSelect(cid) {
    const c = COURSES_REF.find(x => x.id === parseInt(cid));
    if (c) setForm(f => ({ ...f, courseId: c.id, courseName: c.name, courseCode: c.code, category: c.category, type: c.recurrent ? "Recurrent" : "Initial" }));
    else setForm(f => ({ ...f, courseId: cid }));
  }

  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); };
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* ── Top Bar ── */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "#1a56db" }}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-slate-400 leading-none">SAMS</p>
              <p className="text-sm text-slate-800 leading-tight" style={{ fontWeight: 600 }}>Training Schedule</p>
            </div>
          </div>
          {/* View Switcher */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1 gap-0.5 ml-4">
            {[["calendar","Calendar"],["list","List"],["gantt","Timeline"]].map(([id, label]) => (
              <button key={id} onClick={() => setView(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all ${view === id ? "bg-white text-slate-800 shadow-sm font-500" : "text-slate-500 hover:text-slate-700"}`}
                style={{ fontWeight: view === id ? 500 : 400 }}>
                {id === "calendar" && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                {id === "list" && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>}
                {id === "gantt" && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                {label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm transition-all hover:opacity-90"
          style={{ background: "#1a56db", fontWeight: 500 }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Session
        </button>
      </header>

      {/* ── Stat Strip ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-3">
        <div className="flex items-center gap-6 overflow-x-auto">
          {[
            { label: "Total Sessions", val: stats.total, color: "#1a56db" },
            { label: "Scheduled", val: stats.scheduled, color: "#3b82f6" },
            { label: "Upcoming (30d)", val: stats.upcoming, color: "#8b5cf6" },
            { label: "Completed", val: stats.completed, color: "#10b981" },
            { label: "Full", val: stats.full, color: "#f59e0b" },
          ].map(({ label, val, color }) => (
            <div key={label} className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + "18" }}>
                <span className="text-sm font-600" style={{ color, fontWeight: 600 }}>{val}</span>
              </div>
              <span className="text-xs text-slate-500">{label}</span>
              <div className="w-px h-5 bg-slate-200 ml-3" />
            </div>
          ))}
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center gap-3 flex-wrap">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search course..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 w-44" />
        </div>

        {/* Status pills */}
        <div className="flex items-center gap-1 flex-wrap">
          {["All", "Scheduled", "Completed", "Full", "Cancelled"].map(s => {
            const cfg = STATUS_CONFIG[s] || {};
            return (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded-full text-xs border transition-all ${filterStatus === s
                  ? (s === "All" ? "bg-slate-800 text-white border-slate-800" : `${cfg.bg} ${cfg.text} ${cfg.border}`)
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}
                style={{ fontWeight: filterStatus === s ? 500 : 400 }}>
                {s === "All" ? "All Status" : s}
              </button>
            );
          })}
        </div>

        <div className="h-5 w-px bg-slate-200" />

        {/* Category */}
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-100">
          <option value="All">All Categories</option>
          {["Core","Aircraft Familiarization","Aircraft Type","Specialized","Compliance"].map(c => <option key={c}>{c}</option>)}
        </select>

        {/* Dept */}
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-100">
          {DEPTS.map(d => <option key={d}>{d}</option>)}
        </select>

        <span className="ml-auto text-xs text-slate-400">{filtered.length} session{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* ── Main ── */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-auto">
          {view === "calendar" && (
            <CalendarView
              calYear={calYear} calMonth={calMonth}
              prevMonth={prevMonth} nextMonth={nextMonth}
              sessionsOnDay={sessionsOnDay}
              today={today}
              onSelect={setSelectedSession}
              selectedSession={selectedSession}
            />
          )}
          {view === "list" && (
            <ListView sessions={filtered} onSelect={setSelectedSession} selectedSession={selectedSession} />
          )}
          {view === "gantt" && (
            <GanttView sessions={filtered} calYear={calYear} calMonth={calMonth} prevMonth={prevMonth} nextMonth={nextMonth} today={today} onSelect={setSelectedSession} />
          )}
        </main>

        {/* ── Detail Panel ── */}
        {selectedSession && (
          <SessionDetail
            session={selectedSession}
            onClose={() => setSelectedSession(null)}
            onEdit={() => openEdit(selectedSession)}
            onDelete={() => handleDelete(selectedSession.id)}
          />
        )}
      </div>

      {/* ── Form Modal ── */}
      {showForm && (
        <SessionForm
          form={form} setForm={setForm}
          isEdit={!!editSession}
          onSave={handleSave}
          onClose={() => setShowForm(false)}
          onCourseSelect={handleCourseSelect}
        />
      )}
    </div>
  );
}

// ─── Calendar View ────────────────────────────────────────────────────────────

function CalendarView({ calYear, calMonth, prevMonth, nextMonth, sessionsOnDay, today, onSelect, selectedSession }) {
  const numDays = daysInMonth(calYear, calMonth);
  const firstDay = firstDayOfMonth(calYear, calMonth);
  const todayStr = toYMD(today);
  const todayYM = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2,"0")}`;
  const currentYM = `${calYear}-${String(calMonth + 1).padStart(2,"0")}`;

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= numDays; d++) cells.push(d);

  return (
    <div className="p-6">
      {/* Month Nav */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg text-slate-800" style={{ fontWeight: 600 }}>{MONTHS[calMonth]} {calYear}</h2>
          {currentYM === todayYM && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700" style={{ fontWeight: 500 }}>This month</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS_SHORT.map(d => (
          <div key={d} className={`text-center text-xs py-1.5 ${d === "Sun" || d === "Sat" ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 500 }}>{d}</div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const dayStr = `${calYear}-${String(calMonth + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const isToday = dayStr === todayStr;
          const isSun = (i % 7) === 0;
          const isSat = (i % 7) === 6;
          const daySessions = sessionsOnDay(day);

          return (
            <div key={day}
              className={`min-h-24 rounded-xl border p-2 transition-colors ${isToday ? "border-blue-300 bg-blue-50/60" : "border-slate-200 bg-white hover:border-slate-300"} ${isSun || isSat ? "bg-slate-50/50" : ""}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-blue-600 text-white font-600" : isSun || isSat ? "text-slate-400" : "text-slate-600"}`}
                  style={{ fontWeight: isToday ? 600 : 400 }}>
                  {day}
                </span>
                {daySessions.length > 0 && (
                  <span className="text-xs text-slate-400">{daySessions.length}</span>
                )}
              </div>
              <div className="space-y-0.5">
                {daySessions.slice(0, 3).map(s => {
                  const cc = CAT_COLOR[s.category] || { bar: "#94a3b8", light: "#f8fafc", text: "#475569" };
                  const isStart = s.dateStart === dayStr;
                  const isEnd = s.dateEnd === dayStr;
                  return (
                    <button key={s.id}
                      onClick={() => onSelect(selectedSession?.id === s.id ? null : s)}
                      className={`w-full text-left px-1.5 py-0.5 rounded text-xs leading-snug transition-all hover:opacity-80 ${selectedSession?.id === s.id ? "ring-2 ring-offset-0" : ""}`}
                      style={{ background: cc.light, color: cc.text, borderLeft: `3px solid ${cc.bar}`, ringColor: cc.bar }}>
                      <span className="truncate block">{isStart ? s.courseCode : "↳"} {isStart ? "" : ""}</span>
                    </button>
                  );
                })}
                {daySessions.length > 3 && (
                  <p className="text-xs text-slate-400 pl-1">+{daySessions.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── List View ────────────────────────────────────────────────────────────────

function ListView({ sessions, onSelect, selectedSession }) {
  const grouped = useMemo(() => {
    const map = {};
    [...sessions].sort((a, b) => a.dateStart.localeCompare(b.dateStart)).forEach(s => {
      const month = s.dateStart.slice(0, 7);
      if (!map[month]) map[month] = [];
      map[month].push(s);
    });
    return Object.entries(map);
  }, [sessions]);

  if (sessions.length === 0) return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
      <svg className="w-10 h-10 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
      <p className="text-sm">No sessions match your filter</p>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {grouped.map(([month, monthSessions]) => {
        const [y, m] = month.split("-");
        return (
          <div key={month}>
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-sm text-slate-700" style={{ fontWeight: 600 }}>
                {MONTHS[parseInt(m) - 1]} {y}
              </h3>
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400">{monthSessions.length} session{monthSessions.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="space-y-2">
              {monthSessions.map(s => <SessionCard key={s.id} session={s} onSelect={onSelect} isSelected={selectedSession?.id === s.id} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SessionCard({ session: s, onSelect, isSelected }) {
  const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.Scheduled;
  const cc = CAT_COLOR[s.category] || { bar: "#94a3b8", light: "#f8fafc", text: "#475569" };
  const pct = Math.round((s.enrolled / s.maxParticipants) * 100);
  const days = sessionDays(s);

  return (
    <div onClick={() => onSelect(isSelected ? null : s)}
      className={`bg-white rounded-xl border cursor-pointer transition-all hover:shadow-sm ${isSelected ? "border-blue-300 shadow-sm ring-1 ring-blue-200" : "border-slate-200 hover:border-slate-300"}`}>
      <div className="flex items-stretch">
        {/* Color bar */}
        <div className="w-1 rounded-l-xl shrink-0" style={{ background: cc.bar }} />

        <div className="flex-1 px-4 py-3 flex items-center gap-4">
          {/* Date block */}
          <div className="shrink-0 text-center w-14">
            <p className="text-xs text-slate-400">{formatDate(s.dateStart).slice(3, 6)}</p>
            <p className="text-2xl text-slate-700 leading-none" style={{ fontWeight: 600 }}>{s.dateStart.slice(8)}</p>
            {days > 1 && <p className="text-xs text-slate-400 mt-0.5">{days}d</p>}
          </div>

          <div className="w-px h-10 bg-slate-100 shrink-0" />

          {/* Course info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: cc.light, color: cc.text, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>{s.courseCode}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`} style={{ fontWeight: 500 }}>
                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${cfg.dot}`} />
                {s.status}
              </span>
              {s.type === "Recurrent" && (
                <span className="text-xs text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">↺ Recurrent</span>
              )}
            </div>
            <p className="text-sm text-slate-800 font-500 truncate" style={{ fontWeight: 500 }}>{s.courseName}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {s.timeStart}–{s.timeEnd}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {s.venue}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                {s.instructor}
              </span>
            </div>
          </div>

          {/* Enrollment */}
          <div className="shrink-0 text-right w-24">
            <p className="text-sm text-slate-700" style={{ fontWeight: 600 }}>{s.enrolled}<span className="text-xs text-slate-400 font-400">/{s.maxParticipants}</span></p>
            <p className="text-xs text-slate-400 mb-1">enrolled</p>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: pct >= 100 ? "#f59e0b" : pct >= 80 ? "#3b82f6" : "#10b981" }} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{pct}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Gantt / Timeline View ─────────────────────────────────────────────────

function GanttView({ sessions, calYear, calMonth, prevMonth, nextMonth, today, onSelect }) {
  const numDays = daysInMonth(calYear, calMonth);
  const todayStr = toYMD(today);
  const currentYM = `${calYear}-${String(calMonth + 1).padStart(2,"0")}`;

  const monthSessions = sessions.filter(s => {
    const sm = s.dateStart.slice(0, 7);
    const em = s.dateEnd.slice(0, 7);
    return sm <= currentYM && em >= currentYM;
  });

  function dayOffset(dateStr) {
    const clipped = dateStr < currentYM + "-01" ? currentYM + "-01" : dateStr;
    return parseInt(clipped.slice(8)) - 1;
  }
  function daySpan(s) {
    const start = s.dateStart < currentYM + "-01" ? currentYM + "-01" : s.dateStart;
    const endYM = s.dateEnd.slice(0, 7);
    const endDay = endYM > currentYM
      ? `${currentYM}-${String(numDays).padStart(2,"0")}`
      : s.dateEnd;
    return parseInt(endDay.slice(8)) - parseInt(start.slice(8)) + 1;
  }

  const todayCol = todayStr.slice(0, 7) === currentYM ? parseInt(todayStr.slice(8)) - 1 : null;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg text-slate-800" style={{ fontWeight: 600 }}>{MONTHS[calMonth]} {calYear}</h2>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-auto">
        {/* Day header */}
        <div className="flex border-b border-slate-200 sticky top-0 bg-white z-10">
          <div className="w-56 shrink-0 border-r border-slate-200 px-4 py-2 text-xs text-slate-500" style={{ fontWeight: 500 }}>Course</div>
          <div className="flex-1 flex">
            {Array.from({ length: numDays }, (_, i) => {
              const d = i + 1;
              const dateStr = `${currentYM}-${String(d).padStart(2,"0")}`;
              const dow = new Date(calYear, calMonth, d).getDay();
              const isWeekend = dow === 0 || dow === 6;
              const isToday = dateStr === todayStr;
              return (
                <div key={d} className={`flex-1 text-center py-2 border-r border-slate-100 last:border-r-0 ${isWeekend ? "bg-slate-50" : ""} ${isToday ? "bg-blue-50" : ""}`}
                  style={{ minWidth: 28 }}>
                  <p className={`text-xs ${isToday ? "text-blue-600 font-600" : isWeekend ? "text-slate-400" : "text-slate-500"}`}
                    style={{ fontWeight: isToday ? 600 : 400, fontSize: 10 }}>{d}</p>
                  <p className={`text-xs ${isWeekend ? "text-slate-300" : "text-slate-400"}`} style={{ fontSize: 9 }}>{DAYS_SHORT[dow].slice(0,1)}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rows */}
        {monthSessions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">No sessions this month</div>
        ) : (
          monthSessions.map(s => {
            const cc = CAT_COLOR[s.category] || { bar: "#94a3b8", light: "#f8fafc", text: "#475569" };
            const offset = dayOffset(s.dateStart);
            const span = daySpan(s);

            return (
              <div key={s.id} className="flex border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors group" style={{ minHeight: 44 }}>
                <div className="w-56 shrink-0 border-r border-slate-200 px-4 py-2 flex items-center gap-2">
                  <div className="w-1 h-8 rounded-full shrink-0" style={{ background: cc.bar }} />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-700 truncate" style={{ fontWeight: 500 }}>{s.courseCode}</p>
                    <p className="text-xs text-slate-400 truncate" style={{ fontSize: 10 }}>{s.courseName.slice(0, 28)}{s.courseName.length > 28 ? "…" : ""}</p>
                  </div>
                </div>
                <div className="flex-1 relative" style={{ minHeight: 44 }}>
                  {/* Weekend shading */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {Array.from({ length: numDays }, (_, i) => {
                      const dow = new Date(calYear, calMonth, i + 1).getDay();
                      return <div key={i} className="flex-1" style={{ background: dow === 0 || dow === 6 ? "#f8fafc" : "transparent", minWidth: 28 }} />;
                    })}
                  </div>
                  {/* Today line */}
                  {todayCol !== null && (
                    <div className="absolute top-0 bottom-0 w-px bg-blue-400 opacity-50 pointer-events-none z-10"
                      style={{ left: `calc(${((todayCol + 0.5) / numDays) * 100}%)` }} />
                  )}
                  {/* Bar */}
                  <button
                    onClick={() => onSelect(s)}
                    className="absolute top-1/2 -translate-y-1/2 rounded-md flex items-center px-2 text-xs hover:opacity-90 transition-all group-hover:shadow-sm"
                    style={{
                      left: `calc(${(offset / numDays) * 100}% + 2px)`,
                      width: `calc(${(span / numDays) * 100}% - 4px)`,
                      background: cc.bar, color: "#fff",
                      height: 26, minWidth: 24,
                    }}>
                    <span className="truncate" style={{ fontWeight: 500, fontSize: 11 }}>{span > 2 ? s.courseName.slice(0, 22) : ""}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Session Detail Panel ─────────────────────────────────────────────────────

function SessionDetail({ session: s, onClose, onEdit, onDelete }) {
  const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.Scheduled;
  const cc = CAT_COLOR[s.category] || { bar: "#94a3b8", light: "#f8fafc", text: "#475569" };
  const pct = Math.round((s.enrolled / s.maxParticipants) * 100);
  const days = sessionDays(s);

  return (
    <aside className="w-76 bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-y-auto" style={{ width: 300 }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded font-500"
              style={{ background: cc.light, color: cc.text, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>{s.courseCode}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`} style={{ fontWeight: 500 }}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${cfg.dot}`} />
              {s.status}
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <p className="text-sm text-slate-800 leading-snug" style={{ fontWeight: 600 }}>{s.courseName}</p>
      </div>

      {/* Info */}
      <div className="px-5 py-4 space-y-3.5 flex-1">
        {[
          { icon: "calendar", label: "Date", val: formatDate(s.dateStart) + (days > 1 ? ` – ${formatDate(s.dateEnd)}` : ""), sub: `${days} day${days > 1 ? "s" : ""}` },
          { icon: "clock", label: "Time", val: `${s.timeStart} – ${s.timeEnd}` },
          { icon: "location", label: "Venue", val: s.venue },
          { icon: "user", label: "Instructor", val: s.instructor },
          { icon: "dept", label: "Target Dept.", val: s.dept },
          { icon: "tag", label: "Training Type", val: s.type },
          { icon: "category", label: "Category", val: s.category },
        ].map(({ icon, label, val, sub }) => (
          <div key={label} className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
              {icon === "calendar" && <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              {icon === "clock" && <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              {icon === "location" && <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>}
              {icon === "user" && <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
              {(icon === "dept" || icon === "tag" || icon === "category") && <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" /></svg>}
            </div>
            <div>
              <p className="text-xs text-slate-400">{label}</p>
              <p className="text-sm text-slate-700" style={{ fontWeight: 500 }}>{val}</p>
              {sub && <p className="text-xs text-slate-400">{sub}</p>}
            </div>
          </div>
        ))}

        {/* Enrollment bar */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-500" style={{ fontWeight: 500 }}>Enrollment</p>
            <p className="text-xs text-slate-700" style={{ fontWeight: 600 }}>{s.enrolled} / {s.maxParticipants} <span className="text-slate-400 font-400">({pct}%)</span></p>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{ width: `${Math.min(pct, 100)}%`, background: pct >= 100 ? "#f59e0b" : pct >= 80 ? "#3b82f6" : "#10b981" }} />
          </div>
          <div className="flex justify-between mt-1">
            <p className="text-xs text-slate-400">{s.maxParticipants - s.enrolled} seats left</p>
            {pct >= 100 && <p className="text-xs text-amber-600" style={{ fontWeight: 500 }}>Full</p>}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex gap-2">
        <button onClick={onEdit}
          className="flex-1 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          Edit
        </button>
        <button onClick={onDelete}
          className="flex-1 py-2 text-sm rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          Delete
        </button>
      </div>
    </aside>
  );
}

// ─── Session Form Modal ───────────────────────────────────────────────────────

function SessionForm({ form, setForm, isEdit, onSave, onClose, onCourseSelect }) {
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 max-h-screen overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base text-slate-800" style={{ fontWeight: 600 }}>{isEdit ? "Edit Training Session" : "Schedule New Training Session"}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Fill in the session details below</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Course select */}
          <div>
            <label className="text-xs text-slate-500 block mb-1.5" style={{ fontWeight: 500 }}>Training Course <span className="text-red-400">*</span></label>
            <select value={form.courseId} onChange={e => onCourseSelect(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100">
              <option value="">Select a course...</option>
              {["Core","Aircraft Familiarization","Aircraft Type","Specialized","Compliance"].map(cat => (
                <optgroup key={cat} label={cat}>
                  {COURSES_REF.filter(c => c.category === cat).map(c => (
                    <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Dates + time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1.5" style={{ fontWeight: 500 }}>Start Date <span className="text-red-400">*</span></label>
              <input type="date" value={form.dateStart} onChange={e => f("dateStart", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1.5" style={{ fontWeight: 500 }}>End Date</label>
              <input type="date" value={form.dateEnd} onChange={e => f("dateEnd", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1.5" style={{ fontWeight: 500 }}>Start Time</label>
              <input type="time" value={form.timeStart} onChange={e => f("timeStart", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1.5" style={{ fontWeight: 500 }}>End Time</label>
              <input type="time" value={form.timeEnd} onChange={e => f("timeEnd", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
          </div>

          {/* Instructor + Venue */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1.5" style={{ fontWeight: 500 }}>Instructor</label>
              <select value={form.instructor} onChange={e => f("instructor", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100">
                <option value="">Select...</option>
                {INSTRUCTORS.map(i => <option key={i.id} value={i.name}>{i.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1.5" style={{ fontWeight: 500 }}>Venue</label>
              <select value={form.venue} onChange={e => f("venue", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100">
                <option value="">Select...</option>
                {VENUES.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
          </div>

          {/* Dept + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1.5" style={{ fontWeight: 500 }}>Target Department</label>
              <select value={form.dept} onChange={e => f("dept", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100">
                {DEPTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1.5" style={{ fontWeight: 500 }}>Status</label>
              <select value={form.status} onChange={e => f("status", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100">
                {Object.keys(STATUS_CONFIG).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Max participants + Enrolled */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1.5" style={{ fontWeight: 500 }}>Max Participants</label>
              <input type="number" min={1} max={200} value={form.maxParticipants} onChange={e => f("maxParticipants", parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1.5" style={{ fontWeight: 500 }}>Enrolled</label>
              <input type="number" min={0} value={form.enrolled} onChange={e => f("enrolled", parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-0 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={onSave}
            className="flex-1 py-2.5 text-sm rounded-xl text-white hover:opacity-90 transition-all"
            style={{ background: "#1a56db", fontWeight: 500 }}>
            {isEdit ? "Save Changes" : "Schedule Session"}
          </button>
        </div>
      </div>
    </div>
  );
}
