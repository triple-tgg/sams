'use client'

import { Loader2, Printer, X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { useAllLogbookRecords } from '@/lib/api/qa/logbook-records.hooks'
import type { LogbookRecordItem } from '@/lib/api/qa/logbook-records'
import { MENU } from '@/lib/permission-codes'
import { useMenuPermission } from '@/hooks/use-menu-permission'
import './maintenance-logbook-preview.css'

/* eslint-disable @next/next/no-img-element */

const FORM_CODE = 'SAMS-FM-CM-041-Maintenance Experiences Logbook Record-Rev.03-Date 05 AUG 2025'

/** Rows that fit on an A4 landscape page, and the most the last page can hold with the totals and signature block. */
const ROWS_PER_PAGE = 24
const ROWS_ON_SIGNATURE_PAGE = 16

const COLUMNS: { key: string; label: string; width: string; cell: (r: LogbookRecordItem) => React.ReactNode; align?: 'left' }[] = [
    { key: 'name', label: 'NAME - SURENAME', width: '7.5%', cell: (r) => r.nameSurname?.toUpperCase(), align: 'left' },
    { key: 'emp', label: 'EMPLOYEE ID', width: '5%', cell: (r) => r.employeeId },
    { key: 'cat', label: 'LICENSE CATEGORY', width: '5%', cell: (r) => r.licenseCategory },
    { key: 'date', label: 'DATE TO PERFORM TASK', width: '6%', cell: (r) => r.dateToPerformTask },
    { key: 'loc', label: 'LOCATION', width: '4.5%', cell: (r) => r.location },
    { key: 'type', label: 'AIRCRAFT TYPE', width: '10%', cell: (r) => r.aircraftType || combinationLabel(r), align: 'left' },
    { key: 'reg', label: 'AIRCRAFT REGISTRATION', width: '6%', cell: (r) => r.aircraftRegistration },
    { key: 'priv', label: 'PRIVILEGED USED', width: '5%', cell: (r) => r.privilegedUsed },
    { key: 'ata', label: 'ATA Chapter', width: '5%', cell: (r) => r.ataChapter },
    { key: 'rating', label: 'TYPE OF MAINTENANCE (RATING)', width: '6%', cell: (r) => r.typeOfMaintenanceRating },
    { key: 'task', label: 'TYPE OF TASK', width: '10%', cell: (r) => r.typeOfTask },
    { key: 'activity', label: 'TYPE OF ACTIVITY', width: '5%', cell: (r) => r.typeOfActivity },
    { key: 'ref', label: 'MAINTENANCE REFERENCES', width: '7.5%', cell: (r) => r.maintenanceReferences },
    {
        key: 'file', label: 'FILE ATTACHMENT FOR MAINTENANCE REFERENCE', width: '9%', align: 'left',
        cell: (r) => r.fileAttachmentUrl
            ? <a href={r.fileAttachmentUrl} target="_blank" rel="noopener noreferrer" className="lbp-link">{r.fileAttachmentUrl}</a>
            : null,
    },
    { key: 'dur', label: 'PERFORMED DURATION', width: '4.5%', cell: (r) => r.performedDuration },
    { key: 'stamp', label: 'AUTHORIZED STAMP NO.', width: '4.5%', cell: (r) => r.authorizedStampNo },
]

function combinationLabel(r: LogbookRecordItem) {
    const c = r.aircraftEngineCombinationObj
    if (!c) return ''
    const model = [c.familyCode, c.series].filter(Boolean).join('-')
    return c.engineCode ? `${model} (${c.engineCode})` : model
}

/** Split rows into A4 pages; the last page keeps room for the totals and signature block. */
function paginate(records: LogbookRecordItem[]): LogbookRecordItem[][] {
    const pages: LogbookRecordItem[][] = []
    for (let i = 0; i < records.length; i += ROWS_PER_PAGE) pages.push(records.slice(i, i + ROWS_PER_PAGE))
    if (pages.length === 0 || pages[pages.length - 1].length > ROWS_ON_SIGNATURE_PAGE) pages.push([])
    return pages
}

async function waitForPrintableAssets(container: HTMLElement) {
    if (document.fonts?.ready) await document.fonts.ready
    const images = Array.from(container.querySelectorAll('img'))
    await Promise.all(images.map((image) => image.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            image.addEventListener('load', () => resolve(), { once: true })
            image.addEventListener('error', () => resolve(), { once: true })
        })))
}

interface MaintenanceLogbookPreviewProps {
    isOpen: boolean
    onClose: () => void
    staffId: number
}

