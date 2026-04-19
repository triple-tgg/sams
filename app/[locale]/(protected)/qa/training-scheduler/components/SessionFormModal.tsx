'use client'

import { useState, useEffect } from 'react'
import { SessionFormData, STATUS_CONFIG } from '../types'
import { COURSES_REF, INSTRUCTORS, VENUES, DEPTS } from '../data'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'

interface SessionFormModalProps {
    form: SessionFormData
    setForm: React.Dispatch<React.SetStateAction<SessionFormData>>
    isEdit: boolean
    onSave: () => void
    onClose: () => void
    onCourseSelect: (courseId: string) => void
}

export function SessionFormModal({ form, setForm, isEdit, onSave, onClose, onCourseSelect }: SessionFormModalProps) {
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        // Trigger smooth entry animation after conditional mounting
        const timer = setTimeout(() => setIsOpen(true), 10)
        return () => clearTimeout(timer)
    }, [])

    const handleClose = () => {
        setIsOpen(false)
        // Wait for Radix Drawer slide-out animation to finish before unmounting
        setTimeout(onClose, 300)
    }

    const handleSaveAndClose = () => {
        onSave()
        handleClose()
    }

    const f = (k: string, v: string | number) => setForm(p => ({ ...p, [k]: v }))

    return (
        <Drawer open={isOpen} onOpenChange={(val) => !val && handleClose()} direction="right">
            <DrawerContent className="fixed inset-y-0 right-0 left-auto mt-0 h-full w-[450px] sm:max-w-[540px] p-0 flex flex-col bg-card border-l border-border rounded-none rounded-l-[10px] [&>div:first-child]:hidden outline-none">
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-border flex flex-col gap-1 sticky top-0 bg-card z-10 shrink-0">
                    <DrawerHeader className="p-0 text-left">
                        <DrawerTitle className="text-lg font-semibold text-foreground text-left">
                            {isEdit ? 'Edit Training Session' : 'Schedule New Training Session'}
                        </DrawerTitle>
                    </DrawerHeader>
                    <p className="text-xs text-muted-foreground mt-0.5">Fill in the session details below</p>
                </div>

                {/* Form Body - scrollable */}
                <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
                    {/* Course select */}
                    <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                            Training Course <span className="text-red-400">*</span>
                        </label>
                        <select value={String(form.courseId)} onChange={e => onCourseSelect(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 cursor-pointer">
                            <option value="">Select a course...</option>
                            {['Core', 'Aircraft Familiarization', 'Aircraft Type', 'Specialized', 'Compliance'].map(cat => (
                                <optgroup key={cat} label={cat}>
                                    {COURSES_REF.filter(c => c.category === cat).map(c => (
                                        <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>

                    {/* Dates + Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                                Start Date <span className="text-red-400">*</span>
                            </label>
                            <input type="date" value={form.dateStart} onChange={e => f('dateStart', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">End Date</label>
                            <input type="date" value={form.dateEnd} onChange={e => f('dateEnd', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Start Time</label>
                            <input type="time" value={form.timeStart} onChange={e => f('timeStart', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">End Time</label>
                            <input type="time" value={form.timeEnd} onChange={e => f('timeEnd', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10" />
                        </div>
                    </div>

                    {/* Instructor + Venue */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Instructor</label>
                            <input type="text" value={form.instructor} onChange={e => f('instructor', e.target.value)} placeholder="e.g. Captain Aphisit"
                                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Venue</label>
                            <input type="text" value={form.venue} onChange={e => f('venue', e.target.value)} placeholder="e.g. BKK Base Room 1"
                                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10" />
                        </div>
                    </div>

                    {/* Status + Max participants */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Status</label>
                            <select value={form.status} onChange={e => f('status', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 cursor-pointer">
                                {Object.keys(STATUS_CONFIG).map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Max Participants</label>
                            <input type="number" min={1} max={200} value={form.maxParticipants} onChange={e => f('maxParticipants', parseInt(e.target.value) || 1)}
                                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10" />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border flex gap-3 bg-card shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.02)] z-10 sticky bottom-0">
                    <button onClick={handleClose} className="flex-1 py-2.5 text-sm font-medium rounded-lg border border-border text-foreground hover:bg-muted transition-colors cursor-pointer bg-transparent">
                        Cancel
                    </button>
                    <button onClick={handleSaveAndClose}
                        className="flex-1 py-2.5 text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary/90 transition-all cursor-pointer border-none shadow-sm shadow-primary/20">
                        {isEdit ? 'Save Changes' : 'Confirm Schedule'}
                    </button>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
