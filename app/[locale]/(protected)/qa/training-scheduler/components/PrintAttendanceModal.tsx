'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Printer, Loader2 } from 'lucide-react'
import { useAttendanceSheet } from '@/lib/api/qa/attendance-sheet.hooks'
import type { AttendanceSheetData, AttendanceSheetStaff } from '@/lib/api/qa/attendance-sheet'

/** Controlled-form reference printed in the footer of every sheet. */
const ATTENDANCE_FORM_REF = 'SAMS-FM-CM-026-Training Attendance Sheet-Rev.02-Date 06 FEB 2026'

const MIN_ROWS = 20

interface PrintModalProps {
    isOpen: boolean
    onClose: () => void
    scheduleId: number
    /** Session dates (YYYY-MM-DD). When the range spans several days, one sheet is printed per day. */
    dateStart?: string
    dateEnd?: string
    /** Session times (HH:mm), used to compute hours per day for each daily sheet. */
    timeStart?: string
    timeEnd?: string
}

interface DailySheet {
    dateLabel: string
    hoursLabel: string
}

const formatDay = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })

/** Parse "YYYY-MM-DD" as a UTC date so the day never shifts with the viewer's timezone. */
function parseIsoDay(value?: string): Date | null {
    const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (!match) return null
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
}

function hoursBetween(timeStart?: string, timeEnd?: string): number | null {
    if (!timeStart || !timeEnd) return null
    const [sh, sm] = timeStart.split(':').map(Number)
    const [eh, em] = timeEnd.split(':').map(Number)
    if ([sh, sm, eh, em].some(n => Number.isNaN(n))) return null
    return Math.max(0, Math.round(((eh + em / 60) - (sh + sm / 60)) * 100) / 100)
}

/** One entry per training day; falls back to a single sheet using the API's own date/hours. */
function buildDailySheets(data: AttendanceSheetData, props: PrintModalProps): DailySheet[] {
    const start = parseIsoDay(props.dateStart)
    const end = parseIsoDay(props.dateEnd) ?? start
    if (!start || !end || end.getTime() < start.getTime()) {
        return [{ dateLabel: data.trainingDate, hoursLabel: data.totalHours }]
    }

    const perDay = hoursBetween(props.timeStart, props.timeEnd)
    const sheets: DailySheet[] = []
    for (let t = start.getTime(); t <= end.getTime(); t += 86400000) {
        sheets.push({ dateLabel: formatDay(new Date(t)), hoursLabel: perDay !== null ? String(perDay) : data.totalHours })
    }
    // Single-day sessions keep the API's own total hours.
    if (sheets.length === 1) sheets[0].hoursLabel = data.totalHours || sheets[0].hoursLabel
    return sheets
}

const cell: React.CSSProperties = { border: '1px solid black' }
const headCell: React.CSSProperties = { border: '1px solid black', padding: '4px 3px', backgroundColor: '#dbeafe', fontWeight: 'bold' }
// Info fields use "ruled" lines: one dashed line under every text line (wrapped values get one per line).
const INFO_LINE_HEIGHT = 18
const RULED_DASH_TILE = `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='6' height='${INFO_LINE_HEIGHT}'><rect x='0' y='${INFO_LINE_HEIGHT - 1}' width='3' height='1' fill='rgba(0,0,0,0.45)'/></svg>`,
)}")`
const label: React.CSSProperties = { fontWeight: 'bold', whiteSpace: 'nowrap', lineHeight: `${INFO_LINE_HEIGHT}px` }
const value: React.CSSProperties = {
    lineHeight: `${INFO_LINE_HEIGHT}px`,
    minHeight: INFO_LINE_HEIGHT,
    alignSelf: 'start', // don't stretch to the row height, or short values would get extra lines
    padding: '0 6px',
    backgroundImage: RULED_DASH_TILE,
    backgroundSize: `6px ${INFO_LINE_HEIGHT}px`,
    backgroundRepeat: 'repeat',
}

