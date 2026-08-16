'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, Shield, Search } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { useCombinations } from '@/lib/api/master/aircraft-engine/aircraftEngine.hooks'
import type { AircraftEngineCombination } from '@/lib/api/master/aircraft-engine/aircraftEngine.types'

interface EditAircraftModalProps {
    isOpen: boolean
    onClose: () => void
    initialSelection: number[]
    onSave: (selection: number[]) => void
    isSaving?: boolean
}

export function EditAircraftModal({ isOpen, onClose, initialSelection, onSave, isSaving }: EditAircraftModalProps) {
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
    const [comboSearch, setComboSearch] = useState('')
    
    // We fetch combinations here instead of aircraft type licenses
    const { data: combinations = [], isLoading } = useCombinations()

    useEffect(() => {
        if (isOpen) {
            setSelectedIds(new Set(initialSelection))
            setComboSearch('')
        }
    }, [isOpen, initialSelection])

    const toggleCombination = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    // Group combinations by familyCode, filtered by search
    const groupedCombos = useMemo(() => {
        const q = comboSearch.toLowerCase()
        const byFamily = new Map<string, AircraftEngineCombination[]>()
        for (const c of combinations) {
            if (q && !c.displayLabel.toLowerCase().includes(q) && !c.familyCode.toLowerCase().includes(q)) continue
            const arr = byFamily.get(c.familyCode) ?? []
            arr.push(c)
            byFamily.set(c.familyCode, arr)
        }
        return Array.from(byFamily.entries()).sort((a, b) => a[0].localeCompare(b[0]))
    }, [combinations, comboSearch])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave(Array.from(selectedIds))
    }

    if (!isOpen) return null

    const inputClass = 'w-full px-3.5 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg outline-none transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[480px] mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-green-50 text-green-600">
                            <Shield className="h-4 w-4" />
                        </div>
                        <span className="text-base font-bold text-slate-800">Edit Aircraft License</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-all duration-200 border-none bg-transparent"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="px-7 py-5 overflow-y-auto flex-1 max-h-[60vh] space-y-4">
                        
                        {/* Search box */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                value={comboSearch}
                                onChange={e => setComboSearch(e.target.value)}
                                placeholder="Search combination..."
                                className={`${inputClass} !pl-9`}
                            />
                        </div>

                        {/* Selected count */}
                        <div className="flex items-center text-xs text-slate-400">
                            <span>Selected {selectedIds.size} combinations</span>
                        </div>

                        {/* Grouped checkbox list */}
                        <div className="min-h-[120px] max-h-[300px] overflow-y-auto rounded-lg border border-slate-200 p-3 space-y-3">
                            {isLoading ? (
                                <div className="py-6 text-center text-xs text-slate-400">Loading...</div>
                            ) : groupedCombos.length === 0 ? (
                                <p className="py-6 text-center text-xs text-slate-400">No combination found</p>
                            ) : (
                                groupedCombos.map(([family, combos]) => (
                                    <div key={family}>
                                        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                            {family}
                                        </div>
                                        <div className="space-y-0.5">
                                            {combos.map((c) => (
                                                <label
                                                    key={c.id}
                                                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-slate-50 transition-colors duration-150"
                                                >
                                                    <Checkbox
                                                        checked={selectedIds.has(c.id)}
                                                        onCheckedChange={() => toggleCombination(c.id)}
                                                    />
                                                    <span className="text-xs text-slate-700">{c.displayLabel}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-7 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg cursor-pointer transition-all duration-200 hover:bg-slate-50 hover:border-slate-300"
                            disabled={isSaving || isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving || isLoading}
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-green-600 border border-green-600 rounded-lg cursor-pointer transition-all duration-200 hover:bg-green-700 hover:border-green-700 hover:shadow-md disabled:opacity-50"
                        >
                            {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
