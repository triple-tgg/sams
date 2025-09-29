// Example usage of Report APIs and Download functionality

import React, { useState } from 'react';
import {
  useEquipmentReport,
  usePartsToolsReport,
  useThfReport,
  useReportDownload
} from '@/lib/api/hooks/useReports';
import ReportDownloadButton from '@/components/report/ReportDownloadButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Example 1: Basic report data fetching
export const ReportDataExample: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    dateStart: '2025-09-01',
    dateEnd: '2025-09-30'
  });

  // Fetch equipment report
  const {
    data: equipmentData,
    isLoading: equipmentLoading,
    error: equipmentError
  } = useEquipmentReport(dateRange);

  // Fetch parts & tools report
  const {
    data: partsToolsData,
    isLoading: partsToolsLoading,
    error: partsToolsError
  } = usePartsToolsReport(dateRange);

  // Fetch THF report
  const {
    data: thfData,
    isLoading: thfLoading,
    error: thfError
  } = useThfReport(dateRange);

  return (
    <div className="space-y-6">
      <h2>Report Data Example</h2>

      {/* Date Range Input */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Start Date</Label>
          <Input
            type="date"
            value={dateRange.dateStart}
            onChange={(e) => setDateRange(prev => ({ ...prev, dateStart: e.target.value }))}
          />
        </div>
        <div>
          <Label>End Date</Label>
          <Input
            type="date"
            value={dateRange.dateEnd}
            onChange={(e) => setDateRange(prev => ({ ...prev, dateEnd: e.target.value }))}
          />
        </div>
      </div>

      {/* Equipment Report */}
      <div className="border rounded-lg p-4">
        <h3>Equipment Report</h3>
        {equipmentLoading && <p>Loading equipment data...</p>}
        {equipmentError && <p>Error: {equipmentError.message}</p>}
        {equipmentData && (
          <div>
            <p>Found {equipmentData.responseData.length} equipment records</p>
            <pre className="text-xs overflow-auto max-h-40">
              {JSON.stringify(equipmentData.responseData.slice(0, 2), null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Parts & Tools Report */}
      <div className="border rounded-lg p-4">
        <h3>Parts & Tools Report</h3>
        {partsToolsLoading && <p>Loading parts & tools data...</p>}
        {partsToolsError && <p>Error: {partsToolsError.message}</p>}
        {partsToolsData && (
          <div>
            <p>Found {partsToolsData.responseData.length} parts & tools records</p>
            <pre className="text-xs overflow-auto max-h-40">
              {JSON.stringify(partsToolsData.responseData.slice(0, 2), null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* THF Report */}
      <div className="border rounded-lg p-4">
        <h3>THF Report</h3>
        {thfLoading && <p>Loading THF data...</p>}
        {thfError && <p>Error: {thfError.message}</p>}
        {thfData && (
          <div>
            <p>Found {thfData.responseData.length} THF records</p>
            <pre className="text-xs overflow-auto max-h-40">
              {JSON.stringify(thfData.responseData.slice(0, 2), null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

// Example 2: Download buttons usage
export const DownloadButtonsExample: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    dateStart: '2025-09-01',
    dateEnd: '2025-09-30'
  });

  return (
    <div className="space-y-6">
      <h2>Download Buttons Example</h2>

      {/* Date Range Input */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Start Date</Label>
          <Input
            type="date"
            value={dateRange.dateStart}
            onChange={(e) => setDateRange(prev => ({ ...prev, dateStart: e.target.value }))}
          />
        </div>
        <div>
          <Label>End Date</Label>
          <Input
            type="date"
            value={dateRange.dateEnd}
            onChange={(e) => setDateRange(prev => ({ ...prev, dateEnd: e.target.value }))}
          />
        </div>
      </div>

      {/* Download Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <h3 className="mb-4">Equipment Report</h3>
          <ReportDownloadButton
            reportType="equipment"
            dateRange={dateRange}
            className="w-full"
          />
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="mb-4">Parts & Tools Report</h3>
          <ReportDownloadButton
            reportType="partstools"
            dateRange={dateRange}
            className="w-full"
          />
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="mb-4">THF Document Report</h3>
          <ReportDownloadButton
            reportType="thf"
            dateRange={dateRange}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

// Example 3: Manual download with custom logic
export const ManualDownloadExample: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    dateStart: '2025-09-01',
    dateEnd: '2025-09-30'
  });

  const { downloadReport, isLoading } = useReportDownload();

  const handleManualDownload = async (reportType: 'equipment' | 'partstools' | 'thf') => {
    try {
      await downloadReport(reportType, dateRange, 'xlsx');
      console.log(`${reportType} report downloaded successfully`);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <h2>Manual Download Example</h2>

      {/* Date Range Input */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Start Date</Label>
          <Input
            type="date"
            value={dateRange.dateStart}
            onChange={(e) => setDateRange(prev => ({ ...prev, dateStart: e.target.value }))}
          />
        </div>
        <div>
          <Label>End Date</Label>
          <Input
            type="date"
            value={dateRange.dateEnd}
            onChange={(e) => setDateRange(prev => ({ ...prev, dateEnd: e.target.value }))}
          />
        </div>
      </div>

      {/* Manual Download Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={() => handleManualDownload('equipment')}
          disabled={isLoading}
        >
          {isLoading ? 'Downloading...' : 'Download Equipment (XLSX)'}
        </Button>

        <Button
          onClick={() => handleManualDownload('partstools')}
          disabled={isLoading}
        >
          {isLoading ? 'Downloading...' : 'Download Parts & Tools (XLSX)'}
        </Button>

        <Button
          onClick={() => handleManualDownload('thf')}
          disabled={isLoading}
        >
          {isLoading ? 'Downloading...' : 'Download THF (XLSX)'}
        </Button>
      </div>
    </div>
  );
};

// Example 4: Direct API usage
export const DirectApiExample: React.FC = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleDirectApiCall = async () => {
    setLoading(true);
    try {
      // Import API functions directly
      const { getEquipmentReport } = await import('@/lib/api/report/equipments/getEquipments');
      const { exportEquipmentReport } = await import('@/lib/utils/excelExport');

      const response = await getEquipmentReport({
        dateStart: '2025-09-01',
        dateEnd: '2025-09-30'
      });

      setResult(response);

      // Export to Excel
      if (response.responseData.length > 0) {
        exportEquipmentReport(response.responseData, 'xlsx');
      }
    } catch (error) {
      console.error('Direct API call failed:', error);
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2>Direct API Usage Example</h2>

      <Button
        onClick={handleDirectApiCall}
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Call Equipment API & Export'}
      </Button>

      {result && (
        <div className="border rounded-lg p-4">
          <h3>API Response:</h3>
          <pre className="text-xs overflow-auto max-h-60">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};