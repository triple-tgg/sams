import { MatrixItem, EmploymentItem, EducationItem, TrainingHighlight, FlowStep, CategoryProgress, PieDataItem, C, TabName } from './types';

// ── Staff Personal Data ──
export const STAFF_INFO = {
    initials: 'PS',
    nameEn: 'Mr. Phaisal Sangasang',
    nameTh: 'นาย ไพศาล สง่าแสง',
    empNo: 'EMP #0020',
    tags: ['✈ Certifying Staff', '⚡ AMEL #0994 (Valid Mar 2029)', '📋 Maintenance Dept.'],
    dob: '05 February 1963',
    pob: 'Ang Thong',
    nationality: 'Thai 🇹🇭',
    thaiId: '3100502064840',
    phone: '081-341-6865',
    address: '69/27 Moo 5, Fah Piyarom Village, Bueng Kham Phroi, Lam Luk Ka, Pathum Thani 12150',
};

// ── AMEL License ──
export const LICENSE = {
    no: '0994',
    validFrom: '15 Mar 2024',
    validTo: '14 Mar 2029',
};

// ── Aircraft Ratings ──
export const RATINGS: string[] = [
    'Cessna-150', 'A300-600/600R/A310', 'A318/A319/A320/A321 A&P',
    'B737-400', 'A319/A320/A321 (IAE V2500)', 'A320 (CFM56) Series',
    'B737-600/700/800/900 (CFM56)', 'A319/A320/A321 (CFM LEAP-1A)',
    'A319/A320/A321 (IAE PW1100G)',
];

// ── Education ──
export const EDUCATION: EducationItem[] = [
    { deg: 'Bachelor', inst: 'Sukhothai Thammathirat University', period: '2010 – 2014' },
    { deg: 'Diploma', inst: 'Royal Thai Air Force Training (RTAF)', period: '1980 – 1982' },
];

// ── Employment ──
export const EMPLOYMENT: EmploymentItem[] = [
    { org: 'SAMS Co., Ltd.', role: 'Certifying Staff', from: 'Jan 2024', to: 'Present', active: true },
    { org: 'Thai Smile', role: 'LAE Certificate of A320', from: 'Feb 2022', to: 'Jan 2023', active: false },
    { org: 'Thai Airways Intl.', role: 'LAE A320 / A300-600 / B737', from: 'Aug 1990', to: 'Nov 2020', active: false },
    { org: 'Royal Thai Air Force', role: 'Aircraft Mechanic', from: 'Mar 1982', to: 'Aug 1990', active: false },
];

// ── Training Matrix ──
export const MATRIX: MatrixItem[] = [
    { no: 1, course: 'Human Factors in Aviation Maintenance', type: 'R2Y', completed: '15-May-2025', validUntil: '14-May-2027', daysLeft: 435, status: 'valid' },
    { no: 2, course: 'Safety Management System', type: 'R2Y', completed: '06-Jan-2026', validUntil: '05-Jan-2028', daysLeft: 670, status: 'valid' },
    { no: 3, course: 'Dangerous Goods Awareness', type: 'INI', completed: '09-Jan-2025', validUntil: '08-Jan-2027', daysLeft: 308, status: 'valid' },
    { no: 4, course: 'Company Policy, MOE & TPM / 145 CAAT Laws', type: 'INI', completed: '06-Jan-2025', validUntil: '05-Jan-2027', daysLeft: 305, status: 'valid' },
    { no: 5, course: 'A/C Gen Fam B737-600/700/800/900 & B737 MAX', type: 'R2Y', completed: '05-May-2025', validUntil: '04-May-2027', daysLeft: 424, status: 'valid' },
    { no: 6, course: 'A/C Gen Fam A318/A319/A320/A321', type: 'R2Y', completed: '02-May-2025', validUntil: '03-May-2027', daysLeft: 423, status: 'valid' },
    { no: 7, course: 'Aircraft Type B737 (CFM56 & MAX) + Technology', type: 'R2Y', completed: '05-May-2025', validUntil: '04-May-2027', daysLeft: 424, status: 'valid' },
    { no: 8, course: 'Aircraft Type A318/A319/A320/A321 + Technology', type: 'R2Y', completed: '02-May-2025', validUntil: '03-May-2027', daysLeft: 423, status: 'valid' },
    { no: 9, course: 'Fuel Tank Safety (Phase 1 & Phase 2)', type: 'R2Y', completed: '02-Feb-2026', validUntil: '02-Feb-2028', daysLeft: 698, status: 'valid' },
    { no: 10, course: 'Electrical Wiring Interconnection System (EWIS)', type: 'R2Y', completed: '14-May-2025', validUntil: '13-May-2027', daysLeft: 433, status: 'valid' },
    { no: 11, course: 'Aircraft Parts and Material Receiving', type: 'R2Y', completed: '10-Oct-2024', validUntil: '09-Oct-2026', daysLeft: 217, status: 'valid' },
    { no: 12, course: 'Aircraft Inspection Techniques', type: 'INI', completed: '23-Feb-2004', validUntil: '—', daysLeft: null, status: 'perm' },
    { no: 13, course: 'Special Operations (RVSM, PBN/RNP, CAT II/III)', type: 'R2Y', completed: '19-Feb-2025', validUntil: '18-Feb-2026', daysLeft: -16, status: 'expired' },
    { no: 14, course: 'Special Operations (EDTO/ETOPS)', type: 'R2Y', completed: '20-Feb-2025', validUntil: '19-Feb-2027', daysLeft: 350, status: 'valid' },
    { no: 15, course: 'Customer Procedure', type: 'INI', completed: 'Multiple', validUntil: '—', daysLeft: null, status: 'perm' },
];

