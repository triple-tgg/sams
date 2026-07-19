'use client'

import { Download, Loader2, Printer, X } from 'lucide-react'
import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { toast } from 'sonner'
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

async function waitForPrintableAssets(container: HTMLElement) {
    if (document.fonts?.ready) await document.fonts.ready

    const images = Array.from(container.querySelectorAll('img'))
    await Promise.all(images.map((image) => {
        if (image.complete) return Promise.resolve()

        return new Promise<void>((resolve) => {
            image.addEventListener('load', () => resolve(), { once: true })
            image.addEventListener('error', () => resolve(), { once: true })
        })
    }))
}

export function CertifyingStaffPreview({ isOpen, onClose, staffId }: CertifyingStaffPreviewProps) {
    const pagesRef = useRef<HTMLDivElement>(null)
    const [isDownloading, setIsDownloading] = useState(false)
    const [isPrinting, setIsPrinting] = useState(false)
    const { data, isLoading, isError, error } = useStaffPrintPreview(staffId, isOpen)

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

    const isPreviewReady = Boolean(api) && !isLoading && !isError
    const isBusy = isDownloading || isPrinting

    const handlePrint = async () => {
        const container = pagesRef.current
        if (!container || !isPreviewReady) {
            toast.error('Preview data is not ready to print')
            return
        }

        setIsPrinting(true)
        try {
            await waitForPrintableAssets(container)
            window.print()
        } catch (printError) {
            console.error('Failed to prepare certifying staff form for printing:', printError)
            toast.error('Failed to prepare document for printing')
        } finally {
            setIsPrinting(false)
        }
    }

    const handleDownloadPdf = async () => {
        const container = pagesRef.current
        if (!container || !isPreviewReady) {
            toast.error('Preview data is not ready to download')
            return
        }

        setIsDownloading(true)
        container.classList.add('csp-exporting')

        try {
            await waitForPrintableAssets(container)
            const pages = Array.from(container.querySelectorAll<HTMLElement>('.csp-page'))
            if (pages.length === 0) throw new Error('No printable pages found')

            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
            const pageWidth = pdf.internal.pageSize.getWidth()
            const pageHeight = pdf.internal.pageSize.getHeight()

            for (let index = 0; index < pages.length; index += 1) {
                const canvas = await html2canvas(pages[index], {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                })
                const sourceHeight = (canvas.height * pageWidth) / canvas.width
                const scale = Math.min(1, pageHeight / sourceHeight)
                const imageWidth = pageWidth * scale
                const imageHeight = sourceHeight * scale
                const offsetX = (pageWidth - imageWidth) / 2

                if (index > 0) pdf.addPage('a4', 'portrait')
                pdf.addImage(canvas.toDataURL('image/png'), 'PNG', offsetX, 0, imageWidth, imageHeight)
            }

            const fileIdentifier = api?.employeeId || api?.code || String(staffId)
            const safeEmployeeId = fileIdentifier.replace(/[^a-zA-Z0-9-_]+/g, '-') || 'staff'
            pdf.save(`Certifying-Staff-Maintenance-Experience-${safeEmployeeId}.pdf`)
            toast.success('PDF downloaded successfully')
        } catch (downloadError) {
            console.error('Failed to export certifying staff form PDF:', downloadError)
            toast.error(downloadError instanceof Error ? downloadError.message : 'Failed to export PDF')
        } finally {
            container.classList.remove('csp-exporting')
            setIsDownloading(false)
        }
    }

    return (
        <div className="csp-overlay">
            {/* Toolbar */}
            <div className="csp-toolbar">
                <span className="csp-toolbar-title">Certifying Staff Maintenance Experience Summary Form (Preview)</span>
                <div className="csp-toolbar-actions">
                    <button
                        type="button"
                        className="csp-btn csp-btn-primary"
                        onClick={handleDownloadPdf}
                        disabled={!isPreviewReady || isBusy}
                    >
                        {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        {isDownloading ? 'Generating PDF...' : 'Download PDF'}
                    </button>
                    <button
                        type="button"
                        className="csp-btn csp-btn-primary"
                        onClick={handlePrint}
                        disabled={!isPreviewReady || isBusy}
                    >
                        {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                        {isPrinting ? 'Preparing...' : 'Print'}
                    </button>
                    <button type="button" className="csp-btn csp-btn-close" onClick={onClose} disabled={isBusy}>
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Pages Container */}
            {isLoading ? (
                <div className="csp-preview-status">
                    <Loader2 className="h-7 w-7 animate-spin" />
                    <span>Loading preview data...</span>
                </div>
            ) : isError || !api ? (
                <div className="csp-preview-status csp-preview-status-error">
                    <span>Unable to load preview data</span>
                    <small>{error instanceof Error ? error.message : 'Staff preview data is unavailable'}</small>
                </div>
            ) : (
                <div ref={pagesRef} className="csp-pages-container">
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
            )}
        </div>
    )
}
