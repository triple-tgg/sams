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
import { useToast } from "@/components/ui/use-toast";
interface ReportDownloadButtonProps {
  reportType: 'equipment' | 'partstools' | 'thf';
  dateRange: {
    dateStart: string;
    dateEnd: string;
  };
  disabled?: boolean;
  className?: string;
}

const ReportDownloadButton: React.FC<ReportDownloadButtonProps> = ({
  reportType,
  dateRange,
  disabled = false,
  className = "",
}) => {
  const [downloadFormat, setDownloadFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const { downloadReport, isLoading } = useReportDownload();
  const { toast: _toast } = useToast();

  // Get report display name
  const getReportDisplayName = (type: string) => {
    switch (type) {
      case 'equipment':
        return 'Equipment';
      case 'partstools':
        return 'Parts & Tools';
      case 'thf':
        return 'THF Document';
      default:
        return 'Report';
    }
  };

  // Handle download
  const handleDownload = async (format: 'xlsx' | 'csv') => {
    try {
      if (!dateRange.dateStart || !dateRange.dateEnd) {
        toast.error('Please select date range');
        return;
      }

      setDownloadFormat(format);
      const result = await downloadReport(reportType, dateRange, format);

      // Check if data is available
      if (result && !result.hasData) {
        // toast.warning(
        //   `No data found for ${getReportDisplayName(reportType)} report in the selected date range`,
        //   {
        //     description: `Date range: ${dateRange.dateStart} to ${dateRange.dateEnd}`,
        //     duration: 5000,
        //   }
        // );
        _toast({
          variant: "destructive",
          title: `No data found for ${getReportDisplayName(reportType)} report in the selected date range`,
          description: `Date range: ${dateRange.dateStart} to ${dateRange.dateEnd}`,
          duration: 5000,
        });

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
      // toast.error(`Failed to download ${getReportDisplayName(reportType)} report`, {
      //   description: error instanceof Error ? error.message : 'Unknown error occurred',
      //   duration: 5000,
      // });
      _toast({
        variant: "destructive",
        title: "!Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        duration: 5000,
      });
    }
  };

  // Check if date range is valid
  const isDateRangeValid = dateRange.dateStart && dateRange.dateEnd;

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