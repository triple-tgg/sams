import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';

import { toast } from 'sonner';
import { useReportDownload } from '@/lib/api/hooks/useReports';
import { ReportType } from '@/app/[locale]/(protected)/report/data';
// import { useToast } from "@/components/ui/use-toast";
interface ReportDownloadButtonProps {
  reportType: ReportType;
  dateRange: {
    dateStart: string;
    dateEnd: string;
  };
  airlineId: string | undefined;
  disabled?: boolean;
  className?: string;
}

const ReportDownloadButton: React.FC<ReportDownloadButtonProps> = ({
  reportType,
  dateRange,
  airlineId,
  disabled = false,
  className = "",
}) => {
  const [downloadFormat, setDownloadFormat] = useState<'xlsx' | 'csv' | 'zip'>('xlsx');
  const { downloadReport, isLoading } = useReportDownload();
  // const { toast: _toast } = useToast();

  // Get report display name
  const getReportDisplayName = (type: string) => {
    switch (type) {
      case 'equipment':
        return 'Equipment';
      case 'partstools':
        return 'Parts & Tools';
      case 'thf':
        return 'THF Document';
      case 'thf-2':
        return 'THF Document V.2';
      case 'thf-file':
        return 'THF Document File';
      default:
        return 'Report';
    }
  };

  // Handle download
  const handleDownload = async (format: 'xlsx' | 'csv' | 'zip') => {
    try {
      if (!dateRange.dateStart || !dateRange.dateEnd) {
        toast.error('Please select date range');
        return;
      }

      setDownloadFormat(format);
      const result = await downloadReport(reportType, dateRange, format, airlineId);
      console.log("Download result:", result);

      // Check if data is available
      if (result && !result.hasData) {
        toast.warning(`No data found for ${getReportDisplayName(reportType)} report in the selected date range`);
        return;
      }

      // Show success message with data count if available
      const successMessage = result && result.dataCount
        ? `${getReportDisplayName(reportType)} report downloaded successfully (${result.dataCount} records)`
        : `${getReportDisplayName(reportType)} report downloaded successfully`;

      toast.success(successMessage, {
        description: `Format: ${format.toUpperCase()}`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast.error(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  };

  // Check if date range is valid
  const isDateRangeValid = dateRange.dateStart && dateRange.dateEnd;

  if (reportType === 'thf-file') {
    return (
      <Button
        onClick={() => handleDownload('zip')}
        variant="outline"
        disabled={disabled || isLoading || !isDateRangeValid}
        className={`flex items-center gap-2 ${className}`}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Download
      </Button>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled || isLoading || !isDateRangeValid}
          className={`flex items-center gap-2 ${className}`}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download
          {/* {getReportDisplayName(reportType)} */}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm font-semibold text-gray-900">
          Download Format
        </div>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handleDownload('xlsx')}
          disabled={isLoading}
          className="flex items-center gap-2 cursor-pointer"
        >
          <FileSpreadsheet className="h-4 w-4 text-green-600" />
          <div>
            <div className="font-medium">Excel (.xlsx)</div>
            <div className="text-sm text-gray-500">Best for data analysis</div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleDownload('csv')}
          disabled={isLoading}
          className="flex items-center gap-2 cursor-pointer"
        >
          <FileText className="h-4 w-4 text-blue-600" />
          <div>
            <div className="font-medium">CSV (.csv)</div>
            <div className="text-sm text-gray-500">Compatible with all systems</div>
          </div>
        </DropdownMenuItem>

        {!isDateRangeValid && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-sm text-red-600">
              Please select date range to download
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ReportDownloadButton;