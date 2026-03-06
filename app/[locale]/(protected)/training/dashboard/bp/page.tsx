'use client'
import React, { useState, useEffect } from 'react'
import './training-dashboard.css'

// ── Mock Data ──
const metricsData = [
    { label: 'Total Staff', value: '248', sub: <><span>+4</span> เพิ่มเดือนนี้</>, icon: '👥', color: 'blue' },
    { label: 'Compliance Rate', value: '87%', sub: <><span>216/248</span> พนักงานครบถ้วน</>, icon: '✅', color: 'green' },
    { label: 'Training in Progress', value: '34', sub: <><span>7 คอร์ส</span> กำลังดำเนินการ</>, icon: '📚', color: 'amber' },
    { label: 'Critical Alerts', value: '12', sub: <>ใบอนุญาต <span style={{ color: '#dc2626' }}>Expired</span> — ต้องดำเนินการ</>, icon: '🚨', color: 'red' },
]

const skillsData = [
    { rank: 1, name: 'Human Factors', cat: 'REGULATORY · EASA', pct: 92, count: 46 },
    { rank: 2, name: 'Fuel Tank Safety', cat: 'SAFETY · CASA', pct: 72, count: 36 },
    { rank: 3, name: 'Engine Run-up', cat: 'TECHNICAL · CAAT', pct: 54, count: 27 },
    { rank: 4, name: 'SMS Awareness', cat: 'REGULATORY · ICAO', pct: 42, count: 21 },
    { rank: 5, name: 'NDT Level II', cat: 'TECHNICAL · CAAT', pct: 30, count: 15 },
]

const barData = [
    { month: 'MAR', capacity: 30, scheduled: 52, overload: 8 },
    { month: 'APR', capacity: 35, scheduled: 42, overload: 0 },
    { month: 'MAY', capacity: 40, scheduled: 32, overload: 0 },
    { month: 'JUN', capacity: 28, scheduled: 58, overload: 5 },
    { month: 'JUL', capacity: 38, scheduled: 30, overload: 0 },
    { month: 'AUG', capacity: 32, scheduled: 24, overload: 0 },
]

const staffData = [
    {
        name: 'นายสมชาย ชาญชัย', id: 'EMP-0412', initials: 'SC',
        avatarBg: 'linear-gradient(135deg,#7c3aed,#a855f7)',
        position: 'B1 Engineer', cert: 'Human Factors', certType: 'EASA Part-66 Module 9',
        expiry: '15 MAR 2026', expiryColor: '#2563eb',
        status: 'expiring', statusLabel: 'Expiring Soon', action: 'enroll',
    },
    {
        name: 'นายวิชัย ทองดี', id: 'EMP-0287', initials: 'VT',
        avatarBg: 'linear-gradient(135deg,#dc2626,#ef4444)',
        position: 'Technician', cert: 'Engine Run-up', certType: 'CAAT Authorization',
        expiry: '01 MAR 2026', expiryColor: '#dc2626',
        status: 'expired', statusLabel: 'Expired', action: 'suspend',
    },
    {
        name: 'Ms. Sarah Weston', id: 'EMP-0521', initials: 'SW',
        avatarBg: 'linear-gradient(135deg,#0369a1,#3b82f6)',
        position: 'Avionics', cert: 'Fuel Tank Safety', certType: 'EASA Part-145',
        expiry: '— ยังไม่มี —', expiryColor: '#94a3b8',
        status: 'new', statusLabel: 'New Staff', action: 'register',
    },
    {
        name: 'นายกมล มีชัย', id: 'EMP-0198', initials: 'KM',
        avatarBg: 'linear-gradient(135deg,#b45309,#f59e0b)',
        position: 'B2 Engineer', cert: 'NDT Level II', certType: 'CAAT / ASNT',
        expiry: '22 FEB 2026', expiryColor: '#dc2626',
        status: 'expired', statusLabel: 'Expired', action: 'suspend',
    },
    {
        name: 'นางสาวพิมพ์ อร่ามศรี', id: 'EMP-0367', initials: 'PA',
        avatarBg: 'linear-gradient(135deg,#065f46,#22c55e)',
        position: 'Structures', cert: 'SMS Awareness', certType: 'ICAO / CAAT',
        expiry: '28 MAR 2026', expiryColor: '#2563eb',
        status: 'expiring', statusLabel: 'Expiring Soon', action: 'enroll',
    },
]

