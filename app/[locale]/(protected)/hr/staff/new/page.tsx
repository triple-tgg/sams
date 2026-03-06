'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, User, Briefcase, GraduationCap } from 'lucide-react'
import './new-staff.css'

// ── Training Requirements by Position ──
const trainingMatrix: Record<string, Array<{ course: string; body: string; required: boolean }>> = {
    'B1 Engineer': [
        { course: 'Human Factors', body: 'EASA Part-66 Module 9', required: true },
        { course: 'Fuel Tank Safety', body: 'EASA Part-145', required: true },
        { course: 'SMS Awareness', body: 'ICAO / CAAT', required: true },
        { course: 'EWIS (Electrical Wiring)', body: 'EASA Part-66 Module 11', required: true },
        { course: 'Engine Run-up', body: 'CAAT Authorization', required: false },
        { course: 'Dangerous Goods Awareness', body: 'IATA / CAAT', required: true },
        { course: 'RVSM / PBN Awareness', body: 'CAAT', required: false },
    ],
    'B2 Engineer': [
        { course: 'Human Factors', body: 'EASA Part-66 Module 9', required: true },
        { course: 'EWIS (Electrical Wiring)', body: 'EASA Part-66 Module 11', required: true },
        { course: 'Software Management', body: 'CAAT / EASA', required: true },
        { course: 'SMS Awareness', body: 'ICAO / CAAT', required: true },
        { course: 'ESD Awareness', body: 'EASA / Manufacturer', required: true },
        { course: 'Dangerous Goods Awareness', body: 'IATA / CAAT', required: true },
    ],
    'Technician': [
        { course: 'Human Factors (Basic)', body: 'EASA / CAAT', required: true },
        { course: 'Engine Run-up', body: 'CAAT Authorization', required: true },
        { course: 'NDT Level II', body: 'CAAT / ASNT', required: false },
        { course: 'SMS Awareness', body: 'ICAO / CAAT', required: true },
        { course: 'FOD Prevention', body: 'CAAT', required: true },
        { course: 'Dangerous Goods Awareness', body: 'IATA / CAAT', required: true },
    ],
    'Avionics': [
        { course: 'Human Factors', body: 'EASA Part-66 Module 9', required: true },
        { course: 'EWIS Advanced', body: 'EASA Part-66 Module 11', required: true },
        { course: 'Software Management', body: 'CAAT / EASA', required: true },
        { course: 'ESD Awareness', body: 'EASA / Manufacturer', required: true },
        { course: 'SMS Awareness', body: 'ICAO / CAAT', required: true },
        { course: 'Dangerous Goods Awareness', body: 'IATA / CAAT', required: true },
    ],
    'Structures': [
        { course: 'Human Factors', body: 'EASA Part-66 Module 9', required: true },
        { course: 'Composite Repair', body: 'Manufacturer / EASA', required: true },
        { course: 'NDT Level II', body: 'CAAT / ASNT', required: true },
        { course: 'SMS Awareness', body: 'ICAO / CAAT', required: true },
        { course: 'Corrosion Prevention', body: 'EASA / CAAT', required: true },
        { course: 'Dangerous Goods Awareness', body: 'IATA / CAAT', required: false },
    ],
    'Quality Inspector': [
        { course: 'Human Factors', body: 'EASA Part-66 Module 9', required: true },
        { course: 'SMS Awareness', body: 'ICAO / CAAT', required: true },
        { course: 'Audit Techniques', body: 'EASA Part-145 / CAAT', required: true },
        { course: 'Dangerous Goods Awareness', body: 'IATA / CAAT', required: true },
        { course: 'Quality Management Systems', body: 'ISO 9001 / AS9110', required: true },
    ],
    'Planner': [
        { course: 'SMS Awareness', body: 'ICAO / CAAT', required: true },
        { course: 'Human Factors (Basic)', body: 'EASA / CAAT', required: true },
        { course: 'Dangerous Goods Awareness', body: 'IATA / CAAT', required: false },
        { course: 'Maintenance Planning', body: 'EASA Part-145 / CAAT', required: true },
    ],
}

const positions = ['B1 Engineer', 'B2 Engineer', 'Technician', 'Avionics', 'Structures', 'Quality Inspector', 'Planner']
const departments = ['Line Maintenance', 'Base Maintenance', 'Workshop', 'Quality Assurance', 'Planning', 'Engineering']

interface ExperienceEntry {
    company: string
    position: string
    years: string
    description: string
}

const steps = [
    { label: 'Personnel Data', icon: User },
    { label: 'Experience Records', icon: Briefcase },
    { label: 'Training Data', icon: GraduationCap },
]

