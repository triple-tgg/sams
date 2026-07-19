'use client'

import { X, Download, Printer } from 'lucide-react'
import { useState } from 'react'
import { useStaffPrintPreview } from '@/lib/api/hooks/useQAStaffManagement'
import { formatDate } from '@/app/[locale]/(protected)/hr/staff/[id]/utils'
import './certifying-staff-preview.css'

/* eslint-disable @next/next/no-img-element */

interface CertifyingStaffPreviewProps {
    isOpen: boolean
    onClose: () => void
    staffId: number
}

// ── Shared Component for Header ──
function FormHeader({ employeeId }: { employeeId: string }) {
    return (
        <div className="csp-header-container">
            <div className="csp-header-top">
                <img src="/images/logo/logo.png" alt="SAMS" className="csp-logo" />
                <h1 className="csp-title">Certifying Staff Maintenance Experience Summary Form</h1>
            </div>
            <div className="csp-employee-id">Employee ID: {employeeId}</div>
            <div className="csp-header-line"></div>
        </div>
    )
}

// ── Shared Component for Footer ──
function FormFooter({ page, total }: { page: number; total: number }) {
    return (
        <div className="csp-footer">
            <span>SAMS-FM-CM-062-Certifying Staff Maintenance Experience Summary Form-Rev.01-Date 05 AUG 2025</span>
            <span>Page {page} of {total}</span>
        </div>
    )
}

