'use client'

import { useMemo, useState, useEffect } from 'react'
import { Search, RotateCw, CalendarClock, Filter, ChevronLeft, ChevronRight, MoreHorizontal, Edit2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { STAFF } from '../../data-v2'
import { SAMS_STATUS_META } from '../../types-v2'
import type { SamsAuthStatus, Staff } from '../../types-v2'
import { getSamsStatus, daysLeft, fmtDate } from '../../utils'

type FilterStatus = 'all' | 'valid' | 'expiring' | 'expired'

const AIRCRAFT_OPTIONS = [
  'A318/A319/A320/A321',
  'A320 Family (CEO/NEO)',
  'A330-200/300',
  'A330-200/300/800/900',
  'A340-500/600',
  'A350-900/1000',
  'B737-300/400/500',
  'B737-600/700/800/900',
  'B737-600/700/800/900 (CFM56)',
  'B737-7/8/9',
  'B737 MAX',
  'B767-200/300',
  'B777-200/300',
  'B777-200/300/300ER',
  'B777-200ER/300ER',
  'B787',
  'B787-8/9/10',
  'ERJ-190'
]

export function SamsAuthTab() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterStatus>('all')

  const [version, setVersion] = useState(0)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [editAuthNo, setEditAuthNo] = useState('')
  const [editRating, setEditRating] = useState<Set<string>>(new Set())
  const [editAmelExp, setEditAmelExp] = useState('')
  const [editInitDate, setEditInitDate] = useState('')
  const [editCurrDate, setEditCurrDate] = useState('')
  const [editSamsExp, setEditSamsExp] = useState('')

  const handleEditClick = (staff: Staff) => {
    setSelectedStaff(staff)
    setEditAuthNo(staff.authNo)
    const ratings = staff.rating ? staff.rating.split(/\n/).map(r => r.trim()).filter(Boolean) : []
    setEditRating(new Set(ratings))
    setEditAmelExp(staff.amelExp)
    setEditInitDate(staff.initDate)
    setEditCurrDate(staff.currDate)
    setEditSamsExp(staff.samsExp)
  }

  const filtered = useMemo(() => {
    let list = [...STAFF]

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.id.includes(q) ||
        s.authNo.toLowerCase().includes(q)
      )
    }

    if (filter !== 'all') {
      list = list.filter(s => getSamsStatus(s) === filter)
    }

    return list
  }, [search, filter, version])

  // Pagination states
  const [pageIndex, setPageIndex] = useState(0)
  const pageSize = 15

  // Reset page to 0 when filters change
  useEffect(() => {
    setPageIndex(0)
  }, [search, filter])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginatedStaff = filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)

  const getPageNumbers = () => {
    const pages = []
    for (let i = 0; i < totalPages; i++) {
        if (i === 0 || i === totalPages - 1 || (i >= pageIndex - 1 && i <= pageIndex + 1)) {
            pages.push(i)
        } else if (i === pageIndex - 2 || i === pageIndex + 2) {
            pages.push(-1)
        }
    }
    return pages.filter((p, index, arr) => p !== -1 || arr[index - 1] !== -1)
  }

  const counts = useMemo(() => ({
    all: STAFF.length,
    valid: STAFF.filter(s => getSamsStatus(s) === 'valid').length,
    expiring: STAFF.filter(s => getSamsStatus(s) === 'expiring').length,
    expired: STAFF.filter(s => getSamsStatus(s) === 'expired').length,
  }), [])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-foreground">SAMs Authorization</h2>

        {/* ── Filter Bar ── */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, ID, Auth No..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 text-xs border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64"
          />
        </div>

        <div className="w-[180px]">
          <Select value={filter} onValueChange={(v) => setFilter(v as FilterStatus)}>
            <SelectTrigger className="bg-white border-border h-[38px] text-xs font-semibold px-3">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                <SelectValue placeholder="เลือกสถานะ" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด ({counts['all']})</SelectItem>
              <SelectItem value="valid">Valid ({counts['valid']})</SelectItem>
              <SelectItem value="expiring">Expiring ({counts['expiring']})</SelectItem>
              <SelectItem value="expired">Expired ({counts['expired']})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <span className="ml-auto text-[10px] text-muted-foreground hidden">
          แสดง {filtered.length} จาก {STAFF.length} รายการ
        </span>
      </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-border overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-border">
                <th className="px-3 py-2.5 text-left text-muted-foreground font-bold text-[10px] uppercase tracking-wider w-10">#</th>
                <th className="px-3 py-2.5 text-left text-muted-foreground font-bold text-[10px] uppercase tracking-wider" style={{ minWidth: 220 }}>Employee Name</th>
                <th className="px-3 py-2.5 text-left text-muted-foreground font-bold text-[10px] uppercase tracking-wider" style={{ minWidth: 150 }}>Auth No.</th>
                <th className="px-3 py-2.5 text-left text-muted-foreground font-bold text-[10px] uppercase tracking-wider" style={{ minWidth: 180 }}>Rating (AMEL)</th>
                <th className="px-3 py-2.5 text-center text-muted-foreground font-bold text-[10px] uppercase tracking-wider" style={{ minWidth: 90 }}>AMEL Exp.</th>
                <th className="px-3 py-2.5 text-center text-muted-foreground font-bold text-[10px] uppercase tracking-wider" style={{ minWidth: 90 }}>Initial Issue</th>
                <th className="px-3 py-2.5 text-center text-muted-foreground font-bold text-[10px] uppercase tracking-wider" style={{ minWidth: 90 }}>Current Issue</th>
                <th className="px-3 py-2.5 text-center text-muted-foreground font-bold text-[10px] uppercase tracking-wider" style={{ minWidth: 100 }}>Expiry Date</th>
                <th className="px-3 py-2.5 text-center text-muted-foreground font-bold text-[10px] uppercase tracking-wider" style={{ minWidth: 110 }}>Status</th>
                <th className="px-3 py-2.5 text-center text-muted-foreground font-bold text-[10px] uppercase tracking-wider w-16 sticky right-0 bg-slate-50 shadow-[-1px_0_0_0_#e2e8f0] z-10">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStaff.map((s, ri) => {
                const st = getSamsStatus(s)
                const d = daysLeft(s.samsExp)
                const meta = SAMS_STATUS_META[st]
                return (
                  <tr
                    key={s.id}
                    className={`border-b border-border/50 transition-colors hover:bg-blue-50 group ${
                      ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    }`}
                  >
                    {/* # */}
                    <td className="px-3 py-2.5 text-muted-foreground font-semibold">{s.no}</td>
                    {/* Staff */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                          style={{ background: s.color }}
                        >
                          {s.name.split(' ').pop()?.[0] || s.name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground leading-tight">{s.name}</p>
                          <p className="text-[10px] text-primary font-bold">{s.id}</p>
                        </div>
                      </div>
                    </td>
                    {/* Auth No */}
                    <td className="px-3 py-2.5 font-bold text-[11px] text-slate-700">{s.authNo}</td>
                    {/* Rating */}
                    <td className="px-3 py-2.5 text-muted-foreground">
                      <div className="text-[10px] leading-relaxed whitespace-pre-line">{s.rating}</div>
                    </td>
                    {/* AMEL Exp */}
                    <td className="px-3 py-2.5 text-center text-muted-foreground">{fmtDate(s.amelExp)}</td>
                    {/* Initial Issue */}
                    <td className="px-3 py-2.5 text-center text-muted-foreground">{fmtDate(s.initDate)}</td>
                    {/* Current Issue */}
                    <td className="px-3 py-2.5 text-center text-muted-foreground">{fmtDate(s.currDate)}</td>
                    {/* SAMS Exp */}
                    <td className="px-3 py-2.5 text-center font-semibold" style={{ color: meta.text }}>
                      {fmtDate(s.samsExp)}
                    </td>
                    {/* Status */}
                    <td className="px-3 py-2.5 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold" style={{ background: meta.bg, color: meta.text }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.dot }} />
                        {meta.label}
                        {st === 'expiring' && <span className="text-[9px] opacity-80">({d}d)</span>}
                        {st === 'expired' && <span className="text-[9px] opacity-80">({Math.abs(d)}d)</span>}
                      </div>
                    </td>
                    {/* Action */}
                    <td className={`px-3 py-2.5 text-center sticky right-0 shadow-[-1px_0_0_0_#f1f5f9] transition-colors ${
                      ri % 2 === 0 ? 'bg-white group-hover:bg-blue-50' : 'bg-slate-50 group-hover:bg-blue-50'
                    }`}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-md hover:bg-slate-200 mx-auto block">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditClick(s)} className="text-xs font-semibold cursor-pointer">
                            <Edit2 className="w-3.5 h-3.5 mr-2" />
                            แก้ไขข้อมูล
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    ไม่พบข้อมูลที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Footer */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-white">
            <div className="text-xs font-medium text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{filtered.length === 0 ? 0 : pageIndex * pageSize + 1}</span> to <span className="font-semibold text-foreground">{Math.min((pageIndex + 1) * pageSize, filtered.length)}</span> of <span className="font-semibold text-foreground">{filtered.length}</span> entries
            </div>
            
            {totalPages > 1 && (
                <Pagination className="w-auto mx-0">
                    <PaginationContent className="gap-1.5">
                        <PaginationItem>
                            <PaginationLink 
                                href="#" 
                                onClick={(e) => { e.preventDefault(); setPageIndex(p => Math.max(0, p - 1)) }}
                                className={cn("w-8 h-8 p-0 rounded-md transition-all flex items-center justify-center", 
                                    pageIndex === 0 
                                        ? "pointer-events-none opacity-50 border border-slate-200 text-slate-400 bg-slate-50" 
                                        : "border border-slate-300 text-slate-600 bg-white hover:bg-slate-100 hover:text-slate-900"
                                )}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </PaginationLink>
                        </PaginationItem>
                        
                        {getPageNumbers().map((p, idx) => (
                            <PaginationItem key={idx} className="hidden sm:inline-block">
                                {p === -1 ? (
                                    <PaginationEllipsis className="w-8 h-8" />
                                ) : (
                                    <PaginationLink 
                                        href="#" 
                                        isActive={pageIndex === p}
                                        onClick={(e) => { e.preventDefault(); setPageIndex(p) }}
                                        className={cn("w-8 h-8 p-0 rounded-md transition-all font-semibold text-xs flex items-center justify-center", 
                                            pageIndex === p 
                                                ? "bg-primary text-white border border-primary shadow-md hover:bg-primary/90 hover:text-white" 
                                                : "bg-white text-slate-700 border border-slate-700 hover:bg-slate-100 hover:text-slate-900"
                                        )}
                                    >
                                        {p + 1}
                                    </PaginationLink>
                                )}
                            </PaginationItem>
                        ))}

                        <PaginationItem>
                            <PaginationLink 
                                href="#" 
                                onClick={(e) => { e.preventDefault(); setPageIndex(p => Math.min(totalPages - 1, p + 1)) }}
                                className={cn("w-8 h-8 p-0 rounded-md transition-all flex items-center justify-center", 
                                    pageIndex >= totalPages - 1 
                                        ? "pointer-events-none opacity-50 border border-slate-200 text-slate-400 bg-slate-50" 
                                        : "border border-slate-700 text-slate-700 bg-white hover:bg-slate-100 hover:text-slate-900"
                                )}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </PaginationLink>
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={!!selectedStaff} onOpenChange={(open) => !open && setSelectedStaff(null)}>
        <DialogContent className="max-w-[650px] p-0 overflow-hidden border-border/60 shadow-2xl bg-white">
          {selectedStaff && (
            <>
              <div className="px-5 pt-5 pb-4 border-b border-border/60 bg-slate-50">
                <div className="flex items-center justify-between mb-1">
                  <DialogTitle className="text-lg font-bold text-slate-800">
                    {selectedStaff.name}
                  </DialogTitle>
                </div>
                <p className="text-xs font-semibold text-slate-500">
                  {selectedStaff.id} • License {selectedStaff.license}
                </p>
              </div>

              <div className="px-5 py-4 space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  {/* Left Column: Form Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1.5 block">Auth No.</label>
                      <input type="text" value={editAuthNo} onChange={e => setEditAuthNo(e.target.value)} className="w-full bg-white font-semibold text-sm border border-border/60 rounded-md px-3 py-1.5 focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1.5 block">AMEL Expire</label>
                      <input type="date" value={editAmelExp} disabled className="w-full bg-slate-100 text-slate-500 font-semibold text-sm border border-border/60 rounded-md px-3 py-1.5 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1.5 block">Date of Initial Issue</label>
                      <input type="date" value={editInitDate} disabled className="w-full bg-slate-100 text-slate-500 font-semibold text-sm border border-border/60 rounded-md px-3 py-1.5 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1.5 block">Date of Current Issue</label>
                      <input type="date" value={editCurrDate} onChange={e => setEditCurrDate(e.target.value)} className="w-full bg-white font-semibold text-sm border border-border/60 rounded-md px-3 py-1.5 focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1.5 block">Date of Expire (SAMS)</label>
                      <input type="date" value={editSamsExp} onChange={e => setEditSamsExp(e.target.value)} className="w-full bg-white font-semibold text-sm border border-border/60 rounded-md px-3 py-1.5 focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>

                  {/* Right Column: Aircraft checkboxes */}
                  <div className="flex flex-col h-[340px]">
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">Rating (AMEL)</label>
                    <div className="flex-1 bg-white border border-border/60 rounded-md p-1.5 overflow-y-auto">
                      <div className="space-y-0.5 pr-1">
                        {AIRCRAFT_OPTIONS.map(opt => {
                          const isSelected = editRating.has(opt)
                          return (
                            <div
                              key={opt}
                              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left text-sm cursor-not-allowed ${
                                isSelected ? 'bg-slate-200/60 text-slate-700 font-semibold' : 'text-slate-400'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-slate-400 border-slate-400' : 'bg-slate-100 border-slate-200'
                              }`}>
                                {isSelected && (
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <span className="truncate text-xs font-medium leading-tight">{opt}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="px-5 py-4 border-t border-border/60 bg-slate-50">
                <Button variant="outline" onClick={() => setSelectedStaff(null)} className="font-bold">
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    selectedStaff.authNo = editAuthNo
                    selectedStaff.rating = Array.from(editRating).join('\n')
                    selectedStaff.amelExp = editAmelExp
                    selectedStaff.initDate = editInitDate
                    selectedStaff.currDate = editCurrDate
                    selectedStaff.samsExp = editSamsExp
                    setVersion(v => v + 1)
                    setSelectedStaff(null)
                  }}
                  className="font-bold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
