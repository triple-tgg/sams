'use client'

import { X } from 'lucide-react'
import { StaffData } from '../types'
import './print-preview.css'

/* eslint-disable @next/next/no-img-element */

interface PrintPreviewProps {
    isOpen: boolean
    onClose: () => void
    staff: StaffData
}

// ── Page Header ──
function PageHeader() {
    return (
        <div className="pp-header">
            <img src="/images/logo/logo.png" alt="SAMS" className="pp-logo" />
            <h1 className="pp-title">Employee Profile and Training Record</h1>
        </div>
    )
}

// ── Page Footer ──
function PageFooter({ page, total }: { page: number; total: number }) {
    return (
        <div className="pp-footer">
            <span>SAMS-FM-CM-036-Employee Profile and Training Record-Rev.02-Date 05 AUG 2025</span>
            <span>Page {page} of {total}</span>
        </div>
    )
}

// ── Section Header (green band) ──
function SectionTitle({ children }: { children: string }) {
    return (
        <tr>
            <td colSpan={99} className="pp-section-title">{children}</td>
        </tr>
    )
}

// ── Personal Info Row ──
function InfoRow({ label, value, colSpan }: { label: string; value: string; colSpan?: number }) {
    return (
        <>
            <td className="pp-label">{label}</td>
            <td className="pp-value" colSpan={colSpan}>{value}</td>
        </>
    )
}

