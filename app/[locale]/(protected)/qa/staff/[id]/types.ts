// ── Staff Profile Types ──

export interface StaffLicense {
    number: string
    category: string
    issuedDate: string
    expiryDate: string
    status: string
    limitations?: string
    aircraftRatings?: string[]
}

export interface TrainingRecord {
    course: string
    type: string
    dateFrom: string
    dateTo: string
    validUntil: string
    status: string
}

export interface WorkExperience {
    title: string
    company: string
    period: string
    description: string
}

export interface Education {
    degree: string
    institution: string
    year: string
    field: string
}

export interface LogbookEntry {
    date: string
    aircraft: string
    regNo: string
    taskType: string
    thfNo: string
    description: string
    hours: number
    signedOff: boolean
}

// ── Print Preview Types ──

export interface AmelLicense {
    licenseNo: string
    ratings: string[]
    validFrom: string
    validTo: string
}

export interface PreviousTrainingRecord {
    dateFrom: string
    dateTo: string
    course: string
    provider: string
}

export interface CurrentTrainingRecord {
    dateFrom: string
    dateTo: string
    validUntil: string
    course: string
    provider: string
}

export interface PreviousEmployment {
    employer: string
    position: string
    from: string
    to: string
}

export interface StaffData {
    id: number
    empId: string
    name: string
    nameEn: string
    position: string
    department: string
    status: string
    startDate: string
    initials: string
    avatarBg: string
    profileImage?: string
    titleName?: string
    dob: string
    idCard: string
    nationality: string
    phone: string
    email: string
    address: string
    placeOfBirth: string
    license?: StaffLicense
    ratings: string[]
    training: TrainingRecord[]
    experience: WorkExperience[]
    education: Education[]
    logbook: LogbookEntry[]
    amelLicenses?: AmelLicense[]
    previousTraining?: PreviousTrainingRecord[]
    currentTraining?: CurrentTrainingRecord[]
    previousEmployment?: PreviousEmployment[]
}

export type TabName = 'Profile' | 'Training' | 'Experience' | 'Logbook Records'
