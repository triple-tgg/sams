import { formatForDisplay, formatForPicker, formatForValue, formatFromPicker } from "@/lib/utils/formatPicker";
import { Input } from "../input";
import React from "react";

// Custom Date Input Component
export const CustomDateInput = React.forwardRef<
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
          format="DD/MM/YYYY"
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

CustomDateInput.displayName = "CustomDateInput";

// ------------------------------------------------------