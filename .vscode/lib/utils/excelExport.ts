import * as XLSX from 'xlsx';

// Generic function to convert JSON data to Excel and download
export const exportToExcel = <T extends Record<string, any>>(
  data: T[],
  filename: string,
  sheetName: string = 'Report'
): void => {
  try {
    if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
    }

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Convert JSON data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Auto-size columns (optional enhancement)
    const columnWidths: { wch: number }[] = [];
    const headers = Object.keys(data[0]);

    headers.forEach((header, index) => {
      const maxLength = Math.max(
        header.length,
        ...data.map(row => String(row[header] || '').length)
      );
      columnWidths[index] = { wch: Math.min(maxLength + 2, 50) }; // Max width 50
    });

    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate filename with timestamp if not provided
    const timestamp = new Date().toISOString().split('T')[0];
    const finalFilename = filename.includes('.')
      ? filename
      : `${filename}_${timestamp}.xlsx`;

    // Write and download the file
    XLSX.writeFile(workbook, finalFilename);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Failed to export data to Excel');
  }
};

// Generic function to convert JSON data to CSV and download
export const exportToCSV = <T extends Record<string, any>>(
  data: T[],
  filename: string
): void => {
  try {
    if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
    }

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Convert JSON data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

    // Generate filename with timestamp if not provided
    const timestamp = new Date().toISOString().split('T')[0];
    const finalFilename = filename.includes('.')
      ? filename.replace('.xlsx', '.csv')
      : `${filename}_${timestamp}.csv`;

    // Write and download the file as CSV
    XLSX.writeFile(workbook, finalFilename, { bookType: 'csv' });
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw new Error('Failed to export data to CSV');
  }
};

// Specific export functions for each report type
export const exportEquipmentReport = (data: any[], format: 'xlsx' | 'csv' | 'zip' = 'xlsx') => {
  const filename = `Equipment_Report`;

  if (format === 'csv') {
    exportToCSV(data, filename);
  } else {
    exportToExcel(data, filename, 'Equipment Report');
  }
};

export const exportPartsToolsReport = (data: any[], format: 'xlsx' | 'csv' | 'zip' = 'xlsx') => {
  const filename = `Parts_Tools_Report`;

  if (format === 'csv') {
    exportToCSV(data, filename);
  } else {
    exportToExcel(data, filename, 'Parts & Tools Report');
  }
};

export const exportThfReport = (data: any[], format: 'xlsx' | 'csv' | 'zip' = 'xlsx') => {
  const filename = `THF_Report`;

  if (format === 'csv') {
    exportToCSV(data, filename);
  } else {
    exportToExcel(data, filename, 'THF Report');
  }
};

// Helper function to format data before export (optional)
export const formatDataForExport = <T extends Record<string, any>>(
  data: T[],
  formatters: Record<string, (value: any) => string> = {}
): T[] => {
  return data.map(row => {
    const formattedRow = { ...row } as any;

    Object.keys(formatters).forEach(key => {
      if (formattedRow[key] !== undefined) {
        formattedRow[key] = formatters[key](formattedRow[key]);
      }
    });

    return formattedRow as T;
  });
};

// Download file from blob (for API downloads)
export const downloadBlob = (blob: Blob, filename: string) => {
  try {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw new Error('Failed to download file');
  }
};