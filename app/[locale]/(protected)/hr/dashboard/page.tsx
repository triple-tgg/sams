'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import './hr-dashboard.css'

// ── Mock Data ──
const statsCards = [
    { label: 'Total Staff', value: 248, change: '+4', changeLabel: 'เดือนนี้', icon: '👥', color: 'blue', trend: 'up' },
    { label: 'Active', value: 231, change: '93.1%', changeLabel: 'ของทั้งหมด', icon: '✅', color: 'green', trend: 'up' },
    { label: 'On Leave', value: 12, change: '3 วัน', changeLabel: 'เฉลี่ย', icon: '🏖️', color: 'amber', trend: 'neutral' },
    { label: 'Open Positions', value: 5, change: '2', changeLabel: 'urgent', icon: '�', color: 'red', trend: 'down' },
]

const deptData = [
    { name: 'Line Maintenance', count: 82, pct: 33, color: '#2563eb' },
    { name: 'Base Maintenance', count: 64, pct: 26, color: '#7c3aed' },
    { name: 'Workshop', count: 45, pct: 18, color: '#0891b2' },
    { name: 'Quality Assurance', count: 28, pct: 11, color: '#059669' },
    { name: 'Planning', count: 18, pct: 7, color: '#d97706' },
    { name: 'Engineering', count: 11, pct: 5, color: '#dc2626' },
]

const positionData = [
    { name: 'B1 Engineer', count: 62 },
    { name: 'Technician', count: 58 },
    { name: 'B2 Engineer', count: 41 },
    { name: 'Avionics', count: 35 },
    { name: 'Structures', count: 22 },
    { name: 'Quality Inspector', count: 18 },
    { name: 'Planner', count: 12 },
]

const recentActivities = [
    { type: 'new', icon: '🟢', text: 'นางสาวมนัสนันท์ เข้าร่วม Line Maintenance', time: '2 ชม.', date: '06 MAR' },
    { type: 'training', icon: '📚', text: 'Human Factors Training — Batch #12 เริ่มแล้ว (8 คน)', time: '4 ชม.', date: '06 MAR' },
    { type: 'alert', icon: '⚠️', text: '3 ใบอนุญาตจะหมดอายุ ภายใน 30 วัน', time: '6 ชม.', date: '06 MAR' },
    { type: 'leave', icon: '🏖️', text: 'นายธนกฤต สุขสวัสดิ์ — ลาพักร้อน 8-12 MAR', time: '1 วัน', date: '05 MAR' },
    { type: 'cert', icon: '🎓', text: 'NDT Level II — นายกมล มีชัย ผ่านการทดสอบ', time: '1 วัน', date: '05 MAR' },
    { type: 'transfer', icon: '🔄', text: 'Ms. Sarah Weston ย้ายจาก Workshop → Line Maintenance', time: '2 วัน', date: '04 MAR' },
]

const alertItems = [
    { severity: 'critical', label: 'ใบอนุญาต Expired', count: 7, icon: '🔴' },
    { severity: 'warning', label: 'หมดอายุ < 30 วัน', count: 3, icon: '🟡' },
    { severity: 'info', label: 'Staff ใหม่ รอ Onboarding', count: 2, icon: '🔵' },
    { severity: 'info', label: 'Training ค้างส่ง', count: 4, icon: '🟠' },
]

const upcomingEvents = [
    { date: '07 MAR', title: 'Human Factors Exam', desc: 'Batch #12 — 8 คน', type: 'exam' },
    { date: '10 MAR', title: 'EASA Audit Preparation', desc: 'QA Team meeting', type: 'meeting' },
    { date: '12 MAR', title: 'New Staff Orientation', desc: '3 พนักงานใหม่', type: 'onboard' },
    { date: '15 MAR', title: 'SMS Awareness Training', desc: 'Online — ทุกแผนก', type: 'training' },
    { date: '18 MAR', title: 'License Renewal deadline', desc: 'EMP-0287, EMP-0198', type: 'deadline' },
]

