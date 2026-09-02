'use client'

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, ArrowLeft, Loader2, Trash2, Pencil } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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

/** Detect if course is Recurrent from name or explicit field */
function detectCourseType(row: ParsedCourseRow): 'Recurrent' | 'Initial' {
  if (row.courseType?.toLowerCase().includes('recur')) return 'Recurrent'
  if (row.courseName?.toLowerCase().includes('recurrent')) return 'Recurrent'
  return 'Initial'
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
          const courseType = String(row['coursetype'] || row['type'] || '').trim()
          const recurrenceRaw = row['recurrenceintervalyears'] || row['recurrence']
          const recurrenceIntervalYears = recurrenceRaw ? Number(recurrenceRaw) : null
          const additionalNote = String(row['additionalnote'] || row['note'] || '').trim()

          const errors: string[] = []
          if (!courseCode) errors.push('Missing courseCode')
          if (!courseName) errors.push('Missing courseName')
          
          if (courseCategory) {
            const isValidCategory = apiCategories.some(c => c.name.toLowerCase() === courseCategory.toLowerCase())
            if (!isValidCategory) {
              errors.push(`Invalid Category: "${courseCategory}"`)
            }
          } else {
            errors.push('Missing Category')
          }

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

  // Auto-parse file on mount
  useEffect(() => {
    if (initialFile && step === 'upload') {
      handleFile(initialFile)
    }
  }, [initialFile])

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
    setRowToRemove(rowIndex)
  }, [])

  const confirmRemoveRow = useCallback(() => {
    if (rowToRemove !== null) {
      setRows(prev => prev.filter(r => r.rowIndex !== rowToRemove))
      setRowToRemove(null)
    }
  }, [rowToRemove])

  const handleSaveEditRow = useCallback((updatedRow: ParsedCourseRow) => {
    // Re-validate the row
    const errors: string[] = []
    if (!updatedRow.courseCode) errors.push('Missing courseCode')
    if (!updatedRow.courseName) errors.push('Missing courseName')
    
    if (updatedRow.courseCategory) {
      const isValidCategory = apiCategories.some(c => c.name.toLowerCase() === updatedRow.courseCategory.toLowerCase())
      if (!isValidCategory) {
        errors.push(`Invalid Category: "${updatedRow.courseCategory}"`)
      }
    } else {
      errors.push('Missing Category')
    }

    updatedRow.errors = errors
    updatedRow.isValid = errors.length === 0

    setRows(prev => prev.map(r => r.rowIndex === updatedRow.rowIndex ? updatedRow : r))
    setEditingRow(null)
  }, [apiCategories])

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
          recurrenceIntervalYears: detectedType === 'Recurrent'
            ? (row.recurrenceIntervalYears ?? 2)
            : null,
          additionalNote: combinedNote,
          aircraftTypeLicenseId: null,
          courseObjective: row.courseObjective || '',
          courseDuration: row.courseDuration || null,
          courseSyllabus: row.courseSyllabus || null,
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
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground w-10">#</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground w-12">Status</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground min-w-[120px]">Course Code</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground min-w-[250px]">Course Name</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground min-w-[200px]">Objective</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground min-w-[150px]">Category</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground min-w-[100px]">Type</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground min-w-[80px]">Recurrence</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground min-w-[80px]">Duration</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground min-w-[260px]">Syllabus</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground min-w-[140px]">Note</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((row) => {
                    const type = detectCourseType(row)
                    const isEditing = editingRow?.rowIndex === row.rowIndex

                    if (isEditing) {
                      return (
                        <tr key={row.rowIndex} className="bg-slate-50/50">
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
                          <td className="px-1 py-1">
                            <Input className="h-7 text-xs px-2 w-full" value={editingRow.courseCode} onChange={e => setEditingRow({...editingRow, courseCode: e.target.value})} />
                          </td>
                          <td className="px-1 py-1">
                            <Input className="h-7 text-xs px-2 w-full" value={editingRow.courseName} onChange={e => setEditingRow({...editingRow, courseName: e.target.value})} />
                          </td>
                          <td className="px-1 py-1">
                            <Textarea className="min-h-7 h-7 text-xs px-2 py-1 w-full" value={editingRow.courseObjective} onChange={e => setEditingRow({...editingRow, courseObjective: e.target.value})} />
                          </td>
                          <td className="px-1 py-1">
                            <select 
                              className="h-7 text-xs px-2 w-full rounded-md border border-input bg-background"
                              value={editingRow.courseCategory} 
                              onChange={e => setEditingRow({...editingRow, courseCategory: e.target.value})}
                            >
                              <option value="" disabled>Select category...</option>
                              {apiCategories.map(cat => (
                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-1 py-1">
                            <Input className="h-7 text-xs px-2 w-full" value={editingRow.courseType} onChange={e => setEditingRow({...editingRow, courseType: e.target.value})} />
                          </td>
                          <td className="px-1 py-1">
                            <Input type="number" className="h-7 text-xs px-2 w-full min-w-[60px]" value={editingRow.recurrenceIntervalYears || ''} onChange={e => setEditingRow({...editingRow, recurrenceIntervalYears: e.target.value ? Number(e.target.value) : null})} />
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
                          <td className="px-3 py-2 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleSaveEditRow(editingRow)}
                              className="p-1 rounded hover:bg-emerald-100 text-muted-foreground hover:text-emerald-600 transition-colors mr-1"
                              title="Save row"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingRow(null)}
                              className="p-1 rounded hover:bg-slate-200 text-muted-foreground hover:text-slate-600 transition-colors"
                              title="Cancel edit"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      )
                    }

                    return (
                      <tr
                        key={row.rowIndex}
                        className={`transition-colors ${row.isValid
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
                        <td className="px-3 py-2 max-w-[200px] truncate" title={row.courseName}>
                          {row.courseName || <span className="text-red-400 italic">empty</span>}
                        </td>
                        <td className="px-3 py-2 max-w-[180px] truncate" title={row.courseObjective}>
                          {row.courseObjective || <span className="text-muted-foreground">-</span>}
                        </td>
                        <td className="px-3 py-2">
                          {row.courseCategory ? (
                            <Badge className="text-[10px] px-1.5 py-0.5 bg-violet-100 text-violet-700 hover:bg-violet-100">
                              {row.courseCategory}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <Badge
                            className={`text-[10px] px-1.5 py-0.5 ${type === 'Recurrent'
                              ? 'bg-sky-100 text-sky-700 hover:bg-sky-100'
                              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                              }`}
                          >
                            {type === 'Recurrent' ? 'Recurrent' : 'Initial'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {row.recurrenceIntervalYears != null
                            ? `${row.recurrenceIntervalYears} yr${row.recurrenceIntervalYears !== 1 ? 's' : ''}`
                            : '-'}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground max-w-[140px] truncate" title={row.courseDuration}>
                          {row.courseDuration || '-'}
                        </td>
                        <td className="px-3 py-2 max-w-[160px] truncate" title={row.courseSyllabus}>
                          {row.courseSyllabus || <span className="text-muted-foreground">-</span>}
                        </td>
                        <td className="px-3 py-2 max-w-[140px] truncate" title={row.additionalNote}>
                          {row.additionalNote || <span className="text-muted-foreground">-</span>}
                        </td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">
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


    </Dialog>
  )
}
