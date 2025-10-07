"use client";

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Copy of the CustomDateInput component for testing
const TestCustomDateInput = React.forwardRef<
  HTMLInputElement,
  {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    className?: string;
  }
>(({ value = "", onChange, placeholder, className, ...props }, ref) => {
  const [displayValue, setDisplayValue] = React.useState("");
  const [isPickerMode, setIsPickerMode] = React.useState(false);

  // Convert DD/MM/YYYY to DD-MMM-YYYY for display
  const formatForDisplay = (dateStr: string): string => {
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
  const formatForValue = (displayStr: string): string => {
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
  const formatForPicker = (dateStr: string): string => {
    if (!dateStr) return "";
    const parts = dateStr.split("/");
    if (parts.length !== 3) return "";
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  // Convert YYYY-MM-DD from date picker to DD/MM/YYYY
  const formatFromPicker = (pickerStr: string): string => {
    if (!pickerStr) return "";
    const parts = pickerStr.split("-");
    if (parts.length !== 3) return "";
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  };

  // Update display value when form value changes
  React.useEffect(() => {
    setDisplayValue(formatForDisplay(value));
  }, [value]);

  const handleDisplayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDisplayValue = e.target.value;
    setDisplayValue(newDisplayValue);
    
    // Try to convert to form value format
    const formValue = formatForValue(newDisplayValue);
    onChange?.(formValue);
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pickerValue = e.target.value;
    const formValue = formatFromPicker(pickerValue);
    onChange?.(formValue);
  };

  const togglePickerMode = () => {
    setIsPickerMode(!isPickerMode);
  };

  return (
    <div className="relative">
      {isPickerMode ? (
        <Input
          ref={ref}
          type="date"
          value={formatForPicker(value)}
          onChange={handlePickerChange}
          onBlur={() => setIsPickerMode(false)}
          className={className}
          autoFocus
          {...props}
        />
      ) : (
        <Input
          ref={ref}
          type="text"
          value={displayValue}
          onChange={handleDisplayChange}
          onFocus={togglePickerMode}
          placeholder={placeholder || "DD-MMM-YYYY (click to pick)"}
          className={className}
          {...props}
        />
      )}
    </div>
  );
});

TestCustomDateInput.displayName = "TestCustomDateInput";

// Form schema
const TestFormSchema = z.object({
  arrivalDate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/g, "DD/MM/YYYY"),
  departureDate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/g, "DD/MM/YYYY").optional().or(z.literal("")),
});

type TestFormInputs = z.infer<typeof TestFormSchema>;

export default function CustomDateInputTest() {
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<TestFormInputs>({
    resolver: zodResolver(TestFormSchema),
    defaultValues: {
      arrivalDate: "",
      departureDate: "",
    },
  });

  const watchedValues = watch();

  const onSubmit = (data: TestFormInputs) => {
    console.log('Form submitted:', data);
    
    // Convert to backend format
    const convertToBackend = (dateStr: string): string => {
      if (!dateStr) return "";
      const parts = dateStr.split("/");
      if (parts.length !== 3) return dateStr;
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    };

    const backendData = {
      ...data,
      arrivalDate: convertToBackend(data.arrivalDate),
      departureDate: convertToBackend(data.departureDate || ""),
    };

    console.log('Backend format:', backendData);
    alert(`Form submitted!\nSee console for details.\n\nDisplay: ${data.arrivalDate}\nBackend: ${backendData.arrivalDate}`);
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Custom Date Input Test</CardTitle>
          <CardDescription>
            Test the custom date input component with DD-MMM-YYYY display and DD/MM/YYYY form value
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Arrival Date */}
            <div className="space-y-2">
              <Label htmlFor="arrivalDate">Arrival Date</Label>
              <Controller
                name="arrivalDate"
                control={control}
                render={({ field }) => (
                  <TestCustomDateInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="DD-MMM-YYYY (click to pick)"
                  />
                )}
              />
              {errors.arrivalDate && (
                <p className="text-sm text-red-500">{errors.arrivalDate.message}</p>
              )}
            </div>

            {/* Departure Date */}
            <div className="space-y-2">
              <Label htmlFor="departureDate">Departure Date (Optional)</Label>
              <Controller
                name="departureDate"
                control={control}
                render={({ field }) => (
                  <TestCustomDateInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="DD-MMM-YYYY (click to pick)"
                  />
                )}
              />
              {errors.departureDate && (
                <p className="text-sm text-red-500">{errors.departureDate.message}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <Button type="submit">Submit</Button>
              <Button type="button" variant="outline" onClick={() => reset()}>
                Reset
              </Button>
            </div>
          </form>

          {/* Debug Information */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-3">Real-time Values</h3>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Form Values (DD/MM/YYYY):</strong>
                <pre className="mt-1 p-2 bg-white rounded border">
                  {JSON.stringify(watchedValues, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Backend Format (YYYY-MM-DD):</strong>
                <pre className="mt-1 p-2 bg-white rounded border">
                  {JSON.stringify({
                    arrivalDate: watchedValues.arrivalDate ? 
                      watchedValues.arrivalDate.split('/').reverse().join('-') : "",
                    departureDate: watchedValues.departureDate ? 
                      watchedValues.departureDate.split('/').reverse().join('-') : "",
                  }, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">How to Test:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>1. Click on any date input field</li>
              <li>2. Use the native date picker that appears</li>
              <li>3. Notice the display format changes to DD-MMM-YYYY</li>
              <li>4. Check the real-time values to see DD/MM/YYYY format</li>
              <li>5. Submit to see backend conversion to YYYY-MM-DD</li>
            </ul>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}