export default function HRDashboardPage() {
    const router = useRouter()
    const [animateStats, setAnimateStats] = useState(false)
    const [animateBars, setAnimateBars] = useState(false)

    useEffect(() => {
        const t1 = setTimeout(() => setAnimateStats(true), 200)
        const t2 = setTimeout(() => setAnimateBars(true), 600)
        return () => { clearTimeout(t1); clearTimeout(t2) }
    }, [])

    const now = new Date()
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })

    return (
        <div className="hrd">
            {/* ── Header ── */}
            <div className="hrd-header">
                <div>
                    <h1 className="hrd-title">HR Dashboard</h1>
                    <p className="hrd-subtitle">SAMS · อัปเดตล่าสุด: {dateStr}, {timeStr} ICT</p>
                </div>
                <div className="hrd-header-actions">
                    <button className="hrd-btn hrd-btn-outline" onClick={() => router.push('/en/hr/staff')}>
                        👥 Staff List
                    </button>
                    <button className="hrd-btn hrd-btn-primary" onClick={() => router.push('/en/hr/staff/new')}>
                        + New Staff
                    </button>
                </div>
            </div>

            {/* ── Stats Cards ── */}
            <div className="hrd-stats-grid">
                {statsCards.map((s, i) => (
                    <div key={i} className={`hrd-stat-card hrd-stat-${s.color} ${animateStats ? 'show' : ''}`} style={{ animationDelay: `${i * 80}ms` }}>
                        <div className="hrd-stat-top">
                            <span className="hrd-stat-label">{s.label}</span>
                            <span className="hrd-stat-icon">{s.icon}</span>
                        </div>
                        <div className="hrd-stat-value">{s.value}</div>
                        <div className="hrd-stat-change">
                            <span className={`hrd-change-badge hrd-change-${s.trend}`}>{s.change}</span>
                            <span className="hrd-change-label">{s.changeLabel}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Main Content Grid ── */}
            <div className="hrd-main-grid">
                {/* Left Column */}
                <div className="hrd-left-col">
                    {/* Department Breakdown */}
                    <div className="hrd-panel">
                        <div className="hrd-panel-header">
                            <h3 className="hrd-panel-title">Department Breakdown</h3>
                            <span className="hrd-panel-badge">{deptData.length} Departments</span>
                        </div>
                        <div className="hrd-dept-list">
                            {deptData.map((d, i) => (
                                <div key={i} className="hrd-dept-item">
                                    <div className="hrd-dept-info">
                                        <div className="hrd-dept-dot" style={{ background: d.color }} />
                                        <span className="hrd-dept-name">{d.name}</span>
                                    </div>
                                    <div className="hrd-dept-bar-wrap">
                                        <div className="hrd-dept-bar" style={{ width: animateBars ? `${d.pct}%` : '0%', background: d.color }} />
                                    </div>
                                    <div className="hrd-dept-count">{d.count}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Position Distribution */}
                    <div className="hrd-panel">
                        <div className="hrd-panel-header">
                            <h3 className="hrd-panel-title">Position Distribution</h3>
                        </div>
                        <div className="hrd-position-grid">
                            {positionData.map((p, i) => (
                                <div key={i} className="hrd-position-chip">
                                    <span className="hrd-position-name">{p.name}</span>
                                    <span className="hrd-position-count">{p.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="hrd-right-col">
                    {/* Alerts */}
                    <div className="hrd-panel hrd-alerts-panel">
                        <div className="hrd-panel-header">
                            <h3 className="hrd-panel-title">⚡ Alerts</h3>
                            <span className="hrd-panel-badge hrd-badge-red">{alertItems.reduce((a, b) => a + b.count, 0)} items</span>
                        </div>
                        <div className="hrd-alert-list">
                            {alertItems.map((a, i) => (
                                <div key={i} className={`hrd-alert-item hrd-alert-${a.severity}`}>
                                    <span className="hrd-alert-icon">{a.icon}</span>
                                    <span className="hrd-alert-label">{a.label}</span>
                                    <span className="hrd-alert-count">{a.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Upcoming Events */}
                    <div className="hrd-panel">
                        <div className="hrd-panel-header">
                            <h3 className="hrd-panel-title">📅 Upcoming</h3>
                            <span className="hrd-panel-badge">MAR 2026</span>
                        </div>
                        <div className="hrd-events-list">
                            {upcomingEvents.map((e, i) => (
                                <div key={i} className="hrd-event-item">
                                    <div className={`hrd-event-date hrd-event-${e.type}`}>
                                        {e.date.split(' ')[0]}
                                        <span>{e.date.split(' ')[1]}</span>
                                    </div>
                                    <div className="hrd-event-info">
                                        <div className="hrd-event-title">{e.title}</div>
                                        <div className="hrd-event-desc">{e.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Recent Activity ── */}
            <div className="hrd-panel hrd-activity-panel">
                <div className="hrd-panel-header">
                    <h3 className="hrd-panel-title">🕐 Recent Activity</h3>
                    <button className="hrd-btn hrd-btn-text">ดูทั้งหมด →</button>
                </div>
                <div className="hrd-activity-list">
                    {recentActivities.map((a, i) => (
                        <div key={i} className="hrd-activity-item">
                            <span className="hrd-activity-icon">{a.icon}</span>
                            <div className="hrd-activity-content">
                                <span className="hrd-activity-text">{a.text}</span>
                                <span className="hrd-activity-time">{a.time} ที่แล้ว</span>
                            </div>
                            <span className="hrd-activity-date">{a.date}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
