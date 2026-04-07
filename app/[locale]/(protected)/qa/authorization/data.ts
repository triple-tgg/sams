import { CustomerAirline, StaffAuthorization } from './types'

// ─── Customer Airlines (all 18 — matches _v2_reference) ─────────────────────

export const CUSTOMERS: CustomerAirline[] = [
    { id: 'tla', code: 'TLA', name: 'Thai Lion Air',          color: '#e11d48' },
    { id: 'nok', code: 'NOK', name: 'Nok Air',                color: '#f59e0b' },
    { id: 'taa', code: 'TAA', name: 'Thai AirAsia',           color: '#dc2626' },
    { id: 'bka', code: 'PG',  name: 'Bangkok Airways',        color: '#2563eb' },
    { id: 'mna', code: 'MNA', name: 'Myanmar National Airlines', color: '#1d4ed8' },
    { id: 'nin', code: 'NIN', name: 'Lanmei Airlines',        color: '#7c3aed' },
    { id: 'sej', code: 'SEJ', name: 'Spring Japan',           color: '#059669' },
    { id: 'ffm', code: 'FFM', name: 'Firefly',                color: '#dc2626' },
    { id: 'rlh', code: 'RLH', name: 'Citilink Indonesia',     color: '#16a34a' },
    { id: 'indigo', code: 'INDIGO', name: 'IndiGo',           color: '#4338ca' },
    { id: 'aixl', code: 'AIXL', name: 'AirAsia X (Long-Haul)', color: '#dc2626' },
    { id: 'hlf', code: 'HLF', name: 'HK Express',             color: '#7c3aed' },
    { id: 'pal', code: 'PAL', name: 'Philippine Airlines',    color: '#1d4ed8' },
    { id: 'cebu', code: 'CEBU', name: 'Cebu Pacific',         color: '#eab308' },
    { id: 'ai',  code: 'AI',  name: 'Air India',              color: '#dc2626' },
    { id: 'akasa', code: 'AKASA', name: 'Akasa Air',          color: '#ea580c' },
    { id: 'tgw', code: 'TGW', name: 'Thai-German Aero',       color: '#1e40af' },
    { id: 'mh',  code: 'MH',  name: 'Malaysia Airlines',      color: '#1d4ed8' },
]

// Helper to build customerAuths with all airline keys
function buildCust(active: string[], expiring: string[] = [], suspended: string[] = [], remarksMap: Record<string, string> = {}): Record<string, any> {
    const allIds = CUSTOMERS.map(c => c.id)
    const result: Record<string, any> = {}
    for (const id of allIds) {
        if (active.includes(id)) {
            result[id] = { status: 'active', authNumber: `${id.toUpperCase()}-AUTH`, issueDate: '2025-06-01', expiryDate: '2027-06-01', scope: ['B737 NG'], issuedBy: 'QA Dept', remarks: remarksMap[id] }
        } else if (expiring.includes(id)) {
            result[id] = { status: 'expiring', authNumber: `${id.toUpperCase()}-AUTH`, issueDate: '2024-04-01', expiryDate: '2026-04-15', scope: ['B737 NG'], issuedBy: 'QA Dept', remarks: remarksMap[id] || 'Renewal pending' }
        } else if (suspended.includes(id)) {
            result[id] = { status: 'suspended', authNumber: `${id.toUpperCase()}-AUTH`, issueDate: '2025-01-01', expiryDate: '2027-01-01', scope: ['B737 NG'], issuedBy: 'QA Dept', remarks: remarksMap[id] || 'Suspended pending investigation' }
        } else {
            result[id] = null
        }
    }
    return result
}

// ─── Staff Authorization Records ────────────────────────────────────────────

