'use client'

import { X, Download, Printer } from 'lucide-react'
import { useStaffById, useStaffTrainingDashboard } from '@/lib/api/hooks/useQAStaffManagement'
import { formatDate } from '@/app/[locale]/(protected)/hr/staff/[id]/utils'
import './work-experience-preview.css'

/* eslint-disable @next/next/no-img-element */

interface WorkExperiencePreviewProps {
    isOpen: boolean
    onClose: () => void
    staffId: number
}

// ── Shared Component for Header ──
function FormHeader() {
    return (
        <div className="wep-header-container">
            <img src="/images/logo/logo.png" alt="SAMS" className="wep-logo" />
            <h1 className="wep-title">Employee Profile and Training Record</h1>
        </div>
    )
}

// ── Shared Component for Footer ──
function FormFooter({ page, total }: { page: number; total: number }) {
    return (
        <div className="wep-footer">
            <span>SAMS-FM-CM-036-Employee Profile and Training Record-Rev.02-Date 05 AUG 2025</span>
            <span>Page {page} of {total}</span>
        </div>
    )
}

export function WorkExperiencePreview({ isOpen, onClose, staffId }: WorkExperiencePreviewProps) {
    const { data: staffData } = useStaffById(staffId, isOpen)
    const { data: trainingData } = useStaffTrainingDashboard(staffId, isOpen)

    if (!isOpen) return null

    const api = staffData?.responseData
    const nameEn = api?.fullNameEn || api?.name || '-'
    const nameTh = api?.title ? `${api.title} ${api.name}` : (api?.name || '-')
    const dob = api?.dateOfBirth ? formatDate(api.dateOfBirth) : '-'
    const pob = api?.placeOfBirth || '-'
    const idCard = api?.idCardNo || '-'
    const nationality = api?.nationality || '-'
    const address = api?.address || '-'
    const phone = api?.phone || '-'
    const photo = api?.profileImagePath || null

    const educations = (api?.educations || []).filter(e => !e.isdelete)
    const amelLicenses = (api?.staffAmelLicenseList || []).filter(l => !l.isdelete)
    const employments = (api?.workExperiences || []).filter(w => !w.isdelete)

    const previousTrainings = trainingData?.responseData?.histories || []
    const currentTrainings = trainingData?.responseData?.records || []

    return (
        <div className="wep-overlay">
            {/* Toolbar */}
            <div className="wep-toolbar">
                <span className="wep-toolbar-title">Employee Profile and Training Record (Preview)</span>
                <div className="wep-toolbar-actions">
                    <button className="wep-btn wep-btn-primary" onClick={() => window.print()}>
                        <Download className="h-4 w-4" />
                        Download
                    </button>
                    <button className="wep-btn wep-btn-primary" onClick={() => window.print()}>
                        <Printer className="h-4 w-4" />
                        Print
                    </button>
                    <button className="wep-btn wep-btn-close" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Pages Container */}
            <div className="wep-pages-container">
                {/* Single continuous page view for web, printed as multiple via CSS */}
                <div className="wep-page">
                    <FormHeader />
                    
                    {/* Personal Information */}
                    <table className="wep-table">
                        <tbody>
                            <tr>
                                <td colSpan={4} className="wep-table-header">Personal Information</td>
                                <td rowSpan={5} style={{ width: '35mm', padding: 0, textAlign: 'center', verticalAlign: 'middle' }}>
                                    <div className="wep-photo-box" style={{ margin: '0 auto' }}>
                                        {photo ? (
                                            <img src={photo} alt="Staff Photo" className="wep-photo" />
                                        ) : (
                                            <span style={{ color: '#999' }}>Photo</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td className="wep-label">Name (English):</td>
                                <td colSpan={3}>{nameEn}</td>
                            </tr>
                            <tr>
                                <td className="wep-label">ชื่อ (ภาษาไทย):</td>
                                <td colSpan={3}>{nameTh}</td>
                            </tr>
                            <tr>
                                <td className="wep-label">Date of birth:</td>
                                <td>{dob}</td>
                                <td className="wep-label">Place of birth:</td>
                                <td>{pob}</td>
                            </tr>
                            <tr>
                                <td className="wep-label">Thai ID Card:</td>
                                <td>{idCard}</td>
                                <td className="wep-label">Nationality:</td>
                                <td>{nationality}</td>
                            </tr>
                            <tr>
                                <td className="wep-label">Current address:</td>
                                <td colSpan={4}>{address}</td>
                            </tr>
                            <tr>
                                <td className="wep-label">Phone:</td>
                                <td colSpan={4}>{phone}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Education Information */}
                    <table className="wep-table">
                        <thead>
                            <tr>
                                <th colSpan={4} className="wep-table-header">Education Information</th>
                            </tr>
                            <tr>
                                <th>Degree</th>
                                <th>Name of Institution/University/College</th>
                                <th>Start (year)</th>
                                <th>End (year)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {educations.length > 0 ? educations.map((edu, i) => (
                                <tr key={i}>
                                    <td style={{ textAlign: 'center' }}>{edu.degree || '-'}</td>
                                    <td>{edu.institution || '-'}</td>
                                    <td style={{ textAlign: 'center' }}>-</td>
                                    <td style={{ textAlign: 'center' }}>{edu.year || '-'}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center' }}>No records found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* AMEL Records */}
                    <table className="wep-table">
                        <thead>
                            <tr>
                                <th colSpan={4} className="wep-table-header">Aircraft Maintenance Engineer License (AMEL)</th>
                            </tr>
                            <tr>
                                <th rowSpan={2} style={{ width: '15%' }}>License No.</th>
                                <th rowSpan={2} style={{ width: '45%' }}>Ratings</th>
                                <th colSpan={2} style={{ width: '40%' }}>Period of Validity</th>
                            </tr>
                            <tr>
                                <th>From</th>
                                <th>To</th>
                            </tr>
                        </thead>
                        <tbody>
                            {amelLicenses.length > 0 ? amelLicenses.map((lic, i) => (
                                <tr key={i}>
                                    <td style={{ textAlign: 'center' }}>{lic.licenseNumber || '-'}</td>
                                    <td style={{ whiteSpace: 'pre-line' }}>
                                        {lic.aircraftRatings ? lic.aircraftRatings.split(',').map(r => `${r.trim()}`).join('\n') : '-'}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>{lic.issuedDate ? formatDate(lic.issuedDate) : '-'}</td>
                                    <td style={{ textAlign: 'center' }}>{lic.expiryDate ? formatDate(lic.expiryDate) : '-'}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center' }}>No records found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Previous Employment */}
                    <table className="wep-table">
                        <thead>
                            <tr>
                                <th colSpan={6} className="wep-table-header">Previous Employment Information</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employments.length > 0 ? employments.map((emp, i) => (
                                <tr key={i}>
                                    <td className="wep-label" style={{ width: '15%' }}>Employer:</td>
                                    <td colSpan={5}>{emp.company || '-'}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center' }}>No records found</td>
                                </tr>
                            )}
                            {/* Detailed position rows mapped after employer for structure */}
                            {employments.length > 0 && employments.map((emp, i) => (
                                <tr key={`pos-${i}`}>
                                    <td className="wep-label">Position:</td>
                                    <td style={{ width: '35%' }}>{emp.jobTitle || '-'}</td>
                                    <td className="wep-label" style={{ width: '10%' }}>From:</td>
                                    <td style={{ width: '15%' }}>{emp.periodFrom ? formatDate(emp.periodFrom) : '-'}</td>
                                    <td className="wep-label" style={{ width: '10%' }}>To:</td>
                                    <td style={{ width: '15%' }}>{emp.periodTo ? formatDate(emp.periodTo) : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Previous Training Records */}
                    <table className="wep-table" style={{ marginTop: '20px' }}>
                        <thead>
                            <tr>
                                <th colSpan={4} className="wep-table-header">Previous Training Records</th>
                            </tr>
                            <tr>
                                <th colSpan={2}>Date</th>
                                <th>Training Course</th>
                                <th>By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {previousTrainings.length > 0 ? previousTrainings.map((pt, i) => (
                                <tr key={i}>
                                    <td style={{ textAlign: 'center', width: '15%' }}>{pt.dateFrom ? formatDate(pt.dateFrom) : '-'}</td>
                                    <td style={{ textAlign: 'center', width: '15%' }}>{pt.dateTo ? formatDate(pt.dateTo) : '-'}</td>
                                    <td>{pt.courseName || '-'}</td>
                                    <td style={{ width: '20%' }}>{pt.academyName || '-'}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center' }}>No records found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Current Training Records */}
                    <table className="wep-table" style={{ marginTop: '20px' }}>
                        <thead>
                            <tr>
                                <th colSpan={4} className="wep-table-header-green">Current Training Records</th>
                            </tr>
                            <tr>
                                <th colSpan={2}>Training Date</th>
                                <th rowSpan={2} style={{ width: '15%' }}>Valid Until</th>
                                <th rowSpan={2} style={{ width: '40%' }}>Training Course</th>
                                <th rowSpan={2} style={{ width: '15%' }}>By</th>
                            </tr>
                            <tr>
                                <th style={{ width: '15%' }}>From</th>
                                <th style={{ width: '15%' }}>To</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentTrainings.length > 0 ? currentTrainings.map((ct, i) => (
                                <tr key={i}>
                                    <td style={{ textAlign: 'center' }}>{ct.dateFrom ? formatDate(ct.dateFrom) : '-'}</td>
                                    <td style={{ textAlign: 'center' }}>{ct.dateTo ? formatDate(ct.dateTo) : '-'}</td>
                                    <td style={{ textAlign: 'center' }}>{ct.validUntil || 'Never'}</td>
                                    <td>{ct.courseName || '-'}</td>
                                    <td>{ct.providedBy || '-'}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center' }}>No records found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Signatures */}
                    <div className="wep-signature-section">
                        <p style={{ marginBottom: '40px' }}>I hereby certify that the above information is true and correct.</p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', rowGap: '15px', alignItems: 'center' }}>
                            <div style={{ textAlign: 'right', paddingRight: '15px' }}>Signature of Compliance Monitoring:</div>
                            <div style={{ minHeight: '40px', display: 'flex', alignItems: 'center' }}>
                                <span style={{ color: '#0047b3', fontFamily: '"Comic Sans MS", cursive, sans-serif', fontSize: '22px', transform: 'rotate(-5deg)' }}>ชัยณรงค์</span>
                            </div>

                            <div style={{ textAlign: 'right', paddingRight: '15px' }}>Name:</div>
                            <div>Chainarong Chaiampon</div>

                            <div style={{ textAlign: 'right', paddingRight: '15px' }}>Position:</div>
                            <div style={{ display: 'flex', gap: '80px' }}>
                                <span>Compliance Control Executive</span>
                                <span>Date: 03-Feb-2026</span>
                            </div>
                        </div>
                    </div>

                    <FormFooter page={1} total={1} />
                </div>
            </div>
        </div>
    )
}
