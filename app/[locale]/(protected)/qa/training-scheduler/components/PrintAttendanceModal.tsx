'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Printer, Loader2 } from 'lucide-react'
import { useAttendanceSheet } from '@/lib/api/qa/attendance-sheet.hooks'
import type { AttendanceSheetStaff } from '@/lib/api/qa/attendance-sheet'

interface PrintModalProps {
    isOpen: boolean
    onClose: () => void
    scheduleId: number
}

export function PrintAttendanceModal({ isOpen, onClose, scheduleId }: PrintModalProps) {
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
                    @page {
                        size: A4 portrait;
                        margin: 10mm;
                    }
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        color: black;
                        background: white;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid black; padding: 4px 6px; font-size: 11px; }
                    th { background-color: #dbeafe !important; font-weight: bold; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
                    .header img { width: 70px; height: auto; }
                    .header h1 { font-size: 18px; font-weight: bold; margin-top: 12px; }
                    .info-grid { display: grid; grid-template-columns: auto 1fr auto 1fr; gap: 8px 12px; margin-bottom: 20px; font-size: 12px; }
                    .info-label { font-weight: bold; white-space: nowrap; padding-top: 3px; }
                    .info-value { border-bottom: 1px dashed rgba(0,0,0,0.4); padding: 0 6px 3px; }
                    .col-span-3 { grid-column: span 3; }
                    .ml-4 { margin-left: 12px; }
                    .signatures { display: flex; justify-content: flex-end; padding-right: 30px; margin-top: auto; padding-top: 40px; padding-bottom: 30px; }
                    .sig-block { width: 220px; }
                    .sig-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 14px; font-size: 12px; }
                    .sig-line { width: 120px; border-bottom: 1px dashed rgba(0,0,0,0.4); display: inline-block; height: 14px; text-align: center; }
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

    // Pad the rows to minimum 20
    const staffList: AttendanceSheetStaff[] = sheetData?.staffList ?? []
    const rows = [...staffList]
    while (rows.length < 20) {
        rows.push({ no: rows.length + 1, function: '', staffId: '', name: '', position: '' })
    }

    return (
        <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
            <DialogContent size="lg" className="max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-100/50 [&>button]:hidden">
                <DialogHeader className="p-4 bg-white border-b border-border flex flex-row items-center justify-between shrink-0">
                    <DialogTitle className="text-lg font-bold">Print Preview</DialogTitle>
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
                        /* A4 Sheet — ref used by handlePrint to extract innerHTML */
                        <div ref={printContentRef} className="bg-white shadow-xl printable-a4 w-[210mm] min-h-[297mm] p-[15mm] mx-auto text-black font-sans shrink-0 relative flex flex-col">
                            {/* Header */}
                            <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                                <div style={{ width: 120 }}>
                                    <img
                                        src="/images/logo/logo.png"
                                        alt="SAMS Logo"
                                        style={{ width: 70, height: 'auto', objectFit: 'contain' }}
                                    />
                                </div>
                                <h1 style={{ fontSize: 18, fontWeight: 'bold', marginTop: 12 }}>Training Attendance Sheet</h1>
                                <div style={{ width: 120 }}></div>
                            </div>

                            {/* Info Fields */}
                            <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto 1fr', gap: '8px 12px', marginBottom: 20, fontSize: 12 }}>
                                <div className="info-label" style={{ fontWeight: 'bold', whiteSpace: 'nowrap', paddingTop: 3 }}>Course Name:</div>
                                <div className="info-value" style={{ borderBottom: '1px dashed rgba(0,0,0,0.4)', padding: '0 6px 3px' }}>{sheetData.courseName}</div>
                                <div className="info-label ml-4" style={{ fontWeight: 'bold', whiteSpace: 'nowrap', paddingTop: 3, marginLeft: 12 }}>Course Code:</div>
                                <div className="info-value" style={{ borderBottom: '1px dashed rgba(0,0,0,0.4)', padding: '0 6px 3px' }}>{sheetData.courseCode}</div>

                                <div className="info-label" style={{ fontWeight: 'bold', whiteSpace: 'nowrap', paddingTop: 3 }}>Course Objective:</div>
                                <div className="info-value col-span-3" style={{ borderBottom: '1px dashed rgba(0,0,0,0.4)', padding: '0 6px 3px', gridColumn: 'span 3' }}>{sheetData.courseObjective || ''}</div>

                                <div className="info-label" style={{ fontWeight: 'bold', whiteSpace: 'nowrap', paddingTop: 3 }}>Date of Training:</div>
                                <div className="info-value" style={{ borderBottom: '1px dashed rgba(0,0,0,0.4)', padding: '0 6px 3px' }}>{sheetData.trainingDate}</div>
                                <div className="info-label ml-4" style={{ fontWeight: 'bold', whiteSpace: 'nowrap', paddingTop: 3, marginLeft: 12 }}>Time:</div>
                                <div className="info-value" style={{ borderBottom: '1px dashed rgba(0,0,0,0.4)', padding: '0 6px 3px' }}>{sheetData.trainingTime}</div>

                                <div className="info-label" style={{ fontWeight: 'bold', whiteSpace: 'nowrap', paddingTop: 3 }}>Training Venue:</div>
                                <div className="info-value" style={{ borderBottom: '1px dashed rgba(0,0,0,0.4)', padding: '0 6px 3px' }}>{sheetData.venue}</div>
                                <div className="info-label ml-4" style={{ fontWeight: 'bold', whiteSpace: 'nowrap', paddingTop: 3, marginLeft: 12 }}>Total hours:</div>
                                <div className="info-value" style={{ borderBottom: '1px dashed rgba(0,0,0,0.4)', padding: '0 6px 3px' }}>{sheetData.totalHours}</div>

                                <div className="info-label" style={{ fontWeight: 'bold', whiteSpace: 'nowrap', paddingTop: 3 }}>Instructor Name:</div>
                                <div className="info-value col-span-3" style={{ borderBottom: '1px dashed rgba(0,0,0,0.4)', padding: '0 6px 3px', gridColumn: 'span 3' }}>{sheetData.instructorName}</div>
                            </div>

                            {/* Table */}
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, textAlign: 'center', marginBottom: 30 }}>
                                <thead>
                                    <tr>
                                        <th style={{ border: '1px solid black', padding: '6px 4px', backgroundColor: '#dbeafe', fontWeight: 'bold', width: 36 }} rowSpan={2}>No.</th>
                                        <th style={{ border: '1px solid black', padding: '6px 4px', backgroundColor: '#dbeafe', fontWeight: 'bold', width: 80 }} rowSpan={2}>Function</th>
                                        <th style={{ border: '1px solid black', padding: '6px 4px', backgroundColor: '#dbeafe', fontWeight: 'bold', width: 70 }} rowSpan={2}>Staff ID</th>
                                        <th style={{ border: '1px solid black', padding: '6px 4px', backgroundColor: '#dbeafe', fontWeight: 'bold' }} rowSpan={2}>Name</th>
                                        <th style={{ border: '1px solid black', padding: '6px 4px', backgroundColor: '#dbeafe', fontWeight: 'bold', width: 100 }} rowSpan={2}>Position</th>
                                        <th style={{ border: '1px solid black', padding: '4px', backgroundColor: '#dbeafe', fontWeight: 'bold' }} colSpan={2}>Signature</th>
                                    </tr>
                                    <tr>
                                        <th style={{ border: '1px solid black', padding: '4px', backgroundColor: '#dbeafe', fontWeight: 'bold', width: 80 }}>Sign In</th>
                                        <th style={{ border: '1px solid black', padding: '4px', backgroundColor: '#dbeafe', fontWeight: 'bold', width: 80 }}>Sign Out</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((r, i) => (
                                        <tr key={i} style={{ height: 26 }}>
                                            <td style={{ border: '1px solid black', fontWeight: 500 }}>{i + 1}.</td>
                                            <td style={{ border: '1px solid black' }}>{r.function}</td>
                                            <td style={{ border: '1px solid black' }}>{r.staffId}</td>
                                            <td style={{ border: '1px solid black', textAlign: 'left', padding: '0 6px' }}>{r.name}</td>
                                            <td style={{ border: '1px solid black' }}>{r.position}</td>
                                            <td style={{ border: '1px solid black' }}></td>
                                            <td style={{ border: '1px solid black' }}></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Signatures */}
                            <div className="signatures" style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: 30, marginTop: 'auto', paddingBottom: 30 }}>
                                <div className="sig-block" style={{ width: 220 }}>
                                    <div className="sig-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14, fontSize: 12 }}>
                                        <span>Instructor Signature:</span>
                                        <span className="sig-line" style={{ width: 120, borderBottom: '1px dashed rgba(0,0,0,0.4)', display: 'inline-block', height: 14 }}></span>
                                    </div>
                                    <div className="sig-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14, fontSize: 12 }}>
                                        <span>Instructor Name:</span>
                                        <span className="sig-line" style={{ width: 120, borderBottom: '1px dashed rgba(0,0,0,0.4)', display: 'inline-block', height: 14, textAlign: 'center' }}>{sheetData.instructorName}</span>
                                    </div>
                                </div>
                            </div>
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
