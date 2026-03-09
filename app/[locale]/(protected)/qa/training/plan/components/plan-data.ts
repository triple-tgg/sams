import { ReactNode } from 'react';

// ── Types ──
export type PlanStatus = 'draft' | 'active' | 'completed' | 'overdue';

export interface TrainingPlan {
    id: string;
    name: string;
    period: string;
    department: string;
    courses: number;
    enrolled: number;
    totalStaff: number;
    completion: number;
    status: PlanStatus;
    createdBy: string;
    quarter: string;
    year: string;
}

export interface PlanSummary {
    label: string;
    value: number;
    color: string;
    bg: string;
    border: string;
    icon: ReactNode;
}

// ── Status Config ──
export const STATUS_CONFIG: Record<PlanStatus, { label: string; color: string; bg: string; border: string }> = {
    draft: { label: 'Draft', color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' },
    active: { label: 'Active', color: '#1a56db', bg: '#dbeafe', border: '#93c5fd' },
    completed: { label: 'Completed', color: '#16a34a', bg: '#dcfce7', border: '#86efac' },
    overdue: { label: 'Overdue', color: '#dc2626', bg: '#fee2e2', border: '#fca5a5' },
};

// ── Mock Data ──
export const TRAINING_PLANS: TrainingPlan[] = [
    {
        id: 'TP-2026-001', name: 'Q1 Recurrent Training Program',
        period: 'Jan 2026 – Mar 2026', department: 'All Departments',
        courses: 6, enrolled: 82, totalStaff: 248, completion: 94,
        status: 'completed', createdBy: 'Training Manager', quarter: 'Q1', year: '2026',
    },
    {
        id: 'TP-2026-002', name: 'Human Factors Renewal',
        period: 'Feb 2026 – Apr 2026', department: 'Maintenance',
        courses: 2, enrolled: 45, totalStaff: 120, completion: 68,
        status: 'active', createdBy: 'QA Manager', quarter: 'Q1', year: '2026',
    },
    {
        id: 'TP-2026-003', name: 'SMS Awareness Campaign',
        period: 'Mar 2026 – May 2026', department: 'Safety',
        courses: 3, enrolled: 34, totalStaff: 248, completion: 42,
        status: 'active', createdBy: 'Safety Manager', quarter: 'Q1', year: '2026',
    },
    {
        id: 'TP-2026-004', name: 'EWIS Compliance Training',
        period: 'Jan 2026 – Feb 2026', department: 'Maintenance',
        courses: 2, enrolled: 28, totalStaff: 60, completion: 100,
        status: 'completed', createdBy: 'Training Manager', quarter: 'Q1', year: '2026',
    },
    {
        id: 'TP-2026-005', name: 'B737 MAX Type Conversion',
        period: 'Apr 2026 – Jun 2026', department: 'Line Maintenance',
        courses: 8, enrolled: 0, totalStaff: 15, completion: 0,
        status: 'draft', createdBy: 'Training Manager', quarter: 'Q2', year: '2026',
    },
    {
        id: 'TP-2026-006', name: 'Fuel Tank Safety Workshop',
        period: 'Jan 2026 – Mar 2026', department: 'Base Maintenance',
        courses: 2, enrolled: 18, totalStaff: 35, completion: 40,
        status: 'overdue', createdBy: 'QA Manager', quarter: 'Q1', year: '2026',
    },
    {
        id: 'TP-2026-007', name: 'Emergency Procedures Drill',
        period: 'Apr 2026 – May 2026', department: 'All Departments',
        courses: 4, enrolled: 0, totalStaff: 248, completion: 0,
        status: 'draft', createdBy: 'Safety Manager', quarter: 'Q2', year: '2026',
    },
    {
        id: 'TP-2026-008', name: 'New Hire Orientation — Batch 3',
        period: 'Mar 2026 – Apr 2026', department: 'All Departments',
        courses: 5, enrolled: 12, totalStaff: 12, completion: 58,
        status: 'active', createdBy: 'HR Manager', quarter: 'Q1', year: '2026',
    },
];
