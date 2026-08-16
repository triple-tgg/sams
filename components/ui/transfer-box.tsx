'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Package, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TransferBoxItem {
  id: number | string
  name: string
  groupKey: string
}

export interface TransferBoxProps {
  /** All available items */
  items: TransferBoxItem[]
  /** Currently selected item names */
  selected: Set<string>
  /** Callback when selection changes */
  onSelectedChange: (selected: Set<string>) => void
  /** Optional icon for the empty state */
  emptyIcon?: React.ReactNode
  /** Optional label for empty state */
  emptyLabel?: string
  /** Show validation error border */
  hasError?: boolean
  /** Optional class name for the outer container */
  className?: string
  /** Optional fixed height */
  height?: number | string
  /** Custom group label renderer for the selected (right) panel.
   *  Receives the groupKey and the items in that group.
   *  Defaults to the groupKey string. */
  renderSelectedGroupLabel?: (groupKey: string, groupItems: TransferBoxItem[]) => string
}

export function TransferBox({
  items,
  selected,
  onSelectedChange,
  emptyIcon,
  emptyLabel = 'No items selected',
  hasError = false,
  className,
  height = 280,
  renderSelectedGroupLabel,
}: TransferBoxProps) {
  const [leftChecked, setLeftChecked] = useState<Set<string>>(new Set())
  const [rightChecked, setRightChecked] = useState<Set<string>>(new Set())
  const [leftSearch, setLeftSearch] = useState('')
  const [rightSearch, setRightSearch] = useState('')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const availableItems = useMemo(() => items.filter(item => !selected.has(item.name)), [items, selected])
  const selectedItems = useMemo(() => items.filter(item => selected.has(item.name)), [items, selected])

  const filteredAvailable = useMemo(() => {
    const keyword = leftSearch.trim().toLowerCase()
    return keyword ? availableItems.filter(item => item.name.toLowerCase().includes(keyword)) : availableItems
  }, [availableItems, leftSearch])

  const filteredSelected = useMemo(() => {
    const keyword = rightSearch.trim().toLowerCase()
    return keyword ? selectedItems.filter(item => item.name.toLowerCase().includes(keyword)) : selectedItems
  }, [selectedItems, rightSearch])

  const groupedAvailable = useMemo(() => {
    const map = new Map<string, TransferBoxItem[]>()
    filteredAvailable.forEach(item => {
      if (!map.has(item.groupKey)) map.set(item.groupKey, [])
      map.get(item.groupKey)!.push(item)
    })
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [filteredAvailable])

  const groupedSelected = useMemo(() => {
    const map = new Map<string, TransferBoxItem[]>()
    filteredSelected.forEach(item => {
      if (!map.has(item.groupKey)) map.set(item.groupKey, [])
      map.get(item.groupKey)!.push(item)
    })
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [filteredSelected])

  const moveRight = () => {
    if (leftChecked.size === 0) return
    const next = new Set(selected)
    leftChecked.forEach(name => next.add(name))
    onSelectedChange(next)
    setLeftChecked(new Set())
  }

  const moveLeft = () => {
    if (rightChecked.size === 0) return
    const next = new Set(selected)
    rightChecked.forEach(name => next.delete(name))
    onSelectedChange(next)
    setRightChecked(new Set())
  }

  const toggleLeftAll = () => {
    if (leftChecked.size === filteredAvailable.length && filteredAvailable.length > 0) {
      setLeftChecked(new Set())
    } else {
      setLeftChecked(new Set(filteredAvailable.map(o => o.name)))
    }
  }

  const toggleRightAll = () => {
    if (rightChecked.size === filteredSelected.length && filteredSelected.length > 0) {
      setRightChecked(new Set())
    } else {
      setRightChecked(new Set(filteredSelected.map(o => o.name)))
    }
  }

  const leftAllChecked = filteredAvailable.length > 0 && leftChecked.size === filteredAvailable.length
  const rightAllChecked = filteredSelected.length > 0 && rightChecked.size === filteredSelected.length

  return (
    <div
      className={cn(
        "flex gap-2 rounded-lg border p-1",
        hasError ? "border-red-400 ring-1 ring-red-100" : "border-slate-200",
        className,
      )}
      style={{ height }}
    >
      {/* Left Panel — Available */}
      <div className="flex flex-1 flex-col min-h-0 rounded-md border border-slate-200 bg-slate-50/50">
        {/* Header + Search */}
        <div className="flex items-center gap-2 border-b border-slate-200 px-2 py-1.5">
          <button type="button" onClick={toggleLeftAll} className="flex items-center justify-center shrink-0">
            <CheckboxIndicator checked={leftAllChecked} indeterminate={!leftAllChecked && leftChecked.size > 0} />
          </button>
          <span className="text-[10px] font-bold text-slate-500 shrink-0">{availableItems.length} items</span>
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={leftSearch}
              onChange={e => setLeftSearch(e.target.value)}
              placeholder="Search..."
              className="h-7 w-full rounded border border-slate-200 bg-white pl-7 pr-2 text-[11px] outline-none focus:border-blue-400"
            />
          </div>
        </div>
        {/* List */}
        <div className="flex-1 min-h-0 overflow-y-auto px-1 py-1">
          {groupedAvailable.length > 0 ? groupedAvailable.map(([groupKey, groupItems]) => (
            <div key={groupKey} className="mb-2">
              <h4 className="px-1.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">{groupKey}</h4>
              {groupItems.map(item => {
                const checked = leftChecked.has(item.name)
                return (
                  <TransferItem
                    key={item.id}
                    name={item.name}
                    checked={checked}
                    variant="available"
                    onClick={() => setLeftChecked(prev => {
                      const next = new Set(prev)
                      checked ? next.delete(item.name) : next.add(item.name)
                      return next
                    })}
                  />
                )
              })}
            </div>
          )) : (
            <p className="px-2 py-6 text-center text-[11px] text-slate-400">No items available</p>
          )}
        </div>
      </div>

      {/* Center — Transfer Arrows */}
      <div className="flex flex-col items-center justify-center gap-2 px-1">
        <button
          type="button"
          disabled={leftChecked.size === 0}
          onClick={moveRight}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 disabled:opacity-30 shadow-sm"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={rightChecked.size === 0}
          onClick={moveLeft}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 disabled:opacity-30 shadow-sm"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Right Panel — Selected */}
      <div className="flex flex-1 flex-col min-h-0 rounded-md border border-slate-200 bg-white">
        {/* Header + Search */}
        <div className="flex items-center gap-2 border-b border-slate-200 px-2 py-1.5">
          <button type="button" onClick={toggleRightAll} className="flex items-center justify-center shrink-0">
            <CheckboxIndicator checked={rightAllChecked} indeterminate={!rightAllChecked && rightChecked.size > 0} />
          </button>
          <span className="text-[10px] font-bold text-blue-600 shrink-0">{selectedItems.length} selected</span>
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={rightSearch}
              onChange={e => setRightSearch(e.target.value)}
              placeholder="Search..."
              className="h-7 w-full rounded border border-slate-200 bg-white pl-7 pr-2 text-[11px] outline-none focus:border-blue-400"
            />
          </div>
        </div>
        {/* List */}
        <div className="flex-1 min-h-0 overflow-y-auto px-1 py-1">
          {groupedSelected.length > 0 ? groupedSelected.map(([groupKey, groupItems]) => {
            const isCollapsed = collapsedGroups.has(groupKey)
            return (
              <div key={groupKey} className="mb-2">
                <button
                  type="button"
                  onClick={() => setCollapsedGroups(prev => {
                    const next = new Set(prev)
                    isCollapsed ? next.delete(groupKey) : next.add(groupKey)
                    return next
                  })}
                  className="w-full flex items-center gap-1 px-1.5 py-1 rounded hover:bg-blue-50/50 transition-colors group"
                >
                  <ChevronDown className={cn("h-3 w-3 text-blue-400 transition-transform", isCollapsed && "-rotate-90")} />
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wide flex-1 text-left">
                    {renderSelectedGroupLabel ? renderSelectedGroupLabel(groupKey, groupItems) : groupKey}
                  </span>
                  <span className="text-[9px] text-blue-300 font-medium">{groupItems.length}</span>
                </button>
                {!isCollapsed && groupItems.map(item => {
                  const checked = rightChecked.has(item.name)
                  return (
                    <TransferItem
                      key={item.id}
                      name={item.name}
                      checked={checked}
                      variant="selected"
                      onClick={() => setRightChecked(prev => {
                        const next = new Set(prev)
                        checked ? next.delete(item.name) : next.add(item.name)
                        return next
                      })}
                    />
                  )
                })}
              </div>
            )
          }) : (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              {emptyIcon || <Package className="h-8 w-8 mb-2 opacity-30" />}
              <p className="text-[11px]">{emptyLabel}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────── */

function CheckboxIndicator({ checked, indeterminate }: { checked: boolean; indeterminate: boolean }) {
  return (
    <div
      className={cn(
        "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all",
        checked ? "bg-blue-600 border-blue-600" : indeterminate ? "bg-blue-100 border-blue-400" : "bg-white border-slate-300",
      )}
    >
      {checked && (
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
      {indeterminate && <div className="w-2 h-0.5 bg-blue-600 rounded" />}
    </div>
  )
}

function TransferItem({
  name,
  checked,
  variant,
  onClick,
}: {
  name: string
  checked: boolean
  variant: 'available' | 'selected'
  onClick: () => void
}) {
  const isAvailable = variant === 'available'
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-[11px] transition-all",
        checked
          ? isAvailable
            ? "bg-blue-50 text-blue-700 font-semibold"
            : "bg-red-50 text-red-700 font-semibold"
          : "text-slate-700 hover:bg-slate-100",
      )}
    >
      <div
        className={cn(
          "w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all",
          checked
            ? isAvailable
              ? "bg-blue-600 border-blue-600"
              : "bg-red-500 border-red-500"
            : "bg-white border-slate-300",
        )}
      >
        {checked && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className="truncate">{name}</span>
    </button>
  )
}
