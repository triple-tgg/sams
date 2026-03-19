// ── Types ──
export interface Course {
    id: number
    code: string
    name: string
    category: string
    recurrent: boolean
    recurrentYears?: number
    note?: string
}

// ── Constants ──
export const CATEGORIES = ['All', 'Core', 'Aircraft Familiarization', 'Aircraft Type', 'Specialized', 'Compliance'] as const

export const CATEGORY_COLORS: Record<string, string> = {
    Core: 'bg-blue-100 text-blue-800',
    'Aircraft Familiarization': 'bg-sky-100 text-sky-800',
    'Aircraft Type': 'bg-indigo-100 text-indigo-800',
    Specialized: 'bg-amber-100 text-amber-800',
    Compliance: 'bg-emerald-100 text-emerald-800',
}

export const CATEGORY_DOT: Record<string, string> = {
    Core: 'bg-blue-500',
    'Aircraft Familiarization': 'bg-sky-400',
    'Aircraft Type': 'bg-indigo-500',
    Specialized: 'bg-amber-500',
    Compliance: 'bg-emerald-500',
}

// ── Matrix Types ──
export interface MatrixRole {
    short: string
    full: string
}

export interface Department {
    id: string
    name: string
    icon: string
    roles: string[]
}
