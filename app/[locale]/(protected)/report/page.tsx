"use client"

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import CardList from './components/CardList'
import { itemReport } from './data'
import { ReportFormFilter } from './components'
import dayjs from 'dayjs'
import { Filter, FileText } from 'lucide-react'

// Define the type locally to avoid import issues
type ReportFormData = {
  dateStart: string
  dateEnd: string
}

type Props = {}

const ReportPage = (props: Props) => {
  // State สำหรับเก็บค่า dateStart และ dateEnd
  const [dateRange, setDateRange] = useState<ReportFormData>({
    dateStart: dayjs().format('YYYY-MM-DD'),
    dateEnd: dayjs().format('YYYY-MM-DD')
  })
  const [isError, setIsError] = useState<boolean>(false) // Initially valid (same date = valid)

  // Memoized handler สำหรับรับค่าจาก ReportFormFilter
  const handleDateRangeChange = React.useCallback((data: ReportFormData, isValid: boolean) => {
    // Always update validation state first
    setIsError(!isValid)

    // Only update date range if the data actually changed to prevent unnecessary re-renders
    setDateRange(prevRange => {
      if (prevRange.dateStart === data.dateStart && prevRange.dateEnd === data.dateEnd) {
        return prevRange // Return same reference if no change
      }
      console.log('Date range updated:', data, 'isValid:', isValid)
      return data
    })
  }, [])

  return (
    <div className="space-y-6">
      {/* Report Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ReportFormFilter
            onChange={handleDateRangeChange}
            initialValues={dateRange}
          />
        </CardContent>
      </Card>

      {/* Report Generator Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 flex-1">
            <FileText className="h-5 w-5" />
            Report Generator
          </CardTitle>
          <div className="text-sm text-gray-500">
            {dateRange.dateStart && dateRange.dateEnd && (
              <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
                {dayjs(dateRange.dateStart).format('MMM D')} - {dayjs(dateRange.dateEnd).format('MMM D, YYYY')}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <CardList
            values={itemReport}
            date={dateRange}
            isError={isError}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default ReportPage