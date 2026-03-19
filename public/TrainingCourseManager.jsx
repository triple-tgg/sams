import { useState, useMemo } from "react";

const COURSES = [
  { id: 1, code: "HF-001", name: "Human Factors in Aviation Maintenance", category: "Core", recurrent: true, recurrentYears: 2 },
  { id: 2, code: "SMS-001", name: "Safety Management System", category: "Core", recurrent: true, recurrentYears: 2 },
  { id: 3, code: "DG-001", name: "Dangerous Goods Awareness", category: "Core", recurrent: true, recurrentYears: 2 },
  { id: 4, code: "CP-001", name: "Company Policy, Procedures (MOE & TPM) and 145 CAAT/NAA Laws and Regulations", category: "Core", recurrent: false },
  { id: 5, code: "AC-B737", name: "Aircraft General Familiarization for B737-600/700/800/900 (CFM56) and/or B737-7/8/9 (CFM LEAP-1B)", category: "Aircraft Familiarization", recurrent: false },
  { id: 6, code: "AC-A320F", name: "Aircraft General Familiarization for Aircraft Type A318/A319/A320/A321", category: "Aircraft Familiarization", recurrent: false },
  { id: 7, code: "AC-B777F", name: "Aircraft General Familiarization for B777-200/300/300ER (GE90, RB211 Trent 800)", category: "Aircraft Familiarization", recurrent: false },
  { id: 8, code: "AC-A330F", name: "Aircraft General Familiarization for A330-200/300/800/900 (RR Trent 700, PW4000, GE CF6, RR Trent 7000)", category: "Aircraft Familiarization", recurrent: false },
  { id: 9, code: "AC-B787F", name: "Aircraft General Familiarization for B787-8/9/10 (RR211 Trent 1000) and (Genx)", category: "Aircraft Familiarization", recurrent: false },
  { id: 10, code: "AC-B767F", name: "Aircraft General Familiarization for Aircraft Type B767-200/300 (PW4000) and (RB211)", category: "Aircraft Familiarization", recurrent: false },
  { id: 11, code: "AC-A350F", name: "Aircraft General Familiarization for Aircraft Type A350-900/1000 (RR Trent XWB)", category: "Aircraft Familiarization", recurrent: false },
  { id: 12, code: "AC-ERJ190F", name: "Aircraft General Familiarization for Aircraft Type ERJ-190 (PW1900G)", category: "Aircraft Familiarization", recurrent: false },
  { id: 13, code: "AT-B737", name: "Aircraft Type for B737-600/700/800/900 (CFM56) and/or B737-7/8/9 (CFM LEAP-1B) and Relevant Technology", category: "Aircraft Type", recurrent: false },
  { id: 14, code: "AT-A320", name: "Aircraft Type for A318/A319/A320 and Relevant Technology", category: "Aircraft Type", recurrent: false },
  { id: 15, code: "AT-B777", name: "Aircraft Type for B777-200/300/300ER (PW4000, GE90, RB211 Trent 800) and Relevant Technology", category: "Aircraft Type", recurrent: false },
  { id: 16, code: "AT-A330", name: "Aircraft Type for A330-200/300/800/900 (RR Trent 700, PW4000, GE-CF6, RR Trent 7000) and Relevant Technology", category: "Aircraft Type", recurrent: false },
  { id: 17, code: "AT-B787", name: "Aircraft Type for B787-8/9/10 (RR211 Trent 1000) and (Genx) and Relevant Technology", category: "Aircraft Type", recurrent: false },
  { id: 18, code: "AT-B767", name: "Aircraft Type for B767-200/300 (PW4000) and (RB211) and Relevant Technology", category: "Aircraft Type", recurrent: false },
  { id: 19, code: "AT-A350", name: "Aircraft Type for A350-900/1000 (RR Trent XWB) and Relevant Technology", category: "Aircraft Type", recurrent: false },
  { id: 20, code: "AT-ERJ190", name: "Aircraft Type for ERJ-190 (PW1900G) and Relevant Technology", category: "Aircraft Type", recurrent: false },
  { id: 21, code: "SP-APM", name: "Aircraft Parts and Material Receiving", category: "Specialized", recurrent: true, recurrentYears: 2 },
  { id: 22, code: "SP-FTS1", name: "Fuel Tank Safety (Phase 1)", category: "Specialized", recurrent: true, recurrentYears: 2 },
  { id: 23, code: "SP-FTS12", name: "Fuel Tank Safety (Phase 1) and (Phase 2)", category: "Specialized", recurrent: true, recurrentYears: 2 },
  { id: 24, code: "SP-EWIS", name: "Electrical Wiring Interconnection System", category: "Specialized", recurrent: true, recurrentYears: 2 },
  { id: 25, code: "SP-RVSM", name: "Special Operations (RVSM, PBN/RNP, CAT II/III)", category: "Specialized", recurrent: true, recurrentYears: 2 },
  { id: 26, code: "SP-ETOPS", name: "Special Operations (EDTO/ETOPS)", category: "Specialized", recurrent: true, recurrentYears: 2 },
  { id: 27, code: "SP-BORE", name: "CFM56 Engine Borescope Inspection", category: "Specialized", recurrent: false },
  { id: 28, code: "SP-CUST", name: "Customer Procedure", category: "Specialized", recurrent: false },
  { id: 29, code: "SP-AIT", name: "Aircraft Inspection Techniques", category: "Specialized", recurrent: false },
  { id: 30, code: "SP-ERU", name: "Engine Run Up", category: "Specialized", recurrent: false },
  { id: 31, code: "CM-AUDIT", name: "Internal Audit", category: "Compliance", recurrent: false, note: "Applicable with Lead Auditor" },
  { id: 32, code: "CM-LEAD", name: "Lead Auditor", category: "Compliance", recurrent: false, note: "Applicable with Lead Auditor" },
  { id: 33, code: "CM-TTT", name: "Train the Trainer", category: "Compliance", recurrent: false, note: "Applicable with Instructor" },
];

