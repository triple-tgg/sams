// Convert DD/MM/YYYY to DD-MMM-YYYY for display
export const formatForDisplay = (dateStr: string): string => {
  if (!dateStr) return "";
  const parts = dateStr.split("/");
  if (parts.length !== 3) return dateStr;

  const [day, month, year] = parts;
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const monthName = monthNames[parseInt(month) - 1];
  return monthName ? `${day.padStart(2, '0')}-${monthName}-${year}` : dateStr;
};

// Convert DD-MMM-YYYY to DD/MM/YYYY for form value
export const formatForValue = (displayStr: string): string => {
  if (!displayStr) return "";
  const parts = displayStr.split("-");
  if (parts.length !== 3) return displayStr;

  const [day, monthName, year] = parts;
  const monthMap: { [key: string]: string } = {
    "Jan": "01", "Feb": "02", "Mar": "03", "Apr": "04",
    "May": "05", "Jun": "06", "Jul": "07", "Aug": "08",
    "Sep": "09", "Oct": "10", "Nov": "11", "Dec": "12"
  };

  const month = monthMap[monthName];
  return month ? `${day.padStart(2, '0')}/${month}/${year}` : displayStr;
};

// Convert DD/MM/YYYY to YYYY-MM-DD for date picker
export const formatForPicker = (dateStr: string): string => {
  if (!dateStr) return "";
  const parts = dateStr.split("/");
  if (parts.length !== 3) return "";
  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

// Convert YYYY-MM-DD from date picker to DD/MM/YYYY
export const formatFromPicker = (pickerStr: string): string => {
  if (!pickerStr) return "";
  const parts = pickerStr.split("-");
  if (parts.length !== 3) return "";
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

// Date Conversion Helper
// ------------------------------------------------------
// Convert DD/MM/YYYY to YYYY-MM-DD for backend
export const convertDateToBackend = (dateStr: string): string => {
  if (!dateStr) return "";
  const parts = dateStr.split("/");
  if (parts.length !== 3) return dateStr;
  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};