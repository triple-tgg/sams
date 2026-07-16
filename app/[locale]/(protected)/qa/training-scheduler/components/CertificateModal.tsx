import React, { useRef, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Printer, Loader2 } from 'lucide-react'
import { useCertificate } from '@/lib/api/qa/certificate.hooks'
import { formatDate } from '../types'

interface Props {
    isOpen: boolean
    onClose: () => void
    enrollmentId: number | null
    instructorName?: string
}

export function CertificateModal({ isOpen, onClose, enrollmentId, instructorName = '' }: Props) {
    const iframeRef = useRef<HTMLIFrameElement>(null)

    // Fetch certificate data from API
    const { data: certResp, isLoading } = useCertificate(isOpen ? enrollmentId : null)
    const certData = certResp?.responseData?.[0] ?? null

    // Build the HTML with placeholders replaced
    const certificateHtml = useMemo(() => {
        if (!certData) return null

        // We'll fetch the template synchronously via fetch in an effect,
        // but for SSR-safety we build it here with the known structure
        return null // placeholder — actual HTML built in iframe load
    }, [certData])

    const handlePrint = () => {
        if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.print()
        }
    }

    // Load and inject the template into the iframe
    const handleIframeLoad = async () => {
        if (!certData || !iframeRef.current) return

        try {
            const resp = await fetch('/FM-CM-055-Certificate-Template.html')
            let html = await resp.text()

            // Replace placeholders with real data
            html = html.replace(/\{\{CertificateNo\}\}/g, certData.certificateNo || '—')
            html = html.replace(/\{\{FullName\}\}/g, certData.employeeName || '—')
            html = html.replace(/\{\{TrainingCourse\}\}/g, certData.courseName || '—')
            html = html.replace(/\{\{TrainingDate\}\}/g, certData.completedDate ? formatDate(certData.completedDate) : '—')
            html = html.replace(/\{\{InstructorName\}\}/g, instructorName || '—')
            html = html.replace(/\{\{AccountableManagerName\}\}/g, '—')

            const iframe = iframeRef.current
            const doc = iframe.contentDocument || iframe.contentWindow?.document
            if (doc) {
                doc.open()
                doc.write(html)
                doc.close()
            }
        } catch (err) {
            console.error('Failed to load certificate template:', err)
        }
    }

    // Trigger template load when data is ready
    React.useEffect(() => {
        if (isOpen && certData && iframeRef.current) {
            handleIframeLoad()
        }
    }, [isOpen, certData])

    return (
        <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
            <DialogContent size="lg" className="max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-100/50 [&>button]:hidden">
                <DialogHeader className="p-4 bg-white border-b border-border flex flex-row items-center justify-between shrink-0">
                    <DialogTitle className="text-lg font-bold">Certificate Preview</DialogTitle>
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="px-4 py-2 bg-white border border-border text-foreground rounded-lg text-sm font-semibold hover:bg-muted transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={handlePrint}
                            disabled={!certData || isLoading}
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
                            <span className="text-sm">Loading certificate data...</span>
                        </div>
                    ) : certData ? (
                        <iframe
                            ref={iframeRef}
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
                        button, .hidden-print {
                            display: none !important;
                        }
                    }
                `}} />
            </DialogContent>
        </Dialog>
    )
}
