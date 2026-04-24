// ─── Authorization Data — FM-CM-063 Rev.08 ──────────────────────────────────
import type { AirlineKey, Airline, AuthorityKey, Authority, Staff } from './types-v2'
import { AIRLINE_KEYS, AUTHORITY_KEYS } from './types-v2'

// ─── Airlines ───────────────────────────────────────────────────────────────

export const AIRLINES: Record<AirlineKey, Airline> = {
  MNA:    { code: 'MNA',    name: 'Myanmar National Airlines',  color: '#1d4ed8' },
  NIN:    { code: 'NIN',    name: 'Lanmei Airlines',            color: '#7c3aed' },
  SEJ:    { code: 'SEJ',    name: 'Spring Japan',               color: '#059669' },
  FFM:    { code: 'FFM',    name: 'Firefly',                    color: '#dc2626' },
  NOK:    { code: 'NOK',    name: 'Nok Air',                    color: '#ea580c' },
  RLH:    { code: 'RLH',    name: 'Citilink Indonesia',         color: '#16a34a' },
  INDIGO: { code: 'INDIGO', name: 'IndiGo',                     color: '#4338ca' },
  AIXL:   { code: 'AIXL',   name: 'AirAsia X (Long-Haul)',      color: '#dc2626' },
  HLF:    { code: 'HLF',    name: 'HK Express',                 color: '#7c3aed' },
  PAL:    { code: 'PAL',    name: 'Philippine Airlines',        color: '#1d4ed8' },
  QDO:    { code: 'QDO',    name: 'Qingdao Airlines',           color: '#0284c7' },
  CEBU:   { code: 'CEBU',   name: 'Cebu Pacific',               color: '#eab308' },
  AI:     { code: 'AI',     name: 'Air India',                  color: '#dc2626' },
  AKASA:  { code: 'AKASA',  name: 'Akasa Air',                  color: '#ea580c' },
  ASA:    { code: 'ASA',    name: 'Alaska Airlines',            color: '#0369a1' },
  TGW:    { code: 'TGW',    name: 'Thai-German Aero',           color: '#1e40af' },
  MH:     { code: 'MH',     name: 'Malaysia Airlines',          color: '#1d4ed8' },
  ZE:     { code: 'ZE',     name: 'Eastar Jet',                 color: '#ea580c' },
}

export { AIRLINE_KEYS }

// ─── Authorities ────────────────────────────────────────────────────────────

export const AUTHORITIES: Record<AuthorityKey, Authority> = {
  CAAT: { code: 'CAAT', name: 'Civil Aviation Authority of Thailand', color: '#1d4ed8' },
  CAAM: { code: 'CAAM', name: 'Civil Aviation Authority of Malaysia', color: '#7c3aed' },
  CAAP: { code: 'CAAP', name: 'Civil Aviation Authority of Philippines', color: '#059669' },
  CAAS: { code: 'CAAS', name: 'Civil Aviation Authority of Singapore', color: '#dc2626' },
  DGCA_India: { code: 'DGCA_India', name: 'The Directorate General of Civil Aviation of India', color: '#ea580c' },
  DGCA_Indonesia: { code: 'DGCA_Indonesia', name: 'The Directorate General of Civil Aviation of Indonesia', color: '#16a34a' },
  CAASL: { code: 'CAASL', name: 'Civil Aviation Authority of Sri Lanka', color: '#4338ca' },
  GCAA: { code: 'GCAA', name: 'General Civil Aviation Authority', color: '#0284c7' },
  MOLIT: { code: 'MOLIT', name: 'Ministry of Land, Infrastructure and Transport', color: '#eab308' },
  FAA: { code: 'FAA', name: 'Federal Aviation Administration', color: '#dc2626' },
  EASA: { code: 'EASA', name: 'European Union Aviation Safety Agency', color: '#0369a1' },
  GACA: { code: 'GACA', name: 'General Authority of Civil Aviation', color: '#1e40af' },
  DGCA_Kuwait: { code: 'DGCA_Kuwait', name: 'The Directorate General of Civil Aviation of Kuwait', color: '#ea580c' },
}

export { AUTHORITY_KEYS }