export const STAFF_AUTHORIZATIONS: StaffAuthorization[] = [
    {
        staffNo: 1, staffId: '0012', name: 'Mr. Sanmanas Ruangsri', position: 'Certifying Staff', posGroup: 'CS',
        samsAuth: { status: 'active', authNumber: 'SAMS-AUTH-0012', initialIssueDate: '2020-03-15', issueDate: '2025-06-15', expiryDate: '2027-06-15', scope: ['B737 NG', 'B737 MAX'], issuedBy: 'Mr. Montree Chacharoen' },
        customerAuths: buildCust(['tla','nok','mna','nin','sej','ffm','rlh','indigo','aixl','hlf','pal','cebu','ai','akasa','tgw','mh']),
    },
    {
        staffNo: 2, staffId: '0013', name: 'Mr. Pissanu Arunbutr', position: 'Certifying Staff', posGroup: 'CS',
        samsAuth: { status: 'active', authNumber: 'SAMS-AUTH-0013', initialIssueDate: '2019-08-10', issueDate: '2025-04-20', expiryDate: '2027-04-20', scope: ['B737 NG', 'B737 MAX'], issuedBy: 'Mr. Montree Chacharoen' },
        customerAuths: buildCust(['tla','nok','taa','mna','nin','sej','ffm','rlh','indigo','aixl','hlf','pal','cebu','ai','akasa','tgw','mh']),
    },
    {
        staffNo: 3, staffId: '0020', name: 'Mr. Phaisal Sangasang', position: 'Certifying Staff (A320)', posGroup: 'CS',
        samsAuth: { status: 'active', authNumber: 'SAMS-AUTH-0020', initialIssueDate: '2021-01-20', issueDate: '2025-03-01', expiryDate: '2027-03-01', scope: ['A320', 'B737 NG'], issuedBy: 'Mr. Montree Chacharoen' },
        customerAuths: buildCust(['tla','mna','nin','sej','ffm','rlh','indigo','hlf','pal','cebu','ai','tgw','mh'], ['taa','aixl'], [], { taa: 'Renewal pending documentation' }),
    },
    {
        staffNo: 4, staffId: '0022', name: 'Mr. Chalong Siri', position: 'Certifying Staff (A320)', posGroup: 'CS',
        samsAuth: { status: 'active', authNumber: 'SAMS-AUTH-0022', initialIssueDate: '2020-07-05', issueDate: '2025-01-10', expiryDate: '2027-01-10', scope: ['A320', 'B777'], issuedBy: 'Mr. Montree Chacharoen' },
        customerAuths: buildCust(['taa','bka','mna','nin','sej','ffm','rlh','indigo','aixl','hlf','pal','cebu','ai','tgw','mh'], ['akasa']),
    },
    {
        staffNo: 5, staffId: '0028', name: 'Mr. Papoj Imudom', position: 'Certifying Staff (B737 NG/MAX)', posGroup: 'CS',
        samsAuth: { status: 'active', authNumber: 'SAMS-AUTH-0028', initialIssueDate: '2022-05-01', issueDate: '2025-05-01', expiryDate: '2027-05-01', scope: ['B737 NG', 'B737 MAX'], issuedBy: 'Mr. Montree Chacharoen' },
        customerAuths: buildCust(['nok','mna','nin','ffm','rlh','indigo','aixl','hlf','cebu','ai','akasa','tgw','mh'], ['tla'], [], { tla: 'Renewal in progress' }),
    },
    {
        staffNo: 6, staffId: '0041', name: 'Mr. Prakarn Sribudh', position: 'Certifying Staff (B737 CFM)', posGroup: 'CS',
        samsAuth: { status: 'active', authNumber: 'SAMS-AUTH-0041', initialIssueDate: '2021-07-10', issueDate: '2025-07-10', expiryDate: '2027-07-10', scope: ['B737 NG'], issuedBy: 'Mr. Montree Chacharoen' },
        customerAuths: buildCust(['tla','mna','nin','sej','ffm','nok','rlh','indigo','aixl','hlf','pal','cebu','ai','akasa','tgw','mh']),
    },
    {
        staffNo: 7, staffId: '0047', name: 'Mr. Trairattana Klinkaewboonvong', position: 'Certifying Staff', posGroup: 'CS',
        samsAuth: { status: 'expiring', authNumber: 'SAMS-AUTH-0047', initialIssueDate: '2019-04-01', issueDate: '2024-04-01', expiryDate: '2026-04-01', scope: ['B737 NG', 'B737 MAX'], issuedBy: 'Mr. Montree Chacharoen', remarks: 'SAMS renewal started' },
        customerAuths: buildCust(['tla','mna','nin','sej','nok','indigo','aixl','hlf','pal','cebu','akasa','tgw'], ['nok'], ['ffm','ai'], { ffm: 'Suspended', ai: 'Suspended' }),
    },
    {
        staffNo: 8, staffId: '0049', name: 'Mr. Thawansak Bharmmano', position: 'Certifying Staff (A320/B787)', posGroup: 'CS',
        samsAuth: { status: 'active', authNumber: 'SAMS-AUTH-0049', initialIssueDate: '2020-02-15', issueDate: '2025-02-15', expiryDate: '2027-02-15', scope: ['A320', 'B787'], issuedBy: 'Mr. Montree Chacharoen' },
        customerAuths: buildCust(['taa','bka','mna','nin','sej','ffm','rlh','indigo','aixl','hlf','pal','cebu','ai','akasa','tgw','mh']),
    },
    {
        staffNo: 9, staffId: '0052', name: 'Mr. Pongsak Wongrak', position: 'Certifying Staff (A320)', posGroup: 'CS',
        samsAuth: { status: 'expired', authNumber: 'SAMS-AUTH-0052', initialIssueDate: '2018-01-15', issueDate: '2024-01-15', expiryDate: '2026-01-15', scope: ['A320'], issuedBy: 'Mr. Montree Chacharoen', remarks: 'Pending training completion for renewal' },
        customerAuths: buildCust(['taa','nin','sej','ffm','rlh','hlf','pal','cebu','ai','akasa','tgw','mh']),
    },
    {
        staffNo: 10, staffId: '0053', name: 'Mr. Chinnapat Nhurod', position: 'Certifying Staff', posGroup: 'CS',
        samsAuth: { status: 'active', authNumber: 'SAMS-AUTH-0053', initialIssueDate: '2022-08-01', issueDate: '2025-08-01', expiryDate: '2027-08-01', scope: ['B737 NG', 'B737 MAX', 'B787'], issuedBy: 'Mr. Montree Chacharoen' },
        customerAuths: buildCust(['tla','nok','mna','nin','sej','ffm','rlh','indigo','aixl','hlf','pal','cebu','ai','akasa','tgw','mh']),
    },
    {
        staffNo: 11, staffId: '0055', name: 'Mr. Korkiat Fungsuk', position: 'Certifying Staff', posGroup: 'CS',
        samsAuth: { status: 'active', authNumber: 'SAMS-AUTH-0055', initialIssueDate: '2021-06-01', issueDate: '2025-06-01', expiryDate: '2027-06-01', scope: ['B737 NG'], issuedBy: 'Mr. Montree Chacharoen' },
        customerAuths: buildCust(['mna','nin','sej','ffm','rlh','indigo','hlf','pal','cebu','ai','akasa','tgw','mh'], [], ['tla'], { tla: 'Suspended pending investigation' }),
    },
    {
        staffNo: 12, staffId: '0056', name: 'Mr. Paitoon Udompuech', position: 'Certifying Staff (A320)', posGroup: 'CS',
        samsAuth: { status: 'active', authNumber: 'SAMS-AUTH-0056', initialIssueDate: '2020-09-15', issueDate: '2025-09-15', expiryDate: '2027-09-15', scope: ['A320'], issuedBy: 'Mr. Montree Chacharoen' },
        customerAuths: buildCust(['taa','mna','nin','sej','ffm','rlh','indigo','aixl','hlf','pal','cebu','ai','akasa','tgw','mh'], ['bka'], [], { bka: 'Renewal documentation submitted' }),
    },
    {
        staffNo: 13, staffId: '0059', name: 'Mr. Pathompong Bualuang', position: 'Certifying Staff (B737NG)', posGroup: 'CS',
        samsAuth: { status: 'active', authNumber: 'SAMS-AUTH-0059', initialIssueDate: '2022-10-01', issueDate: '2025-10-01', expiryDate: '2027-10-01', scope: ['B737 NG', 'B737 MAX'], issuedBy: 'Mr. Montree Chacharoen' },
        customerAuths: buildCust(['tla','nok','mna','nin','sej','ffm','rlh','indigo','aixl','hlf','pal','cebu','ai','akasa','tgw','mh']),
    },
    {
        staffNo: 14, staffId: '0060', name: 'Mr. Jiroj Jirathan', position: 'Certifying Staff (B737NG)', posGroup: 'CS',
        samsAuth: { status: 'active', authNumber: 'SAMS-AUTH-0060', initialIssueDate: '2021-10-15', issueDate: '2025-10-15', expiryDate: '2027-10-15', scope: ['B737 NG'], issuedBy: 'Mr. Montree Chacharoen' },
        customerAuths: buildCust(['tla','mna','nin','sej','ffm','rlh','indigo','aixl','hlf','pal','cebu','ai','akasa','tgw','mh']),
    },
    {
        staffNo: 15, staffId: '0063', name: 'Mr. Veerapong Chivasakulchai', position: 'Certifying Staff (A320/B777/A330)', posGroup: 'CS',
        samsAuth: { status: 'active', authNumber: 'SAMS-AUTH-0063', initialIssueDate: '2019-03-10', issueDate: '2025-03-10', expiryDate: '2027-03-10', scope: ['A320', 'B777', 'A330'], issuedBy: 'Mr. Montree Chacharoen' },
        customerAuths: buildCust(['taa','bka','mna','nin','sej','ffm','rlh','indigo','aixl','hlf','pal','cebu','ai','akasa','tgw','mh']),
    },
    {
        staffNo: 16, staffId: '0064', name: 'Mr. Wasan Preechamaj', position: 'Certifying Staff (A320/B777)', posGroup: 'CS',
        samsAuth: { status: 'suspended', authNumber: 'SAMS-AUTH-0064', initialIssueDate: '2020-05-01', issueDate: '2025-05-01', expiryDate: '2027-05-01', scope: ['A320', 'B777'], issuedBy: 'Mr. Montree Chacharoen', remarks: 'Under review — pending competency assessment' },
        customerAuths: buildCust(['taa','bka','mna','nin','sej','ffm','rlh','indigo','aixl','hlf','pal','cebu','ai','akasa','tgw','mh']),
    },
]