function AttendanceSheetPage({ data, rows, sheet, dayIndex, totalDays }: {
    data: AttendanceSheetData
    rows: AttendanceSheetStaff[]
    sheet: DailySheet
    dayIndex: number
    totalDays: number
}) {
    return (
        <div
            className="sheet"
            style={{
                width: '210mm', height: '297mm', padding: '15mm', paddingBottom: '5mm', background: 'white', color: 'black',
                display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", flexShrink: 0,
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 0 }}>
                <div style={{ width: 140 }}>
                    <img src="/sams-logo-new.png" alt="SAMS Logo" style={{ width: 110, height: 'auto', objectFit: 'contain' }} />
                </div>
                <div style={{ textAlign: 'center', marginTop: 12 }}>
                    <h1 style={{ fontSize: 18, fontWeight: 'bold' }}>Training Attendance Sheet</h1>
                </div>
                <div style={{ width: 140 }}></div>
            </div>

            {/* Info Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto 1fr', gap: '6px 10px', marginBottom: 16, fontSize: 10 }}>
                <div style={label}>Course Name:</div>
                <div style={value}>{data.courseName}</div>
                <div style={{ ...label, marginLeft: 12 }}>Course Code:</div>
                <div style={value}>{data.courseCode}</div>

                <div style={label}>Course Objective:</div>
                <div style={{ ...value, gridColumn: 'span 3' }}>{data.courseObjective || ''}</div>

                <div style={label}>Date of Training:</div>
                <div style={value}>{sheet.dateLabel}</div>
                <div style={{ ...label, marginLeft: 12 }}>Time:</div>
                <div style={value}>{data.trainingTime}</div>

                <div style={label}>Training Venue:</div>
                <div style={value}>{data.venue}</div>
                <div style={{ ...label, marginLeft: 12 }}>Total hours:</div>
                <div style={value}>{sheet.hoursLabel}</div>

                <div style={label}>Instructor Name:</div>
                <div style={{ ...value, gridColumn: 'span 3' }}>{data.instructorName}</div>
            </div>

            {/* Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9, lineHeight: 1.25, textAlign: 'center', marginBottom: 20 }}>
                <thead>
                    <tr>
                        <th style={{ ...headCell, width: 36 }} rowSpan={2}>No.</th>
                        <th style={{ ...headCell, width: 80 }} rowSpan={2}>Function</th>
                        <th style={{ ...headCell, width: 70 }} rowSpan={2}>Staff ID</th>
                        <th style={headCell} rowSpan={2}>Name</th>
                        <th style={{ ...headCell, width: 100 }} rowSpan={2}>Position</th>
                        <th style={{ ...headCell, padding: 4 }} colSpan={2}>Signature</th>
                    </tr>
                    <tr>
                        <th style={{ ...headCell, padding: 4, width: 80 }}>Sign In</th>
                        <th style={{ ...headCell, padding: 4, width: 80 }}>Sign Out</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r, i) => (
                        <tr key={i} style={{ height: 26 }}>
                            <td style={{ ...cell, fontWeight: 500 }}>{i + 1}.</td>
                            <td style={cell}>{r.function}</td>
                            <td style={cell}>{r.staffId}</td>
                            <td style={{ ...cell, textAlign: 'left', padding: '0 6px' }}>{r.name}</td>
                            <td style={cell}>{r.position}</td>
                            <td style={cell}></td>
                            <td style={cell}></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Signatures — directly below the table */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 200px', columnGap: 16, rowGap: 16, alignItems: 'end', fontSize: 10 }}>
                    <span style={{ whiteSpace: 'nowrap' }}>Instructor Signature:</span>
                    <span style={{ borderBottom: '1px dashed rgba(0,0,0,0.6)', height: 22 }}></span>

                    <span style={{ whiteSpace: 'nowrap' }}>Instructor Name:</span>
                    <span style={{ borderBottom: '1px dashed rgba(0,0,0,0.6)', minHeight: 22, paddingBottom: 3, textAlign: 'center', overflowWrap: 'anywhere', lineHeight: 1.3 }}>
                        {data.instructorName}
                    </span>
                </div>
            </div>

            {/* Footer — pinned to the bottom of every sheet: form ref centered, page number right */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 12, fontSize: 10, marginTop: 'auto' }}>
                <span />
                <span style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>{ATTENDANCE_FORM_REF}</span>
                <span style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Page {dayIndex + 1} of {totalDays}</span>
            </div>
        </div>
    )
}

export function PrintAttendanceModal(props: PrintModalProps) {
    const { isOpen, onClose, scheduleId } = props
    const { data: sheetData, isLoading } = useAttendanceSheet(scheduleId, isOpen)
    const printContentRef = React.useRef<HTMLDivElement>(null)

    const handlePrint = () => {
        if (!printContentRef.current) return

        const content = printContentRef.current.innerHTML

        // Create a hidden iframe for isolated printing
        const iframe = document.createElement('iframe')
        iframe.style.position = 'fixed'
        iframe.style.top = '-10000px'
        iframe.style.left = '-10000px'
        iframe.style.width = '210mm'
        iframe.style.height = '297mm'
        document.body.appendChild(iframe)

        const doc = iframe.contentDocument || iframe.contentWindow?.document
        if (!doc) return

        doc.open()
        doc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <title>Training Attendance Sheet</title>
                <style>
                    @page { size: A4 portrait; margin: 0; }
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        background: white;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    /* One A4 page per daily sheet; the sheet fills the page so the footer sits at the bottom */
                    .sheet {
                        box-shadow: none !important;
                        margin: 0 !important;
                        overflow: hidden;
                        break-after: page;
                        page-break-after: always;
                    }
                    .sheet:last-child { break-after: auto; page-break-after: auto; }
                </style>
            </head>
            <body>${content}</body>
            </html>
        `)
        doc.close()

        // Wait for content to render, then print
        iframe.onload = () => {
            setTimeout(() => {
                iframe.contentWindow?.print()
                // Remove iframe after printing
                setTimeout(() => document.body.removeChild(iframe), 1000)
            }, 300)
        }
    }

    // Pad the rows to a minimum count
    const staffList: AttendanceSheetStaff[] = sheetData?.staffList ?? []
    const rows = [...staffList]
    while (rows.length < MIN_ROWS) {
        rows.push({ no: rows.length + 1, function: '', staffId: '', name: '', position: '' })
    }

    const dailySheets = sheetData ? buildDailySheets(sheetData, props) : []

    return (
        <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
            <DialogContent size="full" className="flex flex-col gap-0 p-0 overflow-hidden sm:rounded-none bg-slate-100 [&>button]:hidden">
                <DialogHeader className="p-4 bg-white border-b border-border flex flex-row items-center justify-between shrink-0">
                    <DialogTitle className="text-lg font-bold">
                        Print Preview
                        {dailySheets.length > 1 && (
                            <span className="ml-2 text-sm font-medium text-muted-foreground">
                                ({dailySheets.length} sheets — one per training day)
                            </span>
                        )}
                    </DialogTitle>
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="px-4 py-2 bg-white border border-border text-foreground rounded-lg text-sm font-semibold hover:bg-muted transition-colors">
                            Cancel
                        </button>
                        <button onClick={handlePrint} disabled={isLoading || !sheetData} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
                            <Printer className="w-4 h-4" />
                            Print Document
                        </button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-8 flex justify-center print-preview-container">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Loader2 className="w-8 h-8 text-muted-foreground/40 animate-spin mb-3" />
                            <p className="text-sm text-muted-foreground">Loading attendance data...</p>
                        </div>
                    ) : sheetData ? (
                        /* A4 sheets — ref used by handlePrint to extract innerHTML */
                        <div ref={printContentRef} className="flex flex-col items-center gap-8">
                            {dailySheets.map((sheet, i) => (
                                <AttendanceSheetPage
                                    key={i}
                                    data={sheetData}
                                    rows={rows}
                                    sheet={sheet}
                                    dayIndex={i}
                                    totalDays={dailySheets.length}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <p className="text-sm text-muted-foreground">No attendance data available.</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
