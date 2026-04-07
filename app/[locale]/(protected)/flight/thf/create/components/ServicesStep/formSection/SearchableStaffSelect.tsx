import React, { useState, useMemo, useRef, useEffect } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ServicesFormInputs } from '../types'
import { useStaff } from '@/lib/api/hooks/useStaff'
import { FlightFormData } from '@/lib/api/hooks/uselineMaintenancesQueryThfByFlightId'
import { dateTimeUtils } from '@/lib/dayjs'
import { formatFromPicker } from '@/lib/utils/formatPicker'
import dayjs from 'dayjs'
import { Search, Loader2 } from 'lucide-react'

// Component for searchable staff selection
const SearchableStaffSelect: React.FC<{
  form: UseFormReturn<ServicesFormInputs>
  index: number
  onStaffSelect: (staff: any) => void;
  infoData: FlightFormData | null;
}> = ({ form, index, onStaffSelect, infoData }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showResults, setShowResults] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Get current personnel list to exclude already selected staff
  const personnel = form.watch('personnel') || []
  const existingStaffIds = personnel.map(p => p.staffId).filter(Boolean)

  // Always fetch all staff (enabled: true, empty search) — filter client-side
  const { data: staffData, isLoading } = useStaff(
    { code: '', name: '', id: '' },
    true
  )

  // Transform and filter staff options based on search term
  const staffOptions = useMemo(() => {
    if (!staffData?.responseData) return []

    const term = searchTerm.trim().toLowerCase()

    return staffData.responseData
      .filter(staff => !existingStaffIds.includes(staff.id)) // Exclude already selected
      .filter(staff => {
        if (!term) return true // No search → show all
        return (
          staff.code.toLowerCase().includes(term) ||
          staff.name.toLowerCase().includes(term)
        )
      })
      .map(staff => ({
        value: staff.code,
        label: `${staff.code} - ${staff.name}`,
        staff: staff
      }))
  }, [staffData, existingStaffIds, searchTerm])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleStaffSelection = (staffCode: string) => {
    const selectedStaff = staffData?.responseData.find(staff => staff.code === staffCode)
    if (selectedStaff) {
      // Check if staff is already selected (extra validation)
      if (existingStaffIds.includes(selectedStaff.id)) {
        alert('This staff member has already been added to the personnel list.')
        return
      }

      // Set form values
      form.setValue(`personnel.${index}.staffId`, selectedStaff.id)
      form.setValue(`personnel.${index}.staffCode`, selectedStaff.code)
      form.setValue(`personnel.${index}.name`, selectedStaff.name)
      form.setValue(`personnel.${index}.type`, selectedStaff.position.code)

      // Resolve From defaults
      const resolvedFromDate = infoData?.arrivalDate || dateTimeUtils.getCurrentDate()
      const resolvedFromTime = infoData?.ata || dayjs().format('HH:mm')

      // Resolve To defaults — ensure To is not before From
      let resolvedToDate = infoData?.departureDate || resolvedFromDate
      let resolvedToTime = infoData?.atd || resolvedFromTime

      // Sanity check: if To datetime is before From datetime, fall back to From values
      const fromDT = dayjs(`${resolvedFromDate} ${resolvedFromTime}`, 'YYYY-MM-DD HH:mm')
      const toDT = dayjs(`${resolvedToDate} ${resolvedToTime}`, 'YYYY-MM-DD HH:mm')
      if (toDT.isValid() && fromDT.isValid() && toDT.isBefore(fromDT)) {
        resolvedToDate = resolvedFromDate
        resolvedToTime = resolvedFromTime
      }

      form.setValue(`personnel.${index}.formDate`, formatFromPicker(resolvedFromDate))
      form.setValue(`personnel.${index}.formTime`, resolvedFromTime)
      form.setValue(`personnel.${index}.toDate`, formatFromPicker(resolvedToDate))
      form.setValue(`personnel.${index}.toTime`, resolvedToTime)

      // Clear search
      setSearchTerm('')
      setShowResults(false)

      onStaffSelect(selectedStaff)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search staff by code or name..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setShowResults(true)
          }}
          onFocus={() => setShowResults(true)}
          className="pl-9"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Dropdown results */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
          {isLoading ? (
            <div className="p-3 text-sm text-gray-500 text-center flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading staff...
            </div>
          ) : staffOptions.length > 0 ? (
            <div className="py-1">
              <div className="px-3 py-1.5 text-xs text-muted-foreground border-b bg-slate-50">
                {searchTerm.trim()
                  ? `${staffOptions.length} result(s) found`
                  : `All staff (${staffOptions.length})`
                }
              </div>
              {staffOptions.map((option) => (
                <div
                  key={option.value}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors"
                  onClick={() => handleStaffSelection(option.value)}
                >
                  <div className="font-medium text-sm text-gray-900">{option.staff.name}</div>
                  <div className="text-xs text-gray-500">
                    Code: <span className="">{option.staff.code}</span> |
                    Position: <span className="font-semibold">{option.staff.position.code}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : staffData?.responseData && staffData.responseData.length > 0 ? (
            <div className="p-3 text-sm text-amber-600 text-center">
              <div className="font-medium">
                {searchTerm.trim()
                  ? `No matching staff for "${searchTerm}"`
                  : 'All staff already added'
                }
              </div>
            </div>
          ) : (
            <div className="p-3 text-sm text-gray-500 text-center">
              No staff found
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchableStaffSelect