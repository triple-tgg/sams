'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Printer } from 'lucide-react'
import { Session, formatDate, sessionDays } from '../types'

interface PrintModalProps {
    isOpen: boolean
    onClose: () => void
    session: Session
    enrolledStaff: any[]
}

export function PrintAttendanceModal({ isOpen, onClose, session, enrolledStaff }: PrintModalProps) {
    const handlePrint = () => {
        window.print()
    }

    // Pad the rows to 20
    const rows = [...enrolledStaff]
    while (rows.length < 20) {
        rows.push({ id: `empty-${rows.length}`, name: '', code: '', license: '', dept: '' })
    }

    const days = sessionDays(session)
    const dateStr = formatDate(session.dateStart) + (days > 1 ? ` – ${formatDate(session.dateEnd)}` : '')

    return (
        <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
            <DialogContent size="lg" className="max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-100/50 [&>button]:hidden">
                <DialogHeader className="p-4 bg-white border-b border-border flex flex-row items-center justify-between shrink-0">
                    <DialogTitle className="text-lg font-bold">Print Preview</DialogTitle>
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="px-4 py-2 bg-white border border-border text-foreground rounded-lg text-sm font-semibold hover:bg-muted transition-colors">
                            Cancel
                        </button>
                        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
                            <Printer className="w-4 h-4" />
                            Print Document
                        </button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-8 flex justify-center print-preview-container">
                    {/* A4 Sheet */}
                    <div className="bg-white shadow-xl printable-a4 w-[210mm] min-h-[297mm] p-[15mm] mx-auto text-black font-sans shrink-0 relative flex flex-col">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-32">
                                <img
                                    src="/images/logo/logo.png"
                                    alt="SAMS Logo"
                                    className="w-20 h-auto object-contain"
                                />
                            </div>
                            <h1 className="text-xl font-bold mt-4">Training Attendance Sheet</h1>
                            <div className="w-32"></div> {/* Spacer for centering */}
                        </div>

                        {/* Info Fields */}
                        <div className="grid grid-cols-[auto_1fr_auto_1fr] gap-x-4 gap-y-3 mb-6 text-[13px]">
                            <div className="font-bold whitespace-nowrap pt-1">Course Name:</div>
                            <div className="border-b border-dashed border-black/50 pb-1 px-2">{session.courseName}</div>
                            <div className="font-bold whitespace-nowrap pt-1 ml-4">Course Code:</div>
                            <div className="border-b border-dashed border-black/50 pb-1 px-2">{session.courseCode}</div>

                            <div className="font-bold whitespace-nowrap pt-1">Course Objective:</div>
                            <div className="border-b border-dashed border-black/50 pb-1 px-2 col-span-3">{session.objective || ''}</div>

                            <div className="font-bold whitespace-nowrap pt-1">Date of Training:</div>
                            <div className="border-b border-dashed border-black/50 pb-1 px-2">{dateStr}</div>
                            <div className="font-bold whitespace-nowrap pt-1 ml-4">Time:</div>
                            <div className="border-b border-dashed border-black/50 pb-1 px-2">{session.timeStart} – {session.timeEnd}</div>

                            <div className="font-bold whitespace-nowrap pt-1">Training Venue:</div>
                            <div className="border-b border-dashed border-black/50 pb-1 px-2">{session.venue}</div>
                            <div className="font-bold whitespace-nowrap pt-1 ml-4">Total hours:</div>
                            <div className="border-b border-dashed border-black/50 pb-1 px-2"></div>

                            <div className="font-bold whitespace-nowrap pt-1">Instructor Name:</div>
                            <div className="border-b border-dashed border-black/50 pb-1 px-2 col-span-3">{session.instructor}</div>
                        </div>

                        {/* Table */}
                        <table className="w-full border-collapse border border-black text-[12px] text-center mb-12">
                            <thead>
                                <tr className="bg-blue-100/30">
                                    <th className="border border-black py-2 w-10 font-bold" rowSpan={2}>No.</th>
                                    <th className="border border-black py-2 w-20 font-bold" rowSpan={2}>Function</th>
                                    <th className="border border-black py-2 w-20 font-bold" rowSpan={2}>Staff ID</th>
                                    <th className="border border-black py-2 font-bold" rowSpan={2}>Name</th>
                                    <th className="border border-black py-2 w-32 font-bold" rowSpan={2}>Position</th>
                                    <th className="border border-black py-1 font-bold" colSpan={2}>Signature</th>
                                </tr>
                                <tr className="bg-blue-100/30">
                                    <th className="border border-black py-1 w-24 font-bold">Sign In</th>
                                    <th className="border border-black py-1 w-24 font-bold">Sign Out</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r, i) => (
                                    <tr key={i} className="h-7">
                                        <td className="border border-black font-medium">{i + 1}.</td>
                                        <td className="border border-black">{r.license}</td>
                                        <td className="border border-black">{r.code}</td>
                                        <td className="border border-black text-left px-2 truncate max-w-[150px]">{r.name}</td>
                                        <td className="border border-black truncate max-w-[120px]">{r.dept}</td>
                                        <td className="border border-black"></td>
                                        <td className="border border-black"></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Signatures */}
                        <div className="flex justify-end pr-8 mt-auto mb-8">
                            <div className="w-64 space-y-4 text-[13px]">
                                <div className="flex justify-between items-end">
                                    <span>Instructor Signature:</span>
                                    <span className="w-32 border-b border-dashed border-black/50 inline-block h-4"></span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span>Instructor Name:</span>
                                    <span className="w-32 border-b border-dashed border-black/50 inline-block h-4 text-center">{session.instructor}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    @media print {
                        body > :not(div[role="dialog"]) {
                            display: none !important;
                        }
                        div[role="dialog"] {
                            position: static !important;
                            box-shadow: none !important;
                            background: white !important;
                        }
                        .print-preview-container {
                            padding: 0 !important;
                            overflow: visible !important;
                        }
                        .printable-a4 {
                            box-shadow: none !important;
                            margin: 0 !important;
                            width: 100% !important;
                            height: 100% !important;
                            page-break-after: always;
                        }
                        .fixed {
                            position: static !important;
                        }
                        button, .hidden-print {
                            display: none !important;
                        }
                    }
                `}} />
            </DialogContent>
        </Dialog>
    )
}
