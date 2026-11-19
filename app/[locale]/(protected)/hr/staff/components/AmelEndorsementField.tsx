'use client'

import { useState } from 'react'
import { Check, Pencil, RotateCcw } from 'lucide-react'

/** Standard endorsement wording printed in the AMEL booklet. Stored in the license's `limitations` field. */
export const DEFAULT_AMEL_ENDORSEMENT = 'Unpressurised Piston Engine Airplanes MTOM not exceeding 5,700 Kgs'

export interface AmelEndorsementValue {
    hasEndorsement: boolean
    endorsementText: string
}

/** Build the field value from a stored `limitations` string. */
export function endorsementFromLimitations(limitations?: string | null): AmelEndorsementValue {
    const text = limitations?.trim() || ''
    return {
        hasEndorsement: !!text,
        endorsementText: text || DEFAULT_AMEL_ENDORSEMENT,
    }
}

/** Convert the field value back to the `limitations` string sent to the API. */
export function endorsementToLimitations(value: AmelEndorsementValue): string {
    return value.hasEndorsement ? value.endorsementText.trim() : ''
}

/** Returns an error message when the value cannot be saved, otherwise null. */
export function validateEndorsement(value: AmelEndorsementValue): string | null {
    return value.hasEndorsement && !value.endorsementText.trim() ? 'AMEL endorsement text is required when checked' : null
}

interface AmelEndorsementFieldProps {
    value: AmelEndorsementValue
    onChange: (value: AmelEndorsementValue) => void
    /** Error shown under the field (e.g. from submit validation). */
    error?: string | null
}

const inputClass =
    'w-full px-3.5 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg outline-none transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300'
const linkButtonClass =
    'inline-flex items-center gap-1 text-xs font-semibold cursor-pointer bg-transparent border-none p-0 transition-colors'

export function AmelEndorsementField({ value, onChange, error }: AmelEndorsementFieldProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [localError, setLocalError] = useState('')
    const shownError = localError || error || ''

    const update = (patch: Partial<AmelEndorsementValue>) => {
        setLocalError('')
        onChange({ ...value, ...patch })
    }

    const handleDone = () => {
        if (!value.endorsementText.trim()) {
            setLocalError('Endorsement text is required')
            return
        }
        setIsEditing(false)
    }

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-500 tracking-wide">AMEL Endorsement (Limitations)</label>
                {value.hasEndorsement &&
                    (isEditing ? (
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => update({ endorsementText: DEFAULT_AMEL_ENDORSEMENT })}
                                className={`${linkButtonClass} text-slate-400 hover:text-slate-600`}
                            >
                                <RotateCcw className="h-3 w-3" /> Reset
                            </button>
                            <button type="button" onClick={handleDone} className={`${linkButtonClass} text-blue-600 hover:text-blue-700`}>
                                <Check className="h-3 w-3" /> Done
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className={`${linkButtonClass} text-blue-600 hover:text-blue-700`}
                        >
                            <Pencil className="h-3 w-3" /> Edit text
                        </button>
                    ))}
            </div>

            {isEditing ? (
                <input
                    type="text"
                    autoFocus
                    value={value.endorsementText}
                    onChange={e => update({ endorsementText: e.target.value })}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            e.preventDefault()
                            handleDone()
                        }
                    }}
                    className={`${inputClass} ${shownError ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                />
            ) : (
                <button
                    type="button"
                    role="checkbox"
                    aria-checked={value.hasEndorsement}
                    onClick={() => update({ hasEndorsement: !value.hasEndorsement })}
                    className={`flex w-full items-center gap-3 rounded-lg border px-3.5 py-3 text-left cursor-pointer transition-all duration-200 ${
                        value.hasEndorsement
                            ? 'border-blue-300 bg-blue-50/60 hover:border-blue-400'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                >
                    <span
                        className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-all duration-200 ${
                            value.hasEndorsement ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white'
                        }`}
                    >
                        {value.hasEndorsement && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    <span className="flex min-w-0 flex-col">
                        <span className={`text-sm font-medium ${value.hasEndorsement ? 'text-slate-800' : 'text-slate-500'}`}>
                            {value.endorsementText}
                        </span>
                        <span className="text-xs text-slate-400">
                            {value.hasEndorsement ? 'Stated in AMEL booklet' : 'Check if stated in AMEL booklet'}
                        </span>
                    </span>
                </button>
            )}
            {shownError && <p className="text-xs font-medium text-red-500">{shownError}</p>}
        </div>
    )
}
