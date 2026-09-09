'use client'

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, ArrowLeft, Loader2, Trash2, Pencil, Wand2, Settings2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { getCourseCategories } from '@/lib/api/qa/course'
import {
  importCourses,
  fetchCourseCodeIndex,
  buildImportCoursePayload,
  summarizeImportPlan,
  type ImportCoursesSummary,
} from '@/lib/api/qa/import-courses'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useReduxAuth } from '@/lib/api/hooks/useReduxAuth'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { cn } from '@/lib/utils'

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
  fieldErrors: Record<string, string>
  isValid: boolean
}

type Step = 'upload' | 'preview' | 'importing' | 'result'

/** Determine course type: prioritize explicit field from Excel, fallback to name heuristics only if empty */
function detectCourseType(row: { courseType?: string; courseName?: string }): 'Recurrent' | 'Initial' {
  const explicitType = row.courseType?.trim().toLowerCase()
  if (explicitType) {
    if (explicitType === 'recurrent' || explicitType.includes('recur')) return 'Recurrent'
    return 'Initial'
  }
  if (row.courseName?.toLowerCase().includes('recurrent')) return 'Recurrent'
  return 'Initial'
}

/** Validate row and return errors both list and by field */
function validateCourseRow(
  row: {
    courseCode: string
    courseName: string
    courseCategory: string
    [key: string]: any
  },
  apiCategories: any[] = []
): { errors: string[]; fieldErrors: Record<string, string>; isValid: boolean } {
  const errors: string[] = []
  const fieldErrors: Record<string, string> = {}

  if (!row.courseCode?.trim()) {
    const msg = 'Missing courseCode'
    errors.push(msg)
    fieldErrors['courseCode'] = msg
  }

  if (!row.courseName?.trim()) {
    const msg = 'Missing courseName'
    errors.push(msg)
    fieldErrors['courseName'] = msg
  }

  if (row.courseCategory?.trim()) {
    if (apiCategories.length > 0) {
      const isValidCategory = apiCategories.some(
        c =>
          c.name?.toLowerCase().trim() === row.courseCategory.toLowerCase().trim() ||
          c.code?.toLowerCase().trim() === row.courseCategory.toLowerCase().trim()
      )
      if (!isValidCategory) {
        const msg = `Invalid Category: "${row.courseCategory}"`
        errors.push(msg)
        fieldErrors['courseCategory'] = msg
      }
    }
  } else {
    const msg = 'Missing Category'
    errors.push(msg)
    fieldErrors['courseCategory'] = msg
  }

  return {
    errors,
    fieldErrors,
    isValid: errors.length === 0,
  }
}

/** Warning/Error icon with tooltip for specific cell */
function CellErrorIcon({ message }: { message?: string }) {
  if (!message) return null
  return (
    <div className="group relative inline-flex items-center shrink-0">
      <AlertTriangle className="h-3.5 w-3.5 text-red-500 cursor-help" />
      <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block bg-red-800 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-40 pointer-events-none">
        {message}
      </div>
    </div>
  )
}

