import { useState } from "react";

const maintenanceTasks = [
  {
    id: 1,
    date: "06 Jan 2026",
    day: "06",
    month: "Jan",
    year: "2026",
    type: "Transit Check",
    subtype: "Check / Visual Inspection (INSP)",
    aircraft: "AIRBUS A320-200",
    reg: "VT-EXE",
    station: "BKK",
    ata: "05, 12",
    duration: 1,
    flightRef: "TR616 SIN-BKK 06/01/2026",
    stamp: "L006",
    badge: "B1/B2",
    hasAttachment: true,
    crs: true,
    category: "inspection",
  },
  {
    id: 2,
    date: "07 Jan 2026",
    day: "07",
    month: "Jan",
    year: "2026",
    type: "Transit Check",
    subtype: "Check / Visual Inspection (INSP)",
    aircraft: "AIRBUS A320-200",
    reg: "4R-ABS",
    station: "BKK",
    ata: "05, 12",
    duration: 1,
    flightRef: "UL404 CMB-BKK 07/01/2026",
    stamp: "L006",
    badge: "B1/B2",
    hasAttachment: true,
    crs: true,
    category: "inspection",
  },
  {
    id: 3,
    date: "09 Jan 2026",
    day: "09",
    month: "Jan",
    year: "2026",
    type: "Daily Check",
    subtype: "Check / Visual Inspection (INSP)",
    aircraft: "AIRBUS A319/A320/A321",
    reg: "4R-ABQ",
    station: "BKK",
    ata: "05, 12, 21",
    duration: 3,
    flightRef: "No.NB2025/0069/BKK",
    stamp: "L006",
    badge: "B1/B2",
    hasAttachment: true,
    crs: true,
    category: "inspection",
  },
  {
    id: 4,
    date: "15 Jan 2026",
    day: "15",
    month: "Jan",
    year: "2026",
    type: "Scheduled Maintenance",
    subtype: "Component Replacement",
    aircraft: "BOEING 737-800",
    reg: "HS-DBV",
    station: "BKK",
    ata: "32",
    duration: 4,
    flightRef: "WO-2026-0102",
    stamp: "L006",
    badge: "B1/B2",
    hasAttachment: true,
    crs: true,
    category: "scheduled",
  },
  {
    id: 5,
    date: "20 Jan 2026",
    day: "20",
    month: "Jan",
    year: "2026",
    type: "Transit Check",
    subtype: "Fuel System Inspection",
    aircraft: "AIRBUS A320-200",
    reg: "VT-EXG",
    station: "BKK",
    ata: "49",
    duration: 2,
    flightRef: "TR632 SIN-BKK 20/01/2026",
    stamp: "L006",
    badge: "B1/B2",
    hasAttachment: true,
    crs: true,
    category: "inspection",
  },
  {
    id: 6,
    date: "03 Feb 2026",
    day: "03",
    month: "Feb",
    year: "2026",
    type: "Engine Inspection",
    subtype: "Borescope Inspection (BSI)",
    aircraft: "AIRBUS A321neo",
    reg: "HS-TXF",
    station: "BKK",
    ata: "71, 72",
    duration: 5,
    flightRef: "BSI-2026-0031",
    stamp: "L006",
    badge: "B1/B2",
    hasAttachment: true,
    crs: true,
    category: "engine",
  },
  {
    id: 7,
    date: "10 Feb 2026",
    day: "10",
    month: "Feb",
    year: "2026",
    type: "Unscheduled Maintenance",
    subtype: "Hydraulic Leak Repair",
    aircraft: "BOEING 737-800",
    reg: "HS-DBV",
    station: "BKK",
    ata: "29",
    duration: 6,
    flightRef: "WO-2026-0187",
    stamp: "L006",
    badge: "B1/B2",
    hasAttachment: true,
    crs: true,
    category: "unscheduled",
  },
  {
    id: 8,
    date: "14 Feb 2026",
    day: "14",
    month: "Feb",
    year: "2026",
    type: "Transit Check",
    subtype: "Check / Visual Inspection (INSP)",
    aircraft: "AIRBUS A320-200",
    reg: "VT-EXE",
    station: "BKK",
    ata: "05, 12",
    duration: 1,
    flightRef: "TR616 SIN-BKK 14/02/2026",
    stamp: "L006",
    badge: "B1/B2",
    hasAttachment: true,
    crs: true,
    category: "inspection",
  },
  {
    id: 9,
    date: "22 Feb 2026",
    day: "22",
    month: "Feb",
    year: "2026",
    type: "Scheduled Maintenance",
    subtype: "Landing Gear Inspection",
    aircraft: "AIRBUS A321neo",
    reg: "HS-TXF",
    station: "BKK",
    ata: "32",
    duration: 4.5,
    flightRef: "WO-2026-0245",
    stamp: "L006",
    badge: "B1/B2",
    hasAttachment: true,
    crs: true,
    category: "scheduled",
  },
  {
    id: 10,
    date: "01 Mar 2026",
    day: "01",
    month: "Mar",
    year: "2026",
    type: "Engine Inspection",
    subtype: "Oil Analysis & Filter Check",
    aircraft: "BOEING 737-800",
    reg: "HS-DBV",
    station: "BKK",
    ata: "79",
    duration: 2,
    flightRef: "BSI-2026-0058",
    stamp: "L006",
    badge: "B1/B2",
    hasAttachment: false,
    crs: true,
    category: "engine",
  },
];

