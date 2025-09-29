// Simple integration example for DateRangeFilter component
"use client";

import React, { useState } from 'react';
import DateRangeFilter from './DateRange';
import { DateRange } from "react-day-picker";

// Example: Flight search with date range filter
export const FlightSearchExample = () => {
  const [searchParams, setSearchParams] = useState({
    dateRange: undefined as DateRange | undefined,
    destination: '',
  });

  const handleSearch = () => {
    console.log('Searching flights with params:', searchParams);
    // Here you would typically call an API or update the search results
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Flight Search</h3>
      
      <DateRangeFilter
        value={searchParams.dateRange}
        onChange={(range) => setSearchParams(prev => ({ ...prev, dateRange: range }))}
        labels={{
          from: "Departure Date",
          to: "Return Date"
        }}
        className="max-w-md"
      />
      
      <button 
        onClick={handleSearch}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        disabled={!searchParams.dateRange?.from}
      >
        Search Flights
      </button>
    </div>
  );
};

// Example: Report filter with date range
export const ReportFilterExample = () => {
  const [filters, setFilters] = useState({
    reportType: 'equipment' as 'equipment' | 'partstools' | 'thf',
    dateRange: undefined as DateRange | undefined,
  });

  const generateReport = () => {
    if (!filters.dateRange?.from || !filters.dateRange?.to) {
      alert('Please select both start and end dates');
      return;
    }
    
    console.log('Generating report:', filters);
    // Here you would call your report generation API
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Generate Report</h3>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium">Report Type</label>
        <select 
          value={filters.reportType}
          onChange={(e) => setFilters(prev => ({ 
            ...prev, 
            reportType: e.target.value as 'equipment' | 'partstools' | 'thf' 
          }))}
          className="w-full p-2 border rounded"
        >
          <option value="equipment">Equipment Report</option>
          <option value="partstools">Parts & Tools Report</option>
          <option value="thf">THF Document Report</option>
        </select>
      </div>
      
      <DateRangeFilter
        value={filters.dateRange}
        onChange={(range) => setFilters(prev => ({ ...prev, dateRange: range }))}
        labels={{
          from: "Report Start Date",
          to: "Report End Date"
        }}
        required
      />
      
      <button 
        onClick={generateReport}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        disabled={!filters.dateRange?.from || !filters.dateRange?.to}
      >
        Generate Report
      </button>
    </div>
  );
};