// ─── Staff — 16 Certifying Staff (FM-CM-063 Rev.08) ─────────────────────────

export const STAFF: Staff[] = [
  {
    no: 1, id: '0012', name: 'Mr. Sanmanas Ruangsri',
    rating: 'B737-300/400/500\nB737-600/700/800/900',
    amelExp: '2027-06-15', authNo: 'SAMS/CM/AUT-L002',
    initDate: '2020-03-15', currDate: '2025-03-15', samsExp: '2027-06-15',
    color: '#3b82f6', license: 'B1',
    cust: {
      MNA: 'valid', NIN: 'valid', SEJ: 'valid', FFM: 'valid', NOK: 'valid',
      RLH: 'valid', INDIGO: 'valid', AIXL: 'valid', HLF: 'valid', PAL: 'valid',
      QDO: 'valid', CEBU: 'valid', AI: 'valid', AKASA: 'valid', ASA: 'valid',
      TGW: 'valid', MH: 'valid', ZE: 'valid',
    },
    auth: {
      CAAT: 'valid', CAAM: 'valid', CAAP: 'valid', CAAS: 'valid', DGCA_India: 'valid',
      DGCA_Indonesia: 'valid', CAASL: 'valid', GCAA: 'valid', MOLIT: 'valid', FAA: 'valid',
      EASA: 'valid', GACA: 'valid', DGCA_Kuwait: 'valid',
    },
  },
  {
    no: 2, id: '0013', name: 'Mr. Pissanu Arunbutr',
    rating: 'B737-300/400/500\nB737-600/700/800/900',
    amelExp: '2027-04-20', authNo: 'SAMS/CM/AUT-L003',
    initDate: '2019-08-10', currDate: '2024-08-10', samsExp: '2027-04-20',
    color: '#8b5cf6', license: 'B1/B2',
    cust: {
      MNA: 'valid', NIN: 'valid', SEJ: 'valid', FFM: 'valid', NOK: 'valid',
      RLH: 'valid', INDIGO: 'valid', AIXL: 'valid', HLF: 'valid', PAL: 'valid',
      QDO: 'valid', CEBU: 'valid', AI: 'valid', AKASA: 'valid', ASA: 'valid',
      TGW: 'valid', MH: 'valid', ZE: 'valid',
    },
    auth: {
      CAAT: 'valid', CAAM: 'valid', CAAP: 'valid', CAAS: 'valid', DGCA_India: 'valid',
      DGCA_Indonesia: 'valid', CAASL: 'valid', GCAA: 'valid', MOLIT: 'valid', FAA: 'valid',
      EASA: 'valid', GACA: 'valid', DGCA_Kuwait: 'valid',
    },
  },
  {
    no: 3, id: '0020', name: 'Mr. Phaisal Sangasang',
    rating: 'A320 Family (CEO/NEO)',
    amelExp: '2027-03-01', authNo: 'SAMS/CM/AUT-L008',
    initDate: '2021-01-20', currDate: '2025-01-20', samsExp: '2027-03-01',
    color: '#06b6d4', license: 'B1',
    note: 'AIXL/AKASA training pending',
    cust: {
      MNA: 'valid', NIN: 'valid', SEJ: 'valid', FFM: 'valid', NOK: 'valid',
      RLH: 'valid', INDIGO: 'valid', AIXL: 'not_complete', HLF: 'valid', PAL: 'valid',
      QDO: 'valid', CEBU: 'valid', AI: 'valid', AKASA: 'not_complete', ASA: 'valid',
      TGW: 'valid', MH: 'valid', ZE: 'valid',
    },
    auth: {
      CAAT: 'valid', CAAM: 'valid', CAAP: 'valid', CAAS: 'valid', DGCA_India: 'valid',
      DGCA_Indonesia: 'valid', CAASL: 'valid', GCAA: 'valid', MOLIT: 'valid', FAA: 'valid',
      EASA: 'valid', GACA: 'valid', DGCA_Kuwait: 'valid',
    },
  },
  {
    no: 4, id: '0022', name: 'Mr. Chalong Siri',
    rating: 'A320 Family (CEO/NEO)',
    amelExp: '2027-01-10', authNo: 'SAMS/CM/AUT-L010',
    initDate: '2020-07-05', currDate: '2024-07-05', samsExp: '2027-01-10',
    color: '#f59e0b', license: 'B1/B2',
    note: 'QDO/AKASA awaiting submission',
    cust: {
      MNA: 'valid', NIN: 'valid', SEJ: 'valid', FFM: 'valid', NOK: 'valid',
      RLH: 'valid', INDIGO: 'valid', AIXL: 'valid', HLF: 'valid', PAL: 'valid',
      QDO: 'pending', CEBU: 'valid', AI: 'valid', AKASA: 'pending', ASA: 'valid',
      TGW: 'valid', MH: 'valid', ZE: 'valid',
    },
    auth: {
      CAAT: 'valid', CAAM: 'valid', CAAP: 'valid', CAAS: 'valid', DGCA_India: 'valid',
      DGCA_Indonesia: 'valid', CAASL: 'valid', GCAA: 'valid', MOLIT: 'valid', FAA: 'valid',
      EASA: 'valid', GACA: 'valid', DGCA_Kuwait: 'valid',
    },
  },
  {
    no: 5, id: '0028', name: 'Mr. Papoj Imudom',
    rating: 'B737-600/700/800/900\nB737 MAX',
    amelExp: '2027-05-01', authNo: 'SAMS/CM/AUT-L014',
    initDate: '2022-05-01', currDate: '2025-05-01', samsExp: '2027-05-01',
    color: '#10b981', license: 'B1',
    note: 'SEJ/PAL customer rejected',
    cust: {
      MNA: 'valid', NIN: 'valid', SEJ: 'not_approve', FFM: 'valid', NOK: 'valid',
      RLH: 'valid', INDIGO: 'valid', AIXL: 'valid', HLF: 'valid', PAL: 'not_approve',
      QDO: 'valid', CEBU: 'valid', AI: 'valid', AKASA: 'valid', ASA: 'valid',
      TGW: 'valid', MH: 'valid', ZE: 'valid',
    },
    auth: {
      CAAT: 'valid', CAAM: 'valid', CAAP: 'valid', CAAS: 'valid', DGCA_India: 'valid',
      DGCA_Indonesia: 'valid', CAASL: 'valid', GCAA: 'valid', MOLIT: 'valid', FAA: 'valid',
      EASA: 'valid', GACA: 'valid', DGCA_Kuwait: 'valid',
    },
  },
  {
    no: 6, id: '0041', name: 'Mr. Prakarn Sribudh',
    rating: 'B737-600/700/800/900 (CFM56)',
    amelExp: '2027-07-10', authNo: 'SAMS/CM/AUT-L022',
    initDate: '2021-07-10', currDate: '2025-07-10', samsExp: '2027-07-10',
    color: '#ef4444', license: 'B1',
    cust: {
      MNA: 'valid', NIN: 'valid', SEJ: 'valid', FFM: 'valid', NOK: 'valid',
      RLH: 'valid', INDIGO: 'valid', AIXL: 'valid', HLF: 'valid', PAL: 'valid',
      QDO: 'valid', CEBU: 'valid', AI: 'valid', AKASA: 'valid', ASA: 'valid',
      TGW: 'valid', MH: 'valid', ZE: 'valid',
    },
    auth: {
      CAAT: 'valid', CAAM: 'valid', CAAP: 'valid', CAAS: 'valid', DGCA_India: 'valid',
      DGCA_Indonesia: 'valid', CAASL: 'valid', GCAA: 'valid', MOLIT: 'valid', FAA: 'valid',
      EASA: 'valid', GACA: 'valid', DGCA_Kuwait: 'valid',
    },
  },
  {
    no: 7, id: '0047', name: 'Mr. Trairattana Klinkaewboonvong',
    rating: 'B737-300/400/500\nB737-600/700/800/900',
    amelExp: '2026-04-01', authNo: 'SAMS/CM/AUT-L028',
    initDate: '2019-04-01', currDate: '2024-04-01', samsExp: '2026-04-01',
    color: '#a855f7', license: 'B1/B2',
    note: 'SAMS renewal started, FFM/AI suspended',
    cust: {
      MNA: 'valid', NIN: 'valid', SEJ: 'valid', FFM: 'suspended', NOK: 'valid',
      RLH: 'not_complete', INDIGO: 'valid', AIXL: 'valid', HLF: 'valid', PAL: 'valid',
      QDO: 'valid', CEBU: 'valid', AI: 'suspended', AKASA: 'valid', ASA: 'valid',
      TGW: 'valid', MH: 'not_complete', ZE: 'valid',
    },
    auth: {
      CAAT: 'valid', CAAM: 'valid', CAAP: 'valid', CAAS: 'valid', DGCA_India: 'valid',
      DGCA_Indonesia: 'valid', CAASL: 'valid', GCAA: 'valid', MOLIT: 'valid', FAA: 'valid',
      EASA: 'valid', GACA: 'valid', DGCA_Kuwait: 'valid',
    },
  },
  {
    no: 8, id: '0049', name: 'Mr. Thawansak Bharmmano',
    rating: 'A320 Family (CEO/NEO)\nB787',
    amelExp: '2027-02-15', authNo: 'SAMS/CM/AUT-L030',
    initDate: '2020-02-15', currDate: '2025-02-15', samsExp: '2027-02-15',
    color: '#0ea5e9', license: 'B1',
    cust: {
      MNA: 'valid', NIN: 'valid', SEJ: 'valid', FFM: 'valid', NOK: 'valid',
      RLH: 'valid', INDIGO: 'valid', AIXL: 'valid', HLF: 'valid', PAL: 'valid',
      QDO: 'valid', CEBU: 'valid', AI: 'valid', AKASA: 'valid', ASA: 'valid',
      TGW: 'valid', MH: 'valid', ZE: 'valid',
    },
    auth: {
      CAAT: 'valid', CAAM: 'valid', CAAP: 'valid', CAAS: 'valid', DGCA_India: 'valid',
      DGCA_Indonesia: 'valid', CAASL: 'valid', GCAA: 'valid', MOLIT: 'valid', FAA: 'valid',
      EASA: 'valid', GACA: 'valid', DGCA_Kuwait: 'valid',
    },
  },
  {
    no: 9, id: '0052', name: 'Mr. Pongsak Wongrak',
    rating: 'A320 Family (CEO/NEO)',
    amelExp: '2026-01-15', authNo: 'SAMS/CM/AUT-L033',
    initDate: '2018-01-15', currDate: '2023-01-15', samsExp: '2026-01-15',
    color: '#f97316', license: 'B2',
    note: 'Pending training completion for SAMS renewal',
    cust: {
      MNA: 'not_approve', NIN: 'valid', SEJ: 'valid', FFM: 'valid', NOK: 'not_approve',
      RLH: 'valid', INDIGO: 'not_approve', AIXL: 'valid', HLF: 'valid', PAL: 'valid',
      QDO: 'valid', CEBU: 'valid', AI: 'valid', AKASA: 'valid', ASA: 'valid',
      TGW: 'not_approve', MH: 'valid', ZE: 'valid',
    },
    auth: {
      CAAT: 'valid', CAAM: 'valid', CAAP: 'valid', CAAS: 'valid', DGCA_India: 'valid',
      DGCA_Indonesia: 'valid', CAASL: 'valid', GCAA: 'valid', MOLIT: 'valid', FAA: 'valid',
      EASA: 'valid', GACA: 'valid', DGCA_Kuwait: 'valid',
    },
  },
  {
    no: 10, id: '0055', name: 'Mr. Chinnapat Kitpaiboon',
    rating: 'B737-600/700/800/900',
    amelExp: '2027-08-20', authNo: 'SAMS/CM/AUT-L036',
    initDate: '2022-08-20', currDate: '2025-08-20', samsExp: '2027-08-20',
    color: '#14b8a6', license: 'B1',
    cust: {
      MNA: 'valid', NIN: 'valid', SEJ: 'valid', FFM: 'valid', NOK: 'valid',
      RLH: 'valid', INDIGO: 'valid', AIXL: 'pending', HLF: 'valid', PAL: 'valid',
      QDO: 'valid', CEBU: 'valid', AI: 'valid', AKASA: 'valid', ASA: 'pending',
      TGW: 'valid', MH: 'valid', ZE: 'valid',
    },
    auth: {
      CAAT: 'valid', CAAM: 'valid', CAAP: 'valid', CAAS: 'valid', DGCA_India: 'valid',
      DGCA_Indonesia: 'valid', CAASL: 'valid', GCAA: 'valid', MOLIT: 'valid', FAA: 'valid',
      EASA: 'valid', GACA: 'valid', DGCA_Kuwait: 'valid',
    },
  },
  {
    no: 11, id: '0058', name: 'Mr. Surasak Mongkolkij',
    rating: 'B777-200/300\nB777-200ER/300ER',
    amelExp: '2027-09-05', authNo: 'SAMS/CM/AUT-L039',
    initDate: '2021-09-05', currDate: '2025-09-05', samsExp: '2027-09-05',
    color: '#6366f1', license: 'B1/B2',
    cust: {
      MNA: 'valid', NIN: 'valid', SEJ: 'valid', FFM: 'valid', NOK: 'valid',
      RLH: 'valid', INDIGO: 'valid', AIXL: 'valid', HLF: 'valid', PAL: 'valid',
      QDO: 'valid', CEBU: 'valid', AI: 'valid', AKASA: 'valid', ASA: 'valid',
      TGW: 'valid', MH: 'valid', ZE: 'valid',
    },
    auth: {
      CAAT: 'valid', CAAM: 'valid', CAAP: 'valid', CAAS: 'valid', DGCA_India: 'valid',
      DGCA_Indonesia: 'valid', CAASL: 'valid', GCAA: 'valid', MOLIT: 'valid', FAA: 'valid',
      EASA: 'valid', GACA: 'valid', DGCA_Kuwait: 'valid',
    },
  },
  {
    no: 12, id: '0061', name: 'Mr. Wichai Thammasiri',
    rating: 'A330-200/300\nA340-500/600',
    amelExp: '2026-06-18', authNo: 'SAMS/CM/AUT-L042',
    initDate: '2019-06-18', currDate: '2024-06-18', samsExp: '2026-06-18',
    color: '#ec4899', license: 'B1',
    note: 'SEJ/HLF documentation incomplete',
    cust: {
      MNA: 'valid', NIN: 'valid', SEJ: 'not_complete', FFM: 'valid', NOK: 'valid',
      RLH: 'valid', INDIGO: 'valid', AIXL: 'valid', HLF: 'not_complete', PAL: 'valid',
      QDO: 'valid', CEBU: 'valid', AI: 'valid', AKASA: 'valid', ASA: 'valid',
      TGW: 'valid', MH: 'valid', ZE: 'valid',
    },
    auth: {
      CAAT: 'valid', CAAM: 'valid', CAAP: 'valid', CAAS: 'valid', DGCA_India: 'valid',
      DGCA_Indonesia: 'valid', CAASL: 'valid', GCAA: 'valid', MOLIT: 'valid', FAA: 'valid',
      EASA: 'valid', GACA: 'valid', DGCA_Kuwait: 'valid',
    },
  },
  {
    no: 13, id: '0064', name: 'Mr. Nattapong Keeplong',
    rating: 'B787-8/9/10',
    amelExp: '2027-11-30', authNo: 'SAMS/CM/AUT-L045',
    initDate: '2023-11-30', currDate: '2025-11-30', samsExp: '2027-11-30',
    color: '#84cc16', license: 'B1',
    cust: {
      MNA: 'valid', NIN: 'valid', SEJ: 'valid', FFM: 'valid', NOK: 'valid',
      RLH: 'valid', INDIGO: 'valid', AIXL: 'valid', HLF: 'valid', PAL: 'valid',
      QDO: 'valid', CEBU: 'valid', AI: 'valid', AKASA: 'valid', ASA: 'valid',
      TGW: 'valid', MH: 'valid', ZE: 'valid',
    },
    auth: {
      CAAT: 'valid', CAAM: 'valid', CAAP: 'valid', CAAS: 'valid', DGCA_India: 'valid',
      DGCA_Indonesia: 'valid', CAASL: 'valid', GCAA: 'valid', MOLIT: 'valid', FAA: 'valid',
      EASA: 'valid', GACA: 'valid', DGCA_Kuwait: 'valid',
    },
  },
  {
    no: 14, id: '0067', name: 'Mr. Arthit Somjai',
    rating: 'B737-600/700/800/900\nA320 Family (CEO/NEO)',
    amelExp: '2026-08-25', authNo: 'SAMS/CM/AUT-L048',
    initDate: '2020-08-25', currDate: '2024-08-25', samsExp: '2026-08-25',
    color: '#f43f5e', license: 'B1/B2',
    note: 'NIN rejected, RLH/MH suspended',
    cust: {
      MNA: 'valid', NIN: 'not_approve', SEJ: 'valid', FFM: 'valid', NOK: 'valid',
      RLH: 'suspended', INDIGO: 'valid', AIXL: 'valid', HLF: 'valid', PAL: 'valid',
      QDO: 'not_complete', CEBU: 'valid', AI: 'valid', AKASA: 'valid', ASA: 'valid',
      TGW: 'valid', MH: 'suspended', ZE: 'valid',
    },
    auth: {
      CAAT: 'valid', CAAM: 'valid', CAAP: 'valid', CAAS: 'valid', DGCA_India: 'valid',
      DGCA_Indonesia: 'valid', CAASL: 'valid', GCAA: 'valid', MOLIT: 'valid', FAA: 'valid',
      EASA: 'valid', GACA: 'valid', DGCA_Kuwait: 'valid',
    },
  },
  {
    no: 15, id: '0070', name: 'Mr. Kittisak Rungsri',
    rating: 'A320 Family (CEO/NEO)',
    amelExp: '2026-03-10', authNo: 'SAMS/CM/AUT-L051',
    initDate: '2018-03-10', currDate: '2023-03-10', samsExp: '2026-03-10',
    color: '#d946ef', license: 'B2',
    note: 'Multiple rejections — escalated to QA Manager',
    cust: {
      MNA: 'not_approve', NIN: 'not_approve', SEJ: 'valid', FFM: 'not_complete', NOK: 'valid',
      RLH: 'valid', INDIGO: 'not_approve', AIXL: 'valid', HLF: 'valid', PAL: 'valid',
      QDO: 'valid', CEBU: 'not_complete', AI: 'valid', AKASA: 'valid', ASA: 'valid',
      TGW: 'valid', MH: 'valid', ZE: 'pending',
    },
    auth: {
      CAAT: 'valid', CAAM: 'valid', CAAP: 'valid', CAAS: 'valid', DGCA_India: 'valid',
      DGCA_Indonesia: 'valid', CAASL: 'valid', GCAA: 'valid', MOLIT: 'valid', FAA: 'valid',
      EASA: 'valid', GACA: 'valid', DGCA_Kuwait: 'valid',
    },
  },
  {
    no: 16, id: '0073', name: 'Mr. Thanawat Boonprasert',
    rating: 'B737-600/700/800/900',
    amelExp: '2026-05-20', authNo: 'SAMS/CM/AUT-L054',
    initDate: '2021-05-20', currDate: '2025-05-20', samsExp: '2026-05-20',
    color: '#0891b2', license: 'B1',
    cust: {
      MNA: 'valid', NIN: 'valid', SEJ: 'valid', FFM: 'valid', NOK: 'valid',
      RLH: 'valid', INDIGO: 'valid', AIXL: 'valid', HLF: 'valid', PAL: 'valid',
      QDO: 'valid', CEBU: 'valid', AI: 'valid', AKASA: 'valid', ASA: 'valid',
      TGW: 'valid', MH: 'valid', ZE: 'valid',
    },
    auth: {
      CAAT: 'valid', CAAM: 'valid', CAAP: 'valid', CAAS: 'valid', DGCA_India: 'valid',
      DGCA_Indonesia: 'valid', CAASL: 'valid', GCAA: 'valid', MOLIT: 'valid', FAA: 'valid',
      EASA: 'valid', GACA: 'valid', DGCA_Kuwait: 'valid',
    },
  },
]
