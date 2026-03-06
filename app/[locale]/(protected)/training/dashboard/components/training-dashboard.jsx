import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from "recharts";

// ── PALETTE ──────────────────────────────────────────────────────────────────
const C = {
  primary:   "#1a56db",
  primary2:  "#1e40af",
  primary3:  "#3b82f6",
  primary4:  "#93c5fd",
  primary5:  "#dbeafe",
  green:     "#16a34a",
  greenL:    "#dcfce7",
  orange:    "#d97706",
  orangeL:   "#fef3c7",
  red:       "#dc2626",
  redL:      "#fee2e2",
  yellow:    "#ca8a04",
  bg:        "#f0f4ff",
  surface:   "#ffffff",
  sidebar:   "#1e3a8a",
  sidebarD:  "#172554",
  border:    "#e2e8f0",
  text:      "#0f172a",
  muted:     "#64748b",
  mutedL:    "#94a3b8",
};

// ── DATA ─────────────────────────────────────────────────────────────────────
const workloadData = [
  { month:"MAR", scheduled:32, available:10, overload:3 },
  { month:"APR", scheduled:28, available:14, overload:0 },
  { month:"MAY", scheduled:25, available:17, overload:0 },
  { month:"JUN", scheduled:38, available:5,  overload:5 },
  { month:"JUL", scheduled:22, available:20, overload:0 },
  { month:"AUG", scheduled:30, available:12, overload:0 },
];

const authData = [
  { name:"Valid",          value:179, color:C.green   },
  { name:"Expiring <30d",  value:21,  color:C.primary3 },
  { name:"Expiring 60-90d",value:14,  color:C.primary4 },
  { name:"Expired",        value:34,  color:C.red      },
];

const missingSkills = [
  { rank:1, name:"Human Factors",    cat:"REGULATORY · EASA", pct:68 },
  { rank:2, name:"Fuel Tank Safety", cat:"SAFETY · CASA",     pct:54 },
  { rank:3, name:"Engine Run-up",    cat:"TECHNICAL · CAAT",  pct:41 },
  { rank:4, name:"SMS Awareness",    cat:"REGULATORY",         pct:35 },
  { rank:5, name:"EWIS",            cat:"TECHNICAL · EASA",   pct:28 },
];

const criticalAlerts = [
  { emp:"Mr. Phaisal Sangasang", course:"RVSM/PBN/RNP CAT II/III", since:"18-Feb-2026", days:16,  dept:"Maintenance" },
  { emp:"Ms. Siriporn Chaiyut",  course:"Human Factors",            since:"01-Feb-2026", days:33,  dept:"Compliance"  },
  { emp:"Mr. Anon Sombat",       course:"Fuel Tank Safety",         since:"15-Jan-2026", days:50,  dept:"Maintenance" },
  { emp:"Ms. Wanida Pracha",     course:"SMS Recurrent",            since:"10-Jan-2026", days:55,  dept:"Safety"      },
];

const navItems = [
  { icon:"✈", label:"Flight List" },
  { icon:"📄", label:"Contract"   },
  { icon:"🧾", label:"Invoice"    },
  { icon:"📊", label:"Report"     },
  { icon:"🎓", label:"Training",  active:true },
  { icon:"⚙️", label:"Master Data"},
];

