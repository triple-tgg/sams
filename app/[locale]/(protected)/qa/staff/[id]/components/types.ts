import { ReactNode, CSSProperties } from 'react';

// ── Color System ──
export const C = {
    primary: '#1a56db', primary2: '#1e40af', primary3: '#3b82f6',
    primary4: '#93c5fd', primary5: '#dbeafe', primary6: '#eff6ff',
    green: '#16a34a', greenL: '#dcfce7',
    orange: '#d97706', orangeL: '#fef3c7',
    red: '#dc2626', redL: '#fee2e2',
    bg: '#f0f4ff', surface: '#ffffff',
    sidebar: '#1e3a8a', sidebarD: '#172554',
    border: '#e2e8f0', text: '#0f172a',
    muted: '#64748b', mutedL: '#94a3b8',
} as const;

// ── Types ──
export type TrainingStatus = 'valid' | 'expired' | 'perm';
export type TrainingType = 'R2Y' | 'INI';
export type FlowStepStatus = 'done' | 'action' | 'pending';
export type TabName = 'Profile' | 'Training Matrix' | 'Experience' | 'Logbook';

export interface MatrixItem {
    no: number;
    course: string;
    type: TrainingType;
    completed: string;
    validUntil: string;
    daysLeft: number | null;
    status: TrainingStatus;
}

export interface EmploymentItem {
    org: string;
    role: string;
    from: string;
    to: string;
    active: boolean;
}

export interface EducationItem {
    deg: string;
    inst: string;
    period: string;
}

export interface TrainingHighlight {
    d: string;
    c: string;
    by: string;
}

export interface FlowStep {
    step: string;
    status: FlowStepStatus;
    desc: string;
}

export interface CategoryProgress {
    l: string;
    d: number;
    t: number;
}

export interface StaffSummaryMetric {
    l: string;
    v: string;
    c: string;
}

export interface PieDataItem {
    name: string;
    value: number;
    color: string;
}

// ── UI Component Props ──
export interface BadgeProps {
    children: ReactNode;
    color: string;
    bg: string;
    border: string;
}

export interface StatusBadgeProps {
    status: TrainingStatus;
    days: number | null;
}

export interface TypeBadgeProps {
    type: TrainingType;
}

export interface SectionCardProps {
    title?: string;
    icon?: ReactNode;
    children: ReactNode;
    style?: CSSProperties;
}

export interface InfoRowProps {
    label: string;
    value: ReactNode;
}

// ── Tab Component Props ──
export interface ProfileTabProps {
    employment: EmploymentItem[];
    ratings: string[];
}

export interface TrainingMatrixTabProps {
    matrix: MatrixItem[];
    categories: CategoryProgress[];
}

export interface ExperienceTabProps {
    highlights: TrainingHighlight[];
}

