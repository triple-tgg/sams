'use client'

import { useState, useEffect } from 'react'
import { X, Shield, Plane, Check, Loader2 } from 'lucide-react'
import { useAircraftTypeLicenses } from '@/lib/api/master/aircraft-type-licenses.hooks'

interface EditAircraftModalProps {
    isOpen: boolean
    onClose: () => void
    initialSelection: number[]
    onSave: (selection: number[]) => void
    isSaving?: boolean
}

export function EditAircraftModal({ isOpen, onClose, initialSelection, onSave, isSaving }: EditAircraftModalProps) {
    const [selection, setSelection] = useState<number[]>([])
    const { data: licenses = [], isLoading } = useAircraftTypeLicenses()

    useEffect(() => {
        if (isOpen) {
            setSelection(initialSelection)
        }
    }, [isOpen, initialSelection])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave(selection)
    }

    if (!isOpen) return null

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
                    <div className="px-7 py-5 overflow-y-auto flex-1 max-h-[60vh]">
                        <p className="text-sm font-medium text-slate-500 mb-4">Select aircraft types to assign to this staff member.</p>
                        
                        {isLoading ? (
                            <div className="flex justify-center items-center py-10">
                                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-2.5">
                                {licenses.map((license) => {
                                    const typeId = license.id
                                    const isSelected = selection.includes(typeId)
                                    return (
                                        <label
                                            key={typeId}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all duration-150 select-none ${
                                                isSelected
                                                    ? 'border-green-300 bg-green-50/60 text-green-800 shadow-sm'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelection(prev => [...prev, typeId])
                                                    } else {
                                                        setSelection(prev => prev.filter(id => id !== typeId))
                                                    }
                                                }}
                                                className="sr-only"
                                            />
                                            <div className={`w-4.5 h-4.5 rounded md border-2 flex items-center justify-center shrink-0 transition-colors ${
                                                isSelected ? 'border-green-500 bg-green-500' : 'border-slate-300 bg-white'
                                            }`}>
                                                {isSelected && (
                                                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                                )}
                                            </div>
                                            <Plane className="h-4 w-4 shrink-0" />
                                            <span className="text-sm font-semibold">{license.name}</span>
                                        </label>
                                    )
                                })}
                            </div>
                        )}
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
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

