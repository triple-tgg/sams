import React, { useRef, useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Printer, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useCertificateList } from '@/lib/api/qa/certificate.hooks'
import type { CertificateData } from '@/lib/api/qa/certificate'
import { formatDate } from '../types'

interface Props {
    isOpen: boolean
    onClose: () => void
    enrollmentIds: number[]
    instructorName?: string
}

export function CertificateAllModal({ isOpen, onClose, enrollmentIds, instructorName = '' }: Props) {
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const [iframeKey, setIframeKey] = useState(0)
    const [currentIndex, setCurrentIndex] = useState(0)

    // Fetch all certificates
    const { data: certResp, isLoading } = useCertificateList(enrollmentIds, isOpen)
    const certList: CertificateData[] = certResp?.responseData ?? []
    const currentCert = certList[currentIndex] ?? null

    const handlePrint = () => {
        if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.print()
        }
    }

    // Inject HTML template into iframe
    const injectTemplate = useCallback(async (iframe: HTMLIFrameElement) => {
        if (!currentCert) return

        try {
            const resp = await fetch('/FM-CM-055-Certificate-Template.html')
            let html = await resp.text()

            html = html.replace(/\{\{CertificateNo\}\}/g, currentCert.certificateNo || '—')
            html = html.replace(/\{\{FullName\}\}/g, currentCert.employeeName || '—')
            html = html.replace(/\{\{TrainingCourse\}\}/g, currentCert.courseName || '—')
            html = html.replace(/\{\{TrainingDate\}\}/g, currentCert.completedDate ? formatDate(currentCert.completedDate) : '—')
            html = html.replace(/\{\{InstructorName\}\}/g, currentCert.instructor || instructorName || '—')
            html = html.replace(/\{\{AccountableManagerName\}\}/g, '—')

            const doc = iframe.contentDocument || iframe.contentWindow?.document
            if (doc) {
                doc.open()
                doc.write(html)
                doc.close()
            }
        } catch (err) {
            console.error('Failed to load certificate template:', err)
        }
    }, [currentCert, instructorName])

    // Force iframe re-mount each time modal opens
    React.useEffect(() => {
        if (isOpen) {
            setIframeKey(k => k + 1)
            setCurrentIndex(0)
        }
    }, [isOpen])

    // Re-inject when currentIndex changes
    React.useEffect(() => {
        if (isOpen && currentCert) {
            setIframeKey(k => k + 1)
        }
    }, [currentIndex, currentCert])

    // Callback ref: called when iframe DOM node mounts
    const setIframeRef = useCallback((node: HTMLIFrameElement | null) => {
        iframeRef.current = node
        if (node && currentCert) {
            injectTemplate(node)
        }
    }, [currentCert, injectTemplate])

    const goPrev = () => setCurrentIndex(i => Math.max(0, i - 1))
    const goNext = () => setCurrentIndex(i => Math.min(certList.length - 1, i + 1))

    return (
        <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
            <DialogContent size="lg" className="max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-100/50 [&>button]:hidden">
                <DialogHeader className="p-4 bg-white border-b border-border flex flex-row items-center justify-between shrink-0">
                    <div className="flex flex-col">
                        <DialogTitle className="text-lg font-bold">Certificate Preview — All</DialogTitle>
                        {certList.length > 0 && (
                            <span className="text-xs text-muted-foreground mt-0.5">
                                {currentCert?.employeeName} ({currentIndex + 1} of {certList.length})
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {certList.length > 1 && (
                            <div className="flex items-center gap-1 mr-2">
                                <button
                                    onClick={goPrev}
                                    disabled={currentIndex === 0}
                                    className="p-1.5 rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={goNext}
                                    disabled={currentIndex >= certList.length - 1}
                                    className="p-1.5 rounded-lg border border-border bg-white text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        <button onClick={onClose} className="px-4 py-2 bg-white border border-border text-foreground rounded-lg text-sm font-semibold hover:bg-muted transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={handlePrint}
                            disabled={!currentCert || isLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Printer className="w-4 h-4" />
                            Print / Save as PDF
                        </button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-8 flex justify-center items-start">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <span className="text-sm">Loading certificates...</span>
                        </div>
                    ) : currentCert ? (
                        <iframe
                            key={iframeKey}
                            ref={setIframeRef}
                            title="Certificate Preview"
                            className="bg-white shadow-xl w-[297mm] min-h-[210mm] border-none"
                            style={{ aspectRatio: '297/210' }}
                        />
                    ) : (
                        <div className="text-center text-slate-500 py-20 w-full">
                            No certificate data available
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