const DEPARTMENTS = [
  {
    id: "all", name: "All Departments", icon: "▦",
    roles: []
  },
  {
    id: "exec", name: "Executive", icon: "◆",
    roles: ["CEO / Accountable Manager"]
  },
  {
    id: "maint", name: "Maintenance", icon: "✦",
    roles: [
      "Maintenance Manager", "Customer Coordinator", "Chief Station Engineer",
      "Duty Engineer", "Aircraft Certifying Staff",
      "Aircraft Certifying Staff (Aircraft Inspector)",
      "Aircraft Certifying Staff (Engine Run Up)",
      "Engine Borescope Inspector", "Aircraft Mechanic"
    ]
  },
  {
    id: "compliance", name: "Compliance Monitoring", icon: "◉",
    roles: ["Compliance Monitoring Manager", "Compliance Standard Executive", "Compliance Control Executive"]
  },
  {
    id: "safety", name: "Safety Management", icon: "▲",
    roles: ["Safety Management Manager", "Safety Executive"]
  },
  {
    id: "technical", name: "Technical Services", icon: "◈",
    roles: ["Technical Services Manager", "Senior Technical Services", "Technical Services Executive"]
  },
  {
    id: "store", name: "Store & Purchase", icon: "◫",
    roles: ["Store and Purchase Manager", "Store and Purchase Executive", "Store Inspector"]
  },
];

const CATEGORIES = ["All", "Core", "Aircraft Familiarization", "Aircraft Type", "Specialized", "Compliance"];

const CATEGORY_COLORS = {
  "Core": "bg-blue-100 text-blue-800",
  "Aircraft Familiarization": "bg-sky-100 text-sky-800",
  "Aircraft Type": "bg-indigo-100 text-indigo-800",
  "Specialized": "bg-amber-100 text-amber-800",
  "Compliance": "bg-emerald-100 text-emerald-800",
};

const CATEGORY_DOT = {
  "Core": "bg-blue-500",
  "Aircraft Familiarization": "bg-sky-400",
  "Aircraft Type": "bg-indigo-500",
  "Specialized": "bg-amber-500",
  "Compliance": "bg-emerald-500",
};

