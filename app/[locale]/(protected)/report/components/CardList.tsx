import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileDown, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReportDownloadButton from '@/components/report/ReportDownloadButton';

type Props = {
  values: Array<{
    id: string
    name: string
    description: string
    reportType: 'equipment' | 'partstools' | 'thf'
  }>
  airlineId: string | undefined
  date?: { dateStart: string, dateEnd: string }
  isError?: boolean
}
const CardList = (props: Props) => {
  return (
    <div className="space-y-3">
      {/* Status indicator */}
      {props.isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-red-700 text-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>Please select a valid date range to enable downloads</span>
          </div>
        </div>
      )}

      <ul className="space-y-3 h-full">
        {props.values.map((item) => (
          <li
            className="flex items-center gap-3 border-b border-default-100 dark:border-default-300 last:border-b-0 pb-3 last:pb-0"
            key={item.id}
          >
            <FileText />
            <div className="flex-1 text-start overflow-hidden text-ellipsis whitespace-nowrap max-w-[63%]">
              <div className="text-sm text-default-600  overflow-hidden text-ellipsis whitespace-nowrap">
                {item.name}
              </div>
              <div className="text-sm font-light text-default-400 dark:text-default-600">
                {item.description}
              </div>
            </div>
            <div className="flex-none ">
              <div className="text-sm font-light text-default-400 dark:text-default-600">
                {props.date?.dateStart} - {props.date?.dateEnd}
              </div>
            </div>
            <ReportDownloadButton
              reportType={item.reportType}
              airlineId={props.airlineId}
              dateRange={{
                dateStart: props.date?.dateStart || '',
                dateEnd: props.date?.dateEnd || ''
              }}
              disabled={props.isError}
              className="ml-auto"
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default CardList