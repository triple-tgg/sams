// Example usage of DateRangeFilter component
"use client";

import React, { useState } from 'react';
import DateRangeFilter from './DateRange';
import { DateRange } from "react-day-picker";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const DateRangeFilterExample: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [formData, setFormData] = useState({
    reportDateRange: undefined as DateRange | undefined,
    filterDateRange: undefined as DateRange | undefined,
  });

  // Handle date range change
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    console.log('Date range changed:', range);
  };

  // Handle form submission
  const handleSubmit = () => {
    console.log('Current date range:', dateRange);
    console.log('Form data:', formData);
    
    if (dateRange?.from && dateRange?.to) {
      console.log('From:', dateRange.from.toISOString().split('T')[0]);
      console.log('To:', dateRange.to.toISOString().split('T')[0]);
    }
  };

  // Clear date range
  const handleClear = () => {
    setDateRange(undefined);
  };

  // Set preset ranges
  const setLastWeek = () => {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    setDateRange({ from: lastWeek, to: today });
  };

  const setLastMonth = () => {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    setDateRange({ from: lastMonth, to: today });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>DateRangeFilter Component Examples</CardTitle>
          <CardDescription>
            Examples showing different usage patterns of the DateRangeFilter component
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          
          {/* Basic Usage */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Usage</h3>
            <DateRangeFilter
              value={dateRange}
              onChange={handleDateRangeChange}
              placeholder="Select date range"
            />
            <div className="flex gap-2">
              <Button onClick={handleSubmit} variant="default">
                Submit
              </Button>
              <Button onClick={handleClear} variant="outline">
                Clear
              </Button>
              <Button onClick={setLastWeek} variant="soft">
                Last Week
              </Button>
              <Button onClick={setLastMonth} variant="soft">
                Last Month
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              Selected: {dateRange?.from ? dateRange.from.toDateString() : 'Not selected'} - {dateRange?.to ? dateRange.to.toDateString() : 'Not selected'}
            </div>
          </div>

          {/* With Custom Labels */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">With Custom Labels</h3>
            <DateRangeFilter
              value={formData.reportDateRange}
              onChange={(range) => setFormData(prev => ({ ...prev, reportDateRange: range }))}
              labels={{
                from: "Report Start Date",
                to: "Report End Date"
              }}
              required
            />
          </div>

          {/* Disabled State */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Disabled State</h3>
            <DateRangeFilter
              value={{ from: new Date('2025-09-01'), to: new Date('2025-09-30') }}
              onChange={() => {}}
              disabled
              labels={{
                from: "Fixed Start Date",
                to: "Fixed End Date"
              }}
            />
          </div>

          {/* Compact Layout */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Compact Layout (No Labels)</h3>
            <DateRangeFilter
              value={formData.filterDateRange}
              onChange={(range) => setFormData(prev => ({ ...prev, filterDateRange: range }))}
              labels={{}} // No labels
              className="max-w-md"
            />
          </div>

          {/* Form Integration Example */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Form Integration</h3>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              <DateRangeFilter
                value={dateRange}
                onChange={handleDateRangeChange}
                labels={{
                  from: "Filter From Date",
                  to: "Filter To Date"
                }}
                required
              />
              <Button type="submit">Apply Filter</Button>
            </form>
          </div>

          {/* Debug Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Debug Information</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify({
                dateRange,
                formData,
                isValidRange: dateRange?.from && dateRange?.to ? dateRange.from <= dateRange.to : true
              }, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DateRangeFilterExample;