/** QA Document › Staff Records › Work Experience: SAMS-FM-CM-041 Maintenance Experiences Logbook Records (A4 landscape). */
export function MaintenanceLogbookPreview({ isOpen, onClose, staffId }: MaintenanceLogbookPreviewProps) {
    const perm = useMenuPermission(MENU.QA_DOC_WORK_EXPERIENCE)
    const pagesRef = useRef<HTMLDivElement>(null)
    const [isPrinting, setIsPrinting] = useState(false)

    // Date range (body of POST /staffs/maintenance-experiences/logbook-records/list); blank = no limit
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    const { data: records = [], isLoading, isError, error, isFetching } = useAllLogbookRecords(
        {
            staffId,
            startDate: startDate || null,
            endDate: endDate || null,
            similarTechnology: null,
        },
        isOpen && staffId > 0
    )

    const pages = useMemo(() => paginate(records), [records])

    if (!isOpen) return null

    const isReady = !isLoading && !isError
    const dateRangeInvalid = !!startDate && !!endDate && startDate > endDate

    const handlePrint = async () => {
        const container = pagesRef.current
        if (!container || !isReady) return toast.error('Preview data is not ready to print')
        setIsPrinting(true)
        try {
            await waitForPrintableAssets(container)
            window.print()
        } catch (printError) {
            console.error('Failed to prepare logbook records for printing:', printError)
            toast.error('Failed to prepare document for printing')
        } finally {
            setIsPrinting(false)
        }
    }

    return createPortal(
        <div className="lbp-overlay">
            <div className="lbp-toolbar">
                <span className="lbp-toolbar-title">Maintenance Experiences Logbook Records (Preview)</span>
                <div className="lbp-toolbar-filters">
                    <label>
                        From
                        <input type="date" value={startDate} max={endDate || undefined} onChange={(e) => setStartDate(e.target.value)} />
                    </label>
                    <label>
                        To
                        <input type="date" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} />
                    </label>
                    {(startDate || endDate) && (
                        <button type="button" className="lbp-link-btn" onClick={() => { setStartDate(''); setEndDate('') }}>
                            Clear
                        </button>
                    )}
                    {isFetching && !isLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-300" />}
                </div>
                <div className="lbp-toolbar-actions">
                    {perm.canExport && (
                        <button className="lbp-btn lbp-btn-primary" onClick={handlePrint} disabled={!isReady || isPrinting}>
                            {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                            {isPrinting ? 'Preparing...' : 'Print'}
                        </button>
                    )}
                    <button className="lbp-btn lbp-btn-close" onClick={onClose} aria-label="Close preview">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {dateRangeInvalid ? (
                <div className="lbp-status lbp-status-error"><span>The start date must not be after the end date</span></div>
            ) : isLoading ? (
                <div className="lbp-status">
                    <Loader2 className="h-7 w-7 animate-spin" />
                    <span>Loading logbook records...</span>
                </div>
            ) : isError ? (
                <div className="lbp-status lbp-status-error">
                    <span>Unable to load logbook records</span>
                    <small>{error instanceof Error ? error.message : 'Logbook records are unavailable'}</small>
                </div>
            ) : (
                <div ref={pagesRef} className="lbp-pages">
                    {pages.map((rows, pageIndex) => {
                        const isLast = pageIndex === pages.length - 1
                        return (
                            <div key={pageIndex} className="lbp-page">
                                <div className="lbp-header">
                                    <img src="/sams-logo-new.png" alt="SAMS" className="lbp-logo" />
                                    <h1 className="lbp-title">MAINTENANCE EXPERIENCES LOGBOOK RECORDS</h1>
                                </div>

                                {(rows.length > 0 || records.length === 0) && (
                                    <table className="lbp-table">
                                        <colgroup>
                                            {COLUMNS.map((c) => <col key={c.key} style={{ width: c.width }} />)}
                                        </colgroup>
                                        <thead>
                                            <tr>{COLUMNS.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
                                        </thead>
                                        <tbody>
                                            {rows.length > 0 ? rows.map((r, i) => (
                                                <tr key={`${r.id}-${pageIndex}-${i}`}>
                                                    {COLUMNS.map((c) => (
                                                        <td key={c.key} className={c.align === 'left' ? 'lbp-left' : undefined}>
                                                            <div className="lbp-cell">{c.cell(r) || ''}</div>
                                                        </td>
                                                    ))}
                                                </tr>
                                            )) : (
                                                <tr><td colSpan={COLUMNS.length} className="lbp-empty">No logbook records found</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}

                                {isLast && (
                                    <div className="lbp-summary">
                                        <div className="lbp-total">
                                            <span>Total Task</span>
                                            <span>{records.length}</span>
                                        </div>
                                        <div className="lbp-verify">
                                            <div className="lbp-sign-space" />
                                            <div className="lbp-verify-row"><span>VERIFIED BY:</span><span className="lbp-line" /></div>
                                            <div className="lbp-verify-row"><span>POSITION:</span><span className="lbp-line lbp-line-value">Compliance Monitoring Manager</span></div>
                                            <div className="lbp-verify-row"><span>DATE:</span><span className="lbp-line" /></div>
                                        </div>
                                    </div>
                                )}

                                <div className="lbp-footer">
                                    <span />
                                    <span>{FORM_CODE}</span>
                                    <span>Page {pageIndex + 1} of {pages.length}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    , document.body)
}
