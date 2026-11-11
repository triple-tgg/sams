'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, Users, GraduationCap, Loader2, Edit3, Trash2, ExternalLink, ChevronUp, ChevronDown, ChevronsUpDown, UserX, MoreVertical, UserRound, PenTool, FileText, AlertTriangle } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { InstructorProfileModal } from './components/InstructorProfileModal'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { InstructorFormModal, type InstructorFormData } from './components/InstructorFormModal'
import { useInstructorList, useUpsertInstructor, useDeleteInstructor } from '@/lib/api/qa/instructor.hooks'
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
import { isInstructorActive, fromDateInputValue, toDateInputValue, getValidityStatus, VALIDITY_WARN_DAYS, type InstructorItem, type InstructorUpsertRequest, type ValidityStatus } from '@/lib/api/qa/instructor'
import { Switch } from '@/components/ui/switch'
import { MENU } from "@/lib/permission-codes";
import { useMenuPermission } from "@/hooks/use-menu-permission";

/** Badge under the Valid To date: expired / expiring soon. */
function ValidityBadge({ status }: { status: ValidityStatus }) {
    if (status.state === 'expired') {
        return (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-red-200 bg-red-50 text-[10px] font-semibold text-red-700">
                <AlertTriangle className="w-3 h-3" />
                Expired{status.daysAgo > 0 ? ` ${status.daysAgo}d ago` : ''}
            </span>
        )
    }
    if (status.state === 'expiring') {
        return (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-amber-200 bg-amber-50 text-[10px] font-semibold text-amber-700">
                <AlertTriangle className="w-3 h-3" />
                {status.daysLeft === 0 ? 'Expires today' : `Expires in ${status.daysLeft}d`}
            </span>
        )
    }
    return null
}

type TypeFilter = 'all' | 'internal' | 'external'
const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'internal', label: 'Internal' },
    { value: 'external', label: 'External' },
]

