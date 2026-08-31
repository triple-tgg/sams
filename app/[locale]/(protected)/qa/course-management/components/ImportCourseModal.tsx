'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, ArrowLeft, Loader2, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { upsertCourse, getCourseCategories, getCourseDepartmentSubList } from '@/lib/api/qa/course'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useReduxAuth } from '@/lib/api/hooks/useReduxAuth'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

// ── Types ──

interface ParsedCourseRow {
  rowIndex: number
  courseCode: string
  courseName: string
  courseObjective: string
  courseDuration: string
  courseSyllabus: string
  courseCategory: string
  courseType: string
  recurrenceIntervalYears: number | null
  additionalNote: string
  // Validation
  errors: string[]
  isValid: boolean
}

interface ImportResult {
  row: ParsedCourseRow
  success: boolean
  error?: string
}

type Step = 'upload' | 'preview' | 'importing' | 'result'

// ── Helpers ──

/** Detect if course is Recurrent from name or explicit field */
function detectCourseType(row: ParsedCourseRow): 'Recurrence' | 'Initial' {
  if (row.courseType?.toLowerCase().includes('recur')) return 'Recurrence'
  if (row.courseName?.toLowerCase().includes('recurrent')) return 'Recurrence'
  return 'Initial'
}

/** Parse Excel file into structured rows */
function parseExcelFile(file: File): Promise<ParsedCourseRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' })

        const rows: ParsedCourseRow[] = jsonData.map((row, idx) => {
          const courseCode = String(row['courseCode'] || '').trim()
          const courseName = String(row['courseName'] || '').trim()
          const courseObjective = String(row['courseObjective'] || '').trim()
          const courseDuration = String(row['Course Duration'] || '').trim()
          const courseSyllabus = String(row['Course Syllabus'] || '').trim()
          const courseCategory = String(row['courseCategory'] || '').trim()
          const courseType = String(row['courseType'] || '').trim()
          const recurrenceRaw = row['recurrenceIntervalYears']
          const recurrenceIntervalYears = recurrenceRaw ? Number(recurrenceRaw) : null
          const additionalNote = String(row['additionalNote'] || '').trim()

          const errors: string[] = []
          if (!courseCode) errors.push('Missing courseCode')
          if (!courseName) errors.push('Missing courseName')

          return {
            rowIndex: idx + 2, // +2: 1-indexed + header row
            courseCode,
            courseName,
            courseObjective,
            courseDuration,
            courseSyllabus,
            courseCategory,
            courseType,
            recurrenceIntervalYears,
            additionalNote,
            errors,
            isValid: errors.length === 0,
          }
        })

        // Filter out completely empty rows
        const nonEmpty = rows.filter(r => r.courseCode || r.courseName)
        resolve(nonEmpty)
      } catch (err) {
        reject(new Error('Failed to parse Excel file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

// ── Component ──

interface ImportCourseModalProps {
  onClose: () => void
}

export function ImportCourseModal({ onClose }: ImportCourseModalProps) {
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [rows, setRows] = useState<ParsedCourseRow[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Import state
  const [importProgress, setImportProgress] = useState(0)
  const [importResults, setImportResults] = useState<ImportResult[]>([])
  const [isImporting, setIsImporting] = useState(false)

  const { user } = useReduxAuth()
  const queryClient = useQueryClient()

  // Fetch categories for mapping
  const { data: categoryListResp } = useQuery({
    queryKey: ['course-categories'],
    queryFn: getCourseCategories,
  })
  const apiCategories = useMemo(() => categoryListResp?.responseData || [], [categoryListResp])

  // Fetch department sub list for requirements
  const { data: deptSubListResp } = useQuery({
    queryKey: ['course-department-sub-list'],
    queryFn: getCourseDepartmentSubList,
  })
  const apiRoles = useMemo(() => deptSubListResp?.responseData || [], [deptSubListResp])

  const validRows = useMemo(() => rows.filter(r => r.isValid), [rows])
  const invalidRows = useMemo(() => rows.filter(r => !r.isValid), [rows])

  // ── Handlers ──

  const handleFile = useCallback(async (f: File) => {
    const isExcel = f.name.match(/\.(xlsx|xls)$/i)
    if (!isExcel) {
      setParseError('Please upload an Excel file (.xlsx or .xls)')
      return
    }

    setFile(f)
    setParseError(null)
    setIsParsing(true)

    try {
      const parsed = await parseExcelFile(f)
      setRows(parsed)
      setStep('preview')
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse file')
    } finally {
      setIsParsing(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }, [handleFile])

  const handleRemoveRow = useCallback((rowIndex: number) => {
    setRows(prev => prev.filter(r => r.rowIndex !== rowIndex))
  }, [])

  const handleImport = useCallback(async () => {
    setStep('importing')
    setIsImporting(true)
    setImportProgress(0)
    setImportResults([])

    const toImport = validRows
    const results: ImportResult[] = []

    for (let i = 0; i < toImport.length; i++) {
      const row = toImport[i]
      try {
        // Resolve category ID
        const detectedType = detectCourseType(row)
        const matchedCategory = apiCategories.find(
          c => c.name.toLowerCase() === row.courseCategory.toLowerCase()
        )
        const categoryId = matchedCategory?.id || (apiCategories[0]?.id ?? 1)

        // Build note combining duration + syllabus + original note
        const noteParts = [
          row.courseDuration && `Duration: ${row.courseDuration}`,
          row.courseSyllabus && `Syllabus:\n${row.courseSyllabus}`,
          row.additionalNote,
        ].filter(Boolean)
        const combinedNote = noteParts.join('\n\n')

        // Map all roles as not required by default (import only creates the course)
        const requirements = apiRoles.map(role => ({
          courseId: 0,
          courseDepartmentSubId: role.id,
          isRequired: false,
        }))

        await upsertCourse({
          courseId: 0, // 0 = create new
          courseCode: row.courseCode,
          courseName: row.courseName,
          courseCategoryId: categoryId,
          courseType: detectedType,
          recurrenceIntervalYears: detectedType === 'Recurrence'
            ? (row.recurrenceIntervalYears ?? 2)
            : null,
          additionalNote: combinedNote,
          aircraftTypeLicenseId: null,
          courseObjective: row.courseObjective || '',
          requirements,
        })

        results.push({ row, success: true })
      } catch (err: any) {
        results.push({ row, success: false, error: err.message || 'Unknown error' })
      }

      setImportProgress(Math.round(((i + 1) / toImport.length) * 100))
      setImportResults([...results])
    }

    setIsImporting(false)
    setStep('result')

    // Invalidate caches
    queryClient.invalidateQueries({ queryKey: ['course-list-management'] })
    queryClient.invalidateQueries({ queryKey: ['course-summary'] })

    const successCount = results.filter(r => r.success).length
    if (successCount > 0) {
      toast.success(`Successfully imported ${successCount} course${successCount > 1 ? 's' : ''}`)
    }
  }, [validRows, apiCategories, apiRoles, queryClient])

  // ── Render ──

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !isImporting) onClose() }}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            {step === 'upload' && 'Import Courses from Excel'}
            {step === 'preview' && 'Preview Import Data'}
            {step === 'importing' && 'Importing Courses...'}
            {step === 'result' && 'Import Complete'}
          </DialogTitle>
        </DialogHeader>

        {/* ─── Step 1: Upload ─── */}
        {step === 'upload' && (
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                w-full max-w-md border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
                transition-all duration-200
                ${isDragOver
                  ? 'border-emerald-400 bg-emerald-50 scale-[1.02]'
                  : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/50'
                }
              `}
            >
              {isParsing ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
                  <p className="text-sm text-muted-foreground">Parsing Excel file...</p>
                </div>
              ) : (
                <>
                  <Upload className={`h-10 w-10 mx-auto mb-4 ${isDragOver ? 'text-emerald-500' : 'text-gray-400'}`} />
                  <p className="text-sm font-medium text-foreground mb-1">
                    Drop your Excel file here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports .xlsx and .xls files
                  </p>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileInput}
            />

            {parseError && (
              <div className="mt-4 flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-lg">
                <XCircle className="h-4 w-4 shrink-0" />
                {parseError}
              </div>
            )}
          </div>
        )}

        {/* ─── Step 2: Preview ─── */}
        {step === 'preview' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Summary bar */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <Badge className="gap-1.5 text-xs py-1 bg-gray-100 text-gray-700 hover:bg-gray-100 border border-gray-200">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                {file?.name}
              </Badge>
              <Badge color="primary" className="gap-1 text-xs py-1">
                {rows.length} rows total
              </Badge>
              <Badge className="gap-1 text-xs py-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                <CheckCircle2 className="h-3 w-3" />
                {validRows.length} valid
              </Badge>
              {invalidRows.length > 0 && (
                <Badge className="gap-1 text-xs py-1 bg-red-100 text-red-800 hover:bg-red-100">
                  <XCircle className="h-3 w-3" />
                  {invalidRows.length} errors
                </Badge>
              )}
            </div>

            {/* Preview Table */}
            <div className="flex-1 overflow-auto border rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground w-10">#</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground w-12">Status</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground min-w-[140px]">Course Code</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground min-w-[250px]">Course Name</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground min-w-[120px]">Type</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground min-w-[100px]">Duration</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((row) => {
                    const type = detectCourseType(row)
                    return (
                      <tr
                        key={row.rowIndex}
                        className={`transition-colors ${
                          row.isValid
                            ? 'hover:bg-muted/30'
                            : 'bg-red-50/50 hover:bg-red-50'
                        }`}
                      >
                        <td className="px-3 py-2 text-muted-foreground">{row.rowIndex}</td>
                        <td className="px-3 py-2">
                          {row.isValid ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <div className="group relative">
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                              <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block bg-red-800 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-20">
                                {row.errors.join(', ')}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 font-mono font-medium text-primary">
                          {row.courseCode || <span className="text-red-400 italic">empty</span>}
                        </td>
                        <td className="px-3 py-2 max-w-[300px] truncate" title={row.courseName}>
                          {row.courseName || <span className="text-red-400 italic">empty</span>}
                        </td>
                        <td className="px-3 py-2">
                          <Badge
                            className={`text-[10px] px-1.5 py-0.5 ${
                              type === 'Recurrence'
                                ? 'bg-sky-100 text-sky-700 hover:bg-sky-100'
                                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {type === 'Recurrence' ? 'Recurrent' : 'Initial'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {row.courseDuration || '-'}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(row.rowIndex)}
                            className="p-1 rounded hover:bg-red-100 text-muted-foreground hover:text-red-600 transition-colors"
                            title="Remove row"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer actions */}
            <DialogFooter className="mt-4 flex items-center gap-2 sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep('upload')
                  setFile(null)
                  setRows([])
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back
              </Button>
              <Button
                type="button"
                color="primary"
                disabled={validRows.length === 0}
                onClick={handleImport}
              >
                <Upload className="h-4 w-4 mr-1.5" />
                Import {validRows.length} course{validRows.length !== 1 ? 's' : ''}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ─── Step 3: Importing ─── */}
        {step === 'importing' && (
          <div className="flex-1 flex flex-col items-center justify-center py-12 gap-6">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <div className="w-full max-w-sm space-y-3 text-center">
              <p className="text-sm font-medium">
                Importing courses... {importResults.length}/{validRows.length}
              </p>
              <Progress value={importProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Please do not close this window
              </p>
            </div>
          </div>
        )}

        {/* ─── Step 4: Result ─── */}
        {step === 'result' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-emerald-700">
                  {importResults.filter(r => r.success).length}
                </p>
                <p className="text-xs text-emerald-600">Imported Successfully</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <XCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-red-700">
                  {importResults.filter(r => !r.success).length}
                </p>
                <p className="text-xs text-red-600">Failed</p>
              </div>
            </div>

            {/* Failed rows detail */}
            {importResults.some(r => !r.success) && (
              <div className="flex-1 overflow-auto border rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-red-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-red-700">Course Code</th>
                      <th className="px-3 py-2 text-left font-medium text-red-700">Course Name</th>
                      <th className="px-3 py-2 text-left font-medium text-red-700">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {importResults.filter(r => !r.success).map((r, idx) => (
                      <tr key={idx} className="hover:bg-red-50/50">
                        <td className="px-3 py-2 font-mono">{r.row.courseCode}</td>
                        <td className="px-3 py-2">{r.row.courseName}</td>
                        <td className="px-3 py-2 text-red-600">{r.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <DialogFooter className="mt-4">
              <Button type="button" color="primary" onClick={onClose}>
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
