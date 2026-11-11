'use client'

import { X, Download, Printer } from 'lucide-react'
import { useWorkExperiencePreview } from '@/lib/api/hooks/useQAStaffManagement'
import { formatDate } from '@/app/[locale]/(protected)/hr/staff/[id]/utils'
import { groupCombinationDisplayLabels } from '@/lib/utils/aircraftEngineDisplay'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useLayoutEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import './work-experience-preview.css'
import { MENU } from "@/lib/permission-codes";
import { useMenuPermission } from "@/hooks/use-menu-permission";

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
            <img src="/sams-logo-cropped.png" alt="SAMS" className="wep-logo" />
            <h1 className="wep-title">Employee Profile and Training Record</h1>
        </div>
    )
}

// ── Shared Component for Footer ──
function FormFooter({ page, total }: { page: number; total: number }) {
    return (
        <div className="wep-footer">
            <span className="wep-footer-code">SAMS-FM-CM-036-Employee Profile and Training Record-Rev.02-Date 05 AUG 2025</span>
            <span className="wep-footer-page">Page {page} of {total}</span>
        </div>
    )
}

// ── A4 pagination for training pages ──
type TrainingSegment =
    | { kind: 'prev'; rows: number[] }
    | { kind: 'cur'; rows: number[] }
    | { kind: 'signature' }
type TrainingPage = TrainingSegment[]

interface TrainingMeasurements {
    header: number
    footer: number
    prevThead: number
    prevRows: number[]
    curThead: number
    curRows: number[]
    signature: number
}

const MM_TO_PX = 96 / 25.4
// A4 height (297mm) minus page padding (15mm top, 8mm bottom)
const PAGE_CONTENT_HEIGHT_PX = (297 - 15 - 8) * MM_TO_PX
const TABLE_GAP_PX = 20 // margin-top between consecutive tables on a page
const TABLE_MARGIN_BOTTOM_PX = 20 // .wep-table margin-bottom
const SAFETY_PX = 12 // buffer for rounding / border-collapse differences

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Parse an API date ("YYYY-MM-DD" or ISO datetime); date-only strings are read as local dates. */
function parseApiDate(value?: string | null): Date | null {
    if (!value) return null
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
    const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value)
    return isNaN(d.getTime()) ? null : d
}

/** Format as DD-MMM-YYYY, e.g. 02-Feb-2028 */
function formatDmy(d: Date): string {
    return `${String(d.getDate()).padStart(2, '0')}-${MONTHS_SHORT[d.getMonth()]}-${d.getFullYear()}`
}

/** Format an API date as MMM-YYYY, e.g. Feb-2022 */
function formatMonthYear(value?: string | null): string {
    const d = parseApiDate(value)
    return d ? `${MONTHS_SHORT[d.getMonth()]}-${d.getFullYear()}` : '-'
}

function outerHeight(el: Element | null): number {
    if (!el) return 0
    const cs = window.getComputedStyle(el)
    return el.getBoundingClientRect().height + (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0)
}

function paginateTraining(m: TrainingMeasurements): TrainingPage[] {
    const available = PAGE_CONTENT_HEIGHT_PX - m.header - m.footer - SAFETY_PX
    const pages: TrainingPage[] = [[]]
    let used = 0
    const page = () => pages[pages.length - 1]
    const newPage = () => {
        pages.push([])
        used = 0
    }

    const placeTable = (kind: 'prev' | 'cur', theadH: number, rowHs: number[]) => {
        let i = 0
        while (i < rowHs.length) {
            const gap = page().length > 0 ? TABLE_GAP_PX : 0
            const minNeeded = gap + theadH + rowHs[i] + TABLE_MARGIN_BOTTOM_PX
            if (page().length > 0 && used + minNeeded > available) {
                newPage()
                continue
            }
            const seg: { kind: typeof kind; rows: number[] } = { kind, rows: [] }
            page().push(seg)
            used += gap + theadH + TABLE_MARGIN_BOTTOM_PX
            // Always place at least one row per segment so an oversized row can't loop forever
            while (i < rowHs.length && (seg.rows.length === 0 || used + rowHs[i] <= available)) {
                seg.rows.push(i)
                used += rowHs[i]
                i++
            }
            if (i < rowHs.length) newPage()
        }
    }

    placeTable('prev', m.prevThead, m.prevRows)
    placeTable('cur', m.curThead, m.curRows)

    if (page().length > 0 && used + m.signature > available) newPage()
    page().push({ kind: 'signature' })

    return pages
}