export function CertifyingStaffPreview({ isOpen, onClose, staffId }: CertifyingStaffPreviewProps) {
    const { data } = useStaffPrintPreview(staffId, isOpen)

    if (!isOpen) return null

    const api = data?.responseData?.profile
    const employeeId = api?.employeeId || '-'
    const staffName = api?.fullNameEn || api?.name || '-'
    const designation = 'Certifying Staff' // Hardcoded based on PDF
    
    // Use any as type because the API typing in QAStaffItem for these arrays is unknown[] currently
    const amelLicenses = (api?.staffAmelLicenseList as any[] || []).filter(l => !l.isdelete)
    const workExperiences = (api?.workExperiences as any[] || []).filter(w => !w.isdelete)

    // Derived values
    const expStartDate = workExperiences.length > 0 && workExperiences[workExperiences.length - 1].periodFrom 
        ? formatDate(workExperiences[workExperiences.length - 1].periodFrom!) 
        : '-'
    const expEndDate = workExperiences.length > 0 && workExperiences[0].periodTo 
        ? formatDate(workExperiences[0].periodTo!) 
        : 'Present'

    return (
        <div className="csp-overlay">
            {/* Toolbar */}
            <div className="csp-toolbar">
                <span className="csp-toolbar-title">Certifying Staff Maintenance Experience Summary Form (Preview)</span>
                <div className="csp-toolbar-actions">
                    <button className="csp-btn csp-btn-primary" onClick={() => window.print()}>
                        <Download className="h-4 w-4" />
                        Download
                    </button>
                    <button className="csp-btn csp-btn-primary" onClick={() => window.print()}>
                        <Printer className="h-4 w-4" />
                        Print
                    </button>
                    <button className="csp-btn csp-btn-close" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Pages Container */}
            <div className="csp-pages-container">
                {/* Page 1 */}
                <div className="csp-page">
                    <FormHeader employeeId={employeeId} />
                    
                    <div className="csp-section-title">PART 1: PERSONAL INFORMATION</div>
                    <table className="csp-table csp-table-info">
                        <tbody>
                            <tr>
                                <td>Staff Name:</td>
                                <td>{staffName}</td>
                            </tr>
                            <tr>
                                <td>Designation:</td>
                                <td>{designation}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="csp-section-title">PART 2: AIRCRAFT MAINTENANCE ENGINEER LICENSE (AMEL) RECORDS</div>
                    <table className="csp-table csp-table-info">
                        <thead>
                            <tr>
                                <th rowSpan={2} style={{ width: '15%' }}>AMEL<br/>Number</th>
                                <th colSpan={2} style={{ width: '40%' }}>Period of Validity of License</th>
                                <th rowSpan={2} style={{ width: '45%' }}>Aircraft Ratings</th>
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
                                    <td style={{ textAlign: 'center' }}>{lic.issuedDate ? formatDate(lic.issuedDate) : '-'}</td>
                                    <td style={{ textAlign: 'center' }}>{lic.expiryDate ? formatDate(lic.expiryDate) : '-'}</td>
                                    <td style={{ whiteSpace: 'pre-line' }}>
                                        {lic.aircraftRatings ? lic.aircraftRatings.split(',').map((r: string) => `-${r.trim()}`).join('\n') : '-'}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td style={{ textAlign: 'center' }}>-</td>
                                    <td style={{ textAlign: 'center' }}>-</td>
                                    <td style={{ textAlign: 'center' }}>-</td>
                                    <td style={{ textAlign: 'center' }}>-</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    <div className="csp-section-title">PART 3: WORK EXPERIENCES</div>
                    <table className="csp-table csp-table-info">
                        <tbody>
                            <tr>
                                <td>Experience Start Date:</td>
                                <td>{expStartDate}</td>
                            </tr>
                            <tr>
                                <td>Experience End Date:</td>
                                <td>{expEndDate}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="csp-section-title">PART 4: SUMMARY OF MAINTENANCE TASKS</div>
                    <table className="csp-table csp-table-tasks">
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', background: '#e5e7eb', fontWeight: 'bold' }}>Description</th>
                                <th style={{ textAlign: 'left', background: '#e5e7eb', fontWeight: 'bold' }}>Tasks Completed</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Group 1</td>
                                <td>370 Tasks</td>
                            </tr>
                            <tr>
                                <td>Group 2</td>
                                <td>6 Tasks</td>
                            </tr>
                            <tr>
                                <td>Training/Management/Instructor<br/>Tasks (Maximum 20%):</td>
                                <td>2 Tasks</td>
                            </tr>
                            <tr>
                                <td>Total</td>
                                <td>378 Tasks</td>
                            </tr>
                        </tbody>
                    </table>

                    <FormFooter page={1} total={2} />
                </div>

                {/* Page 2 */}
                <div className="csp-page">
                    <FormHeader employeeId={employeeId} />

                    <div className="csp-notes">
                        <div>Note:</div>
                        <ol>
                            <li>Document a minimum of <strong>180 tasks</strong> during the 6/24-month period.</li>
                            <li>Classify tasks as per the aircraft group (Group 1 or Group 2) as outlined in similar<br/>technology table in MOE 3.9.1(h)(iii).</li>
                            <li>Ensure no more than <strong>20%</strong> of the tasks are categorized under <strong>training, management, or<br/>instructor roles</strong> as outlined in MOE 3.9.1(h)(v).</li>
                        </ol>
                    </div>

                    <div className="csp-divider"></div>

                    <div className="csp-signatures">
                        <div className="csp-sig-block">
                            <div className="csp-sig-title">REVIEWED BY</div>
                            <div className="csp-sig-row">
                                <span className="csp-sig-label">Signature</span>
                                <span>:</span>
                                <span className="csp-sig-line"></span>
                            </div>
                            <div className="csp-sig-row">
                                <span className="csp-sig-label">Name</span>
                                <span>:</span>
                                <span className="csp-sig-line csp-sig-value"></span>
                            </div>
                            <div className="csp-sig-row">
                                <span className="csp-sig-label">Position</span>
                                <span>:</span>
                                <span className="csp-sig-line csp-sig-value">Compliance Control Executive</span>
                            </div>
                            <div className="csp-sig-row">
                                <span className="csp-sig-label">Date</span>
                                <span>:</span>
                                <span className="csp-sig-line csp-sig-value"></span>
                            </div>
                        </div>

                        <div className="csp-sig-block">
                            <div className="csp-sig-title">APPROVED BY</div>
                            <div className="csp-sig-row">
                                <span className="csp-sig-label">Signature</span>
                                <span>:</span>
                                <span className="csp-sig-line"></span>
                            </div>
                            <div className="csp-sig-row">
                                <span className="csp-sig-label">Name</span>
                                <span>:</span>
                                <span className="csp-sig-line csp-sig-value"></span>
                            </div>
                            <div className="csp-sig-row">
                                <span className="csp-sig-label">Position</span>
                                <span>:</span>
                                <span className="csp-sig-line csp-sig-value">Compliance Monitoring Manager</span>
                            </div>
                            <div className="csp-sig-row">
                                <span className="csp-sig-label">Date</span>
                                <span>:</span>
                                <span className="csp-sig-line csp-sig-value"></span>
                            </div>
                        </div>
                    </div>

                    <FormFooter page={2} total={2} />
                </div>
            </div>
        </div>
    )
}
