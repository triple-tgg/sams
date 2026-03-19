import { CourseRef, Employee } from './types'

// ─── Course Definitions ─────────────────────────────────────────────────────

export const MANDATORY: CourseRef[] = [
    { id: 'hf',   short: 'HF',    label: 'Human Factors',        interval: 24 },
    { id: 'sms',  short: 'SMS',   label: 'Safety Mgmt System',   interval: 24 },
    { id: 'dga',  short: 'DGA',   label: 'Dangerous Goods',      interval: 24 },
    { id: 'cp',   short: 'CP',    label: 'Company Policy / MOE', interval: 24 },
    { id: 'fts',  short: 'FTS',   label: 'Fuel Tank Safety',     interval: 24 },
    { id: 'ewis', short: 'EWIS',  label: 'EWIS',                 interval: 24 },
    { id: 'rvsm', short: 'RVSM',  label: 'Spec Ops RVSM',        interval: 12 },
    { id: 'edto', short: 'EDTO',  label: 'Spec Ops EDTO',        interval: 24 },
]

export const TYPE_COURSES: CourseRef[] = [
    { id: 'tb737cfm',  short: 'B737',  label: 'B737 CFM56', interval: 24 },
    { id: 'tb737leap', short: 'B737M', label: 'B737 LEAP',  interval: 24 },
    { id: 'ta320',     short: 'A320',  label: 'A320 fam',   interval: 24 },
    { id: 'tb777',     short: 'B777',  label: 'B777',       interval: 24 },
    { id: 'ta330',     short: 'A330',  label: 'A330',       interval: 24 },
    { id: 'tb787',     short: 'B787',  label: 'B787',       interval: 24 },
]

export const ALL_COURSES = [...MANDATORY, ...TYPE_COURSES]

// ─── Employees ──────────────────────────────────────────────────────────────