export function WorkExperiencePreview({ isOpen, onClose, staffId }: WorkExperiencePreviewProps) {
    const perm = useMenuPermission(MENU.QA_DOC_WORK_EXPERIENCE);
    const { data: previewData } = useWorkExperiencePreview(staffId, isOpen)
    const [isDownloading, setIsDownloading] = useState(false)
    const measureRef = useRef<HTMLDivElement>(null)
    const [measuredPages, setMeasuredPages] = useState<TrainingPage[] | null>(null)

    useLayoutEffect(() => {
        if (!isOpen) return
        const root = measureRef.current
        if (!root) return
        const q = (sel: string) => root.querySelector(sel)
        const height = (sel: string) => q(sel)?.getBoundingClientRect().height ?? 0
        const rowHeights = (sel: string) =>
            Array.from(root.querySelectorAll(`${sel} > tr`)).map(r => r.getBoundingClientRect().height)
        setMeasuredPages(paginateTraining({
            header: outerHeight(q('[data-measure="header"] > .wep-header-container')),
            footer: height('[data-measure="footer"]'),
            prevThead: height('[data-measure="prev-thead"]'),
            prevRows: rowHeights('[data-measure="prev-tbody"]'),
            curThead: height('[data-measure="cur-thead"]'),
            curRows: rowHeights('[data-measure="cur-tbody"]'),
            signature: outerHeight(q('[data-measure="signature"]')),
        }))
    }, [isOpen, previewData])

    if (!isOpen) return null

    const api = previewData?.responseData?.profile
    const trainingResp = previewData?.responseData?.training

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

    // Build aircraft ratings from staffAircraftLicenseList using group display labels
    const aircraftLicenseList = (api?.staffAircraftLicenseList || []).filter(l => !l.isdelete)
    const aircraftCombinations = aircraftLicenseList
        .filter((l: any) => l.aircraftEngineObj)
        .map((l: any) => ({
            id: l.aircraftEngineId || l.aircraftEngineObj.id,
            familyCode: l.aircraftEngineObj.familyCode || '',
            series: l.aircraftEngineObj.series || '',
            engineCode: l.aircraftEngineObj.engineCode || '',
        }))
    const aircraftRatingLabels = groupCombinationDisplayLabels(
        aircraftCombinations.map((c: any) => c.id),
        aircraftCombinations
    )

    const previousTrainings = trainingResp?.histories || []
    const currentTrainings = trainingResp?.records || []

    // Row index lists (an empty list still renders one "No records found" row)
    const prevRowIndexes = Array.from({ length: Math.max(1, previousTrainings.length) }, (_, i) => i)
    const curRowIndexes = Array.from({ length: Math.max(1, currentTrainings.length) }, (_, i) => i)

    // Fallback before measurement: everything on a single training page
    const trainingPages: TrainingPage[] = measuredPages ?? [[
        { kind: 'prev', rows: prevRowIndexes },
        { kind: 'cur', rows: curRowIndexes },
        { kind: 'signature' },
    ]]
    const totalPages = 1 + trainingPages.length

    const prevColGroup = (
        <colgroup>
            <col style={{ width: '15%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '50%' }} />
            <col style={{ width: '20%' }} />
        </colgroup>
    )
    const prevTheadRows = (
        <>
            <tr>
                <th colSpan={4} className="wep-table-header">Previous Training Records</th>
            </tr>
            <tr>
                <th colSpan={2}>Date</th>
                <th>Training Course</th>
                <th>By</th>
            </tr>
        </>
    )
    const prevThead = <thead>{prevTheadRows}</thead>
    const renderPrevRow = (i: number) => {
        const pt = previousTrainings[i]
        if (!pt) {
            return (
                <tr key="prev-empty">
                    <td colSpan={4} style={{ textAlign: 'center' }}>No records found</td>
                </tr>
            )
        }
        return (
            <tr key={i}>
                <td style={{ textAlign: 'center' }}>{pt.dateFrom ? formatDate(pt.dateFrom) : '-'}</td>
                <td style={{ textAlign: 'center' }}>{pt.dateTo ? formatDate(pt.dateTo) : '-'}</td>
                <td>{pt.courseName || '-'}</td>
                <td style={{ textAlign: 'center' }}>{pt.academyName || '-'}</td>
            </tr>
        )
    }

    const curColGroup = (
        <colgroup>
            <col style={{ width: '15%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '40%' }} />
            <col style={{ width: '15%' }} />
        </colgroup>
    )
    const curTheadRows = (
        <>
            <tr>
                <th colSpan={5} className="wep-table-header-green">Current Training Records</th>
            </tr>
            <tr>
                <th colSpan={2}>Training Date</th>
                <th rowSpan={2}>Valid Until</th>
                <th rowSpan={2}>Training Course</th>
                <th rowSpan={2}>By</th>
            </tr>
            <tr>
                <th>From</th>
                <th>To</th>
            </tr>
        </>
    )
    const curThead = <thead>{curTheadRows}</thead>
    const renderCurRow = (i: number) => {
        const ct = currentTrainings[i]
        if (!ct) {
            return (
                <tr key="cur-empty">
                    <td colSpan={5} style={{ textAlign: 'center' }}>No records found</td>
                </tr>
            )
        }
        const validUntilDate = parseApiDate(ct.validUntil)
        // Non-date values (e.g. "Never") are shown as-is
        const validUntil = validUntilDate ? formatDmy(validUntilDate) : (ct.validUntil || 'Never')
        return (
            <tr key={i}>
                <td style={{ textAlign: 'center' }}>{ct.dateFrom ? formatDate(ct.dateFrom) : '-'}</td>
                <td style={{ textAlign: 'center' }}>{ct.dateTo ? formatDate(ct.dateTo) : '-'}</td>
                <td style={{ textAlign: 'center' }}>{validUntil}</td>
                <td>{ct.courseName || '-'}</td>
                <td style={{ textAlign: 'center' }}>{ct.providedBy || '-'}</td>
            </tr>
        )
    }

    // Latest "Training Date From" among current training records, e.g. 03-Feb-2026
    const latestTrainingFrom = currentTrainings
        .map(ct => parseApiDate(ct.dateFrom))
        .filter((d): d is Date => !!d)
        .reduce<Date | null>((latest, d) => (!latest || d > latest ? d : latest), null)
    const latestTrainingDate = latestTrainingFrom ? formatDmy(latestTrainingFrom) : '-'

    const signatureBlock = (
        <>
            <div className="wep-signature-section">
                <p style={{ marginBottom: '40px' }}>I hereby certify that the above information is true and correct.</p>

                <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', rowGap: '15px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right', paddingRight: '15px' }}>Signature of Compliance Monitoring:</div>
                    {/* Left blank for a wet signature */}
                    <div style={{ minHeight: '40px' }} />

                    <div style={{ textAlign: 'right', paddingRight: '15px' }}>Name:</div>
                    <div>Chainarong Chaiampon</div>

                    <div style={{ textAlign: 'right', paddingRight: '15px' }}>Position:</div>
                    <div style={{ display: 'flex', gap: '80px' }}>
                        <span>Compliance Control Executive</span>
                        <span>Date: {latestTrainingDate}</span>
                    </div>
                </div>
            </div>
            <div style={{ marginTop: '40px' }} />
        </>
    )

    const handleDownloadPDF = async () => {
        const input = document.getElementById('wep-content-to-print');
        if (!input) {
            toast.error("Could not find content to print");
            return;
        }

        setIsDownloading(true);
        toast.info("Generating PDF... Please wait.");

        try {
            await new Promise(resolve => setTimeout(resolve, 300));

            const pages = Array.from(input.querySelectorAll<HTMLElement>('.wep-page'));
            if (pages.length === 0) {
                toast.error("No pages found to export");
                return;
            }

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            for (let i = 0; i < pages.length; i++) {
                const canvas = await html2canvas(pages[i], {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff'
                });

                const imgWidth = pageWidth;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                const scale = Math.min(1, pageHeight / imgHeight);
                const finalWidth = imgWidth * scale;
                const finalHeight = imgHeight * scale;
                const offsetX = (pageWidth - finalWidth) / 2;

                if (i > 0) pdf.addPage('a4', 'portrait');
                pdf.addImage(canvas.toDataURL('image/png'), 'PNG', offsetX, 0, finalWidth, finalHeight);
            }
            
            const fileName = `Employee_Profile_${api?.idCardNo || nameEn}.pdf`;
            pdf.save(fileName);
            toast.success("PDF Downloaded Successfully");
        } catch (error) {
            console.error("Failed to generate PDF", error);
            toast.error("Failed to generate PDF");
        } finally {
            setIsDownloading(false);
        }
    }

    return (
        <div className="wep-overlay">
            {/* Toolbar */}
            <div className="wep-toolbar">
                <span className="wep-toolbar-title">Employee Profile and Training Record (Preview)</span>
                <div className="wep-toolbar-actions">
                    {perm.canExport && (<button className="wep-btn wep-btn-primary" onClick={() => window.print()}>
                        <Printer className="h-4 w-4" />
                        Print
                    </button>)}
                    <button className="wep-btn wep-btn-close" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Pages Container */}
            <div className="wep-pages-container" id="wep-content-to-print">
                {/* ── Page 1: Personal Info, Education, AMEL, Employment ── */}
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
                                    <td style={{ padding: 0 }}>
                                        {aircraftRatingLabels.length > 0
                                            ? aircraftRatingLabels.map((label, idx) => (
                                                <div key={idx} style={{ padding: '4px 8px', borderBottom: idx < aircraftRatingLabels.length - 1 ? '1px solid #ccc' : 'none' }}>
                                                    {label}
                                                </div>
                                            ))
                                            : <div style={{ padding: '4px 8px', textAlign: 'center' }}>-</div>}
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
                                    <td>{emp.jobTitle || '-'}</td>
                                    <td className="wep-label wep-fit">From:</td>
                                    <td className="wep-fit" style={{ textAlign: 'center' }}>{formatMonthYear(emp.periodFrom)}</td>
                                    <td className="wep-label wep-fit">To:</td>
                                    <td className="wep-fit" style={{ textAlign: 'center' }}>{formatMonthYear(emp.periodTo)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <FormFooter page={1} total={totalPages} />
                </div>

                {/* ── Page 2+: Training Records, Signature (paginated to A4) ── */}
                {trainingPages.map((segments, pageIdx) => (
                    <div className="wep-page" key={`training-page-${pageIdx}`}>
                        <FormHeader />
                        {segments.map((seg, segIdx) => {
                            const marginTop = segIdx > 0 ? `${TABLE_GAP_PX}px` : undefined
                            if (seg.kind === 'prev') {
                                return (
                                    <table key={segIdx} className="wep-table wep-table-fixed" style={{ marginTop }}>
                                        {prevColGroup}
                                        {prevThead}
                                        <tbody>{seg.rows.map(renderPrevRow)}</tbody>
                                    </table>
                                )
                            }
                            if (seg.kind === 'cur') {
                                return (
                                    <table key={segIdx} className="wep-table wep-table-fixed" style={{ marginTop }}>
                                        {curColGroup}
                                        {curThead}
                                        <tbody>{seg.rows.map(renderCurRow)}</tbody>
                                    </table>
                                )
                            }
                            return <div key={segIdx}>{signatureBlock}</div>
                        })}
                        <FormFooter page={pageIdx + 2} total={totalPages} />
                    </div>
                ))}
            </div>

            {/* Off-screen copy used only to measure row heights for pagination */}
            <div className="wep-page wep-measure" ref={measureRef} aria-hidden="true">
                <div data-measure="header"><FormHeader /></div>
                <table className="wep-table wep-table-fixed">
                    {prevColGroup}
                    <thead data-measure="prev-thead">{prevTheadRows}</thead>
                    <tbody data-measure="prev-tbody">{prevRowIndexes.map(renderPrevRow)}</tbody>
                </table>
                <table className="wep-table wep-table-fixed">
                    {curColGroup}
                    <thead data-measure="cur-thead">{curTheadRows}</thead>
                    <tbody data-measure="cur-tbody">{curRowIndexes.map(renderCurRow)}</tbody>
                </table>
                <div data-measure="signature" style={{ display: 'flow-root' }}>{signatureBlock}</div>
                <div data-measure="footer"><FormFooter page={1} total={1} /></div>
            </div>
        </div>
    )
}
