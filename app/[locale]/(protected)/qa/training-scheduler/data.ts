import { Session, Instructor } from './types'

// ─── Course References ──────────────────────────────────────────────────────

export const COURSES_REF = [
    { id: 1, code: 'HF-001', name: 'Human Factors in Aviation Maintenance', category: 'Core', recurrent: true },
    { id: 2, code: 'SMS-001', name: 'Safety Management System', category: 'Core', recurrent: true },
    { id: 3, code: 'DG-001', name: 'Dangerous Goods Awareness', category: 'Core', recurrent: true },
    { id: 4, code: 'CP-001', name: 'Company Policy, Procedures (MOE & TPM)', category: 'Core', recurrent: false },
    { id: 13, code: 'AT-B737', name: 'Aircraft Type: B737 & Relevant Technology', category: 'Aircraft Type', recurrent: false },
    { id: 14, code: 'AT-A320', name: 'Aircraft Type: A318/319/320', category: 'Aircraft Type', recurrent: false },
    { id: 15, code: 'AT-B777', name: 'Aircraft Type: B777', category: 'Aircraft Type', recurrent: false },
    { id: 22, code: 'SP-FTS1', name: 'Fuel Tank Safety (Phase 1)', category: 'Specialized', recurrent: true },
    { id: 24, code: 'SP-EWIS', name: 'Electrical Wiring Interconnection System', category: 'Specialized', recurrent: true },
    { id: 25, code: 'SP-RVSM', name: 'Special Operations (RVSM, PBN/RNP, CAT II/III)', category: 'Specialized', recurrent: true },
    { id: 26, code: 'SP-ETOPS', name: 'Special Operations (EDTO/ETOPS)', category: 'Specialized', recurrent: true },
    { id: 31, code: 'CM-AUDIT', name: 'Internal Audit', category: 'Compliance', recurrent: false },
    { id: 33, code: 'CM-TTT', name: 'Train the Trainer', category: 'Compliance', recurrent: false },
]

// ─── Instructors ────────────────────────────────────────────────────────────

export const INSTRUCTORS: Instructor[] = [
    { id: 1, name: 'Capt. Somchai W.', dept: 'Technical Services' },
    { id: 2, name: 'Eng. Priya N.', dept: 'Maintenance' },
    { id: 3, name: 'Mr. Thanakorn L.', dept: 'Compliance Monitoring' },
    { id: 4, name: 'Ms. Siriporn K.', dept: 'Safety Management' },
    { id: 5, name: 'External Instructor', dept: 'External' },
]

// ─── Venues & Departments ──────────────────────────────────────────────────

export const VENUES = ['Training Room A', 'Training Room B', 'Hangar 1 – Classroom', 'Hangar 2 – Classroom', 'Online (MS Teams)', 'External Facility']
export const DEPTS = ['All Departments', 'Executive', 'Maintenance', 'Compliance Monitoring', 'Safety Management', 'Technical Services', 'Store & Purchase']
export const CATEGORIES = ['All', 'Core', 'Aircraft Familiarization', 'Aircraft Type', 'Specialized', 'Compliance']

// ─── Initial Sessions (Mar–Jun 2026) ───────────────────────────────────────

