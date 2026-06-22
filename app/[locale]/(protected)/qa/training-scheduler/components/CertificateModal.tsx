import React, { useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'
import { formatDate } from '../types'

interface Staff {
    name: string
    code: string
    dept: string
}

interface Session {
    courseName: string
    courseCode: string
    dateStart: string
    dateEnd: string
    instructor: string
}

interface Props {
    isOpen: boolean
    onClose: () => void
    session: Session
    staffList: Staff[]
}

export function CertificateModal({ isOpen, onClose, session, staffList }: Props) {
    const printRef = useRef<HTMLDivElement>(null)

    const handlePrint = () => {
        window.print()
    }

    return (
        <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
            <DialogContent size="lg" className="max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-100/50 [&>button]:hidden">
                <DialogHeader className="p-4 bg-white border-b border-border flex flex-row items-center justify-between shrink-0">
                    <DialogTitle className="text-lg font-bold">Certificate Preview</DialogTitle>
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="px-4 py-2 bg-white border border-border text-foreground rounded-lg text-sm font-semibold hover:bg-muted transition-colors">
                            Cancel
                        </button>
                        <button onClick={handlePrint} disabled={staffList.length === 0} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            <Printer className="w-4 h-4" />
                            Print / Save as PDF
                        </button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-8 flex justify-center flex-col items-center gap-8 print-preview-container">
                    {staffList.map((staff, idx) => (
                        <div 
                            key={idx} 
                            className="bg-white shadow-xl printable-a4 w-[297mm] min-h-[210mm] relative p-12 shrink-0 flex flex-col justify-center items-center text-center"
                        >
                            {/* Decorative border */}
                            <div className="absolute inset-6 border-[16px] border-double border-slate-200 pointer-events-none" />
                            
                            <div className="z-10 w-full px-16 flex flex-col items-center justify-center h-full">
                                <h1 className="text-5xl font-serif font-bold text-slate-800 mb-4 uppercase tracking-widest">Certificate of Completion</h1>
                                <div className="w-40 h-1.5 bg-primary mb-12" />

                                <p className="text-xl text-slate-500 mb-6">This is to certify that</p>
                                <h2 className="text-5xl font-bold text-slate-900 mb-8 font-serif border-b border-slate-300 pb-2 px-12">{staff.name}</h2>
                                
                                <p className="text-xl text-slate-500 mb-6">has successfully completed the training course on</p>
                                <h3 className="text-4xl font-bold text-primary mb-10 leading-tight px-10">{session.courseName}</h3>
                                
                                <p className="text-lg text-slate-600 mb-16 font-medium">
                                    Conducted from {formatDate(session.dateStart)} to {formatDate(session.dateEnd)}
                                </p>

                                <div className="flex w-full justify-between px-16 mt-auto">
                                    <div className="flex flex-col items-center">
                                        <div className="w-64 h-px bg-slate-400 mb-3" />
                                        <p className="text-base font-bold text-slate-700 uppercase">{session.instructor}</p>
                                        <p className="text-sm text-slate-500">Course Instructor</p>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="w-64 h-px bg-slate-400 mb-3" />
                                        <p className="text-base font-bold text-slate-700 uppercase">Training Manager</p>
                                        <p className="text-sm text-slate-500">Quality Assurance</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {staffList.length === 0 && (
                        <div className="text-center text-slate-500 py-20 w-full">No staff selected for certificate</div>
                    )}
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
                        @page { size: landscape; margin: 0; }
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