// ── Training Categories ──
export const CATEGORIES: CategoryProgress[] = [
    { l: '🔹 Core Regulatory', d: 4, t: 4 },
    { l: '✈ Aircraft Type Training', d: 4, t: 4 },
    { l: '🛡 Airworthiness & Technical', d: 4, t: 4 },
    { l: '⚡ Special Operations', d: 2, t: 3 },
];

// ── Donut Chart Data ──
export const PIE_DATA: PieDataItem[] = [
    { name: 'Valid', value: 14, color: C.green },
    { name: 'Expired', value: 1, color: C.red },
];

// ── Training Highlights ──
export const TRAINING_HIGHLIGHTS: TrainingHighlight[] = [
    { d: 'Aug 2000', c: 'CF6-80 Series Borescope Inspection', by: 'Thai Airways' },
    { d: 'Feb 2004', c: 'Basic Inspection Techniques', by: 'Thai Airways' },
    { d: 'Jun 2005', c: 'A320-200 License (Airframe & LAE V2500)', by: 'Thai Airways' },
    { d: 'Dec 2012', c: 'A319/A320/A321 (IAE V2500) Engine Run-up', by: 'Airbus Training' },
    { d: 'Dec 2018', c: 'A320/A321 CFM LEAP-1A Differences Course', by: 'Strom Aviation Ltd.' },
    { d: 'Feb 2022', c: 'SMS & Human Factors', by: 'Thai Smile' },
    { d: 'Feb 2022', c: 'EWIS & Fuel Tank Safety Phase 1&2', by: 'Thai Smile' },
    { d: 'Feb 2022', c: 'Special Ops (AWO, PBN, RVSM & ETOP)', by: 'Thai Smile' },
    { d: 'Jan 2024', c: 'Safety Management System Initial', by: 'SAMS Co., Ltd.' },
    { d: 'Jul 2024', c: 'EASA Train the Trainer Initial', by: 'Sofema' },
];

// ── Flowchart Steps ──
export const FLOW_STEPS: FlowStep[] = [
    { step: 'START', status: 'done', desc: 'Initiated' },
    { step: 'Check Training Progress', status: 'done', desc: '15 courses verified' },
    { step: 'Require Training?', status: 'action', desc: 'YES — RVSM expired' },
    { step: 'Notify Relevant Parties', status: 'pending', desc: 'Awaiting' },
    { step: 'Add to Training Schedule', status: 'pending', desc: 'Pending' },
    { step: 'Enroll in Training', status: 'pending', desc: 'Not yet' },
    { step: 'Record Progress', status: 'pending', desc: 'Pending' },
    { step: 'END', status: 'pending', desc: 'Incomplete' },
];

// ── Sign-off ──
export const SIGN_OFF = {
    name: 'Chainarong Chaiampon',
    title: 'Compliance Control Executive',
    date: '03-Feb-2026',
};

// ── Tab Names ──
export const TABS: readonly TabName[] = ['Profile', 'Training Matrix', 'Experience', 'Flowchart'];
