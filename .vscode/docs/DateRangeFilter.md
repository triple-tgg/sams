# DateRangeFilter Component Documentation

## Overview

The `DateRangeFilter` component is a React component that provides a user-friendly interface for selecting date ranges using HTML date inputs. It uses two `<input type="date">` elements to allow users to select start and end dates.

## Features

- ✅ **Two separate date inputs** - From date and To date
- ✅ **Date range validation** - Ensures from date is not after to date  
- ✅ **Customizable labels** - Custom labels for both inputs
- ✅ **Required field support** - Optional required validation
- ✅ **Disabled state** - Can be disabled for read-only scenarios
- ✅ **Responsive layout** - Grid layout that adapts to screen size
- ✅ **Error handling** - Shows validation errors for invalid ranges
- ✅ **TypeScript support** - Full TypeScript definitions
- ✅ **Browser native date picker** - Uses native browser date picker UI

## Installation

The component uses these dependencies:
- `react` - React framework
- `react-day-picker` - For DateRange type definition
- `@/components/ui/input` - UI Input component
- `@/components/ui/label` - UI Label component  
- `@/lib/utils` - Utility functions (cn for className merging)

## Basic Usage

```tsx
import DateRangeFilter from './components/DateRange';
import { DateRange } from "react-day-picker";
import { useState } from 'react';

function MyComponent() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  return (
    <DateRangeFilter
      value={dateRange}
      onChange={setDateRange}
      placeholder="Select date range"
    />
  );
}
```

## Props Interface

```tsx
interface DateRangeFilterProps {
  className?: string;                    // Additional CSS classes
  value?: DateRange;                     // Current date range value
  onChange?: (range: DateRange | undefined) => void;  // Change handler
  placeholder?: string;                  // Placeholder text
  labels?: {                            // Custom labels
    from?: string;
    to?: string;
  };
  disabled?: boolean;                   // Disable both inputs
  required?: boolean;                   // Mark fields as required
}
```

## Examples

### 1. Basic Date Range Selection

```tsx
const [dateRange, setDateRange] = useState<DateRange | undefined>();

<DateRangeFilter
  value={dateRange}
  onChange={setDateRange}
/>
```

### 2. With Custom Labels

```tsx
<DateRangeFilter
  value={dateRange}
  onChange={setDateRange}
  labels={{
    from: "Start Date",
    to: "End Date"
  }}
/>
```

### 3. Required Fields

```tsx
<DateRangeFilter
  value={dateRange}
  onChange={setDateRange}
  required
  labels={{
    from: "Report Start Date",
    to: "Report End Date"
  }}
/>
```

### 4. Disabled State

```tsx
<DateRangeFilter
  value={{ from: new Date('2025-09-01'), to: new Date('2025-09-30') }}
  onChange={() => {}}
  disabled
/>
```

### 5. Form Integration

```tsx
function ReportForm() {
  const [formData, setFormData] = useState({
    dateRange: undefined as DateRange | undefined,
    reportType: 'equipment'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.dateRange?.from || !formData.dateRange?.to) {
      alert('Please select date range');
      return;
    }
    console.log('Submitting:', formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <DateRangeFilter
        value={formData.dateRange}
        onChange={(range) => setFormData(prev => ({ ...prev, dateRange: range }))}
        required
        labels={{
          from: "Report Start Date",
          to: "Report End Date"
        }}
      />
      <button type="submit">Generate Report</button>
    </form>
  );
}
```

## Date Validation

The component includes built-in validation:

- **Range validation**: From date cannot be after to date
- **Visual feedback**: Invalid ranges show red borders
- **Error messages**: Displays error message for invalid ranges
- **Input constraints**: Sets `max` on from date and `min` on to date

## Styling

The component is fully styled with Tailwind CSS and follows these patterns:

- **Responsive grid**: Uses `sm:grid-cols-2` for side-by-side layout on larger screens
- **Consistent spacing**: Uses standard spacing classes (`space-y-2`, `gap-4`)
- **Error states**: Red borders and text for validation errors
- **Focus states**: Proper focus styling for accessibility

## Accessibility

- ✅ **Semantic HTML**: Uses proper `<input type="date">` elements
- ✅ **Labels**: Proper label associations with `htmlFor` attributes
- ✅ **Required indicators**: Visual `*` for required fields
- ✅ **Error announcements**: Error messages are properly associated
- ✅ **Keyboard navigation**: Full keyboard support via native inputs

## Browser Support

The component uses `<input type="date">` which is supported in:
- ✅ Chrome 20+
- ✅ Firefox 57+
- ✅ Safari 14.1+  
- ✅ Edge 12+

For older browsers, the input will fall back to text input.

## Advanced Usage

### Getting Formatted Dates

```tsx
const formatDate = (date: Date | undefined): string => {
  if (!date) return '';
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
};

// Usage
console.log('From:', formatDate(dateRange?.from));
console.log('To:', formatDate(dateRange?.to));
```

### Setting Preset Ranges

```tsx
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
```

## Comparison with DateRangePicker

| Feature | DateRangeFilter | DateRangePicker |
|---------|----------------|------------------|
| UI Style | Two separate inputs | Single popover button |
| Native feel | ✅ Browser native | Custom calendar |
| Mobile friendly | ✅ Native mobile picker | Custom implementation |
| Compact | ❌ Takes more space | ✅ Single button |
| Always visible | ✅ Always shows inputs | ❌ Hidden until clicked |

## Troubleshooting

### Common Issues

1. **Date not updating**: Make sure to pass the `onChange` callback properly
2. **Validation errors**: Check that date range is valid (from ≤ to)
3. **Styling issues**: Ensure Tailwind CSS classes are available
4. **TypeScript errors**: Import `DateRange` type from `react-day-picker`

### Debug Tips

```tsx
// Add debug logging
const handleDateChange = (range: DateRange | undefined) => {
  console.log('Date range changed:', range);
  console.log('From:', range?.from?.toISOString());
  console.log('To:', range?.to?.toISOString());
  onChange?.(range);
};
```