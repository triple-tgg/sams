import { useState } from 'react'
import { Briefcase, GraduationCap, Pencil, Trash2, Plus, Check, X as XIcon, Loader2 } from 'lucide-react'
import { StaffData } from '../types'
import { WorkExperienceItemModal, type WorkExperienceDraft } from './WorkExperienceItemModal'
import { StaffByIdData, UpsertStaffRequest, UpsertEducation, UpsertWorkExperience, buildStaffUpsertRequest } from '@/lib/api/qa/staff-management'
import { useUpsertStaff } from '@/lib/api/hooks/useQAStaffManagement'
import { toast } from 'sonner'
import { CollapsibleCard } from './CollapsibleCard'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const DEGREE_OPTIONS = ['Diploma', 'Certificate', 'Associate', 'Bachelor', 'Master', 'Doctoral', 'Other']

interface EducationDraft {
    degree: string
    institution: string
    fieldOfStudy: string
    year: string
}

const emptyEducationDraft = (): EducationDraft => ({ degree: '', institution: '', fieldOfStudy: '', year: '' })

const inputCls =
    'w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100'

// ── Experience Tab ──
export function ExperienceTab({ staff, apiData }: { staff: StaffData, apiData?: StaffByIdData }) {
    // ── Work experience: the modal edits one item ('new' adds); removal asks first ──
    const [expEditing, setExpEditing] = useState<number | 'new' | null>(null)
    const [expDeletingId, setExpDeletingId] = useState<number | null>(null)

    // ── Education inline editing: 'new' is the add row, a number is the record being edited ──
    const [eduEditing, setEduEditing] = useState<number | 'new' | null>(null)
    const [eduDraft, setEduDraft] = useState<EducationDraft>(emptyEducationDraft())
    const [eduDeletingId, setEduDeletingId] = useState<number | null>(null)

    const upsertMutation = useUpsertStaff()

    const buildUpsertPayload = (overrideFields: Partial<UpsertStaffRequest>): UpsertStaffRequest | null => {
        if (!apiData) {
            toast.error("Cannot edit: raw API data is missing.")
            return null
        }
        
        return buildStaffUpsertRequest(apiData, overrideFields)
    }

    // The saved work experience list, straight from the API (the display list formats dates and turns blanks into '-').
    const savedExperiences: UpsertWorkExperience[] = (apiData?.workExperiences ?? [])
        .filter((w) => !w.isdelete)
        .map((w) => ({
            id: w.id,
            jobTitle: w.jobTitle || '',
            company: w.company || '',
            periodFrom: w.periodFrom || '',
            periodTo: w.periodTo || '',
            description: w.description || '',
        }))

    /** The upsert takes the whole list, so every change sends the saved list with one item changed. */
    const saveExperiences = (list: UpsertWorkExperience[], successMessage: string, onDone: () => void) => {
        const payload = buildUpsertPayload({ workExperiences: list })
        if (!payload) return
        upsertMutation.mutate(payload, {
            onSuccess: () => {
                toast.success(successMessage)
                onDone()
            },
            onError: (err) => toast.error(err.message || 'Failed to update work experience'),
        })
    }

    const submitExperience = (draft: WorkExperienceDraft) => {
        const entry: UpsertWorkExperience = {
            id: expEditing === 'new' || expEditing === null ? 0 : expEditing,
            jobTitle: draft.jobTitle,
            company: draft.company,
            periodFrom: draft.periodFrom,
            periodTo: draft.periodTo,
            description: draft.description,
        }
        const list =
            expEditing === 'new'
                ? [...savedExperiences, entry]
                : savedExperiences.map((w) => (w.id === entry.id ? entry : w))
        saveExperiences(
            list,
            expEditing === 'new' ? 'Work experience added successfully' : 'Work experience updated successfully',
            () => setExpEditing(null)
        )
    }

    const confirmDeleteExperience = () => {
        if (expDeletingId === null) return
        saveExperiences(
            savedExperiences.filter((w) => w.id !== expDeletingId),
            'Work experience removed successfully',
            () => setExpDeletingId(null)
        )
    }

    // The saved education list, straight from the API (the display list turns blanks into '-').
    const savedEducations: UpsertEducation[] = (apiData?.educations ?? [])
        .filter((e) => !e.isdelete)
        .map((e) => ({
            id: e.id,
            degree: e.degree || '',
            institution: e.institution || '',
            fieldOfStudy: e.fieldOfStudy || '',
            year: e.year || 0,
        }))

    const isSaving = upsertMutation.isPending

    const closeEduEditor = () => {
        setEduEditing(null)
        setEduDraft(emptyEducationDraft())
    }

    const startAddEducation = () => {
        setEduDeletingId(null)
        setEduDraft(emptyEducationDraft())
        setEduEditing('new')
    }

    const startEditEducation = (id: number) => {
        const edu = savedEducations.find((e) => e.id === id)
        if (!edu) return
        setEduDeletingId(null)
        setEduDraft({
            degree: edu.degree,
            institution: edu.institution,
            fieldOfStudy: edu.fieldOfStudy,
            year: edu.year ? String(edu.year) : '',
        })
        setEduEditing(id)
    }

    /** The upsert takes the whole list, so every change sends the saved list with one entry changed. */
    const saveEducations = (list: UpsertEducation[], successMessage: string, onDone: () => void) => {
        const payload = buildUpsertPayload({ educations: list })
        if (!payload) return
        upsertMutation.mutate(payload, {
            onSuccess: () => {
                toast.success(successMessage)
                onDone()
            },
            onError: (err) => toast.error(err.message || 'Failed to update education'),
        })
    }

    const submitEducation = () => {
        const degree = eduDraft.degree.trim()
        const institution = eduDraft.institution.trim()
        const year = Number(eduDraft.year)
        const maxYear = new Date().getFullYear() + 10
        if (!degree) return toast.error('Degree is required')
        if (!institution) return toast.error('Institution is required')
        if (!eduDraft.year || !Number.isInteger(year) || year < 1900 || year > maxYear) {
            return toast.error(`Year must be between 1900 and ${maxYear}`)
        }

        const entry: UpsertEducation = {
            id: eduEditing === 'new' || eduEditing === null ? 0 : eduEditing,
            degree,
            institution,
            fieldOfStudy: eduDraft.fieldOfStudy.trim(),
            year,
        }
        const list =
            eduEditing === 'new'
                ? [...savedEducations, entry]
                : savedEducations.map((e) => (e.id === entry.id ? entry : e))
        saveEducations(list, eduEditing === 'new' ? 'Education added successfully' : 'Education updated successfully', closeEduEditor)
    }

    const confirmDeleteEducation = () => {
        if (eduDeletingId === null) return
        saveEducations(
            savedEducations.filter((e) => e.id !== eduDeletingId),
            'Education removed successfully',
            () => setEduDeletingId(null)
        )
    }

    const eduKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') submitEducation()
        if (e.key === 'Escape') closeEduEditor()
    }

    const renderEducationEditor = (key: string | number) => (
        <tr key={key} className={eduEditing === 'new' ? 'bg-emerald-50/30' : 'bg-blue-50/50'}>
            <td className="py-2 px-2 border-b border-slate-100 min-w-[150px]">
                <select
                    value={eduDraft.degree}
                    onChange={(e) => setEduDraft((d) => ({ ...d, degree: e.target.value }))}
                    onKeyDown={eduKeyDown}
                    autoFocus
                    className={inputCls}
                >
                    <option value="">Select degree</option>
                    {/* Keep a saved value that is not in the list selectable */}
                    {eduDraft.degree && !DEGREE_OPTIONS.includes(eduDraft.degree) && (
                        <option value={eduDraft.degree}>{eduDraft.degree}</option>
                    )}
                    {DEGREE_OPTIONS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                    ))}
                </select>
            </td>
            <td className="py-2 px-2 border-b border-slate-100 min-w-[180px]">
                <input type="text" value={eduDraft.institution} onChange={(e) => setEduDraft((d) => ({ ...d, institution: e.target.value }))} onKeyDown={eduKeyDown} placeholder="Institution" className={inputCls} />
            </td>
            <td className="py-2 px-2 border-b border-slate-100 min-w-[160px]">
                <input type="text" value={eduDraft.fieldOfStudy} onChange={(e) => setEduDraft((d) => ({ ...d, fieldOfStudy: e.target.value }))} onKeyDown={eduKeyDown} placeholder="Field of study" className={inputCls} />
            </td>
            <td className="py-2 px-2 border-b border-slate-100 w-[110px]">
                <input type="number" inputMode="numeric" value={eduDraft.year} onChange={(e) => setEduDraft((d) => ({ ...d, year: e.target.value.slice(0, 4) }))} onKeyDown={eduKeyDown} placeholder="YYYY" className={inputCls} />
            </td>
            <td className="py-2 px-2 border-b border-slate-100">
                <div className="flex items-center justify-center gap-1.5">
                    <button onClick={submitEducation} disabled={isSaving} title="Save" className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-emerald-600 hover:bg-emerald-50 cursor-pointer transition-all bg-transparent border-none disabled:opacity-50">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </button>
                    <button onClick={closeEduEditor} disabled={isSaving} title="Cancel" className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer transition-all bg-transparent border-none disabled:opacity-50">
                        <XIcon className="h-4 w-4" />
                    </button>
                </div>
            </td>
        </tr>
    )

    return (
        <div>
            {/* Side by side on xl, Education wider (3/5) for its table; each card keeps its own height (items-start) */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-x-4 items-start">
            {/* Work Experience */}
            <CollapsibleCard
                icon={<Briefcase className="h-4 w-4" />}
                iconClassName="bg-amber-100 text-amber-600"
                title="Work Experience"
                className="min-w-0 xl:col-span-2"
                collapsibleOn="always"
                defaultOpen
                action={staff.experience.length > 0 && (
                    <button
                        onClick={() => setExpEditing('new')}
                        disabled={isSaving || !apiData}
                        className="inline-flex shrink-0 items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-primary rounded-lg cursor-pointer transition-all duration-200 hover:bg-primary/80 border-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus className="h-3.5 w-3.5" /> Add Experience
                    </button>
                )}
            >
                {staff.experience.length > 0 ? (
                    <ScrollArea viewportClassName="max-h-[550px]">
                    <div className="relative ml-2 pr-3">
                        {/* Timeline vertical line */}
                        <div className="absolute left-[54px] top-2 bottom-2 w-[2px] bg-slate-200" />

                        {staff.experience.map((exp, i) => {
                            // Parse period like "2021 – Present" into start part
                            const periodParts = exp.period.split('–').map(s => s.trim())
                            const startLabel = periodParts[0] || ''

                            return (
                                <div key={i} className="relative flex gap-0 mb-8 last:mb-0">
                                    {/* Left: Date label */}
                                    <div className="w-[44px] shrink-0 text-right pr-0">
                                        <span className="text-xs font-medium text-rose-400 leading-tight block mt-0.5">
                                            {startLabel}
                                        </span>
                                    </div>

                                    {/* Center: Dot on timeline */}
                                    <div className="w-[22px] shrink-0 flex justify-center relative z-10">
                                        <div className="w-3 h-3 rounded-full bg-white border-[2.5px] border-rose-400 mt-1.5" />
                                    </div>

                                    {/* Right: Content */}
                                    <div className="group/item flex-1 min-w-0 pl-1">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h4 className="text-sm font-bold text-slate-800 min-w-0">{exp.title}</h4>
                                            <div className="flex shrink-0 items-center gap-0.5">
                                                <button
                                                    type="button"
                                                    onClick={() => exp.id !== undefined && setExpEditing(exp.id)}
                                                    disabled={exp.id === undefined || !apiData || isSaving}
                                                    title="Edit"
                                                    aria-label={`Edit ${exp.title}`}
                                                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer transition-all bg-transparent border-none disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => exp.id !== undefined && setExpDeletingId(exp.id)}
                                                    disabled={exp.id === undefined || !apiData || isSaving}
                                                    title="Remove"
                                                    aria-label={`Remove ${exp.title}`}
                                                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 cursor-pointer transition-all bg-transparent border-none disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="text-xs text-slate-500 mb-0.5">
                                            Company: {exp.company}
                                        </div>
                                        <div className="text-xs text-slate-400 mb-2">
                                            {exp.period}
                                        </div>
                                        {exp.description && exp.description !== '-' && (
                                            <div className="text-xs text-slate-400 leading-relaxed border-t border-slate-100 pt-2 mt-1">
                                                <span className="text-slate-500 font-medium">Notes:</span>{' '}
                                                <span className="text-slate-400">{exp.description}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    </ScrollArea>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
                            <Briefcase className="h-7 w-7 text-amber-300" />
                        </div>
                        <p className="text-sm font-semibold text-slate-500 mb-1">No Work Experience</p>
                        <p className="text-xs text-slate-400 mb-5">Work experience records have not been added yet.</p>
                        <button
                            onClick={() => setExpEditing('new')}
                            disabled={!apiData}
                            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg cursor-pointer transition-all duration-200 hover:bg-primary/80 border-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Briefcase className="h-4 w-4" />
                            Add Work Experience
                        </button>
                    </div>
                )}
            </CollapsibleCard>

            {/* Education — edited inline in the table */}
            <CollapsibleCard
                icon={<GraduationCap className="h-4 w-4" />}
                iconClassName="bg-blue-50 text-blue-600"
                title="Education"
                className="min-w-0 xl:col-span-3"
                collapsibleOn="always"
                defaultOpen
                action={staff.education.length > 0 && eduEditing === null && (
                    <button
                        onClick={startAddEducation}
                        disabled={isSaving || !apiData}
                        className="inline-flex shrink-0 items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-primary rounded-lg cursor-pointer transition-all duration-200 hover:bg-primary/80 border-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus className="h-3.5 w-3.5" /> Add Education
                    </button>
                )}
            >
                {staff.education.length > 0 || eduEditing === 'new' ? (
                    <ScrollArea scrollbars="both" className="-mx-1" viewportClassName="max-h-[550px] px-1">
                    <table className="w-full min-w-[620px] border-collapse">
                        <thead>
                            <tr>
                                {['Degree', 'Institution', 'Field of Study', 'Year'].map((h) => (
                                    <th
                                        key={h}
                                        className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-2.5 px-3.5 bg-white sticky top-0 z-[2] shadow-[inset_0_-1px_0_#e8ecf1] text-left whitespace-nowrap"
                                    >
                                        {h}
                                    </th>
                                ))}
                                <th className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-2.5 px-3.5 bg-white sticky top-0 z-[2] shadow-[inset_0_-1px_0_#e8ecf1] text-center w-[100px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staff.education.map((edu, i) => {
                                const id = edu.id ?? -1
                                if (eduEditing === id) return renderEducationEditor(id)

                                const isDeleting = eduDeletingId === id
                                const isLocked = eduEditing !== null || (eduDeletingId !== null && !isDeleting) || isSaving
                                return (
                                    <tr key={edu.id ?? i} className={`group transition-colors ${isDeleting ? 'bg-red-50/60' : 'hover:bg-slate-50'} ${isLocked && !isDeleting ? 'opacity-50' : ''}`}>
                                        <td className="text-[13px] py-3 px-3.5 border-b border-slate-100 text-slate-800 font-medium">{edu.degree || '-'}</td>
                                        <td className="text-[13px] py-3 px-3.5 border-b border-slate-100 text-slate-600">{edu.institution || '-'}</td>
                                        <td className="text-[13px] py-3 px-3.5 border-b border-slate-100 text-slate-500">{edu.field || '-'}</td>
                                        <td className="text-[13px] py-3 px-3.5 border-b border-slate-100 text-slate-700 whitespace-nowrap">{edu.year || '-'}</td>
                                        <td className="py-3 px-3.5 border-b border-slate-100">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button onClick={() => startEditEducation(id)} disabled={isLocked || edu.id === undefined} title="Edit" className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer transition-all bg-transparent border-none disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400">
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button onClick={() => setEduDeletingId(id)} disabled={isLocked || edu.id === undefined} title="Remove" className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 cursor-pointer transition-all bg-transparent border-none disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                        </td>
                                    </tr>
                                )
                            })}
                            {eduEditing === 'new' && renderEducationEditor('new')}
                        </tbody>
                    </table>
                    </ScrollArea>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                            <GraduationCap className="h-7 w-7 text-blue-300" />
                        </div>
                        <p className="text-sm font-semibold text-slate-500 mb-1">No Education Records</p>
                        <p className="text-xs text-slate-400 mb-5">Education records have not been added yet.</p>
                        <button
                            onClick={startAddEducation}
                            disabled={!apiData}
                            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg cursor-pointer transition-all duration-200 hover:bg-primary/80 border-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="h-4 w-4" />
                            Add Education
                        </button>
                    </div>
                )}
            </CollapsibleCard>
            </div>

            {/* Remove Education confirmation */}
            {(() => {
                const target = staff.education.find((e) => e.id === eduDeletingId)
                return (
                    <AlertDialog
                        open={eduDeletingId !== null}
                        onOpenChange={(open) => { if (!open && !isSaving) setEduDeletingId(null) }}
                    >
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Remove Education</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to remove this education record? This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            {target && (
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                                    <p className="font-semibold text-slate-800">{target.degree || '-'}</p>
                                    <p className="text-slate-600">{target.institution || '-'}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {[target.field && target.field !== '-' ? target.field : null, target.year && target.year !== '-' ? target.year : null].filter(Boolean).join(' · ') || '-'}
                                    </p>
                                </div>
                            )}
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    disabled={isSaving}
                                    onClick={(e) => {
                                        // Keep the dialog open until the save finishes; it closes on success.
                                        e.preventDefault()
                                        confirmDeleteEducation()
                                    }}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                    {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                    Remove
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )
            })()}

            {/* Add / edit one work experience item */}
            <WorkExperienceItemModal
                open={expEditing !== null}
                item={typeof expEditing === 'number' ? savedExperiences.find((w) => w.id === expEditing) ?? null : null}
                isSaving={isSaving}
                onClose={() => setExpEditing(null)}
                onSubmit={submitExperience}
            />

            {/* Remove Work Experience confirmation */}
            {(() => {
                const target = staff.experience.find((w) => w.id === expDeletingId)
                return (
                    <AlertDialog
                        open={expDeletingId !== null}
                        onOpenChange={(open) => { if (!open && !isSaving) setExpDeletingId(null) }}
                    >
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Remove Work Experience</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to remove this work experience record? This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            {target && (
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                                    <p className="font-semibold text-slate-800">{target.title}</p>
                                    <p className="text-slate-600">{target.company}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{target.period || '-'}</p>
                                </div>
                            )}
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    disabled={isSaving}
                                    onClick={(e) => {
                                        // Keep the dialog open until the save finishes; it closes on success.
                                        e.preventDefault()
                                        confirmDeleteExperience()
                                    }}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                    {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                    Remove
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )
            })()}
        </div>
    )
}