export const INITIAL_SESSIONS: Session[] = [
    {
        id: 1, courseId: 1, courseName: 'Human Factors in Aviation Maintenance',
        courseCode: 'HF-001', category: 'Core',
        dateStart: '2026-03-10', dateEnd: '2026-03-10',
        timeStart: '09:00', timeEnd: '16:00',
        instructor: 'Mr. Thanakorn L.', venue: 'Training Room A',
        dept: 'All Departments', maxParticipants: 30, enrolled: 24,
        status: 'Completed', type: 'Recurrent',
    },
    {
        id: 2, courseId: 2, courseName: 'Safety Management System',
        courseCode: 'SMS-001', category: 'Core',
        dateStart: '2026-03-17', dateEnd: '2026-03-17',
        timeStart: '09:00', timeEnd: '16:00',
        instructor: 'Ms. Siriporn K.', venue: 'Training Room B',
        dept: 'All Departments', maxParticipants: 25, enrolled: 20,
        status: 'Completed', type: 'Recurrent',
    },
    {
        id: 3, courseId: 13, courseName: 'Aircraft Type: B737 & Relevant Technology',
        courseCode: 'AT-B737', category: 'Aircraft Type',
        dateStart: '2026-03-24', dateEnd: '2026-03-27',
        timeStart: '08:00', timeEnd: '17:00',
        instructor: 'Capt. Somchai W.', venue: 'Hangar 1 – Classroom',
        dept: 'Maintenance', maxParticipants: 15, enrolled: 12,
        status: 'Completed', type: 'Initial',
    },
    {
        id: 4, courseId: 3, courseName: 'Dangerous Goods Awareness',
        courseCode: 'DG-001', category: 'Core',
        dateStart: '2026-04-02', dateEnd: '2026-04-02',
        timeStart: '13:00', timeEnd: '17:00',
        instructor: 'External Instructor', venue: 'Online (MS Teams)',
        dept: 'All Departments', maxParticipants: 50, enrolled: 38,
        status: 'Scheduled', type: 'Recurrent',
    },
    {
        id: 5, courseId: 22, courseName: 'Fuel Tank Safety (Phase 1)',
        courseCode: 'SP-FTS1', category: 'Specialized',
        dateStart: '2026-04-08', dateEnd: '2026-04-09',
        timeStart: '08:00', timeEnd: '17:00',
        instructor: 'Capt. Somchai W.', venue: 'Hangar 2 – Classroom',
        dept: 'Maintenance', maxParticipants: 12, enrolled: 8,
        status: 'Scheduled', type: 'Recurrent',
    },
    {
        id: 6, courseId: 24, courseName: 'Electrical Wiring Interconnection System',
        courseCode: 'SP-EWIS', category: 'Specialized',
        dateStart: '2026-04-14', dateEnd: '2026-04-16',
        timeStart: '08:00', timeEnd: '17:00',
        instructor: 'Eng. Priya N.', venue: 'Hangar 1 – Classroom',
        dept: 'Maintenance', maxParticipants: 15, enrolled: 15,
        status: 'Full', type: 'Recurrent',
    },
    {
        id: 7, courseId: 14, courseName: 'Aircraft Type: A318/319/320',
        courseCode: 'AT-A320', category: 'Aircraft Type',
        dateStart: '2026-04-22', dateEnd: '2026-04-25',
        timeStart: '08:00', timeEnd: '17:00',
        instructor: 'Capt. Somchai W.', venue: 'Hangar 1 – Classroom',
        dept: 'Maintenance', maxParticipants: 15, enrolled: 10,
        status: 'Scheduled', type: 'Initial',
    },
    {
        id: 8, courseId: 25, courseName: 'Special Operations (RVSM, PBN/RNP, CAT II/III)',
        courseCode: 'SP-RVSM', category: 'Specialized',
        dateStart: '2026-05-06', dateEnd: '2026-05-07',
        timeStart: '09:00', timeEnd: '17:00',
        instructor: 'External Instructor', venue: 'External Facility',
        dept: 'Maintenance', maxParticipants: 10, enrolled: 7,
        status: 'Scheduled', type: 'Recurrent',
    },
    {
        id: 9, courseId: 31, courseName: 'Internal Audit',
        courseCode: 'CM-AUDIT', category: 'Compliance',
        dateStart: '2026-05-12', dateEnd: '2026-05-13',
        timeStart: '09:00', timeEnd: '17:00',
        instructor: 'Mr. Thanakorn L.', venue: 'Training Room A',
        dept: 'Compliance Monitoring', maxParticipants: 8, enrolled: 5,
        status: 'Scheduled', type: 'Initial',
    },
    {
        id: 10, courseId: 26, courseName: 'Special Operations (EDTO/ETOPS)',
        courseCode: 'SP-ETOPS', category: 'Specialized',
        dateStart: '2026-05-20', dateEnd: '2026-05-21',
        timeStart: '09:00', timeEnd: '17:00',
        instructor: 'Capt. Somchai W.', venue: 'Hangar 2 – Classroom',
        dept: 'Maintenance', maxParticipants: 12, enrolled: 9,
        status: 'Scheduled', type: 'Recurrent',
    },
    {
        id: 11, courseId: 4, courseName: 'Company Policy, Procedures (MOE & TPM)',
        courseCode: 'CP-001', category: 'Core',
        dateStart: '2026-06-03', dateEnd: '2026-06-03',
        timeStart: '09:00', timeEnd: '12:00',
        instructor: 'Ms. Siriporn K.', venue: 'Training Room B',
        dept: 'All Departments', maxParticipants: 40, enrolled: 28,
        status: 'Scheduled', type: 'Initial',
    },
    {
        id: 12, courseId: 33, courseName: 'Train the Trainer',
        courseCode: 'CM-TTT', category: 'Compliance',
        dateStart: '2026-06-15', dateEnd: '2026-06-17',
        timeStart: '09:00', timeEnd: '17:00',
        instructor: 'External Instructor', venue: 'External Facility',
        dept: 'Technical Services', maxParticipants: 6, enrolled: 4,
        status: 'Scheduled', type: 'Initial',
    },
]
