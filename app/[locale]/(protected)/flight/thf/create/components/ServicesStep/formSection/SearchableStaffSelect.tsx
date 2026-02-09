import React, { useState, useMemo } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ServicesFormInputs } from '../types'
import { useStaff } from '@/lib/api/hooks/useStaff'
import { FlightFormData } from '@/lib/api/hooks/uselineMaintenancesQueryThfByFlightId'
import { dateTimeUtils } from '@/lib/dayjs'
import { formatFromPicker } from '@/lib/utils/formatPicker'
import dayjs from 'dayjs'

// Component for searchable staff selection
const SearchableStaffSelect: React.FC<{
  form: UseFormReturn<ServicesFormInputs>
  index: number
  onStaffSelect: (staff: any) => void;
  infoData: FlightFormData | null;
}> = ({ form, index, onStaffSelect, infoData }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchBy, setSearchBy] = useState<'code' | 'name'>('code')
  const [showResults, setShowResults] = useState(false)

  // Get current personnel list to exclude already selected staff
  const personnel = form.watch('personnel') || []
  const existingStaffIds = personnel.map(p => p.staffId).filter(Boolean)

  // Get staff data based on search criteria
  const { data: staffData, isLoading } = useStaff(
    {
      code: searchBy === 'code' ? searchTerm : '',
      name: searchBy === 'name' ? searchTerm : '',
      id: ''
    },
    searchTerm.length > 1 // Only search when there are at least 2 characters
  )

  // Transform staff data to options and filter out already selected staff
  const staffOptions = useMemo(() => {
    if (!staffData?.responseData) return []

    return staffData.responseData
      .filter(staff => !existingStaffIds.includes(staff.id)) // Filter out already selected staff
      .map(staff => ({
        value: staff.code,
        label: `${staff.code} - ${staff.name}`,
        staff: staff
      }))
  }, [staffData, existingStaffIds])

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

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setShowResults(value.length > 1)
  }

  // Get current selected staff info
  const currentStaffId = form.watch(`personnel.${index}.staffId`)
  const currentStaffName = form.watch(`personnel.${index}.name`)

  return (
    <div className="space-y-2 relative">
      {/* Current selection display */}
      {currentStaffId && currentStaffName && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-green-800">
                Selected: {currentStaffName}
              </div>
              <div className="text-xs text-green-600">
                ID: {currentStaffId}
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                form.setValue(`personnel.${index}.staffId`, 0)
                form.setValue(`personnel.${index}.name`, '')
                form.setValue(`personnel.${index}.type`, '')
              }}
              className="text-xs"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Search controls */}
      <div className="flex gap-2">
        <Select value={searchBy} onValueChange={(value: 'code' | 'name') => setSearchBy(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="code">By Code</SelectItem>
            <SelectItem value="name">By Name</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1 relative">
          <Input
            placeholder={`Search staff by ${searchBy}... (min 2 chars)`}
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => searchTerm.length > 1 && setShowResults(true)}
            className="flex-1"
          />

          {/* Search results dropdown */}
          {showResults && searchTerm.length > 1 && (
            <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
              {isLoading ? (
                <div className="p-3 text-sm text-gray-500 text-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mx-auto mb-2"></div>
                  Searching staff...
                </div>
              ) : staffOptions.length > 0 ? (
                <div className="py-1">
                  {staffOptions.map((option) => (
                    <div
                      key={option.value}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                      onClick={() => handleStaffSelection(option.value)}
                    >
                      <div className="font-medium text-gray-900">{option.staff.name}</div>
                      <div className="text-sm text-gray-500">
                        Code: <span className="font-mono">{option.staff.code}</span> |
                        Position: <span className="font-semibold">{option.staff.position.code}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : staffData?.responseData && staffData.responseData.length > 0 ? (
                <div className="p-3 text-sm text-amber-600 text-center">
                  <div className="font-medium">All matching staff already added</div>
                  <div className="text-xs mt-1">
                    Found {staffData.responseData.length} staff member(s), but they are already in the personnel list.
                  </div>
                </div>
              ) : (
                <div className="p-3 text-sm text-gray-500 text-center">
                  No staff found for &quot;{searchTerm}&quot;
                </div>
              )}

              {/* Close button */}
              <div className="border-t border-gray-200 p-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResults(false)}
                  className="w-full text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search hint with personnel count */}
      {!currentStaffId && (
        <div className="text-xs text-gray-500">
          💡 Tip: Start typing to search for staff by {searchBy}. Select a staff member to auto-fill the fields below.
          {existingStaffIds.length > 0 && (
            <div className="mt-1 text-amber-600">
              ⚠️ {existingStaffIds.length} staff member(s) already added and will be excluded from search results.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchableStaffSelect