'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, Users, GraduationCap, Loader2, Edit3, Trash2, ExternalLink } from 'lucide-react'
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
import type { InstructorItem } from '@/lib/api/qa/instructor'

export default function InstructorPage() {
    const [search, setSearch] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingInstructor, setEditingInstructor] = useState<InstructorFormData | null>(null)
    const [deletingId, setDeletingId] = useState<number | null>(null)

    const { data: instructors = [], isLoading } = useInstructorList()
    const upsertMutation = useUpsertInstructor()
    const deleteMutation = useDeleteInstructor()

    // Filter by search
    const filtered = instructors.filter((inst) => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
            inst.name?.toLowerCase().includes(q) ||
            inst.code?.toLowerCase().includes(q) ||
            inst.email?.toLowerCase().includes(q)
        )
    })

    const activeCount = instructors.filter((i) => !i.isDelete).length

    const handleSubmitInstructor = async (data: InstructorFormData) => {
        try {
            await upsertMutation.mutateAsync({
                id: data.id || 0,
                title: data.title,
                code: data.code,
                name: data.name,
                description: data.description,
                licenseLink: data.licenseLink,
                email: data.email,
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

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-'
        try {
            return new Date(dateStr).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            })
        } catch {
            return dateStr
        }
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
                <Button className="gap-2" onClick={() => setShowAddModal(true)}>
                    <Plus className="w-4 h-4" />
                    Add Instructor
                </Button>
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
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <GraduationCap className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">—</p>
                                <p className="text-xs text-muted-foreground font-medium">Courses Assigned</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Table Card */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base">Instructors</CardTitle>
                            <CardDescription>List of all registered training instructors</CardDescription>
                        </div>
                        <div className="relative w-[280px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search instructors..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 h-9 text-sm"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">#</TableHead>
                                <TableHead>Instructor Name</TableHead>
                                <TableHead>Code</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Signature</TableHead>
                                <TableHead>Updated</TableHead>
                                <TableHead className="w-[80px] text-center">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-40 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                            <p className="text-xs text-muted-foreground">Loading instructors...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-40 text-center">
                                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                            <Users className="w-10 h-10 opacity-30" />
                                            <div>
                                                <p className="text-sm font-medium">No instructors found</p>
                                                <p className="text-xs">
                                                    {search ? 'Try a different search term' : 'Click "Add Instructor" to get started'}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((inst, idx) => (
                                    <TableRow key={inst.id}>
                                        <TableCell className="text-xs font-medium text-muted-foreground">{idx + 1}</TableCell>
                                        <TableCell>
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
                                        <TableCell className="text-xs text-muted-foreground">{inst.email || '-'}</TableCell>
                                        <TableCell>
                                            {inst.licenseLink ? (
                                                <a
                                                    href={inst.licenseLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    View
                                                </a>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{formatDate(inst.updatedDate)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => handleEdit(inst)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer border-none bg-transparent"
                                                    title="Edit Instructor"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeletingId(inst.id)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer border-none bg-transparent"
                                                    title="Delete Instructor"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

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