/** Parse Excel file into structured rows */
function parseExcelFile(file: File, apiCategories: any[] = []): Promise<ParsedCourseRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' })

        const rows: ParsedCourseRow[] = jsonData.map((rawRow, idx) => {
          // Normalize keys (lowercase, no spaces) to be extremely robust against Excel formatting differences
          const row: Record<string, any> = {}
          for (const key in rawRow) {
            const normalizedKey = key.toLowerCase().replace(/\s+/g, '')
            row[normalizedKey] = rawRow[key]
          }

          const courseCode = String(row['coursecode'] || '').trim()
          const courseName = String(row['coursename'] || '').trim()
          const courseObjective = String(row['courseobjective'] || row['objective'] || '').trim()
          const courseDuration = String(row['courseduration'] || row['duration'] || '').trim()
          const courseSyllabus = String(row['coursesyllabus'] || row['syllabus'] || '').trim()
          const courseCategory = String(row['coursecategory'] || row['category'] || '').trim()
          const rawType = String(row['coursetype'] || row['type'] || '').trim()
          let courseType = 'Initial'
          if (rawType) {
            courseType = rawType.toLowerCase().includes('recur') ? 'Recurrent' : 'Initial'
          } else if (courseName.toLowerCase().includes('recurrent')) {
            courseType = 'Recurrent'
          }
          const recurrenceRaw = row['recurrenceintervalyears'] || row['recurrence']
          const recurrenceIntervalYears = recurrenceRaw ? Math.round(Number(recurrenceRaw) * 10) / 10 : null
          const additionalNote = String(row['additionalnote'] || row['note'] || '').trim()

          const validation = validateCourseRow(
            { courseCode, courseName, courseCategory },
            apiCategories
          )

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
            ...validation,
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
  file: File
  onClose: () => void
}

export function ImportCourseModal({ file: initialFile, onClose }: ImportCourseModalProps) {
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(initialFile)
  const [rows, setRows] = useState<ParsedCourseRow[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Edit and Remove state
  const [rowToRemove, setRowToRemove] = useState<number | null>(null)
  const [editingRow, setEditingRow] = useState<ParsedCourseRow | null>(null)

  // Import state
  const [importProgress, setImportProgress] = useState(0)
  const [importStage, setImportStage] = useState('')
  const [importSummary, setImportSummary] = useState<ImportCoursesSummary | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  const { user } = useReduxAuth()
  const queryClient = useQueryClient()

  // Fetch categories for mapping
  const { data: categoryListResp } = useQuery({
    queryKey: ['course-categories'],
    queryFn: getCourseCategories,
  })
  const apiCategories = useMemo(() => categoryListResp?.responseData || [], [categoryListResp])

  // Existing course codes, so the preview can say which rows update an
  // existing course and which create a new one.
  const { data: courseCodeIndex } = useQuery({
    queryKey: ['course-code-index'],
    queryFn: () => fetchCourseCodeIndex(),
  })

  const validRows = useMemo(() => rows.filter(r => r.isValid), [rows])
  const invalidRows = useMemo(() => rows.filter(r => !r.isValid), [rows])

  // How the valid rows split between creating and updating, using the codes
  // already in the system.
  const importPlan = useMemo(
    () => summarizeImportPlan(buildImportCoursePayload(validRows, courseCodeIndex ?? new Map())),
    [validRows, courseCodeIndex]
  )

  // Compute which columns have errors and how many
  const columnErrorCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const row of rows) {
      if (row.fieldErrors) {
        for (const field of Object.keys(row.fieldErrors)) {
          counts[field] = (counts[field] || 0) + 1
        }
      }
    }
    return counts
  }, [rows])

  // Thai/English column names with errors for the alert banner
  const errorColumnNames = useMemo(() => {
    const map: Record<string, string> = {
      courseCode: 'Course Code',
      courseName: 'Course Name',
      courseCategory: 'Category',
      courseType: 'Type',
      recurrenceIntervalYears: 'Recurrence',
      courseDuration: 'Duration',
      courseSyllabus: 'Syllabus',
      additionalNote: 'Note',
    }
    return Object.keys(columnErrorCounts).map(key => map[key] || key)
  }, [columnErrorCounts])

  // Default values confirmation modal state
  const [defaultModalState, setDefaultModalState] = useState<{
    isOpen: boolean
    targetColumn?: string
  }>({ isOpen: false })
  const [defaultCategory, setDefaultCategory] = useState<string>('')
  const [defaultType, setDefaultType] = useState<'Initial' | 'Recurrent'>('Initial')
  const [defaultRecurrence, setDefaultRecurrence] = useState<number>(2)
  const [applyOnlyToErrors, setApplyOnlyToErrors] = useState<boolean>(true)

  // Initialize defaultCategory when apiCategories loads
  useEffect(() => {
    if (apiCategories.length > 0 && !defaultCategory) {
      setDefaultCategory(apiCategories[0]?.name || '')
    }
  }, [apiCategories, defaultCategory])

  // Handler to apply default values to rows
  const handleApplyDefaultValues = useCallback(() => {
    const targetCol = defaultModalState.targetColumn

    setRows(prev => {
      return prev.map(row => {
        // If applyOnlyToErrors is true and row has no errors, skip
        if (applyOnlyToErrors && row.isValid) return row

        const updatedRow = { ...row }
        let changed = false

        // Category
        if (!targetCol || targetCol === 'courseCategory') {
          if (!applyOnlyToErrors || row.fieldErrors?.courseCategory) {
            if (defaultCategory) {
              updatedRow.courseCategory = defaultCategory
              changed = true
            }
          }
        }

        // Type
        if (!targetCol || targetCol === 'courseType') {
          if (!applyOnlyToErrors || row.fieldErrors?.courseType) {
            updatedRow.courseType = defaultType
            changed = true
          }
        }

        // Recurrence
        if (!targetCol || targetCol === 'recurrenceIntervalYears') {
          if (!applyOnlyToErrors || row.fieldErrors?.recurrenceIntervalYears) {
            updatedRow.recurrenceIntervalYears = defaultRecurrence
            changed = true
          }
        }

        if (changed) {
          const validation = validateCourseRow(updatedRow, apiCategories)
          return {
            ...updatedRow,
            ...validation,
          }
        }

        return row
      })
    })

    setDefaultModalState({ isOpen: false })
    toast.success('ตั้งค่าเริ่มต้นและตรวจสอบข้อมูลใหม่เรียบร้อยแล้ว')
  }, [applyOnlyToErrors, defaultCategory, defaultModalState.targetColumn, defaultType, defaultRecurrence, apiCategories])

  // Auto-parse file on mount
  useEffect(() => {
    if (initialFile && step === 'upload') {
      handleFile(initialFile)
    }
  }, [initialFile])

  // Re-validate rows when apiCategories changes
  useEffect(() => {
    if (apiCategories.length > 0 && rows.length > 0) {
      setRows(prev =>
        prev.map(r => ({
          ...r,
          ...validateCourseRow(r, apiCategories),
        }))
      )
    }
  }, [apiCategories])

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
      const parsed = await parseExcelFile(f, apiCategories)
      setRows(parsed)
      setStep('preview')
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse file')
    } finally {
      setIsParsing(false)
    }
  }, [apiCategories])

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
    setRowToRemove(rowIndex)
  }, [])

  const confirmRemoveRow = useCallback(() => {
    if (rowToRemove !== null) {
      setRows(prev => prev.filter(r => r.rowIndex !== rowToRemove))
      setRowToRemove(null)
    }
  }, [rowToRemove])

  const handleSaveEditRow = useCallback((updatedRow: ParsedCourseRow) => {
    const validation = validateCourseRow(updatedRow, apiCategories)
    const newRow = {
      ...updatedRow,
      ...validation,
    }

    setRows(prev => prev.map(r => r.rowIndex === updatedRow.rowIndex ? newRow : r))
    setEditingRow(null)
  }, [apiCategories])

  const handleImport = useCallback(async () => {
    setStep('importing')
    setIsImporting(true)
    setImportProgress(0)
    setImportSummary(null)
    setImportError(null)

    try {
      // Read the current course codes right before sending. A stale index would
      // send id 0 for a course that already exists and duplicate it.
      setImportStage('Checking existing course codes...')
      setImportProgress(20)
      const codeIndex = await fetchCourseCodeIndex()

      setImportStage('Uploading courses...')
      setImportProgress(60)
      const payload = buildImportCoursePayload(validRows, codeIndex)
      const res = await importCourses(payload)

      setImportProgress(100)
      setImportSummary(res.responseData)

      const { created = 0, updated = 0 } = res.responseData ?? {}
      if (created + updated > 0) {
        toast.success(`Imported ${created} new and updated ${updated} course${updated === 1 ? '' : 's'}`)
      } else {
        toast.warning('No course was created or updated')
      }

      queryClient.invalidateQueries({ queryKey: ['course-list-management'] })
      queryClient.invalidateQueries({ queryKey: ['course-summary'] })
      queryClient.invalidateQueries({ queryKey: ['course-code-index'] })
    } catch (err: any) {
      const message = err?.message || 'Failed to import courses'
      setImportError(message)
      toast.error(message)
    } finally {
      setIsImporting(false)
      setImportStage('')
      setStep('result')
    }
  }, [validRows, queryClient])

  // ── Render ──

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !isImporting) onClose() }}>
      <DialogContent size="lg" className="max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            {step === 'upload' && 'Parsing File...'}
            {step === 'preview' && 'Preview Import Data'}
            {step === 'importing' && 'Importing Courses...'}
            {step === 'result' && 'Import Complete'}
          </DialogTitle>
        </DialogHeader>

        {/* ─── Step 1: Parsing ─── */}
        {step === 'upload' && (
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            {isParsing ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
                <p className="text-sm text-muted-foreground">Parsing Excel file...</p>
              </div>
            ) : parseError ? (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-lg">
                  <XCircle className="h-4 w-4 shrink-0" />
                  {parseError}
                </div>
                <Button type="button" variant="outline" onClick={onClose} className="mt-2">Close</Button>
              </div>
            ) : null}
          </div>
        )}

        {/* ─── Step 2: Preview ─── */}
        {step === 'preview' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Summary bar */}
            <div className="flex items-center gap-3 mb-3 flex-wrap">
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

            {/* Error Banner when errors exist */}
            {invalidRows.length > 0 && (
              <div className="flex items-center justify-between p-3 mb-3 bg-red-50/90 border border-red-200 rounded-lg text-xs text-red-900 shadow-sm">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-red-900">
                        พบข้อมูลไม่ถูกต้อง {invalidRows.length} แถว
                      </span>
                      {errorColumnNames.length > 0 && (
                        <span className="text-red-700 font-medium">
                          (คอลัมน์: {errorColumnNames.join(', ')})
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-red-600 mt-0.5">
                      ท่านสามารถคลิกที่เซลล์เพื่อแก้ไขข้อมูลรายแถว หรือกดยืนยันเพื่อตั้งค่าเริ่มต้น (Set Default Value) ให้กับรายการที่มีข้อผิดพลาด
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm gap-1.5"
                    onClick={() => setDefaultModalState({ isOpen: true })}
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                    กดยืนยันตั้งค่าเริ่มต้น (Set Default Value)
                  </Button>
                </div>
              </div>
            )}

            {/* Preview Table */}
            <div className="flex-1 overflow-auto border rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="sticky left-0 z-30 bg-slate-50 px-3 py-2.5 text-left font-medium text-muted-foreground w-10">#</th>
                    <th className="sticky left-[40px] z-30 bg-slate-50 px-3 py-2.5 text-left font-medium text-muted-foreground w-16 border-r border-slate-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">Status</th>
                    <th className={cn("px-3 py-2.5 text-left font-medium min-w-[130px]", columnErrorCounts['courseCode'] ? 'text-red-700 bg-red-50 border-b-2 border-red-400' : 'text-muted-foreground')}>
                      <div className="flex items-center justify-between gap-1.5">
                        <span>Course Code</span>
                        {columnErrorCounts['courseCode'] && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-600 bg-red-100 border border-red-200 rounded-full px-1.5 py-0">
                            <AlertTriangle className="h-3 w-3" />
                            {columnErrorCounts['courseCode']}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className={cn("px-3 py-2.5 text-left font-medium min-w-[240px]", columnErrorCounts['courseName'] ? 'text-red-700 bg-red-50 border-b-2 border-red-400' : 'text-muted-foreground')}>
                      <div className="flex items-center justify-between gap-1.5">
                        <span>Course Name</span>
                        {columnErrorCounts['courseName'] && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-600 bg-red-100 border border-red-200 rounded-full px-1.5 py-0">
                            <AlertTriangle className="h-3 w-3" />
                            {columnErrorCounts['courseName']}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className={cn("px-3 py-2.5 text-left font-medium min-w-[190px]", columnErrorCounts['courseObjective'] ? 'text-red-700 bg-red-50 border-b-2 border-red-400' : 'text-muted-foreground')}>
                      <div className="flex items-center justify-between gap-1.5">
                        <span>Objective</span>
                        {columnErrorCounts['courseObjective'] && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-600 bg-red-100 border border-red-200 rounded-full px-1.5 py-0">
                            <AlertTriangle className="h-3 w-3" />
                            {columnErrorCounts['courseObjective']}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className={cn("px-3 py-2.5 text-left font-medium min-w-[160px]", columnErrorCounts['courseCategory'] ? 'text-red-700 bg-red-50 border-b-2 border-red-400' : 'text-muted-foreground')}>
                      <div className="flex items-center justify-between gap-1.5">
                        <span>Category</span>
                        {columnErrorCounts['courseCategory'] && (
                          <button
                            type="button"
                            onClick={() => setDefaultModalState({ isOpen: true, targetColumn: 'courseCategory' })}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-100 hover:bg-red-200 border border-red-300 rounded-full px-1.5 py-0.5 transition-colors cursor-pointer"
                            title="คลิกเพื่อกดยืนยันตั้งค่าเริ่มต้นสำหรับ Category"
                          >
                            <AlertTriangle className="h-3 w-3 text-red-600" />
                            <span>{columnErrorCounts['courseCategory']}</span>
                            <span className="text-[9px] underline">ตั้งค่า</span>
                          </button>
                        )}
                      </div>
                    </th>
                    <th className={cn("px-3 py-2.5 text-left font-medium min-w-[110px]", columnErrorCounts['courseType'] ? 'text-red-700 bg-red-50 border-b-2 border-red-400' : 'text-muted-foreground')}>
                      <div className="flex items-center justify-between gap-1.5">
                        <span>Type</span>
                        {columnErrorCounts['courseType'] && (
                          <button
                            type="button"
                            onClick={() => setDefaultModalState({ isOpen: true, targetColumn: 'courseType' })}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-100 hover:bg-red-200 border border-red-300 rounded-full px-1.5 py-0.5 transition-colors cursor-pointer"
                            title="คลิกเพื่อกดยืนยันตั้งค่าเริ่มต้นสำหรับ Type"
                          >
                            <AlertTriangle className="h-3 w-3 text-red-600" />
                            <span>{columnErrorCounts['courseType']}</span>
                            <span className="text-[9px] underline">ตั้งค่า</span>
                          </button>
                        )}
                      </div>
                    </th>
                    <th className={cn("px-3 py-2.5 text-left font-medium min-w-[110px]", columnErrorCounts['recurrenceIntervalYears'] ? 'text-red-700 bg-red-50 border-b-2 border-red-400' : 'text-muted-foreground')}>
                      <div className="flex items-center justify-between gap-1.5">
                        <span>Recurrence</span>
                        {columnErrorCounts['recurrenceIntervalYears'] && (
                          <button
                            type="button"
                            onClick={() => setDefaultModalState({ isOpen: true, targetColumn: 'recurrenceIntervalYears' })}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-100 hover:bg-red-200 border border-red-300 rounded-full px-1.5 py-0.5 transition-colors cursor-pointer"
                            title="คลิกเพื่อกดยืนยันตั้งค่าเริ่มต้นสำหรับ Recurrence"
                          >
                            <AlertTriangle className="h-3 w-3 text-red-600" />
                            <span>{columnErrorCounts['recurrenceIntervalYears']}</span>
                            <span className="text-[9px] underline">ตั้งค่า</span>
                          </button>
                        )}
                      </div>
                    </th>
                    <th className={cn("px-3 py-2.5 text-left font-medium min-w-[85px]", columnErrorCounts['courseDuration'] ? 'text-red-700 bg-red-50 border-b-2 border-red-400' : 'text-muted-foreground')}>
                      <div className="flex items-center justify-between gap-1.5">
                        <span>Duration</span>
                        {columnErrorCounts['courseDuration'] && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-600 bg-red-100 border border-red-200 rounded-full px-1.5 py-0">
                            <AlertTriangle className="h-3 w-3" />
                            {columnErrorCounts['courseDuration']}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className={cn("px-3 py-2.5 text-left font-medium min-w-[240px]", columnErrorCounts['courseSyllabus'] ? 'text-red-700 bg-red-50 border-b-2 border-red-400' : 'text-muted-foreground')}>
                      <div className="flex items-center justify-between gap-1.5">
                        <span>Syllabus</span>
                        {columnErrorCounts['courseSyllabus'] && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-600 bg-red-100 border border-red-200 rounded-full px-1.5 py-0">
                            <AlertTriangle className="h-3 w-3" />
                            {columnErrorCounts['courseSyllabus']}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className={cn("px-3 py-2.5 text-left font-medium min-w-[130px]", columnErrorCounts['additionalNote'] ? 'text-red-700 bg-red-50 border-b-2 border-red-400' : 'text-muted-foreground')}>
                      <div className="flex items-center justify-between gap-1.5">
                        <span>Note</span>
                        {columnErrorCounts['additionalNote'] && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-600 bg-red-100 border border-red-200 rounded-full px-1.5 py-0">
                            <AlertTriangle className="h-3 w-3" />
                            {columnErrorCounts['additionalNote']}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="sticky right-0 z-30 bg-slate-50 px-3 py-2.5 text-right font-medium text-muted-foreground w-16 border-l border-slate-200 shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.06)]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((row) => {
                    const type = detectCourseType(row)
                    const isEditing = editingRow?.rowIndex === row.rowIndex

                    if (isEditing) {
                      return (
                        <tr key={row.rowIndex} className="bg-amber-50/40 border-y-2 border-primary/30">
                          <td className="sticky left-0 z-20 bg-amber-50 px-3 py-2 text-muted-foreground">{row.rowIndex}</td>
                          <td className="sticky left-[40px] z-20 bg-amber-50 px-3 py-2 border-r border-slate-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                            {row.isValid ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <div className="group/edit-status relative">
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                                <div className="absolute left-0 bottom-full mb-1 hidden group-hover/edit-status:block bg-red-800 text-white text-[10px] px-2.5 py-1.5 rounded shadow-lg whitespace-nowrap z-40">
                                  {row.errors.join(', ')}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-1 py-1">
                            <div className="flex items-center gap-1">
                              {row.fieldErrors?.courseCode && <CellErrorIcon message={row.fieldErrors.courseCode} />}
                              <Input
                                className={cn("h-7 text-xs px-2 w-full", row.fieldErrors?.courseCode && "border-red-500 focus-visible:ring-red-500 bg-red-50/30")}
                                value={editingRow.courseCode}
                                onChange={e => setEditingRow({...editingRow, courseCode: e.target.value})}
                              />
                            </div>
                          </td>
                          <td className="px-1 py-1">
                            <div className="flex items-center gap-1">
                              {row.fieldErrors?.courseName && <CellErrorIcon message={row.fieldErrors.courseName} />}
                              <Input
                                className={cn("h-7 text-xs px-2 w-full", row.fieldErrors?.courseName && "border-red-500 focus-visible:ring-red-500 bg-red-50/30")}
                                value={editingRow.courseName}
                                onChange={e => setEditingRow({...editingRow, courseName: e.target.value})}
                              />
                            </div>
                          </td>
                          <td className="px-1 py-1">
                            <div className="flex items-center gap-1">
                              {row.fieldErrors?.courseObjective && <CellErrorIcon message={row.fieldErrors.courseObjective} />}
                              <Textarea className="min-h-7 h-7 text-xs px-2 py-1 w-full" value={editingRow.courseObjective} onChange={e => setEditingRow({...editingRow, courseObjective: e.target.value})} />
                            </div>
                          </td>
                          <td className="px-1 py-1">
                            <div className="flex items-center gap-1">
                              {row.fieldErrors?.courseCategory && <CellErrorIcon message={row.fieldErrors.courseCategory} />}
                              <select 
                                className={cn(
                                  "h-7 text-xs px-2 w-full rounded-md border border-input bg-background",
                                  row.fieldErrors?.courseCategory && "border-red-500 focus:ring-red-500 bg-red-50/40"
                                )}
                                value={editingRow.courseCategory} 
                                onChange={e => setEditingRow({...editingRow, courseCategory: e.target.value})}
                              >
                                <option value="" disabled>Select category...</option>
                                {apiCategories.map(cat => (
                                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                                ))}
                              </select>
                              {apiCategories.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setEditingRow({...editingRow, courseCategory: apiCategories[0]?.name || ''})}
                                  className="h-7 text-[10px] px-1.5 rounded border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap"
                                  title="ใช้ค่าเริ่มต้น (Category แรก)"
                                >
                                  ค่าเริ่มต้น
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-1 py-1">
                            <select
                              className="h-7 text-xs px-2 w-full rounded-md border border-input bg-background"
                              value={editingRow.courseType || 'Initial'}
                              onChange={e => setEditingRow({...editingRow, courseType: e.target.value})}
                            >
                              <option value="Initial">Initial</option>
                              <option value="Recurrent">Recurrent</option>
                            </select>
                          </td>
                          <td className="px-1 py-1">
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                step="0.1"
                                min="0"
                                className="h-7 text-xs px-2 w-full min-w-[55px]"
                                value={editingRow.recurrenceIntervalYears ?? ''}
                                onChange={e => {
                                  const val = e.target.value
                                  if (val === '') {
                                    setEditingRow({...editingRow, recurrenceIntervalYears: null})
                                  } else {
                                    const num = Math.round(Number(val) * 10) / 10
                                    setEditingRow({...editingRow, recurrenceIntervalYears: num})
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => setEditingRow({...editingRow, recurrenceIntervalYears: 2})}
                                className="h-7 text-[10px] px-1.5 rounded border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap"
                                title="ตั้งค่าเริ่มต้น 2 ปี"
                              >
                                2y
                              </button>
                            </div>
                          </td>
                          <td className="px-1 py-1">
                            <Input className="h-7 text-xs px-2 w-full" value={editingRow.courseDuration} onChange={e => setEditingRow({...editingRow, courseDuration: e.target.value})} />
                          </td>
                          <td className="px-1 py-1">
                            <Textarea className="min-h-7 h-7 text-xs px-2 py-1 w-full" value={editingRow.courseSyllabus} onChange={e => setEditingRow({...editingRow, courseSyllabus: e.target.value})} />
                          </td>
                          <td className="px-1 py-1">
                            <Input className="h-7 text-xs px-2 w-full" value={editingRow.additionalNote} onChange={e => setEditingRow({...editingRow, additionalNote: e.target.value})} />
                          </td>
                          <td className="sticky right-0 z-20 bg-amber-50 px-3 py-2 text-right whitespace-nowrap border-l border-slate-200 shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                            <div className="flex items-center gap-1 justify-end">
                              <button
                                type="button"
                                onClick={() => handleSaveEditRow(editingRow)}
                                className="p-1 px-1.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition-colors flex items-center gap-1 text-[11px] font-medium"
                                title="Save changes"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>บันทึก</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingRow(null)}
                                className="p-1 px-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors text-[11px]"
                                title="Cancel edit"
                              >
                                ยกเลิก
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    }

                    return (
                      <tr
                        key={row.rowIndex}
                        className={cn(
                          "group transition-colors",
                          row.isValid
                            ? "hover:bg-muted/30"
                            : "bg-red-50/40 hover:bg-red-50/70"
                        )}
                      >
                        <td className={cn(
                          "sticky left-0 z-20 px-3 py-2 text-muted-foreground transition-colors",
                          row.isValid ? "bg-white group-hover:bg-slate-50" : "bg-red-50/95 group-hover:bg-red-100"
                        )}>
                          {row.rowIndex}
                        </td>
                        <td className={cn(
                          "sticky left-[40px] z-20 px-3 py-2 border-r border-slate-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] transition-colors",
                          row.isValid ? "bg-white group-hover:bg-slate-50" : "bg-red-50/95 group-hover:bg-red-100"
                        )}>
                          {row.isValid ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <div className="group/status relative">
                                <AlertTriangle className="h-4 w-4 text-red-500 cursor-pointer" />
                                <div className="absolute left-0 bottom-full mb-1 hidden group-hover/status:block bg-red-800 text-white text-[10px] px-2.5 py-1.5 rounded shadow-lg whitespace-nowrap z-40 pointer-events-none">
                                  <p className="font-semibold mb-0.5">ข้อผิดพลาด ({row.errors.length}):</p>
                                  {row.errors.map((e, idx) => (
                                    <div key={idx}>• {e}</div>
                                  ))}
                                  <p className="mt-1 text-[9px] text-red-200">คลิกที่ช่องหรือปุ่มเพื่อแก้ไข</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setEditingRow(row)}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 hover:bg-red-200 font-medium transition-colors"
                                title="คลิกเพื่อแก้ไขข้อมูลแถวนี้"
                              >
                                แก้ไข
                              </button>
                            </div>
                          )}
                        </td>
                        <td
                          onClick={() => setEditingRow(row)}
                          className={cn(
                            "px-3 py-2 font-mono font-medium transition-colors cursor-pointer group/cell",
                            row.fieldErrors?.courseCode 
                              ? "text-red-700 bg-red-50/90 hover:bg-red-100/90 border-l-2 border-red-500" 
                              : "text-primary hover:bg-muted/40"
                          )}
                          title="คลิกเพื่อแก้ไข Course Code"
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <CellErrorIcon message={row.fieldErrors?.courseCode} />
                              <span>{row.courseCode || <span className="text-red-500 italic">ว่าง (คลิกแก้ไข)</span>}</span>
                            </div>
                            <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity shrink-0" />
                          </div>
                        </td>
                        <td
                          onClick={() => setEditingRow(row)}
                          className={cn(
                            "px-3 py-2 max-w-[200px] transition-colors cursor-pointer group/cell",
                            row.fieldErrors?.courseName 
                              ? "bg-red-50/90 hover:bg-red-100/90 border-l-2 border-red-500" 
                              : "hover:bg-muted/40"
                          )}
                          title="คลิกเพื่อแก้ไข Course Name"
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <CellErrorIcon message={row.fieldErrors?.courseName} />
                              <span className="truncate" title={row.courseName}>
                                {row.courseName || <span className="text-red-500 italic">ว่าง (คลิกแก้ไข)</span>}
                              </span>
                            </div>
                            <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity shrink-0" />
                          </div>
                        </td>
                        <td
                          onClick={() => setEditingRow(row)}
                          className={cn(
                            "px-3 py-2 max-w-[180px] transition-colors cursor-pointer group/cell",
                            row.fieldErrors?.courseObjective 
                              ? "bg-red-50/90 hover:bg-red-100/90 border-l-2 border-red-500" 
                              : "hover:bg-muted/40"
                          )}
                          title="คลิกเพื่อแก้ไข Objective"
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <CellErrorIcon message={row.fieldErrors?.courseObjective} />
                              <span className="truncate" title={row.courseObjective}>
                                {row.courseObjective || <span className="text-muted-foreground">-</span>}
                              </span>
                            </div>
                            <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity shrink-0" />
                          </div>
                        </td>
                        <td
                          onClick={() => setEditingRow(row)}
                          className={cn(
                            "px-3 py-2 transition-colors cursor-pointer group/cell",
                            row.fieldErrors?.courseCategory 
                              ? "bg-red-50/90 hover:bg-red-100/90 border-l-2 border-red-500" 
                              : "hover:bg-muted/40"
                          )}
                          title="คลิกเพื่อแก้ไข Category"
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <CellErrorIcon message={row.fieldErrors?.courseCategory} />
                              {row.courseCategory ? (
                                <Badge
                                  className={cn(
                                    "text-[10px] px-1.5 py-0.5",
                                    row.fieldErrors?.courseCategory
                                      ? "bg-red-100 text-red-700 hover:bg-red-100 border border-red-300"
                                      : "bg-violet-100 text-violet-700 hover:bg-violet-100"
                                  )}
                                >
                                  {row.courseCategory}
                                </Badge>
                              ) : (
                                <span className="text-red-500 italic text-xs">ไม่ได้ระบุ (คลิกเพื่อเลือก)</span>
                              )}
                            </div>
                            <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity shrink-0" />
                          </div>
                        </td>
                        <td
                          onClick={() => setEditingRow(row)}
                          className={cn(
                            "px-3 py-2 transition-colors cursor-pointer group/cell",
                            row.fieldErrors?.courseType 
                              ? "bg-red-50/90 hover:bg-red-100/90 border-l-2 border-red-500" 
                              : "hover:bg-muted/40"
                          )}
                          title="คลิกเพื่อแก้ไข Type"
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <CellErrorIcon message={row.fieldErrors?.courseType} />
                              <Badge
                                className={`text-[10px] px-1.5 py-0.5 ${type === 'Recurrent'
                                  ? 'bg-sky-100 text-sky-700 hover:bg-sky-100'
                                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                  }`}
                              >
                                {type === 'Recurrent' ? 'Recurrent' : 'Initial'}
                              </Badge>
                            </div>
                            <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity shrink-0" />
                          </div>
                        </td>
                        <td
                          onClick={() => setEditingRow(row)}
                          className={cn(
                            "px-3 py-2 text-muted-foreground transition-colors cursor-pointer group/cell",
                            row.fieldErrors?.recurrenceIntervalYears 
                              ? "bg-red-50/90 hover:bg-red-100/90 border-l-2 border-red-500 text-red-700" 
                              : "hover:bg-muted/40"
                          )}
                          title="คลิกเพื่อแก้ไข Recurrence"
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <CellErrorIcon message={row.fieldErrors?.recurrenceIntervalYears} />
                              <span>
                                {row.recurrenceIntervalYears != null
                                  ? `${Number.isInteger(row.recurrenceIntervalYears) ? row.recurrenceIntervalYears : row.recurrenceIntervalYears.toFixed(1)} yr${row.recurrenceIntervalYears !== 1 ? 's' : ''}`
                                  : '-'}
                              </span>
                            </div>
                            <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity shrink-0" />
                          </div>
                        </td>
                        <td
                          onClick={() => setEditingRow(row)}
                          className={cn(
                            "px-3 py-2 text-muted-foreground max-w-[140px] transition-colors cursor-pointer group/cell",
                            row.fieldErrors?.courseDuration 
                              ? "bg-red-50/90 hover:bg-red-100/90 border-l-2 border-red-500 text-red-700" 
                              : "hover:bg-muted/40"
                          )}
                          title="คลิกเพื่อแก้ไข Duration"
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <CellErrorIcon message={row.fieldErrors?.courseDuration} />
                              <span className="truncate" title={row.courseDuration}>
                                {row.courseDuration || '-'}
                              </span>
                            </div>
                            <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity shrink-0" />
                          </div>
                        </td>
                        <td
                          onClick={() => setEditingRow(row)}
                          className={cn(
                            "px-3 py-2 max-w-[160px] transition-colors cursor-pointer group/cell",
                            row.fieldErrors?.courseSyllabus 
                              ? "bg-red-50/90 hover:bg-red-100/90 border-l-2 border-red-500 text-red-700" 
                              : "hover:bg-muted/40"
                          )}
                          title="คลิกเพื่อแก้ไข Syllabus"
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <CellErrorIcon message={row.fieldErrors?.courseSyllabus} />
                              <span className="truncate" title={row.courseSyllabus}>
                                {row.courseSyllabus || <span className="text-muted-foreground">-</span>}
                              </span>
                            </div>
                            <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity shrink-0" />
                          </div>
                        </td>
                        <td
                          onClick={() => setEditingRow(row)}
                          className={cn(
                            "px-3 py-2 max-w-[140px] transition-colors cursor-pointer group/cell",
                            row.fieldErrors?.additionalNote 
                              ? "bg-red-50/90 hover:bg-red-100/90 border-l-2 border-red-500 text-red-700" 
                              : "hover:bg-muted/40"
                          )}
                          title="คลิกเพื่อแก้ไข Note"
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <CellErrorIcon message={row.fieldErrors?.additionalNote} />
                              <span className="truncate" title={row.additionalNote}>
                                {row.additionalNote || <span className="text-muted-foreground">-</span>}
                              </span>
                            </div>
                            <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity shrink-0" />
                          </div>
                        </td>
                        <td className={cn(
                          "sticky right-0 z-20 px-3 py-2 text-right whitespace-nowrap border-l border-slate-200 shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.06)] transition-colors",
                          row.isValid ? "bg-white group-hover:bg-slate-50" : "bg-red-50/95 group-hover:bg-red-100"
                        )}>
                          <button
                            type="button"
                            onClick={() => setEditingRow(row)}
                            className="p-1 rounded hover:bg-slate-100 text-muted-foreground hover:text-primary transition-colors mr-1"
                            title="Edit row"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
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
                onClick={onClose}
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                {/* A row whose Course Code already exists updates that course */}
                {validRows.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {importPlan.createCount} new, {importPlan.updateCount} update
                  </span>
                )}
                <Button
                  type="button"
                  color="primary"
                  disabled={validRows.length === 0}
                  onClick={handleImport}
                >
                  <Upload className="h-4 w-4 mr-1.5" />
                  Import {validRows.length} course{validRows.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </DialogFooter>
          </div>
        )}

        {/* ─── Step 3: Importing ─── */}
        {step === 'importing' && (
          <div className="flex-1 flex flex-col items-center justify-center py-12 gap-6">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <div className="w-full max-w-sm space-y-3 text-center">
              <p className="text-sm font-medium">
                {importStage || `Importing ${validRows.length} course${validRows.length === 1 ? '' : 's'}...`}
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
            {/* The request itself failed, so there are no server counts to show */}
            {importError ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <XCircle className="h-10 w-10 text-red-500" />
                <p className="text-sm font-medium text-red-700">Import failed</p>
                <p className="text-xs text-muted-foreground text-center max-w-md">{importError}</p>
              </div>
            ) : (
              <>
                {/* Summary cards straight from the import response */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                    <FileSpreadsheet className="h-6 w-6 text-slate-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-slate-700">{importSummary?.total ?? 0}</p>
                    <p className="text-xs text-slate-600">Total Rows</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-emerald-700">{importSummary?.created ?? 0}</p>
                    <p className="text-xs text-emerald-600">Created</p>
                  </div>
                  <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 text-center">
                    <Pencil className="h-6 w-6 text-sky-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-sky-700">{importSummary?.updated ?? 0}</p>
                    <p className="text-xs text-sky-600">Updated</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                    <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-amber-700">{importSummary?.skipped ?? 0}</p>
                    <p className="text-xs text-amber-600">Skipped</p>
                  </div>
                </div>

                {/* Errors reported per row by the server */}
                {importSummary?.errors && importSummary.errors.length > 0 && (
                  <div className="flex-1 overflow-auto border rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="bg-red-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-red-700">
                            Errors reported by the server ({importSummary.errors.length})
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {importSummary.errors.map((message, idx) => (
                          <tr key={`import-error-${idx}`} className="hover:bg-red-50/50">
                            <td className="px-3 py-2 text-red-600">{message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            <DialogFooter className="mt-4">
              <Button type="button" color="primary" onClick={onClose}>
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>

      {/* Remove Confirmation Dialog */}
      {rowToRemove !== null && (
        <Dialog open={rowToRemove !== null} onOpenChange={() => setRowToRemove(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirm Removal</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">Are you sure you want to remove this row from the import list?</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRowToRemove(null)}>Cancel</Button>
              <Button type="button" color="destructive" onClick={confirmRemoveRow}>Remove</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Set Default Values Confirmation Dialog */}
      {defaultModalState.isOpen && (
        <Dialog
          open={defaultModalState.isOpen}
          onOpenChange={(open) => {
            if (!open) setDefaultModalState({ isOpen: false })
          }}
        >
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Wand2 className="h-5 w-5 text-primary" />
                ยืนยันการตั้งค่าเริ่มต้น (Set Default Value)
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs">
              <p className="text-muted-foreground">
                ระบบจะนำค่าเริ่มต้นที่ระบุด้านล่างไปใส่ให้กับรายการที่มีข้อผิดพลาดโดยอัตโนมัติ เพื่อให้ข้อมูลถูกต้องและสามารถนำเข้าได้:
              </p>

              {/* Category Default */}
              {(!defaultModalState.targetColumn || defaultModalState.targetColumn === 'courseCategory') && (
                <div className="space-y-1.5 p-3 rounded-lg border bg-slate-50/70">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-slate-800">Category (หมวดหมู่วิชา)</Label>
                    {columnErrorCounts['courseCategory'] ? (
                      <Badge className="text-[10px] py-0 bg-red-100 text-red-700 hover:bg-red-100 border border-red-200">
                        พบข้อผิดพลาด {columnErrorCounts['courseCategory']} รายการ
                      </Badge>
                    ) : null}
                  </div>
                  <select
                    className="w-full h-8 text-xs px-2 rounded-md border border-input bg-background"
                    value={defaultCategory}
                    onChange={(e) => setDefaultCategory(e.target.value)}
                  >
                    <option value="" disabled>-- เลือก Category เริ่มต้น --</option>
                    {apiCategories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Course Type Default */}
              {(!defaultModalState.targetColumn || defaultModalState.targetColumn === 'courseType') && (
                <div className="space-y-1.5 p-3 rounded-lg border bg-slate-50/70">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-slate-800">Course Type (ประเภทหลักสูตร)</Label>
                    {columnErrorCounts['courseType'] ? (
                      <Badge className="text-[10px] py-0 bg-red-100 text-red-700 hover:bg-red-100 border border-red-200">
                        พบข้อผิดพลาด {columnErrorCounts['courseType']} รายการ
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex gap-4 pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="defaultType"
                        value="Initial"
                        checked={defaultType === 'Initial'}
                        onChange={() => setDefaultType('Initial')}
                        className="text-primary"
                      />
                      <span>Initial</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="defaultType"
                        value="Recurrent"
                        checked={defaultType === 'Recurrent'}
                        onChange={() => setDefaultType('Recurrent')}
                        className="text-primary"
                      />
                      <span>Recurrent</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Recurrence Default */}
              {(!defaultModalState.targetColumn || defaultModalState.targetColumn === 'recurrenceIntervalYears') && (
                <div className="space-y-1.5 p-3 rounded-lg border bg-slate-50/70">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-slate-800">Recurrence Interval (ปี - ทศนิยม 1 ตำแหน่ง)</Label>
                    {columnErrorCounts['recurrenceIntervalYears'] ? (
                      <Badge className="text-[10px] py-0 bg-red-100 text-red-700 hover:bg-red-100 border border-red-200">
                        พบข้อผิดพลาด {columnErrorCounts['recurrenceIntervalYears']} รายการ
                      </Badge>
                    ) : null}
                  </div>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    className="h-8 text-xs"
                    value={defaultRecurrence}
                    onChange={(e) => setDefaultRecurrence(Math.round(Number(e.target.value) * 10) / 10)}
                  />
                </div>
              )}

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={applyOnlyToErrors}
                    onChange={(e) => setApplyOnlyToErrors(e.target.checked)}
                    className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                  />
                  <span className="text-muted-foreground">
                    นำค่าเริ่มต้นไปใช้เฉพาะรายการที่เกิดข้อผิดพลาดเท่านั้น (แนะนำ)
                  </span>
                </label>
              </div>
            </div>

            <DialogFooter className="mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDefaultModalState({ isOpen: false })}
              >
                ยกเลิก
              </Button>
              <Button
                type="button"
                color="primary"
                onClick={handleApplyDefaultValues}
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                ยืนยันใช้ค่าเริ่มต้น
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}


    </Dialog>
  )
}