export const EMPLOYEES: Employee[] = [
    { no:1,  id:'0012', name:'Mr. Sanmanas Ruangsri',           pos:'Certifying Staff',              posGroup:'CS',
      courses:{ hf:'2028-02-08',sms:'2028-01-05',dga:'2027-01-08',cp:'2026-06-03',fts:'2028-02-02',ewis:'2027-01-16',rvsm:'2027-02-15',edto:'2027-02-19', tb737cfm:'2027-05-04',tb737leap:'2027-05-04',ta320:'-',tb777:'-',ta330:'-',tb787:'-' }},
    { no:2,  id:'0013', name:'Mr. Pissanu Arunbutr',            pos:'Certifying Staff',              posGroup:'CS',
      courses:{ hf:'2028-02-08',sms:'2028-01-05',dga:'2027-01-08',cp:'2028-02-11',fts:'2027-05-22',ewis:'2027-05-13',rvsm:'2027-02-15',edto:'2027-02-19', tb737cfm:'2027-05-04',tb737leap:'2027-05-04',ta320:'-',tb777:'-',ta330:'-',tb787:'-' }},
    { no:3,  id:'0020', name:'Mr. Phaisal Sangasang',           pos:'Certifying Staff (A320)',        posGroup:'CS',
      courses:{ hf:'2027-05-14',sms:'2028-01-05',dga:'2027-01-08',cp:'2027-01-05',fts:'2028-02-02',ewis:'2027-05-13',rvsm:'2027-02-15',edto:'2027-02-19', tb737cfm:'2027-05-04',tb737leap:'-',ta320:'2027-05-03',tb777:'-',ta330:'-',tb787:'-' }},
    { no:4,  id:'0022', name:'Mr. Chalong Siri',                pos:'Certifying Staff (A320)',        posGroup:'CS',
      courses:{ hf:'2027-05-14',sms:'2028-01-05',dga:'2027-01-08',cp:'2027-01-05',fts:'2027-06-11',ewis:'2027-03-27',rvsm:'2027-02-15',edto:'2028-01-09', tb737cfm:'-',tb737leap:'-',ta320:'2026-11-17',tb777:'2027-06-03',ta330:'-',tb787:'-' }},
    { no:5,  id:'0028', name:'Mr. Papoj Imudom',                pos:'Certifying Staff (B737 NG/MAX)', posGroup:'CS',
      courses:{ hf:'2027-05-14',sms:'2028-01-05',dga:'2027-01-08',cp:'2027-06-12',fts:'2028-02-02',ewis:'2027-01-16',rvsm:'2027-02-15',edto:'2028-01-09', tb737cfm:'2027-05-04',tb737leap:'2027-05-04',ta320:'-',tb777:'-',ta330:'-',tb787:'-' }},
    { no:6,  id:'0032', name:'Mr. Puchong Suwannit',            pos:'Aircraft Mechanic',             posGroup:'AM',
      courses:{ hf:'2028-02-08',sms:'2028-01-05',dga:'2028-02-04',cp:'2028-02-11',fts:'2028-02-02',ewis:'2028-02-09',rvsm:'2027-02-15',edto:'2028-01-09', tb737cfm:'-',tb737leap:'-',ta320:'-',tb777:'-',ta330:'-',tb787:'-' }},
    { no:7,  id:'0036', name:'Ms. Orrachorn Itipi',             pos:'Compliance Monitoring Mgr',     posGroup:'QA',
      courses:{ hf:'2028-02-08',sms:'2028-01-05',dga:'2026-07-07',cp:'2028-02-11',fts:'2026-04-05',ewis:'2028-02-09',rvsm:'2027-02-15',edto:'2028-01-09', tb737cfm:'-',tb737leap:'-',ta320:'-',tb777:'-',ta330:'-',tb787:'-' }},
    { no:8,  id:'0039', name:'Mr. Nont Bhekasuta',              pos:'Aircraft Mechanic',             posGroup:'AM',
      courses:{ hf:'2026-04-10',sms:'2028-01-05',dga:'2028-02-04',cp:'2028-02-11',fts:'2028-02-02',ewis:'2028-02-09',rvsm:'2027-02-15',edto:'2027-02-19', tb737cfm:'-',tb737leap:'-',ta320:'-',tb777:'-',ta330:'-',tb787:'-' }},
    { no:9,  id:'0040', name:'Mr. Shiravut Butmart',            pos:'Aircraft Mechanic',             posGroup:'AM',
      courses:{ hf:'2028-02-08',sms:'2028-01-05',dga:'2028-02-04',cp:'2028-02-11',fts:'2028-02-02',ewis:'2026-04-18',rvsm:'2027-02-15',edto:'2027-02-19', tb737cfm:'-',tb737leap:'-',ta320:'-',tb777:'-',ta330:'-',tb787:'-' }},
    { no:10, id:'0041', name:'Mr. Prakarn Sribudh',             pos:'Certifying Staff (B737 CFM)',   posGroup:'CS',
      courses:{ hf:'2028-02-08',sms:'2028-01-05',dga:'2028-02-04',cp:'2028-02-11',fts:'2028-02-02',ewis:'2028-02-09',rvsm:'2027-02-15',edto:'2027-02-19', tb737cfm:'2027-05-04',tb737leap:'-',ta320:'-',tb777:'-',ta330:'-',tb787:'-' }},
    { no:11, id:'0042', name:'Mr. Nuttawee Buaboon',            pos:'Aircraft Mechanic',             posGroup:'AM',
      courses:{ hf:'2028-02-08',sms:'2028-01-05',dga:'2028-02-04',cp:'2028-02-11',fts:'2028-02-02',ewis:'2028-02-09',rvsm:'2027-02-15',edto:'2027-02-19', tb737cfm:'-',tb737leap:'-',ta320:'-',tb777:'-',ta330:'-',tb787:'-' }},
    { no:12, id:'0044', name:'Mr. Pichai Kumprakorn',           pos:'Safety Management Manager',     posGroup:'MGR',
      courses:{ hf:'2026-06-06',sms:'2028-01-05',dga:'2026-07-07',cp:'2026-05-15',fts:'2026-06-16',ewis:'2026-06-18',rvsm:'2025-06-24',edto:'2028-01-09', tb737cfm:'-',tb737leap:'-',ta320:'-',tb777:'-',ta330:'-',tb787:'-' }},
    { no:13, id:'0047', name:'Mr. Trairattana Klinkaewboonvong',pos:'Certifying Staff',              posGroup:'CS',
      courses:{ hf:'2026-06-06',sms:'2026-06-13',dga:'2026-07-07',cp:'2026-06-03',fts:'2026-06-16',ewis:'2026-06-18',rvsm:'2026-03-31',edto:'2028-01-09', tb737cfm:'2027-05-04',tb737leap:'2027-05-04',ta320:'-',tb777:'-',ta330:'-',tb787:'-' }},
    { no:14, id:'0049', name:'Mr. Thawansak Bharmmano',         pos:'Certifying Staff (A320/B787)',  posGroup:'CS',
      courses:{ hf:'2026-06-06',sms:'2026-06-13',dga:'2026-07-07',cp:'2026-06-03',fts:'2026-06-16',ewis:'2026-06-18',rvsm:'2026-03-31',edto:'2028-01-09', tb737cfm:'-',tb737leap:'-',ta320:'2028-02-19',tb777:'-',ta330:'-',tb787:'2027-02-25' }},
    { no:15, id:'0051', name:'Mr. Sirawit Saetang',             pos:'Aircraft Mechanic',             posGroup:'AM',
      courses:{ hf:'2026-06-06',sms:'2026-06-13',dga:'2026-07-07',cp:'2026-06-03',fts:'2026-06-16',ewis:'2026-06-18',rvsm:'2026-03-31',edto:'2028-01-09', tb737cfm:'-',tb737leap:'-',ta320:'-',tb777:'-',ta330:'-',tb787:'-' }},
    { no:16, id:'0052', name:'Mr. Pongsak Wongrak',             pos:'Certifying Staff (A320)',        posGroup:'CS',
      courses:{ hf:'2026-06-06',sms:'2026-06-13',dga:'2026-07-07',cp:'2026-06-03',fts:'2026-06-16',ewis:'2026-06-18',rvsm:'2026-03-31',edto:'2028-01-09', tb737cfm:'-',tb737leap:'-',ta320:'2027-06-19',tb777:'-',ta330:'-',tb787:'-' }},
    { no:17, id:'0053', name:'Mr. Chinnapat Nhurod',            pos:'Certifying Staff',              posGroup:'CS',
      courses:{ hf:'2026-06-06',sms:'2026-06-13',dga:'2026-07-07',cp:'2026-06-03',fts:'2026-06-16',ewis:'2026-06-18',rvsm:'2026-03-31',edto:'2028-01-09', tb737cfm:'2027-05-04',tb737leap:'2027-05-04',ta320:'-',tb777:'-',ta330:'-',tb787:'2027-02-25' }},
    { no:18, id:'0055', name:'Mr. Korkiat Fungsuk',             pos:'Certifying Staff',              posGroup:'CS',
      courses:{ hf:'2026-07-05',sms:'2026-06-13',dga:'2026-07-07',cp:'2026-06-25',fts:'2026-06-16',ewis:'2026-06-18',rvsm:'2026-03-31',edto:'2028-01-09', tb737cfm:'2027-05-04',tb737leap:'-',ta320:'-',tb777:'-',ta330:'-',tb787:'-' }},
    { no:19, id:'0056', name:'Mr. Paitoon Udompuech',           pos:'Certifying Staff (A320)',        posGroup:'CS',
      courses:{ hf:'2026-07-05',sms:'2026-07-04',dga:'2026-07-12',cp:'2026-06-25',fts:'2027-01-15',ewis:'2027-01-16',rvsm:'2026-05-07',edto:'2027-05-08', tb737cfm:'-',tb737leap:'-',ta320:'2027-06-19',tb777:'-',ta330:'-',tb787:'-' }},
    { no:20, id:'0057', name:'Mr. Montree Chacharoen',          pos:'Accountable Manager',           posGroup:'MGR',
      courses:{ hf:'2026-09-09',sms:'2026-09-08',dga:'2026-10-08',cp:'2026-09-05',fts:'2026-10-11',ewis:'2026-10-13',rvsm:'2026-05-07',edto:'2026-09-24', tb737cfm:'-',tb737leap:'-',ta320:'-',tb777:'-',ta330:'-',tb787:'-' }},
    { no:21, id:'0059', name:'Mr. Pathompong Bualuang',         pos:'Certifying Staff (B737NG)',      posGroup:'CS',
      courses:{ hf:'2026-10-06',sms:'2026-10-07',dga:'2026-10-08',cp:'2026-10-03',fts:'2026-10-11',ewis:'2026-10-13',rvsm:'2026-03-31',edto:'2026-09-24', tb737cfm:'2027-05-04',tb737leap:'2027-05-04',ta320:'-',tb777:'-',ta330:'-',tb787:'-' }},
    { no:22, id:'0060', name:'Mr. Jiroj Jirathan',              pos:'Certifying Staff (B737NG)',      posGroup:'CS',
      courses:{ hf:'2026-10-06',sms:'2026-10-07',dga:'2026-10-08',cp:'2026-10-03',fts:'2026-10-11',ewis:'2026-10-13',rvsm:'2026-03-31',edto:'2026-09-24', tb737cfm:'2027-05-04',tb737leap:'-',ta320:'-',tb777:'-',ta330:'-',tb787:'-' }},
    { no:23, id:'0061', name:'Mr. Santisucha Bunaram',          pos:'Aircraft Mechanic',             posGroup:'AM',
      courses:{ hf:'2026-10-06',sms:'2026-10-07',dga:'2026-10-08',cp:'2026-10-03',fts:'2026-10-11',ewis:'2026-10-13',rvsm:'2026-03-31',edto:'2026-09-24', tb737cfm:'-',tb737leap:'-',ta320:'-',tb777:'-',ta330:'-',tb787:'-' }},
    { no:24, id:'0063', name:'Mr. Veerapong Chivasakulchai',    pos:'Certifying Staff (A320/B777/A330)', posGroup:'CS',
      courses:{ hf:'2026-10-06',sms:'2026-10-07',dga:'2026-10-08',cp:'2026-10-03',fts:'2026-10-11',ewis:'2026-10-13',rvsm:'2026-03-31',edto:'2026-09-24', tb737cfm:'-',tb737leap:'-',ta320:'2027-05-03',tb777:'2027-06-03',ta330:'2027-06-12',tb787:'-' }},
    { no:25, id:'0064', name:'Mr. Wasan Preechamaj',            pos:'Certifying Staff (A320/B777)',  posGroup:'CS',
      courses:{ hf:'2026-10-06',sms:'2026-10-07',dga:'2026-10-08',cp:'2026-10-03',fts:'2026-10-11',ewis:'2026-10-13',rvsm:'2026-03-31',edto:'2026-09-24', tb737cfm:'-',tb737leap:'-',ta320:'2027-05-03',tb777:'2027-06-03',ta330:'-',tb787:'-' }},
]