// ── CUSTOM TOOLTIP ────────────────────────────────────────────────────────────
const WorkloadTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 14px", fontSize:12, boxShadow:"0 4px 16px rgba(0,0,0,.1)" }}>
      <div style={{ fontWeight:700, marginBottom:6, color:C.text }}>{label} 2026</div>
      {payload.map(p => (
        <div key={p.name} style={{ display:"flex", justifyContent:"space-between", gap:16, color:p.color }}>
          <span>{p.name}</span><span style={{ fontWeight:600 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── DONUT CENTER LABEL ────────────────────────────────────────────────────────
const DonutLabel = ({ viewBox }) => {
  const { cx, cy } = viewBox;
  return (
    <g>
      <text x={cx} y={cy-8} textAnchor="middle" fill={C.primary} fontSize={28} fontWeight={800}>87%</text>
      <text x={cx} y={cy+14} textAnchor="middle" fill={C.muted} fontSize={11} letterSpacing={1}>COMPLIANT</text>
    </g>
  );
};

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [activeNav, setActiveNav] = useState("Training");
  const [alertTab, setAlertTab]   = useState("all");
  const [gapTab, setGapTab]       = useState("missing");
  const now = "06 MAR 2026, 15:38 ICT";

  return (
    <div style={{ display:"flex", height:"100vh", background:C.bg, fontFamily:"'Segoe UI',system-ui,sans-serif", overflow:"hidden" }}>

      {/* ── SIDEBAR ── */}
      <div style={{ width:80, background:`linear-gradient(180deg,${C.sidebar},${C.sidebarD})`, display:"flex", flexDirection:"column", alignItems:"center", paddingTop:0, flexShrink:0, boxShadow:"2px 0 16px rgba(30,58,138,.25)" }}>
        {/* Logo */}
        <div style={{ width:"100%", padding:"18px 0 20px", display:"flex", flexDirection:"column", alignItems:"center", borderBottom:"1px solid rgba(255,255,255,.1)", marginBottom:8 }}>
          <div style={{ width:46, height:46, background:"#fff", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 10px rgba(0,0,0,.2)" }}>
            <span style={{ fontSize:11, fontWeight:900, color:C.primary2, letterSpacing:.5 }}>SAMS</span>
          </div>
        </div>
        {navItems.map(n => (
          <div key={n.label} onClick={()=>setActiveNav(n.label)}
            style={{ width:"100%", padding:"12px 0", display:"flex", flexDirection:"column", alignItems:"center", gap:4, cursor:"pointer",
              background: n.label===activeNav ? "rgba(255,255,255,.15)" : "transparent",
              borderLeft: n.label===activeNav ? `3px solid #fff` : "3px solid transparent",
              transition:"all .2s" }}>
            <span style={{ fontSize:18 }}>{n.icon}</span>
            <span style={{ fontSize:9, color: n.label===activeNav?"#fff":"rgba(255,255,255,.55)", letterSpacing:.5, textAlign:"center", lineHeight:1.2 }}>{n.label}</span>
          </div>
        ))}
      </div>

      {/* ── MAIN ── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* TOP BAR */}
        <div style={{ background:"#fff", borderBottom:`1px solid ${C.border}`, padding:"0 28px", height:52, display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
          <span style={{ color:C.muted, fontSize:16 }}>→</span>
          <div style={{ flex:1 }}/>
          <div style={{ display:"flex", gap:10 }}>
            <button style={{ padding:"6px 14px", borderRadius:7, border:`1.5px solid ${C.border}`, background:"#fff", fontSize:12, color:C.text, cursor:"pointer", fontWeight:500, display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:11 }}>↓</span> EXPORT REPORT
            </button>
            <button style={{ padding:"6px 16px", borderRadius:7, border:"none", background:`linear-gradient(135deg,${C.primary},${C.primary2})`, fontSize:12, color:"#fff", cursor:"pointer", fontWeight:600, boxShadow:`0 2px 8px ${C.primary}55` }}>
              + ENROLL
            </button>
          </div>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div style={{ flex:1, overflowY:"auto", padding:"24px 28px" }}>

          {/* PAGE TITLE */}
          <div style={{ marginBottom:22 }}>
            <div style={{ fontSize:26, fontWeight:800, color:C.text, letterSpacing:-.5 }}>
              Training &amp; <span style={{ color:C.primary }}>Compliance</span>
            </div>
            <div style={{ fontSize:12, color:C.muted, marginTop:3 }}>
              // SAMS · อัปเดตล่าสุด: {now}
            </div>
          </div>

          {/* ── KPI CARDS ── */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:20 }}>
            {[
              { label:"TOTAL STAFF",          val:"248",  sub:"+4 เพิ่มเดือนนี้",             color:C.primary,  dotColor:C.primary,  icon:"👥", bg:`linear-gradient(135deg,#eff6ff,#dbeafe)`, border:C.primary4 },
              { label:"COMPLIANCE RATE",       val:"87%",  sub:"216/248 พนักงานครบถ้วน",       color:C.green,    dotColor:C.green,    icon:"✅", bg:`linear-gradient(135deg,#f0fdf4,#dcfce7)`, border:"#86efac" },
              { label:"TRAINING IN PROGRESS",  val:"34",   sub:"7 คอร์ส กำลังดำเนินการ",        color:C.primary,  dotColor:C.primary3, icon:"📚", bg:`linear-gradient(135deg,#eff6ff,#dbeafe)`, border:C.primary4 },
              { label:"CRITICAL ALERTS",       val:"12",   sub:"ใบอนุญาต Expired — ต้องดำเนินการ", color:C.red,  dotColor:C.red,      icon:"🚨", bg:`linear-gradient(135deg,#fff1f2,#fee2e2)`, border:"#fca5a5" },
            ].map(k=>(
              <div key={k.label} style={{ background:k.bg, border:`1.5px solid ${k.border}`, borderRadius:14, padding:"18px 20px", position:"relative", overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,.05)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:10 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:k.dotColor }}/>
                  <div style={{ fontSize:10, fontWeight:700, color:k.dotColor, letterSpacing:1.5 }}>{k.label}</div>
                </div>
                <div style={{ fontSize:38, fontWeight:900, color:k.color, lineHeight:1, marginBottom:6 }}>{k.val}</div>
                <div style={{ fontSize:11, color:C.muted }}>{k.sub}</div>
                <div style={{ position:"absolute", right:14, bottom:12, fontSize:32, opacity:.12 }}>{k.icon}</div>
              </div>
            ))}
          </div>

          {/* ── ROW 2: DONUT + BAR + MISSING SKILLS ── */}
          <div style={{ display:"grid", gridTemplateColumns:"300px 1fr 280px", gap:16, marginBottom:20 }}>

            {/* AUTHORIZATION STATUS */}
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:20, boxShadow:"0 2px 12px rgba(0,0,0,.04)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:C.text, letterSpacing:1 }}>AUTHORIZATION STATUS</div>
                <div style={{ padding:"2px 8px", borderRadius:5, background:`linear-gradient(135deg,${C.primary},${C.primary2})`, fontSize:9, color:"#fff", fontWeight:700, letterSpacing:1 }}>LIVE</div>
              </div>

              <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>
                <PieChart width={190} height={190}>
                  <Pie data={authData} cx={90} cy={90} innerRadius={60} outerRadius={88}
                    dataKey="value" paddingAngle={2} startAngle={90} endAngle={-270}
                    labelLine={false}>
                    {authData.map((d,i)=><Cell key={i} fill={d.color}/>)}
                    <DonutLabel/>
                  </Pie>
                </PieChart>
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {authData.map(d=>(
                  <div key={d.name} style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:10, height:10, borderRadius:2, background:d.color }}/>
                      <span style={{ fontSize:12, color:C.muted }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize:13, fontWeight:700, color:d.color }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* MONTHLY TRAINING WORKLOAD */}
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:20, boxShadow:"0 2px 12px rgba(0,0,0,.04)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                <div style={{ fontSize:11, fontWeight:700, color:C.text, letterSpacing:1 }}>MONTHLY TRAINING WORKLOAD</div>
                <div style={{ padding:"2px 10px", borderRadius:5, background:C.primary5, border:`1px solid ${C.primary4}`, fontSize:10, color:C.primary, fontWeight:600 }}>2026</div>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
                <div style={{ fontSize:11, color:C.muted }}>คอร์ส/เดือน</div>
                <div style={{ fontSize:10, color:C.muted }}>CAPACITY MAX: 45</div>
              </div>

              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={workloadData} barSize={28} barCategoryGap="30%">
                  <XAxis dataKey="month" tick={{ fontSize:11, fill:C.muted }} axisLine={false} tickLine={false}/>
                  <YAxis domain={[0,45]} tick={{ fontSize:10, fill:C.muted }} axisLine={false} tickLine={false} width={24}/>
                  <Tooltip content={<WorkloadTooltip/>}/>
                  <Bar dataKey="available" name="Available Capacity" stackId="a" fill={C.primary5} radius={[0,0,0,0]}/>
                  <Bar dataKey="scheduled" name="Scheduled"          stackId="a" fill={C.primary}  radius={[0,0,0,0]}/>
                  <Bar dataKey="overload"  name="Overload ⚠"         stackId="a" fill={C.red}      radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>

              <div style={{ display:"flex", gap:16, marginTop:8, justifyContent:"center" }}>
                {[["Available Capacity",C.primary5,C.primary4],["Scheduled",C.primary,C.primary],["Overload ⚠",C.red,C.red]].map(([l,bg,bd])=>(
                  <div key={l} style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <div style={{ width:12, height:10, borderRadius:2, background:bg, border:`1px solid ${bd}` }}/>
                    <span style={{ fontSize:10, color:C.muted }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* TOP MISSING SKILLS */}
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:20, boxShadow:"0 2px 12px rgba(0,0,0,.04)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:C.text, letterSpacing:1 }}>TOP MISSING SKILLS</div>
                <button onClick={()=>setGapTab(gapTab==="missing"?"gap":"missing")} style={{ padding:"2px 10px", borderRadius:5, background:C.primary5, border:`1px solid ${C.primary4}`, fontSize:9, color:C.primary, fontWeight:600, cursor:"pointer", letterSpacing:1 }}>
                  {gapTab==="missing"?"GAP ANALYSIS ›":"MISSING SKILLS ›"}
                </button>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {missingSkills.map(s=>(
                  <div key={s.rank} style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                    <div style={{ width:22, height:22, borderRadius:"50%", background:C.primary5, border:`1.5px solid ${C.primary4}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:C.primary, flexShrink:0, marginTop:1 }}>{s.rank}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{s.name}</div>
                      <div style={{ fontSize:9, color:C.muted, letterSpacing:.5, marginBottom:5 }}>{s.cat}</div>
                      <div style={{ height:3, background:C.primary5, borderRadius:2, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${s.pct}%`, background:`linear-gradient(90deg,${C.primary},${C.primary3})`, borderRadius:2 }}/>
                      </div>
                    </div>
                    <div style={{ fontSize:11, fontWeight:700, color:C.primary, flexShrink:0 }}>{s.pct}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── ROW 3: CRITICAL ALERTS TABLE ── */}
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,.04)", marginBottom:20 }}>
            <div style={{ padding:"16px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:C.red }}/>
              <div style={{ fontSize:11, fontWeight:700, color:C.text, letterSpacing:1 }}>CRITICAL ALERTS — LICENSE EXPIRED</div>
              <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
                {["all","maintenance","compliance","safety"].map(t=>(
                  <button key={t} onClick={()=>setAlertTab(t)} style={{ padding:"3px 10px", borderRadius:5, fontSize:10, fontWeight:600, cursor:"pointer", letterSpacing:.5, textTransform:"uppercase",
                    background: alertTab===t ? `linear-gradient(135deg,${C.primary},${C.primary2})` : C.primary5,
                    border: alertTab===t ? "none" : `1px solid ${C.primary4}`,
                    color: alertTab===t ? "#fff" : C.primary }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:C.bg }}>
                  {["Employee","Course","Dept","Expired Since","Days Overdue","Action"].map(h=>(
                    <th key={h} style={{ padding:"10px 16px", fontSize:10, fontWeight:700, color:C.muted, textAlign:"left", letterSpacing:1, borderBottom:`1px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {criticalAlerts
                  .filter(a => alertTab==="all" || a.dept.toLowerCase()===alertTab)
                  .map((a,i)=>(
                  <tr key={i} style={{ borderBottom:`1px solid ${C.border}` }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.bg}
                    onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                    <td style={{ padding:"12px 16px" }}>
                      <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{a.emp}</div>
                    </td>
                    <td style={{ padding:"12px 16px" }}>
                      <div style={{ fontSize:12, color:C.text }}>{a.course}</div>
                    </td>
                    <td style={{ padding:"12px 16px" }}>
                      <span style={{ padding:"2px 8px", borderRadius:4, background:C.primary5, border:`1px solid ${C.primary4}`, fontSize:10, color:C.primary, fontWeight:600 }}>{a.dept}</span>
                    </td>
                    <td style={{ padding:"12px 16px", fontSize:12, color:C.muted, fontFamily:"monospace" }}>{a.since}</td>
                    <td style={{ padding:"12px 16px" }}>
                      <span style={{ padding:"3px 10px", borderRadius:12, background:a.days>50?C.redL:"#fff7ed", border:`1px solid ${a.days>50?"#fca5a5":"#fdba74"}`, fontSize:11, fontWeight:700, color:a.days>50?C.red:C.orange }}>
                        {a.days}d overdue
                      </span>
                    </td>
                    <td style={{ padding:"12px 16px" }}>
                      <button style={{ padding:"5px 12px", borderRadius:6, background:`linear-gradient(135deg,${C.primary},${C.primary2})`, border:"none", color:"#fff", fontSize:11, fontWeight:600, cursor:"pointer", boxShadow:`0 2px 6px ${C.primary}44` }}>
                        Enroll Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── ROW 4: QUICK STATS ── */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
            {[
              { label:"Courses Completed This Month", val:"47",  icon:"✅", color:C.green,   bg:C.greenL,   border:"#86efac" },
              { label:"Avg. Days to Renew",           val:"8.4", icon:"⏱", color:C.primary, bg:C.primary5, border:C.primary4 },
              { label:"Upcoming Expirations (30d)",   val:"21",  icon:"📅", color:C.orange,  bg:C.orangeL,  border:"#fcd34d" },
              { label:"Certifying Staff Compliant",   val:"93%", icon:"🎖", color:C.primary, bg:C.primary5, border:C.primary4 },
            ].map(k=>(
              <div key={k.label} style={{ background:k.bg, border:`1.5px solid ${k.border}`, borderRadius:12, padding:"14px 16px", display:"flex", gap:12, alignItems:"center" }}>
                <div style={{ fontSize:24 }}>{k.icon}</div>
                <div>
                  <div style={{ fontSize:22, fontWeight:800, color:k.color, lineHeight:1 }}>{k.val}</div>
                  <div style={{ fontSize:10, color:C.muted, marginTop:3, lineHeight:1.3 }}>{k.label}</div>
                </div>
              </div>
            ))}
          </div>

        </div>{/* end scroll */}
      </div>{/* end main */}
    </div>
  );
}