// ── Page 1: Profile ──
function ProfilePage({ staff, totalPages }: { staff: StaffData; totalPages: number }) {
    const amelLicenses = staff.amelLicenses ?? []
    const prevEmployment = staff.previousEmployment ?? []

    return (
        <div className="pp-page">
            <PageHeader />

            {/* Personal Information */}
            <table className="pp-table">
                <tbody>
                    <SectionTitle>Personal Information</SectionTitle>
                    <tr>
                        <InfoRow label="Name (English):" value={staff.nameEn} colSpan={3} />
                        <td rowSpan={8} className="pp-photo-cell">
                            {staff.profileImage ? (
                                <img src={staff.profileImage} alt="Photo" className="pp-photo" />
                            ) : (
                                <div className="pp-photo-placeholder">Photo</div>
                            )}
                        </td>
                    </tr>
                    <tr>
                        <InfoRow label="ชื่อ (ภาษาไทย):" value={staff.name} colSpan={3} />
                    </tr>
                    <tr>
                        <InfoRow label="Date of birth:" value={staff.dob} />
                        <InfoRow label="Place of birth:" value={staff.placeOfBirth} />
                    </tr>
                    <tr>
                        <InfoRow label="Thai ID Card:" value={staff.idCard} />
                        <InfoRow label="Nationality:" value={staff.nationality} />
                    </tr>
                    <tr>
                        <InfoRow label="Current address:" value={staff.address} colSpan={3} />
                    </tr>
                    <tr>
                        <InfoRow label="Phone:" value={staff.phone} colSpan={3} />
                    </tr>
                </tbody>
            </table>

            {/* Education Information */}
            <table className="pp-table pp-mt">
                <tbody>
                    <SectionTitle>Education Information</SectionTitle>
                    <tr className="pp-col-header">
                        <td>Degree</td>
                        <td>Name of Institution/University/College</td>
                        <td>Start (year)</td>
                        <td>End (year)</td>
                    </tr>
                    {staff.education.map((edu, i) => (
                        <tr key={i}>
                            <td className="pp-center">{edu.degree}</td>
                            <td className="pp-center">{edu.institution}</td>
                            <td className="pp-center">{edu.year.split('–')[0]?.trim() || edu.year}</td>
                            <td className="pp-center">{edu.year.split('–')[1]?.trim() || ''}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* AMEL */}
            {amelLicenses.length > 0 && (
                <table className="pp-table pp-mt">
                    <tbody>
                        <tr>
                            <td className="pp-section-title" colSpan={4}>Aircraft Maintenance Engineer License (AMEL)</td>
                        </tr>
                        <tr className="pp-col-header">
                            <td rowSpan={2}>License No.</td>
                            <td rowSpan={2}>Ratings</td>
                            <td colSpan={2}>Period of Validity</td>
                        </tr>
                        <tr className="pp-col-header">
                            <td>From</td>
                            <td>To</td>
                        </tr>
                        {amelLicenses.map((lic, li) =>
                            lic.ratings.map((rating, ri) => (
                                <tr key={`${li}-${ri}`}>
                                    {ri === 0 && (
                                        <td className="pp-center" rowSpan={lic.ratings.length}>{lic.licenseNo}</td>
                                    )}
                                    <td>{rating}</td>
                                    {ri === Math.floor(lic.ratings.length / 2) && (
                                        <>
                                            <td className="pp-center" rowSpan={lic.ratings.length - ri}>{lic.validFrom}</td>
                                            <td className="pp-center" rowSpan={lic.ratings.length - ri}>{lic.validTo}</td>
                                        </>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}

            {/* Previous Employment */}
            {prevEmployment.length > 0 && (
                <table className="pp-table pp-mt">
                    <tbody>
                        <SectionTitle>Previous Employment Information</SectionTitle>
                        {prevEmployment.map((emp, i) => (
                            <>
                                <tr key={`emp-${i}`}>
                                    <InfoRow label="Employer:" value={emp.employer} colSpan={4} />
                                </tr>
                                <tr key={`pos-${i}`}>
                                    <td className="pp-label">Position:</td>
                                    <td style={{ whiteSpace: 'pre-line' }}>{emp.position}</td>
                                    <td className="pp-label">From:</td>
                                    <td className="pp-center">{emp.from}</td>
                                    <td className="pp-label">To:</td>
                                    <td className="pp-center">{emp.to}</td>
                                </tr>
                            </>
                        ))}
                    </tbody>
                </table>
            )}

            <PageFooter page={1} total={totalPages} />
        </div>
    )
}

// ── Training Records Pages ──
function TrainingPages({ staff, startPage, totalPages }: { staff: StaffData; startPage: number; totalPages: number }) {
    const prevTraining = staff.previousTraining ?? []
    const currTraining = staff.currentTraining ?? []

    // Combine all rows with type markers
    type Row = { type: 'prev-header' } | { type: 'curr-header' } | { type: 'prev'; data: typeof prevTraining[0] } | { type: 'curr'; data: typeof currTraining[0] } | { type: 'cert' }
    const allRows: Row[] = []

    if (prevTraining.length > 0) {
        allRows.push({ type: 'prev-header' })
        prevTraining.forEach(t => allRows.push({ type: 'prev', data: t }))
    }
    if (currTraining.length > 0) {
        allRows.push({ type: 'curr-header' })
        currTraining.forEach(t => allRows.push({ type: 'curr', data: t }))
    }
    allRows.push({ type: 'cert' })

    // Split into pages (~20 rows per page for readability)
    const ROWS_PER_PAGE = 18
    const pages: Row[][] = []
    for (let i = 0; i < allRows.length; i += ROWS_PER_PAGE) {
        pages.push(allRows.slice(i, i + ROWS_PER_PAGE))
    }

    return (
        <>
            {pages.map((pageRows, pi) => (
                <div className="pp-page" key={pi}>
                    <PageHeader />
                    <table className="pp-table">
                        <tbody>
                            {pageRows.map((row, ri) => {
                                if (row.type === 'prev-header') {
                                    return (
                                        <React.Fragment key={ri}>
                                            <SectionTitle>Previous Training Records</SectionTitle>
                                            <tr className="pp-col-header">
                                                <td colSpan={2}>Date</td>
                                                <td>Training Course</td>
                                                <td>By</td>
                                            </tr>
                                        </React.Fragment>
                                    )
                                }
                                if (row.type === 'curr-header') {
                                    return (
                                        <React.Fragment key={ri}>
                                            <SectionTitle>Current Training Records</SectionTitle>
                                            <tr className="pp-col-header">
                                                <td colSpan={2}>Training Date</td>
                                                <td rowSpan={2}>Valid Until</td>
                                                <td rowSpan={2}>Training Course</td>
                                                <td rowSpan={2}>By</td>
                                            </tr>
                                            <tr className="pp-col-header">
                                                <td>From</td>
                                                <td>To</td>
                                            </tr>
                                        </React.Fragment>
                                    )
                                }
                                if (row.type === 'prev') {
                                    return (
                                        <tr key={ri}>
                                            <td className="pp-center pp-nowrap">{row.data.dateFrom}</td>
                                            <td className="pp-center pp-nowrap">{row.data.dateTo}</td>
                                            <td>{row.data.course}</td>
                                            <td className="pp-center">{row.data.provider}</td>
                                        </tr>
                                    )
                                }
                                if (row.type === 'curr') {
                                    return (
                                        <tr key={ri}>
                                            <td className="pp-center pp-nowrap">{row.data.dateFrom}</td>
                                            <td className="pp-center pp-nowrap">{row.data.dateTo}</td>
                                            <td className="pp-center pp-nowrap">{row.data.validUntil || ''}</td>
                                            <td>{row.data.course}</td>
                                            <td className="pp-center">{row.data.provider}</td>
                                        </tr>
                                    )
                                }
                                if (row.type === 'cert') {
                                    return (
                                        <React.Fragment key={ri}>
                                            <tr>
                                                <td colSpan={5} className="pp-cert-text">
                                                    <p>I hereby certify that the above information is true and correct.</p>
                                                    <div className="pp-signature-area">
                                                        <div className="pp-sig-row">
                                                            <span className="pp-sig-label">Signature of Compliance Monitoring:</span>
                                                            <span className="pp-sig-line"></span>
                                                        </div>
                                                        <div className="pp-sig-row">
                                                            <span className="pp-sig-label">Name:</span>
                                                            <span className="pp-sig-value">____________________________</span>
                                                        </div>
                                                        <div className="pp-sig-details">
                                                            <div>
                                                                <span className="pp-sig-label">Position:</span>
                                                                <span className="pp-sig-value">____________________________</span>
                                                            </div>
                                                            <div>
                                                                <span className="pp-sig-label">Date:</span>
                                                                <span className="pp-sig-value">____________________________</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    )
                                }
                                return null
                            })}
                        </tbody>
                    </table>
                    <PageFooter page={startPage + pi} total={totalPages} />
                </div>
            ))}
        </>
    )
}

import React from 'react'

// ── Main Component ──
export function PrintPreview({ isOpen, onClose, staff }: PrintPreviewProps) {
    if (!isOpen) return null

    // Calculate total pages
    const prevTraining = staff.previousTraining ?? []
    const currTraining = staff.currentTraining ?? []
    const totalTrainingRows = prevTraining.length + currTraining.length + 3 // +headers+cert
    const trainingPages = Math.max(1, Math.ceil(totalTrainingRows / 18))
    const totalPages = 1 + trainingPages // page 1 = profile

    return (
        <div className="pp-overlay">
            {/* Toolbar */}
            <div className="pp-toolbar no-print">
                <span className="pp-toolbar-title">Print Preview — Employee Profile and Training Record</span>
                <div className="pp-toolbar-actions">
                    <button
                        className="pp-btn pp-btn-primary"
                        onClick={() => window.print()}
                    >
                        🖨️ Print
                    </button>
                    <button
                        className="pp-btn pp-btn-close"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Pages Container */}
            <div className="pp-pages-container no-print-hide">
                <ProfilePage staff={staff} totalPages={totalPages} />
                <TrainingPages staff={staff} startPage={2} totalPages={totalPages} />
            </div>
        </div>
    )
}