const filters = ['ทั้งหมด (12)', 'Expired (7)', 'Expiring Soon (3)', 'New Staff (2)']

const calendarDays = [
    { day: 1 }, { day: 2 }, { day: 3 }, { day: 4 }, { day: 5 },
    { day: 6, today: true }, { day: 7, event: true },
    { day: 8, event: true }, { day: 9 }, { day: 10 },
    { day: 11, event: true }, { day: 12 }, { day: 13 },
    { day: 14, event: true }, { day: 15 },
    { day: 16, event: true }, { day: 17, event: true },
    { day: 18 }, { day: 19 }, { day: 20 },
    { day: 21, event: true },
]

// ── Component ──
export default function HRDashboardPage() {
    const [activeFilter, setActiveFilter] = useState(0)
    const [animateBars, setAnimateBars] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setAnimateBars(true), 500)
        return () => clearTimeout(timer)
    }, [])

    const now = new Date()
    const dateStr = now.toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
    }).toUpperCase()
    const timeStr = now.toLocaleTimeString('en-GB', {
        hour: '2-digit', minute: '2-digit', hour12: false,
    })

    return (
        <div className="hr-dashboard">
            {/* ── Page Header ── */}
            <div className="hr-page-header">
                <div>
                    <div className="hr-page-title">
                        Training &amp; <span>Compliance</span>
                    </div>
                    <div className="hr-page-subtitle">
            // SAMS · อัปเดตล่าสุด: {dateStr}, {timeStr} ICT
                    </div>
                </div>
                <div className="hr-header-actions">
                    <button className="hr-btn hr-btn-ghost">↓ Export Report</button>
                    <button className="hr-btn hr-btn-primary">+ Enroll Staff</button>
                </div>
            </div>

            {/* ── Metrics ── */}
            <div className="hr-metrics-grid">
                {metricsData.map((m, i) => (
                    <div key={i} className={`hr-metric-card ${m.color}`}>
                        <div className="hr-metric-label">
                            <span className="hr-metric-label-dot" />
                            {m.label}
                        </div>
                        <div className="hr-metric-value">{m.value}</div>
                        <div className="hr-metric-sub">{m.sub}</div>
                        <div className="hr-metric-icon">{m.icon}</div>
                    </div>
                ))}
            </div>

            {/* ── Analytics Row ── */}
            <div className="hr-analytics-row">
                {/* Donut Chart */}
                <div className="hr-panel">
                    <div className="hr-panel-header">
                        <div className="hr-panel-title">Authorization Status</div>
                        <div className="hr-panel-badge">LIVE</div>
                    </div>
                    <div className="hr-donut-container">
                        <div className="hr-donut-wrap">
                            <svg className="hr-donut-svg" width="160" height="160" viewBox="0 0 160 160">
                                <circle cx="80" cy="80" r="60" fill="none" stroke="#e2e8f0" strokeWidth="22" />
                                <circle cx="80" cy="80" r="60" fill="none" stroke="#22c55e" strokeWidth="22"
                                    strokeDasharray="271 106" strokeDashoffset="0" strokeLinecap="butt" />
                                <circle cx="80" cy="80" r="60" fill="none" stroke="#93c5fd" strokeWidth="22"
                                    strokeDasharray="38 339" strokeDashoffset="-271" strokeLinecap="butt" />
                                <circle cx="80" cy="80" r="60" fill="none" stroke="#60a5fa" strokeWidth="22"
                                    strokeDasharray="22 355" strokeDashoffset="-309" strokeLinecap="butt" />
                                <circle cx="80" cy="80" r="60" fill="none" stroke="#ef4444" strokeWidth="22"
                                    strokeDasharray="47 330" strokeDashoffset="-331" strokeLinecap="butt" />
                            </svg>
                            <div className="hr-donut-center">
                                <div className="hr-donut-pct">87%</div>
                                <div className="hr-donut-pct-label">Compliant</div>
                            </div>
                        </div>
                        <div className="hr-donut-legend">
                            <div className="hr-legend-item">
                                <div className="hr-legend-left"><div className="hr-legend-dot" style={{ background: '#16a34a' }} />Valid</div>
                                <div className="hr-legend-count" style={{ color: '#16a34a' }}>179</div>
                            </div>
                            <div className="hr-legend-item">
                                <div className="hr-legend-left"><div className="hr-legend-dot" style={{ background: '#93c5fd' }} />Expiring &lt;30d</div>
                                <div className="hr-legend-count" style={{ color: '#60a5fa' }}>21</div>
                            </div>
                            <div className="hr-legend-item">
                                <div className="hr-legend-left"><div className="hr-legend-dot" style={{ background: '#60a5fa' }} />Expiring 60-90d</div>
                                <div className="hr-legend-count" style={{ color: '#3b82f6' }}>14</div>
                            </div>
                            <div className="hr-legend-item">
                                <div className="hr-legend-left"><div className="hr-legend-dot" style={{ background: '#dc2626' }} />Expired</div>
                                <div className="hr-legend-count" style={{ color: '#dc2626' }}>34</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bar Chart */}
                <div className="hr-panel">
                    <div className="hr-panel-header">
                        <div className="hr-panel-title">Monthly Training Workload</div>
                        <div className="hr-panel-badge">2026</div>
                    </div>
                    <div className="hr-bar-chart-wrap">
                        <div className="hr-chart-labels">
                            <span>คอร์ส/คน</span>
                            <span>Capacity Max: 45</span>
                        </div>
                        <div className="hr-bar-group">
                            {barData.map((b, i) => (
                                <div key={i} className="hr-bar-col">
                                    <div className="hr-bar-stack" style={{ height: '100%' }}>
                                        <div className="hr-bar-seg capacity" style={{ height: `${b.capacity}%` }} />
                                        <div className="hr-bar-seg scheduled" style={{ height: `${b.scheduled}%` }} />
                                        {b.overload > 0 && (
                                            <div className="hr-bar-seg overload" style={{ height: `${b.overload}%` }} />
                                        )}
                                    </div>
                                    <div className="hr-bar-month">{b.month}</div>
                                </div>
                            ))}
                        </div>
                        <div className="hr-chart-legend">
                            <div className="hr-chart-legend-item">
                                <div className="hr-chart-legend-swatch" style={{ background: '#b8ceef' }} />Available Capacity
                            </div>
                            <div className="hr-chart-legend-item">
                                <div className="hr-chart-legend-swatch" style={{ background: '#3b82f6' }} />Scheduled
                            </div>
                            <div className="hr-chart-legend-item">
                                <div className="hr-chart-legend-swatch" style={{ background: '#dc2626' }} />Overload ⚠️
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Missing Skills */}
                <div className="hr-panel">
                    <div className="hr-panel-header">
                        <div className="hr-panel-title">Top Missing Skills</div>
                        <div className="hr-panel-badge">GAP ANALYSIS</div>
                    </div>
                    <div className="hr-skills-list">
                        {skillsData.map((s) => (
                            <div key={s.rank} className="hr-skill-item">
                                <div className="hr-skill-rank">{s.rank}</div>
                                <div className="hr-skill-info">
                                    <div className="hr-skill-name">{s.name}</div>
                                    <div className="hr-skill-cat">{s.cat}</div>
                                </div>
                                <div className="hr-skill-bar-wrap">
                                    <div className="hr-skill-bar-bg">
                                        <div
                                            className="hr-skill-bar-fill"
                                            style={{ width: animateBars ? `${s.pct}%` : '0%' }}
                                        />
                                    </div>
                                </div>
                                <div className="hr-skill-count">{s.count}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Action Required Table ── */}
            <div className="hr-action-section">
                <div className="hr-section-header">
                    <div className="hr-section-title">
                        ⚡ Action Required
                        <span className="hr-alert-count">12 CRITICAL</span>
                    </div>
                    <button className="hr-btn hr-btn-ghost">ดูทั้งหมด →</button>
                </div>
                <div className="hr-table-wrap">
                    <div className="hr-filter-bar">
                        {filters.map((f, i) => (
                            <button
                                key={i}
                                className={`hr-filter-chip ${activeFilter === i ? 'active' : ''}`}
                                onClick={() => setActiveFilter(i)}
                            >
                                {f}
                            </button>
                        ))}
                        <input className="hr-search-input" type="text" placeholder="🔍  ค้นหาพนักงาน..." />
                    </div>
                    <table className="hr-table">
                        <thead>
                            <tr>
                                <th>พนักงาน</th>
                                <th>ตำแหน่ง</th>
                                <th>ใบอนุญาต / คอร์ส</th>
                                <th>วันหมดอายุ</th>
                                <th>สถานะ</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staffData.map((s, i) => (
                                <tr key={i}>
                                    <td>
                                        <div className="hr-staff-cell">
                                            <div className="hr-staff-avatar" style={{ background: s.avatarBg }}>
                                                {s.initials}
                                            </div>
                                            <div>
                                                <div className="hr-staff-name">{s.name}</div>
                                                <div className="hr-staff-id">{s.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className="hr-pos-tag">{s.position}</span></td>
                                    <td>
                                        <div className="hr-cert-name">{s.cert}</div>
                                        <div className="hr-cert-type">{s.certType}</div>
                                    </td>
                                    <td className="hr-expiry-date" style={{ color: s.expiryColor }}>{s.expiry}</td>
                                    <td>
                                        <span className={`hr-status-pill hr-status-${s.status}`}>
                                            <span className="dot" />
                                            {s.statusLabel}
                                        </span>
                                    </td>
                                    <td>
                                        {s.action === 'enroll' && (
                                            <button className="hr-action-btn hr-action-enroll">📋 จัดลงคอร์ส</button>
                                        )}
                                        {s.action === 'suspend' && (
                                            <button className="hr-action-btn hr-action-suspend">🚫 ระงับ Roster</button>
                                        )}
                                        {s.action === 'register' && (
                                            <button className="hr-action-btn hr-action-register">+ ลงทะเบียน</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Bottom Integration Row ── */}
            <div className="hr-bottom-row">
                {/* Roster Sync */}
                <div className="hr-integration-card">
                    <div className="hr-int-header">
                        <div className="hr-int-icon roster">🚫</div>
                        <div>
                            <div className="hr-int-title">Roster Sync Status</div>
                            <div className="hr-int-sub">Block List · อัปเดต 09:41</div>
                        </div>
                    </div>
                    <div className="hr-int-stat">
                        <div className="hr-int-stat-row">
                            <div className="hr-int-stat-label">ถูก Block จาก Roster</div>
                            <div className="hr-int-stat-val val-red">7</div>
                        </div>
                        <div className="hr-int-stat-row">
                            <div className="hr-int-stat-label">รอ Clearance</div>
                            <div className="hr-int-stat-val val-amber">3</div>
                        </div>
                        <div className="hr-int-stat-row">
                            <div className="hr-int-stat-label">Cleared ล่าสุด</div>
                            <div className="hr-int-stat-val val-green">2</div>
                        </div>
                    </div>
                    <button className="hr-int-btn">🔗 ดู Roster Block List</button>
                </div>

                {/* Training Calendar */}
                <div className="hr-integration-card">
                    <div className="hr-int-header">
                        <div className="hr-int-icon calendar">📅</div>
                        <div>
                            <div className="hr-int-title">Training Calendar</div>
                            <div className="hr-int-sub">March 2026</div>
                        </div>
                    </div>
                    <div className="hr-calendar-strip">
                        {calendarDays.map((d, i) => (
                            <div
                                key={i}
                                className={`hr-cal-day ${d.today ? 'today' : ''} ${d.event ? 'has-event' : ''} ${!d.today && !d.event ? 'empty' : ''}`}
                            >
                                {d.day}
                            </div>
                        ))}
                    </div>
                    <button className="hr-int-btn">📋 ดู Training Plan เต็ม</button>
                </div>

                {/* Customer Auth Tracker */}
                <div className="hr-integration-card">
                    <div className="hr-int-header">
                        <div className="hr-int-icon customer">🏢</div>
                        <div>
                            <div className="hr-int-title">Customer Auth Tracker</div>
                            <div className="hr-int-sub">เอกสารลูกค้า · Q1 2026</div>
                        </div>
                    </div>
                    <div className="hr-int-stat">
                        <div className="hr-int-stat-row">
                            <div className="hr-int-stat-label">Approved</div>
                            <div className="hr-int-stat-val val-green">18</div>
                        </div>
                        <div className="hr-int-stat-row">
                            <div className="hr-int-stat-label">Pending Review</div>
                            <div className="hr-int-stat-val val-amber">5</div>
                        </div>
                        <div className="hr-int-stat-row">
                            <div className="hr-int-stat-label">Rejected / Revision</div>
                            <div className="hr-int-stat-val val-red">2</div>
                        </div>
                    </div>
                    <button className="hr-int-btn">📤 ส่งเอกสารใหม่</button>
                </div>
            </div>
        </div>
    )
}