export default function TrainingCourseManager() {
  const [activeTab, setActiveTab] = useState("courses");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedDept, setExpandedDept] = useState(null);

  const [modalForm, setModalForm] = useState({
    code: "", name: "", category: "Core", recurrent: false, recurrentYears: 2, note: ""
  });

  const filtered = useMemo(() => {
    return COURSES.filter(c => {
      const matchCat = selectedCategory === "All" || c.category === selectedCategory;
      const matchSearch = !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, search]);

  const stats = useMemo(() => ({
    total: COURSES.length,
    recurrent: COURSES.filter(c => c.recurrent).length,
    initial: COURSES.filter(c => !c.recurrent).length,
    byCategory: CATEGORIES.slice(1).map(cat => ({
      name: cat,
      count: COURSES.filter(c => c.category === cat).length
    }))
  }), []);

  const openAdd = () => {
    setEditMode(false);
    setModalForm({ code: "", name: "", category: "Core", recurrent: false, recurrentYears: 2, note: "" });
    setShowModal(true);
  };

  const openEdit = (course) => {
    setEditMode(true);
    setModalForm({ ...course });
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "#1a56db" }}>
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
                <path d="M3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zm5.99 7.176A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 leading-none">SAMS</p>
              <p className="text-sm font-600 text-gray-800 leading-tight" style={{ fontWeight: 600 }}>Training Management</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 hidden sm:block">SAMS-FM-CM-014 Rev.03</span>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-sm font-500 transition-all hover:opacity-90"
            style={{ background: "#1a56db", fontWeight: 500 }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Course
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
            {/* Nav Tabs */}
            <div className="p-3 border-b border-gray-100">
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                {[["courses", "Courses"], ["matrix", "Matrix"]].map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex-1 text-xs py-1.5 rounded-md font-500 transition-all ${activeTab === id ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    style={{ fontWeight: 500 }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Department Filter */}
            <div className="p-3 flex-1 overflow-y-auto">
              <p className="text-xs font-500 text-gray-400 uppercase tracking-wider mb-2" style={{ fontWeight: 600, letterSpacing: "0.06em" }}>Departments</p>
              <div className="space-y-0.5">
                {DEPARTMENTS.map(dept => {
                  const isSelected = selectedDept === dept.id;
                  const isExpanded = expandedDept === dept.id;
                  const hasRoles = dept.roles.length > 0;
                  return (
                    <div key={dept.id}>
                      <button
                        onClick={() => {
                          setSelectedDept(dept.id);
                          setExpandedDept(isExpanded ? null : dept.id);
                        }}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all text-sm ${
                          isSelected ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <span className="text-base leading-none">{dept.icon}</span>
                        <span className="truncate flex-1" style={{ fontWeight: isSelected ? 500 : 400 }}>{dept.name}</span>
                        {hasRoles && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                            isSelected ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
                          }`}>
                            {dept.roles.length}
                          </span>
                        )}
                        {hasRoles && (
                          <svg
                            className={`w-3 h-3 shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""} ${isSelected ? "text-blue-500" : "text-gray-400"}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </button>

                      {/* Roles sub-list */}
                      {isExpanded && hasRoles && (
                        <div className="ml-3 mt-0.5 mb-1 border-l-2 border-blue-100 pl-3 space-y-0.5">
                          {dept.roles.map((role, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 py-1.5 px-2 rounded-md text-xs text-gray-600 hover:bg-blue-50 hover:text-blue-700 cursor-default transition-colors"
                            >
                              <div className="w-1 h-1 rounded-full bg-blue-300 shrink-0" />
                              <span className="leading-snug">{role}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-500 text-gray-400 uppercase tracking-wider mb-2" style={{ fontWeight: 600, letterSpacing: "0.06em" }}>Category</p>
                <div className="space-y-0.5">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all text-sm ${
                        selectedCategory === cat ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {cat !== "All" && (
                        <span className={`w-2 h-2 rounded-full shrink-0 ${CATEGORY_DOT[cat] || "bg-gray-400"}`} />
                      )}
                      <span style={{ fontWeight: selectedCategory === cat ? 500 : 400 }}>{cat}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {activeTab === "courses" ? (
            <div className="p-6 space-y-5">
              {/* Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Total Courses" value={stats.total} color="#1a56db" />
                <StatCard label="Recurrent (2yr)" value={stats.recurrent} color="#0ea5e9" />
                <StatCard label="Initial Only" value={stats.initial} color="#6366f1" />
                <StatCard label="Categories" value={5} color="#f59e0b" />
              </div>

              {/* Category Breakdown */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-500 text-gray-500 mb-3" style={{ fontWeight: 500 }}>Course distribution by category</p>
                <div className="flex gap-2 flex-wrap">
                  {stats.byCategory.map(({ name, count }) => (
                    <button
                      key={name}
                      onClick={() => setSelectedCategory(name)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all ${
                        selectedCategory === name
                          ? "border-blue-400 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-600"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${CATEGORY_DOT[name]}`} />
                      {name}
                      <span className="font-600 ml-0.5" style={{ fontWeight: 600 }}>{count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Search + Filter Bar */}
              <div className="flex gap-3 items-center">
                <div className="relative flex-1 max-w-xs">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                  />
                </div>
                <span className="text-sm text-gray-400">{filtered.length} courses</span>
              </div>

              {/* Course List */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                  <div className="col-span-1 text-xs font-500 text-gray-400" style={{ fontWeight: 500 }}>No.</div>
                  <div className="col-span-1 text-xs font-500 text-gray-400" style={{ fontWeight: 500 }}>Code</div>
                  <div className="col-span-6 text-xs font-500 text-gray-400" style={{ fontWeight: 500 }}>Training Course</div>
                  <div className="col-span-2 text-xs font-500 text-gray-400" style={{ fontWeight: 500 }}>Category</div>
                  <div className="col-span-2 text-xs font-500 text-gray-400" style={{ fontWeight: 500 }}>Type</div>
                </div>

                {filtered.map((course, idx) => (
                  <div
                    key={course.id}
                    onClick={() => setSelectedCourse(selectedCourse?.id === course.id ? null : course)}
                    className={`grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-50 cursor-pointer transition-all hover:bg-blue-50/40 ${
                      selectedCourse?.id === course.id ? "bg-blue-50 border-blue-100" : ""
                    }`}
                  >
                    <div className="col-span-1 text-sm text-gray-400">{course.id}</div>
                    <div className="col-span-1">
                      <span className="text-xs font-500 text-gray-500" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>
                        {course.code}
                      </span>
                    </div>
                    <div className="col-span-6 text-sm text-gray-700 leading-snug pr-2">{course.name}</div>
                    <div className="col-span-2">
                      <span className={`text-xs px-2 py-0.5 rounded-md ${CATEGORY_COLORS[course.category] || "bg-gray-100 text-gray-600"}`}>
                        {course.category}
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center gap-1.5">
                      {course.recurrent ? (
                        <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          {course.recurrentYears}yr
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Initial
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {filtered.length === 0 && (
                  <div className="py-12 text-center text-gray-400 text-sm">
                    No courses match your filter
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Matrix View */
            <div className="p-6">
              <MatrixView />
            </div>
          )}
        </main>

        {/* Course Detail Panel */}
        {selectedCourse && (
          <aside className="w-72 bg-white border-l border-gray-200 p-5 flex flex-col gap-4 shrink-0 overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-500 text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{selectedCourse.code}</span>
                <h3 className="text-sm font-500 text-gray-800 mt-0.5 leading-snug" style={{ fontWeight: 600 }}>{selectedCourse.name}</h3>
              </div>
              <button onClick={() => setSelectedCourse(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 shrink-0 ml-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <DetailRow label="Category">
                <span className={`text-xs px-2 py-0.5 rounded-md ${CATEGORY_COLORS[selectedCourse.category]}`}>
                  {selectedCourse.category}
                </span>
              </DetailRow>
              <DetailRow label="Training Type">
                {selectedCourse.recurrent ? (
                  <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                    Recurrent — every {selectedCourse.recurrentYears} years
                  </span>
                ) : (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">Initial training</span>
                )}
              </DetailRow>
              {selectedCourse.note && (
                <DetailRow label="Note">
                  <span className="text-xs text-gray-600">{selectedCourse.note}</span>
                </DetailRow>
              )}
              <DetailRow label="Course ID">
                <span className="text-xs font-500 text-gray-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>#{selectedCourse.id}</span>
              </DetailRow>
            </div>

            <div className="pt-3 border-t border-gray-100 space-y-2">
              <p className="text-xs font-500 text-gray-400 uppercase tracking-wider" style={{ fontWeight: 600 }}>Regulatory Notes</p>
              <div className="text-xs text-gray-500 leading-relaxed bg-gray-50 rounded-lg p-3 space-y-2">
                <p>• Training shall be completed within <strong className="text-gray-700">6 months</strong> of joining</p>
                <p>• Governed by CAAT MOE Issue 10 Rev.00</p>
                <p>• Ref: SAMS-FM-CM-014 Rev.03 (05 AUG 2025)</p>
              </div>
            </div>

            <div className="flex gap-2 mt-auto pt-3 border-t border-gray-100">
              <button
                onClick={() => openEdit(selectedCourse)}
                className="flex-1 text-sm py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Edit
              </button>
              <button
                className="flex-1 text-sm py-2 rounded-lg text-white transition-colors hover:opacity-90"
                style={{ background: "#1a56db" }}
              >
                View Matrix
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-600 text-gray-800" style={{ fontWeight: 600 }}>{editMode ? "Edit Course" : "Add New Course"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-500 text-gray-500 block mb-1.5" style={{ fontWeight: 500 }}>Course Code</label>
                  <input
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                    placeholder="e.g. HF-001"
                    value={modalForm.code}
                    onChange={e => setModalForm({ ...modalForm, code: e.target.value })}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  />
                </div>
                <div>
                  <label className="text-xs font-500 text-gray-500 block mb-1.5" style={{ fontWeight: 500 }}>Category</label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                    value={modalForm.category}
                    onChange={e => setModalForm({ ...modalForm, category: e.target.value })}
                  >
                    {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-500 text-gray-500 block mb-1.5" style={{ fontWeight: 500 }}>Course Name</label>
                <textarea
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                  rows={3}
                  placeholder="Full course name..."
                  value={modalForm.name}
                  onChange={e => setModalForm({ ...modalForm, name: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setModalForm({ ...modalForm, recurrent: !modalForm.recurrent })}
                    className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${modalForm.recurrent ? "bg-blue-500" : "bg-gray-300"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${modalForm.recurrent ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                  <span className="text-sm text-gray-600">Recurrent Training</span>
                </label>
                {modalForm.recurrent && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Every</span>
                    <input
                      type="number"
                      className="w-14 px-2 py-1 text-sm border border-gray-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-100"
                      value={modalForm.recurrentYears}
                      onChange={e => setModalForm({ ...modalForm, recurrentYears: parseInt(e.target.value) })}
                      min={1} max={5}
                    />
                    <span className="text-sm text-gray-500">years</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-500 text-gray-500 block mb-1.5" style={{ fontWeight: 500 }}>Additional Note (optional)</label>
                <input
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="e.g. Applicable with Lead Auditor"
                  value={modalForm.note}
                  onChange={e => setModalForm({ ...modalForm, note: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 text-sm rounded-lg text-white transition-opacity hover:opacity-90"
                style={{ background: "#1a56db" }}
              >
                {editMode ? "Save Changes" : "Add Course"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-500">{label}</p>
        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
      </div>
      <p className="text-2xl font-600 text-gray-800" style={{ fontWeight: 600, color }}>{value}</p>
    </div>
  );
}

function DetailRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-gray-400 shrink-0 pt-0.5">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  );
}

const MATRIX_ROLES = [
  { short: "CEO", full: "CEO/Acct. Manager" },
  { short: "MM", full: "Maint. Manager" },
  { short: "CC", full: "Cust. Coordinator" },
  { short: "CSE", full: "Chief Stn. Engineer" },
  { short: "DE", full: "Duty Engineer" },
  { short: "ACS", full: "Aircraft Cert. Staff" },
  { short: "ACI", full: "ACS (Inspector)" },
  { short: "ACE", full: "ACS (Engine Run Up)" },
  { short: "EBI", full: "Engine Borescope Insp." },
  { short: "AM", full: "Aircraft Mechanic" },
  { short: "CMM", full: "CM Manager" },
  { short: "CSX", full: "Compliance Exec." },
  { short: "SMM", full: "Safety Manager" },
  { short: "SE", full: "Safety Executive" },
  { short: "TSM", full: "Tech Services Mgr." },
  { short: "STS", full: "Senior Tech Services" },
  { short: "SPM", full: "S&P Manager" },
  { short: "SI", full: "Store Inspector" },
];

const MATRIX_DATA = {
  1:  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  2:  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  3:  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  4:  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  5:  [1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0],
  6:  [1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0],
  7:  [1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0],
  8:  [1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0],
  9:  [1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0],
  10: [1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0],
  11: [1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0],
  12: [1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0],
  13: [0,0,0,0,0,1,1,1,0,1,0,0,0,0,0,0,0,0],
  14: [0,0,0,0,0,1,1,1,0,1,0,0,0,0,0,0,0,0],
  15: [0,0,0,0,0,1,1,1,0,1,0,0,0,0,0,0,0,0],
  16: [0,0,0,0,0,1,1,1,0,1,0,0,0,0,0,0,0,0],
  17: [0,0,0,0,0,1,1,1,0,1,0,0,0,0,0,0,0,0],
  18: [0,0,0,0,0,1,1,1,0,1,0,0,0,0,0,0,0,0],
  19: [0,0,0,0,0,1,1,1,0,1,0,0,0,0,0,0,0,0],
  20: [0,0,0,0,0,1,1,1,0,1,0,0,0,0,0,0,0,0],
  21: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
  22: [0,1,0,1,1,1,1,1,0,1,0,0,0,0,0,0,0,0],
  23: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  24: [0,1,0,1,1,1,1,1,0,1,0,0,0,0,0,0,0,0],
  25: [0,1,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0],
  26: [0,1,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0],
  27: [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0],
  28: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  29: [0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
  30: [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
  31: [0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0],
  32: [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
  33: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0],
};

const MATRIX_COURSES = [
  { id: 1, name: "Human Factors in Aviation Maintenance" },
  { id: 2, name: "Safety Management System" },
  { id: 3, name: "Dangerous Goods Awareness" },
  { id: 4, name: "Company Policy, Procedures & Regulations" },
  { id: 5, name: "General Fam: B737 (CFM56/LEAP-1B)" },
  { id: 6, name: "General Fam: A318/319/320/321" },
  { id: 7, name: "General Fam: B777 (GE90/Trent 800)" },
  { id: 8, name: "General Fam: A330 (Trent 700/PW4000)" },
  { id: 9, name: "General Fam: B787 (Trent 1000/GEnx)" },
  { id: 10, name: "General Fam: B767 (PW4000/RB211)" },
  { id: 11, name: "General Fam: A350 (Trent XWB)" },
  { id: 12, name: "General Fam: ERJ-190 (PW1900G)" },
  { id: 13, name: "Aircraft Type: B737 & Relevant Technology" },
  { id: 14, name: "Aircraft Type: A318/319/320" },
  { id: 15, name: "Aircraft Type: B777" },
  { id: 16, name: "Aircraft Type: A330" },
  { id: 17, name: "Aircraft Type: B787" },
  { id: 18, name: "Aircraft Type: B767" },
  { id: 19, name: "Aircraft Type: A350" },
  { id: 20, name: "Aircraft Type: ERJ-190" },
  { id: 21, name: "Aircraft Parts and Material Receiving" },
  { id: 22, name: "Fuel Tank Safety (Phase 1)" },
  { id: 23, name: "Fuel Tank Safety (Phase 1+2)" },
  { id: 24, name: "Electrical Wiring Interconnection System" },
  { id: 25, name: "Special Operations (RVSM, PBN/RNP, CAT II/III)" },
  { id: 26, name: "Special Operations (EDTO/ETOPS)" },
  { id: 27, name: "CFM56 Engine Borescope Inspection" },
  { id: 28, name: "Customer Procedure" },
  { id: 29, name: "Aircraft Inspection Techniques" },
  { id: 30, name: "Engine Run Up" },
  { id: 31, name: "Internal Audit" },
  { id: 32, name: "Lead Auditor" },
  { id: 33, name: "Train the Trainer" },
];

function MatrixView() {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [hoveredCol, setHoveredCol] = useState(null);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-600 text-gray-800" style={{ fontWeight: 600 }}>Training Requirements Matrix</h2>
          <p className="text-xs text-gray-400 mt-0.5">SAMS-FM-CM-014 Rev.03 — Required training per role</p>
        </div>
        <div className="flex gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded flex items-center justify-center" style={{ background: "#1a56db" }}>
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            </span>
            Required
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-gray-100 flex items-center justify-center">
              <span className="text-gray-300 text-base leading-none" style={{ fontSize: 10 }}>—</span>
            </span>
            Not Required
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="text-xs border-collapse" style={{ minWidth: 900 }}>
          <thead>
            <tr>
              <th className="sticky left-0 z-20 bg-white border-r border-b border-gray-100 px-4 py-3 text-left text-gray-500 w-64 min-w-64 font-500" style={{ fontWeight: 500 }}>
                Training Course
              </th>
              {MATRIX_ROLES.map((role, i) => (
                <th
                  key={i}
                  className={`border-b border-gray-100 px-1 py-2 font-500 transition-colors ${hoveredCol === i ? "bg-blue-50" : ""}`}
                  style={{ fontWeight: 500, minWidth: 42, width: 42 }}
                  onMouseEnter={() => setHoveredCol(i)}
                  onMouseLeave={() => setHoveredCol(null)}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-gray-700 font-600" style={{ fontWeight: 600 }}>{role.short}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MATRIX_COURSES.map((course, rowIdx) => {
              const data = MATRIX_DATA[course.id] || [];
              const courseInfo = COURSES.find(c => c.id === course.id);
              return (
                <tr
                  key={course.id}
                  className={`border-b border-gray-50 transition-colors ${hoveredRow === rowIdx ? "bg-blue-50/30" : rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                  onMouseEnter={() => setHoveredRow(rowIdx)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <td className="sticky left-0 z-10 border-r border-gray-100 px-4 py-2.5 text-gray-700 font-400 leading-snug"
                    style={{ background: hoveredRow === rowIdx ? "#f0f7ff" : rowIdx % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <div className="flex items-start gap-2">
                      <div className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${CATEGORY_DOT[courseInfo?.category] || "bg-gray-400"}`} />
                      <span className="text-xs leading-snug">{course.name}</span>
                      {courseInfo?.recurrent && (
                        <span className="shrink-0 text-orange-400 text-xs">↺</span>
                      )}
                    </div>
                  </td>
                  {data.map((val, colIdx) => (
                    <td
                      key={colIdx}
                      className={`text-center py-2 px-0.5 transition-colors cursor-default ${hoveredCol === colIdx ? "bg-blue-50/60" : ""}`}
                      onMouseEnter={() => { setHoveredCol(colIdx); setHoveredCell(`${rowIdx}-${colIdx}`); }}
                      onMouseLeave={() => { setHoveredCol(null); setHoveredCell(null); }}
                    >
                      {val === 1 ? (
                        <span
                          className="inline-flex items-center justify-center w-5 h-5 rounded"
                          style={{ background: "#1a56db" }}
                        >
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-gray-100">
                          <span className="text-gray-300" style={{ fontSize: 8 }}>✕</span>
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Role tooltips row */}
      <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 overflow-x-auto">
        <div className="flex gap-2 flex-wrap">
          {MATRIX_ROLES.map((role, i) => (
            <span
              key={i}
              className={`text-xs px-2 py-0.5 rounded-md transition-colors ${hoveredCol === i ? "bg-blue-100 text-blue-700" : "bg-white text-gray-500 border border-gray-200"}`}
            >
              <strong className="font-600" style={{ fontWeight: 600 }}>{role.short}</strong> = {role.full}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