const categoryConfig = {
  inspection: { color: "#0EA5E9", bg: "rgba(14,165,233,0.08)", label: "INSP" },
  scheduled: { color: "#8B5CF6", bg: "rgba(139,92,246,0.08)", label: "SCHD" },
  engine: { color: "#F97316", bg: "rgba(249,115,22,0.08)", label: "ENG" },
  unscheduled: { color: "#EF4444", bg: "rgba(239,68,68,0.08)", label: "UNSC" },
};

export default function MaintenanceLogbook() {
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [viewMode, setViewMode] = useState("list");

  const filtered =
    filter === "all"
      ? maintenanceTasks
      : maintenanceTasks.filter((t) => t.category === filter);

  const totalHours = filtered.reduce((a, t) => a + t.duration, 0);

  const stats = {
    inspection: maintenanceTasks.filter((t) => t.category === "inspection").length,
    scheduled: maintenanceTasks.filter((t) => t.category === "scheduled").length,
    engine: maintenanceTasks.filter((t) => t.category === "engine").length,
    unscheduled: maintenanceTasks.filter((t) => t.category === "unscheduled").length,
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0B0F1A",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      color: "#E2E8F0",
      padding: "0",
      position: "relative",
      overflow: "hidden",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* Ambient glow */}
      <div style={{
        position: "fixed", top: "-200px", right: "-200px",
        width: "600px", height: "600px",
        background: "radial-gradient(circle, rgba(14,165,233,0.06) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "fixed", bottom: "-300px", left: "-100px",
        width: "500px", height: "500px",
        background: "radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px",
          }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "10px",
              background: "linear-gradient(135deg, #0EA5E9, #6366F1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px", fontWeight: "700", color: "#fff",
              fontFamily: "'JetBrains Mono', monospace",
              boxShadow: "0 0 20px rgba(14,165,233,0.3)",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <div>
              <h1 style={{
                fontSize: "22px", fontWeight: "700", margin: 0,
                letterSpacing: "-0.02em", color: "#F1F5F9",
              }}>
                Maintenance Experiences Logbook
              </h1>
              <div style={{
                fontSize: "12px", color: "#64748B",
                fontFamily: "'JetBrains Mono', monospace",
                marginTop: "2px",
              }}>
                SAMS-FM-CM-041 Rev.03 &nbsp;·&nbsp; 5 AUG 2025
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px",
          marginBottom: "24px",
        }}>
          {[
            { label: "Total Tasks", value: maintenanceTasks.length, icon: "📋", accent: "#0EA5E9" },
            { label: "Total Hours", value: `${totalHours}`, icon: "⏱", accent: "#8B5CF6" },
            { label: "Aircraft Types", value: "3", icon: "✈", accent: "#F97316" },
            { label: "CRS Completed", value: `${maintenanceTasks.filter(t => t.crs).length}/${maintenanceTasks.length}`, icon: "✓", accent: "#10B981" },
          ].map((stat, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "14px",
              padding: "18px 16px",
              position: "relative",
              overflow: "hidden",
              transition: "all 0.2s ease",
              cursor: "default",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              e.currentTarget.style.borderColor = `${stat.accent}33`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
            }}
            >
              <div style={{
                position: "absolute", top: "-10px", right: "-10px",
                width: "60px", height: "60px",
                background: `radial-gradient(circle, ${stat.accent}10, transparent 70%)`,
              }} />
              <div style={{ fontSize: "12px", color: "#64748B", marginBottom: "6px", fontWeight: "500", letterSpacing: "0.05em" }}>
                {stat.label}
              </div>
              <div style={{
                fontSize: "26px", fontWeight: "700", color: stat.accent,
                fontFamily: "'JetBrains Mono', monospace",
                lineHeight: 1,
              }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: "20px", flexWrap: "wrap", gap: "12px",
        }}>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {[
              { key: "all", label: "All", count: maintenanceTasks.length },
              { key: "inspection", label: "Inspection", count: stats.inspection },
              { key: "scheduled", label: "Scheduled", count: stats.scheduled },
              { key: "engine", label: "Engine", count: stats.engine },
              { key: "unscheduled", label: "Unscheduled", count: stats.unscheduled },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: "7px 14px",
                  borderRadius: "8px",
                  border: filter === f.key
                    ? `1px solid ${f.key === "all" ? "#0EA5E9" : categoryConfig[f.key]?.color || "#0EA5E9"}`
                    : "1px solid rgba(255,255,255,0.08)",
                  background: filter === f.key
                    ? `${f.key === "all" ? "rgba(14,165,233,0.12)" : categoryConfig[f.key]?.bg || "rgba(14,165,233,0.12)"}`
                    : "rgba(255,255,255,0.02)",
                  color: filter === f.key
                    ? (f.key === "all" ? "#0EA5E9" : categoryConfig[f.key]?.color || "#0EA5E9")
                    : "#94A3B8",
                  fontSize: "13px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex", alignItems: "center", gap: "6px",
                }}
              >
                {f.label}
                <span style={{
                  fontSize: "11px",
                  fontFamily: "'JetBrains Mono', monospace",
                  opacity: 0.7,
                }}>{f.count}</span>
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "3px" }}>
            {["list", "compact"].map(m => (
              <button key={m} onClick={() => setViewMode(m)} style={{
                padding: "6px 12px", borderRadius: "6px", border: "none",
                background: viewMode === m ? "rgba(255,255,255,0.08)" : "transparent",
                color: viewMode === m ? "#E2E8F0" : "#64748B",
                fontSize: "12px", fontWeight: "500", cursor: "pointer",
                textTransform: "capitalize", transition: "all 0.15s ease",
              }}>{m}</button>
            ))}
          </div>
        </div>

        {/* Task List */}
        <div style={{ display: "flex", flexDirection: "column", gap: viewMode === "compact" ? "2px" : "10px" }}>
          {filtered.map((task, idx) => {
            const cat = categoryConfig[task.category];
            const isExpanded = expandedId === task.id;

            if (viewMode === "compact") {
              return (
                <div key={task.id}
                  onClick={() => setExpandedId(isExpanded ? null : task.id)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "80px 1fr 120px 80px 60px 70px",
                    alignItems: "center",
                    padding: "10px 16px",
                    background: idx % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                    transition: "background 0.15s ease",
                    gap: "12px",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                  onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent"}
                >
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#64748B", fontSize: "12px" }}>{task.date}</span>
                  <span style={{ color: "#E2E8F0", fontWeight: "500" }}>{task.type} — {task.subtype}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#94A3B8", fontSize: "12px" }}>{task.reg}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#94A3B8", fontSize: "12px" }}>ATA {task.ata}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: cat.color, fontSize: "12px", fontWeight: "600" }}>{task.duration}h</span>
                  <span style={{
                    fontSize: "10px", fontWeight: "600", color: cat.color,
                    background: cat.bg, padding: "3px 8px", borderRadius: "4px",
                    textAlign: "center", letterSpacing: "0.05em",
                  }}>{cat.label}</span>
                </div>
              );
            }

            return (
              <div
                key={task.id}
                onClick={() => setExpandedId(isExpanded ? null : task.id)}
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: `1px solid ${isExpanded ? cat.color + "40" : "rgba(255,255,255,0.05)"}`,
                  borderRadius: "16px",
                  padding: "0",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  animation: `fadeSlideIn 0.4s ease ${idx * 0.05}s both`,
                }}
                onMouseEnter={e => {
                  if (!isExpanded) {
                    e.currentTarget.style.borderColor = cat.color + "30";
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  }
                }}
                onMouseLeave={e => {
                  if (!isExpanded) {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.025)";
                  }
                }}
              >
                <div style={{ display: "flex", alignItems: "stretch" }}>
                  {/* Date Column */}
                  <div style={{
                    width: "80px", minWidth: "80px",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    padding: "20px 0",
                    borderRight: "1px solid rgba(255,255,255,0.05)",
                    background: `linear-gradient(180deg, ${cat.color}08, transparent)`,
                  }}>
                    <div style={{
                      fontSize: "28px", fontWeight: "700", lineHeight: 1,
                      color: cat.color,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>{task.day}</div>
                    <div style={{
                      fontSize: "11px", color: "#64748B", marginTop: "2px",
                      fontWeight: "600", letterSpacing: "0.05em", textTransform: "uppercase",
                    }}>{task.month} {task.year}</div>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, padding: "16px 20px", minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <h3 style={{
                            margin: 0, fontSize: "15px", fontWeight: "600",
                            color: "#F1F5F9", lineHeight: 1.3,
                          }}>
                            {task.type}
                          </h3>
                          <span style={{
                            fontSize: "10px", fontWeight: "600",
                            color: cat.color, background: cat.bg,
                            padding: "2px 8px", borderRadius: "4px",
                            letterSpacing: "0.06em",
                          }}>{cat.label}</span>
                        </div>
                        <div style={{
                          fontSize: "13px", color: "#94A3B8", marginTop: "2px",
                        }}>{task.subtype}</div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                        {/* Duration */}
                        <div style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "14px", fontWeight: "600",
                          color: cat.color,
                          background: cat.bg,
                          padding: "4px 10px",
                          borderRadius: "8px",
                          whiteSpace: "nowrap",
                        }}>
                          {task.duration}h
                        </div>
                        {/* CRS */}
                        {task.crs && (
                          <div style={{
                            display: "flex", alignItems: "center", gap: "4px",
                            color: "#10B981", fontSize: "12px", fontWeight: "600",
                          }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                              <polyline points="22 4 12 14.01 9 11.01"/>
                            </svg>
                            CRS
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Meta Row */}
                    <div style={{
                      display: "flex", alignItems: "center", gap: "16px",
                      marginTop: "10px", flexWrap: "wrap",
                    }}>
                      {[
                        { icon: "✈", text: `${task.aircraft} · ${task.reg}` },
                        { icon: "📍", text: task.station },
                        { icon: "🔧", text: `ATA ${task.ata}` },
                      ].map((meta, mi) => (
                        <div key={mi} style={{
                          display: "flex", alignItems: "center", gap: "5px",
                          fontSize: "12px", color: "#64748B",
                        }}>
                          <span style={{ fontSize: "11px" }}>{meta.icon}</span>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{meta.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Expanded Detail */}
                    {isExpanded && (
                      <div style={{
                        marginTop: "14px", paddingTop: "14px",
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                        display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px",
                        animation: "fadeIn 0.2s ease",
                      }}>
                        {[
                          { label: "Flight / WO Ref", value: task.flightRef },
                          { label: "Stamp", value: task.stamp },
                          { label: "License", value: task.badge },
                          { label: "Attachment", value: task.hasAttachment ? "Available" : "None" },
                        ].map((d, di) => (
                          <div key={di}>
                            <div style={{ fontSize: "10px", color: "#475569", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "2px" }}>
                              {d.label}
                            </div>
                            <div style={{
                              fontSize: "13px", color: "#CBD5E1",
                              fontFamily: "'JetBrains Mono', monospace",
                            }}>{d.value}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Summary */}
        <div style={{
          marginTop: "24px",
          background: "linear-gradient(135deg, rgba(14,165,233,0.08), rgba(99,102,241,0.08))",
          border: "1px solid rgba(14,165,233,0.15)",
          borderRadius: "14px",
          padding: "18px 24px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: "12px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <div>
              <div style={{ fontSize: "11px", color: "#64748B", fontWeight: "600", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Showing
              </div>
              <div style={{
                fontSize: "22px", fontWeight: "700", color: "#0EA5E9",
                fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.2,
              }}>
                {filtered.length} <span style={{ fontSize: "13px", color: "#64748B", fontWeight: "500" }}>tasks</span>
              </div>
            </div>
            <div style={{ width: "1px", height: "36px", background: "rgba(255,255,255,0.08)" }} />
            <div>
              <div style={{ fontSize: "11px", color: "#64748B", fontWeight: "600", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Total Duration
              </div>
              <div style={{
                fontSize: "22px", fontWeight: "700", color: "#8B5CF6",
                fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.2,
              }}>
                {totalHours} <span style={{ fontSize: "13px", color: "#64748B", fontWeight: "500" }}>hours</span>
              </div>
            </div>
          </div>
          <div style={{
            fontSize: "11px", color: "#475569",
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            SAMS-FM-CM-041 Rev.03
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button { font-family: inherit; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>
    </div>
  );
}
