'use client'

import { useEffect, useState } from 'react'
import { Briefcase, Loader2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { UpsertWorkExperience } from '@/lib/api/qa/staff-management'

export interface WorkExperienceDraft {
    jobTitle: string
    company: string
    /** YYYY-MM-DD, as the date inputs use it. */
    periodFrom: string
    /** YYYY-MM-DD; empty when `isCurrent`. */
    periodTo: string
    isCurrent: boolean
    description: string
}

/** The API sends dates with a time part; date inputs want just the day. */
const toDateInput = (value: string | null | undefined) => (value ? value.slice(0, 10) : '')

export function draftFromWorkExperience(exp: UpsertWorkExperience | null): WorkExperienceDraft {
    if (!exp) {
        return { jobTitle: '', company: '', periodFrom: '', periodTo: '', isCurrent: false, description: '' }
    }
    return {
        jobTitle: exp.jobTitle || '',
        company: exp.company || '',
        periodFrom: toDateInput(exp.periodFrom),
        periodTo: toDateInput(exp.periodTo),
        isCurrent: !exp.periodTo,
        description: exp.description || '',
    }
}

const inputCls =
    'w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400'

interface WorkExperienceItemModalProps {
    open: boolean
    /** null adds a new item; otherwise the item being edited. */
    item: UpsertWorkExperience | null
    isSaving: boolean
    onClose: () => void
    onSubmit: (draft: WorkExperienceDraft) => void
}

// ── Add / edit one work experience item ──
export function WorkExperienceItemModal({ open, item, isSaving, onClose, onSubmit }: WorkExperienceItemModalProps) {
    const [draft, setDraft] = useState<WorkExperienceDraft>(draftFromWorkExperience(item))
    const [errors, setErrors] = useState<Partial<Record<keyof WorkExperienceDraft, string>>>({})
    const isEdit = item !== null

    useEffect(() => {
        if (open) {
            setDraft(draftFromWorkExperience(item))
            setErrors({})
        }
    }, [open, item])

    const set = <K extends keyof WorkExperienceDraft>(key: K, value: WorkExperienceDraft[K]) => {
        setDraft((d) => ({ ...d, [key]: value }))
        setErrors((e) => ({ ...e, [key]: undefined }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const next: typeof errors = {}
        if (!draft.jobTitle.trim()) next.jobTitle = 'Job title is required'
        if (!draft.company.trim()) next.company = 'Company is required'
        if (!draft.periodFrom) next.periodFrom = 'Start date is required'
        if (!draft.isCurrent && !draft.periodTo) next.periodTo = 'End date is required, or tick "Currently working here"'
        if (!draft.isCurrent && draft.periodFrom && draft.periodTo && draft.periodTo < draft.periodFrom) {
            next.periodTo = 'End date must be on or after the start date'
        }
        setErrors(next)
        if (Object.keys(next).length > 0) return
        onSubmit({
            ...draft,
            jobTitle: draft.jobTitle.trim(),
            company: draft.company.trim(),
            description: draft.description.trim(),
            periodTo: draft.isCurrent ? '' : draft.periodTo,
        })
    }

    const fieldError = (key: keyof WorkExperienceDraft) =>
        errors[key] ? <p className="mt-1 text-xs text-red-600">{errors[key]}</p> : null

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o && !isSaving) onClose() }}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-100 text-amber-600">
                            <Briefcase className="h-4 w-4" />
                        </span>
                        {isEdit ? 'Edit Work Experience' : 'Add Work Experience'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit ? 'Update this work experience record.' : 'Add a new work experience record.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                            Job Title <span className="text-red-500">*</span>
                        </label>
                        <input type="text" value={draft.jobTitle} onChange={(e) => set('jobTitle', e.target.value)} placeholder="e.g. Licensed Aircraft Engineer" autoFocus className={inputCls} />
                        {fieldError('jobTitle')}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                            Company <span className="text-red-500">*</span>
                        </label>
                        <input type="text" value={draft.company} onChange={(e) => set('company', e.target.value)} placeholder="e.g. Thai Airways" className={inputCls} />
                        {fieldError('company')}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                From <span className="text-red-500">*</span>
                            </label>
                            <input type="date" value={draft.periodFrom} onChange={(e) => set('periodFrom', e.target.value)} className={inputCls} />
                            {fieldError('periodFrom')}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                To {!draft.isCurrent && <span className="text-red-500">*</span>}
                            </label>
                            <input type="date" value={draft.isCurrent ? '' : draft.periodTo} onChange={(e) => set('periodTo', e.target.value)} disabled={draft.isCurrent} className={inputCls} />
                            {fieldError('periodTo')}
                        </div>
                    </div>

                    <label className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={draft.isCurrent}
                            onChange={(e) => { set('isCurrent', e.target.checked); set('periodTo', '') }}
                            className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                        />
                        Currently working here
                    </label>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Notes</label>
                        <textarea value={draft.description} onChange={(e) => set('description', e.target.value)} rows={3} placeholder="Responsibilities, aircraft types, etc." className={`${inputCls} resize-y`} />
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {isEdit ? 'Save Changes' : 'Add'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
