'use client'

import { useState } from 'react'
import { X as XIcon } from 'lucide-react'
import { CATEGORIES } from '../types'

interface AddCourseModalProps {
    onClose: () => void
}

export function AddCourseModal({ onClose }: AddCourseModalProps) {
    const [form, setForm] = useState({
        code: '',
        name: '',
        category: 'Recurrent' as string,
        recurrent: false,
        recurrentYears: 2,
        note: '',
    })

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-card rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 border border-border">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-bold text-foreground">Add New Course</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted cursor-pointer transition-colors border-none bg-transparent"
                    >
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Code + Category */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Course Code</label>
                            <input
                                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary"
                                placeholder="e.g. CRS-017"
                                value={form.code}
                                onChange={e => setForm({ ...form, code: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Category</label>
                            <select
                                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary cursor-pointer"
                                value={form.category}
                                onChange={e => setForm({ ...form, category: e.target.value })}
                            >
                                {(CATEGORIES as readonly string[]).slice(1).map(c => (
                                    <option key={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Course Name */}
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Course Name</label>
                        <textarea
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary resize-none"
                            rows={3}
                            placeholder="Full course name..."
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                        />
                    </div>

                    {/* Type */}
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Type</label>
                        <div className="flex items-center gap-3">
                            <div className="flex gap-1 bg-muted p-1 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, recurrent: false })}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer border-none ${
                                        !form.recurrent
                                            ? 'bg-card text-primary shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground bg-transparent'
                                    }`}
                                >
                                    Initial
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, recurrent: true })}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer border-none ${
                                        form.recurrent
                                            ? 'bg-card text-orange-600 shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground bg-transparent'
                                    }`}
                                >
                                    Recurrent
                                </button>
                            </div>
                            {form.recurrent && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Every</span>
                                    <input
                                        type="number"
                                        className="w-14 px-2 py-1 text-sm border border-border rounded-lg text-center text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary/10"
                                        value={form.recurrentYears}
                                        onChange={e => setForm({ ...form, recurrentYears: parseInt(e.target.value) })}
                                        min={1}
                                        max={5}
                                    />
                                    <span className="text-sm text-muted-foreground">years</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Note */}
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Additional Note (optional)</label>
                        <input
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary"
                            placeholder="e.g. Applicable with Lead Auditor"
                            value={form.note}
                            onChange={e => setForm({ ...form, note: e.target.value })}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 text-sm rounded-lg border border-border text-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 text-sm rounded-lg text-white bg-primary hover:bg-primary/90 transition-opacity cursor-pointer border-none"
                    >
                        Add Course
                    </button>
                </div>
            </div>
        </div>
    )
}