export default function InstructorPage() {
    const perm = useMenuPermission(MENU.QA_INSTRUCTOR);
    const [search, setSearch] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingInstructor, setEditingInstructor] = useState<InstructorFormData | null>(null)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    // Code column sort: asc → desc → none (API order)
    const [codeSort, setCodeSort] = useState<'asc' | 'desc' | null>(null)
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
    // Show only active instructors whose validity is expired or expiring soon
    const [attentionOnly, setAttentionOnly] = useState(false)
    const [profileStaffId, setProfileStaffId] = useState<number | null>(null)
    const toggleCodeSort = () => setCodeSort(s => (s === null ? 'asc' : s === 'asc' ? 'desc' : null))

    const { data: instructors = [], isLoading } = useInstructorList()
    const upsertMutation = useUpsertInstructor()
    const deleteMutation = useDeleteInstructor()

    // Instructor type filter counts (before search, so the numbers stay stable while typing)
    const typeCounts: Record<TypeFilter, number> = {
        all: instructors.length,
        internal: instructors.filter(i => i.flagInternal).length,
        external: instructors.filter(i => !i.flagInternal).length,
    }

    // Active instructors whose validity needs attention (inactive ones aren't scheduled, so not flagged)
    const needsAttention = (inst: InstructorItem) => {
        const s = getValidityStatus(inst.validTo).state
        return isInstructorActive(inst) && (s === 'expired' || s === 'expiring')
    }
    const expiredList = instructors.filter(i => isInstructorActive(i) && getValidityStatus(i.validTo).state === 'expired')
    const expiringList = instructors.filter(i => isInstructorActive(i) && getValidityStatus(i.validTo).state === 'expiring')
    const showAttentionOnly = attentionOnly && expiredList.length + expiringList.length > 0

    // Filter by type and search, then sort by code when requested
    const searched = instructors.filter((inst) => {
        if (showAttentionOnly && !needsAttention(inst)) return false
        if (typeFilter === 'internal' && !inst.flagInternal) return false
        if (typeFilter === 'external' && inst.flagInternal) return false
        if (!search) return true
        const q = search.toLowerCase()
        return (
            inst.name?.toLowerCase().includes(q) ||
            inst.code?.toLowerCase().includes(q) ||
            inst.email?.toLowerCase().includes(q)
        )
    })
    const filtered = codeSort
        ? [...searched].sort((a, b) => {
            const cmp = (a.code ?? '').localeCompare(b.code ?? '', undefined, { numeric: true, sensitivity: 'base' })
            return codeSort === 'asc' ? cmp : -cmp
        })
        : searched

    const activeCount = instructors.filter(isInstructorActive).length
    const inactiveCount = instructors.length - activeCount

    /** Full upsert body from a loaded instructor, so a single-field change doesn't wipe the rest. */
    const toUpsertBody = (inst: InstructorItem): InstructorUpsertRequest => ({
        id: inst.id,
        title: inst.title ?? '',
        code: inst.code ?? '',
        name: inst.name ?? '',
        email: inst.email ?? '',
        description: inst.description ?? '',
        licenseLink: inst.licenseLink ?? '',
        approvalLetterLink: inst.approvalLetterLink ?? '',
        flagInternal: !!inst.flagInternal,
        staffId: inst.flagInternal && inst.staffId ? inst.staffId : null,
        isActive: isInstructorActive(inst),
        validFrom: fromDateInputValue(toDateInputValue(inst.validFrom)),
        validTo: fromDateInputValue(toDateInputValue(inst.validTo)),
    })

    const [togglingId, setTogglingId] = useState<number | null>(null)
    const handleToggleActive = async (inst: InstructorItem, isActive: boolean) => {
        setTogglingId(inst.id)
        try {
            await upsertMutation.mutateAsync({ ...toUpsertBody(inst), isActive })
            toast.success(`${inst.name} is now ${isActive ? 'active' : 'inactive'}`)
        } catch (err: any) {
            toast.error(err?.message || 'Failed to update active status')
        } finally {
            setTogglingId(null)
        }
    }

    const handleSubmitInstructor = async (data: InstructorFormData) => {
        // The form doesn't edit isActive: keep the current value on edit, new instructors start active.
        const existing = data.id ? instructors.find(i => i.id === data.id) : undefined
        try {
            await upsertMutation.mutateAsync({
                isActive: existing ? isInstructorActive(existing) : true,
                id: data.id || 0,
                title: data.title,
                code: data.code,
                name: data.name,
                description: data.description,
                licenseLink: data.licenseLink,
                email: data.email,
                flagInternal: data.flagInternal,
                staffId: data.flagInternal ? data.staffId : null, // External → no staff link
                approvalLetterLink: data.approvalLetterLink,
                validFrom: fromDateInputValue(data.validFrom),
                validTo: fromDateInputValue(data.validTo),
            })
            toast.success(data.id ? 'Instructor updated successfully' : 'Instructor added successfully')
            setShowAddModal(false)
            setEditingInstructor(null)
        } catch (err: any) {
            toast.error(err?.message || 'Failed to save instructor')
        }
    }

    const handleEdit = (inst: InstructorItem) => {
        setEditingInstructor({
            id: inst.id,
            title: inst.title,
            code: inst.code,
            name: inst.name,
            description: inst.description,
            licenseLink: inst.licenseLink,
            email: inst.email,
            flagInternal: !!inst.flagInternal,
            staffId: inst.staffId ?? 0,
            approvalLetterLink: inst.approvalLetterLink ?? '',
            validFrom: toDateInputValue(inst.validFrom),
            validTo: toDateInputValue(inst.validTo),
        })
    }

    const handleDelete = async () => {
        if (!deletingId) return
        try {
            await deleteMutation.mutateAsync(deletingId)
            toast.success('Instructor deleted successfully')
            setDeletingId(null)
        } catch (err: any) {
            toast.error(err?.message || 'Failed to delete instructor')
        }
    }


    /** Validity dates are calendar days: format the date part only, so no timezone shift. */
    const formatDateOnly = (value?: string | null) => {
        const v = toDateInputValue(value)
        if (!v) return '-'
        const [y, m, d] = v.split('-').map(Number)
        return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Instructor Management</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage training instructors and their qualifications
                    </p>
                </div>
                {perm.canCreate && (<Button color='primary' className="gap-2" onClick={() => setShowAddModal(true)}>
                    <Plus className="w-4 h-4" />
                    Add Instructor
                </Button>)}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Users className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{isLoading ? '—' : instructors.length}</p>
                                <p className="text-xs text-muted-foreground font-medium">Total Instructors</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <GraduationCap className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{isLoading ? '—' : activeCount}</p>
                                <p className="text-xs text-muted-foreground font-medium">Active Instructors</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-500/10 flex items-center justify-center">
                                <UserX className="w-6 h-6 text-slate-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{isLoading ? '—' : inactiveCount}</p>
                                <p className="text-xs text-muted-foreground font-medium">Inactive Instructors</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Validity warning */}
            {!isLoading && expiredList.length + expiringList.length > 0 && (
                <div
                    role="alert"
                    className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${expiredList.length > 0
                        ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200'
                        : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
                        }`}
                >
                    <div className="flex items-start gap-3 min-w-0">
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div className="min-w-0 text-sm">
                            <p className="font-semibold">
                                {[
                                    expiredList.length > 0 && `${expiredList.length} instructor${expiredList.length > 1 ? 's have' : ' has'} expired`,
                                    expiringList.length > 0 && `${expiringList.length} expiring within ${VALIDITY_WARN_DAYS} days`,
                                ].filter(Boolean).join(' · ')}
                            </p>
                            <p className="text-xs opacity-80 mt-0.5 line-clamp-2">
                                {[...expiredList, ...expiringList].map(i => `${i.title} ${i.name}`.trim()).join(', ')}
                            </p>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 bg-white/70 dark:bg-transparent"
                        onClick={() => setAttentionOnly(v => !v)}
                    >
                        {showAttentionOnly ? 'Show all' : 'Show these only'}
                    </Button>
                </div>
            )}

            {/* Table Card */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle className="text-base">Instructors</CardTitle>
                            <CardDescription>List of all registered training instructors</CardDescription>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            {/* Type filter */}
                            <div role="radiogroup" aria-label="Filter by instructor type" className="inline-flex rounded-lg border border-border bg-card p-0.5">
                                {TYPE_FILTERS.map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        role="radio"
                                        aria-checked={typeFilter === opt.value}
                                        onClick={() => setTypeFilter(opt.value)}
                                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${typeFilter === opt.value
                                            ? 'bg-primary text-white'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        {opt.label}
                                        <span className={`ml-1.5 text-[10px] ${typeFilter === opt.value ? 'text-white/80' : 'text-muted-foreground/70'}`}>
                                            {typeCounts[opt.value]}
                                        </span>
                                    </button>
                                ))}
                            </div>
                            <div className="relative w-full sm:w-70">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search instructors..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 h-9 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table wrapperClassName="max-h-[calc(100vh-280px)] min-h-80">
                        <TableHeader className="sticky top-0 z-30 bg-card shadow-[0_1px_0_0_var(--border)]">
                            <TableRow>
                                <TableHead className="w-[50px]">#</TableHead>
                                <TableHead className="sticky left-0 z-20 min-w-55 bg-card shadow-[1px_0_0_0_var(--border)]">Instructor Name</TableHead>
                                <TableHead aria-sort={codeSort === 'asc' ? 'ascending' : codeSort === 'desc' ? 'descending' : 'none'}>
                                    <button
                                        type="button"
                                        onClick={toggleCodeSort}
                                        className="inline-flex items-center gap-1 uppercase hover:text-foreground transition-colors"
                                        title="Sort by instructor code"
                                    >
                                        Instructor Code
                                        {codeSort === 'asc' ? (
                                            <ChevronUp className="w-3.5 h-3.5 text-primary" />
                                        ) : codeSort === 'desc' ? (
                                            <ChevronDown className="w-3.5 h-3.5 text-primary" />
                                        ) : (
                                            <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground/50" />
                                        )}
                                    </button>
                                </TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Valid From</TableHead>
                                <TableHead>Valid To</TableHead>
                                <TableHead className="text-center">Active</TableHead>
                                <TableHead className="w-20 text-center sticky right-0 z-20 bg-card shadow-[-1px_0_0_0_var(--border)]">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-40 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                            <p className="text-xs text-muted-foreground">Loading instructors...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-40 text-center">
                                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                            <Users className="w-10 h-10 opacity-30" />
                                            <div>
                                                <p className="text-sm font-medium">No instructors found</p>
                                                <p className="text-xs">
                                                    {search || typeFilter !== 'all' || showAttentionOnly
                                                        ? 'Try a different search term or type filter'
                                                        : 'Click "Add Instructor" to get started'}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((inst, idx) => (
                                    <TableRow key={inst.id} className={idx % 2 === 1 ? 'bg-slate-50 dark:bg-slate-900' : 'bg-card'}>
                                        <TableCell className="text-xs font-medium text-muted-foreground">{idx + 1}</TableCell>
                                        <TableCell className="sticky left-0 z-10 min-w-55 bg-inherit shadow-[1px_0_0_0_var(--border)]">
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">{inst.title} {inst.name}</p>
                                                {inst.description && (
                                                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{inst.description}</p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-border bg-muted/30 font-mono text-[11px] font-medium text-foreground">
                                                {inst.code}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-semibold ${inst.flagInternal
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                                    }`}
                                            >
                                                {inst.flagInternal ? 'Internal' : 'External'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{inst.email || '-'}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDateOnly(inst.validFrom)}</TableCell>
                                        <TableCell className="text-xs whitespace-nowrap">
                                            {(() => {
                                                const status = getValidityStatus(inst.validTo)
                                                return (
                                                    <div className="flex flex-col items-start gap-1">
                                                        <span className={status.state === 'expired' ? 'font-semibold text-red-700' : status.state === 'expiring' ? 'font-semibold text-amber-700' : 'text-muted-foreground'}>
                                                            {formatDateOnly(inst.validTo)}
                                                        </span>
                                                        <ValidityBadge status={status} />
                                                    </div>
                                                )
                                            })()}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="inline-flex items-center gap-2">
                                                <Switch
                                                    checked={isInstructorActive(inst)}
                                                    onCheckedChange={(checked) => handleToggleActive(inst, checked)}
                                                    disabled={togglingId !== null || !perm.canEdit}
                                                    aria-label={`${inst.name} active`}
                                                />
                                                {togglingId === inst.id && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                                            </div>
                                        </TableCell>
                                        <TableCell className="sticky right-0 z-10 bg-inherit shadow-[-1px_0_0_0_var(--border)]">
                                            <div className="flex items-center justify-center">
                                                <DropdownMenu modal={false}>
                                                    <DropdownMenuTrigger asChild>
                                                        <button
                                                            type="button"
                                                            aria-label={`Actions for ${inst.name}`}
                                                            className="p-1.5 rounded-lg text-slate-500 hover:text-foreground hover:bg-muted transition-colors"
                                                        >
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-52">
                                                        {inst.flagInternal && inst.staffId > 0 && (
                                                            <DropdownMenuItem onSelect={() => setProfileStaffId(inst.staffId)} className="gap-2 cursor-pointer">
                                                                <UserRound className="w-4 h-4" /> View Profile
                                                            </DropdownMenuItem>
                                                        )}
                                                        {perm.canEdit && (<DropdownMenuItem onSelect={() => handleEdit(inst)} className="gap-2 cursor-pointer">
                                                            <Edit3 className="w-4 h-4" /> Edit Instructor
                                                        </DropdownMenuItem>)}
                                                        {inst.licenseLink && (
                                                            <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                                                                <a href={inst.licenseLink} target="_blank" rel="noopener noreferrer">
                                                                    <PenTool className="w-4 h-4" /> View Signature
                                                                    <ExternalLink className="w-3 h-3 ml-auto opacity-60" />
                                                                </a>
                                                            </DropdownMenuItem>
                                                        )}
                                                        {inst.approvalLetterLink && (
                                                            <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                                                                <a href={inst.approvalLetterLink} target="_blank" rel="noopener noreferrer">
                                                                    <FileText className="w-4 h-4" /> View Approval Letter
                                                                    <ExternalLink className="w-3 h-3 ml-auto opacity-60" />
                                                                </a>
                                                            </DropdownMenuItem>
                                                        )}
                                                        {perm.canDelete && <DropdownMenuSeparator />}
                                                        {perm.canDelete && (<DropdownMenuItem
                                                            onSelect={() => setDeletingId(inst.id)}
                                                            className="gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                                        >
                                                            <Trash2 className="w-4 h-4" /> Delete Instructor
                                                        </DropdownMenuItem>)}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Staff profile of an Internal instructor (read-only) */}
            <InstructorProfileModal staffId={profileStaffId} onClose={() => setProfileStaffId(null)} />

            {/* Add Instructor Modal */}
            <InstructorFormModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSubmit={handleSubmitInstructor}
                isPending={upsertMutation.isPending}
            />

            {/* Edit Instructor Modal */}
            <InstructorFormModal
                isOpen={!!editingInstructor}
                onClose={() => setEditingInstructor(null)}
                onSubmit={handleSubmitInstructor}
                isPending={upsertMutation.isPending}
                instructor={editingInstructor}
            />
            {/* Delete Confirm Dialog */}
            <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Instructor</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this instructor?
                            {deletingId && (() => {
                                const inst = instructors.find((i) => i.id === deletingId)
                                return inst ? (
                                    <span className="block mt-1 font-medium text-foreground">
                                        {inst.title} {inst.name} ({inst.code})
                                    </span>
                                ) : null
                            })()}
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