export default function NewStaffPage() {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(0)

    // Step 1: Personnel
    const [personnel, setPersonnel] = useState({
        title: '', fullNameTh: '', fullNameEn: '', nickname: '',
        empId: `EMP-${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')}`,
        dob: '', phone: '', email: '', address: '',
        position: '', department: '', startDate: '',
    })

    // Step 2: Experience
    const [experiences, setExperiences] = useState<ExperienceEntry[]>([
        { company: '', position: '', years: '', description: '' },
    ])
    const [certifications, setCertifications] = useState('')

    // Step 3: Training (auto-populated)
    const trainingItems = trainingMatrix[personnel.position] || []

    const updatePersonnel = (field: string, value: string) => {
        setPersonnel(prev => ({ ...prev, [field]: value }))
    }

    const addExperience = () => {
        setExperiences(prev => [...prev, { company: '', position: '', years: '', description: '' }])
    }

    const removeExperience = (index: number) => {
        setExperiences(prev => prev.filter((_, i) => i !== index))
    }

    const updateExperience = (index: number, field: keyof ExperienceEntry, value: string) => {
        setExperiences(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e))
    }

    const handleSubmit = () => {
        // Mock submit — in real app, would call API
        router.push('/en/hr/staff')
    }

    return (
        <div className="ns-page">
            {/* Header */}
            <div className="ns-header">
                <Button variant="ghost" size="sm" onClick={() => router.push('/en/hr/staff')} className="ns-back-btn">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Staff List
                </Button>
                <h1 className="ns-title">Register New Staff</h1>
                <p className="ns-subtitle">Staff Registration — Personnel Data, Experience Records, Training Data</p>
            </div>

            {/* Step Indicator */}
            <div className="ns-steps">
                {steps.map((step, i) => {
                    const Icon = step.icon
                    const isActive = i === currentStep
                    const isDone = i < currentStep
                    return (
                        <div
                            key={i}
                            className={`ns-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
                            onClick={() => isDone && setCurrentStep(i)}
                        >
                            <div className="ns-step-circle">
                                {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                            </div>
                            <span className="ns-step-label">{step.label}</span>
                            {i < steps.length - 1 && <div className="ns-step-line" />}
                        </div>
                    )
                })}
            </div>

            {/* Step Content */}
            <Card className="ns-content-card">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        {React.createElement(steps[currentStep].icon, { className: 'h-5 w-5 text-blue-600' })}
                        {steps[currentStep].label}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {/* ── STEP 1: Personnel ── */}
                    {currentStep === 0 && (
                        <div className="ns-form-grid">
                            <div className="ns-field">
                                <label>Title</label>
                                <Select value={personnel.title} onValueChange={(v) => updatePersonnel('title', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Mr.">Mr.</SelectItem>
                                        <SelectItem value="Mrs.">Mrs.</SelectItem>
                                        <SelectItem value="Ms.">Ms.</SelectItem>
                                        <SelectItem value="นาย">นาย</SelectItem>
                                        <SelectItem value="นาง">นาง</SelectItem>
                                        <SelectItem value="นางสาว">นางสาว</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="ns-field span-2">
                                <label>Full Name (Thai)</label>
                                <Input value={personnel.fullNameTh} onChange={(e) => updatePersonnel('fullNameTh', e.target.value)} placeholder="ชื่อ-นามสกุล (ภาษาไทย)" />
                            </div>
                            <div className="ns-field span-2">
                                <label>Full Name (English)</label>
                                <Input value={personnel.fullNameEn} onChange={(e) => updatePersonnel('fullNameEn', e.target.value)} placeholder="Full Name (English)" />
                            </div>
                            <div className="ns-field">
                                <label>Nickname</label>
                                <Input value={personnel.nickname} onChange={(e) => updatePersonnel('nickname', e.target.value)} placeholder="Nickname" />
                            </div>
                            <div className="ns-field">
                                <label>Employee ID</label>
                                <Input value={personnel.empId} readOnly className="bg-muted" />
                            </div>
                            <div className="ns-field">
                                <label>Date of Birth</label>
                                <Input type="date" value={personnel.dob} onChange={(e) => updatePersonnel('dob', e.target.value)} />
                            </div>
                            <div className="ns-field">
                                <label>Phone</label>
                                <Input value={personnel.phone} onChange={(e) => updatePersonnel('phone', e.target.value)} placeholder="08x-xxx-xxxx" />
                            </div>
                            <div className="ns-field span-2">
                                <label>Email</label>
                                <Input type="email" value={personnel.email} onChange={(e) => updatePersonnel('email', e.target.value)} placeholder="email@sams.co.th" />
                            </div>
                            <div className="ns-field span-full">
                                <label>Address</label>
                                <Input value={personnel.address} onChange={(e) => updatePersonnel('address', e.target.value)} placeholder="Address" />
                            </div>
                            <div className="ns-field">
                                <label>Position *</label>
                                <Select value={personnel.position} onValueChange={(v) => updatePersonnel('position', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select Position..." /></SelectTrigger>
                                    <SelectContent>
                                        {positions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="ns-field">
                                <label>Department</label>
                                <Select value={personnel.department} onValueChange={(v) => updatePersonnel('department', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select Department..." /></SelectTrigger>
                                    <SelectContent>
                                        {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="ns-field">
                                <label>Start Date</label>
                                <Input type="date" value={personnel.startDate} onChange={(e) => updatePersonnel('startDate', e.target.value)} />
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: Experience ── */}
                    {currentStep === 1 && (
                        <div className="ns-experience-section">
                            <div className="ns-exp-header">
                                <h3 className="text-sm font-semibold text-muted-foreground">Work Experience</h3>
                                <Button variant="outline" size="sm" onClick={addExperience}>
                                    <Plus className="h-3 w-3 mr-1" /> Add Entry
                                </Button>
                            </div>
                            {experiences.map((exp, i) => (
                                <div key={i} className="ns-exp-card">
                                    <div className="ns-exp-card-header">
                                        <span className="text-xs font-semibold text-muted-foreground">Experience #{i + 1}</span>
                                        {experiences.length > 1 && (
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeExperience(i)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                    <div className="ns-form-grid">
                                        <div className="ns-field span-2">
                                            <label>Company / Organization</label>
                                            <Input value={exp.company} onChange={(e) => updateExperience(i, 'company', e.target.value)} placeholder="Company name" />
                                        </div>
                                        <div className="ns-field">
                                            <label>Position Held</label>
                                            <Input value={exp.position} onChange={(e) => updateExperience(i, 'position', e.target.value)} placeholder="Position" />
                                        </div>
                                        <div className="ns-field">
                                            <label>Duration (Years)</label>
                                            <Input value={exp.years} onChange={(e) => updateExperience(i, 'years', e.target.value)} placeholder="e.g. 3" />
                                        </div>
                                        <div className="ns-field span-full">
                                            <label>Description</label>
                                            <Input value={exp.description} onChange={(e) => updateExperience(i, 'description', e.target.value)} placeholder="Brief description of responsibilities" />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className="ns-cert-section">
                                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Certifications Held</h3>
                                <Input
                                    value={certifications}
                                    onChange={(e) => setCertifications(e.target.value)}
                                    placeholder="e.g. EASA Part-66 Cat B1, CAAT License, FAA A&P Certificate"
                                />
                                <p className="text-xs text-muted-foreground mt-1.5">Separate multiple certifications with commas</p>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 3: Training ── */}
                    {currentStep === 2 && (
                        <div className="ns-training-section">
                            {!personnel.position ? (
                                <div className="ns-training-empty">
                                    <GraduationCap className="h-10 w-10 text-muted-foreground/40" />
                                    <p className="text-muted-foreground mt-2">Please select a Position in Step 1 to see required training courses.</p>
                                    <Button variant="outline" size="sm" className="mt-3" onClick={() => setCurrentStep(0)}>
                                        Go to Step 1
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="ns-training-info">
                                        <div className="ns-training-info-badge">
                                            <span className="text-blue-600 font-semibold">{personnel.position}</span>
                                            <span className="text-muted-foreground"> — {trainingItems.length} courses required</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Training requirements based on Training Needs Matrix (SAMS-FM-CM-014)
                                        </p>
                                    </div>
                                    <div className="ns-training-table-wrap">
                                        <table className="ns-training-table">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Training Course</th>
                                                    <th>Regulatory Body</th>
                                                    <th>Priority</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {trainingItems.map((t, i) => (
                                                    <tr key={i}>
                                                        <td className="text-muted-foreground">{i + 1}</td>
                                                        <td className="font-medium">{t.course}</td>
                                                        <td className="text-muted-foreground text-xs">{t.body}</td>
                                                        <td>
                                                            <Badge color={t.required ? 'destructive' : 'default'} className="text-[10px]">
                                                                {t.required ? 'Required' : 'Optional'}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            <span className="ns-status-not-started">
                                                                <span className="ns-status-dot" />
                                                                Not Started
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="ns-nav-buttons">
                <Button
                    variant="outline"
                    onClick={() => setCurrentStep(s => s - 1)}
                    disabled={currentStep === 0}
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Previous
                </Button>
                {currentStep < steps.length - 1 ? (
                    <Button onClick={() => setCurrentStep(s => s + 1)} className="ns-btn-next">
                        Next
                        <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                ) : (
                    <Button onClick={handleSubmit} className="ns-btn-submit">
                        <Check className="h-4 w-4 mr-1" />
                        Register Staff
                    </Button>
                )}
            </div>
        </div>
    )
}
