import { z } from 'zod'
import { dateTimeUtils } from '@/lib/dayjs'
import { convertDateToBackend } from '@/lib/utils/formatPicker';

// Helper function to validate time format (HH:MM) using Day.js - Required version
const requiredTimeSchema = z.string().min(1, "Time is required").refine((time) => {
  return dateTimeUtils.isValidTime(time) && /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}, {
  message: "Invalid time format (HH:MM)"
});

// Helper function to validate time format (HH:MM) using Day.js - Optional version
const optionalTimeSchema = z.string().refine((time) => {
  if (!time || time === "") return true; // Optional field
  return dateTimeUtils.isValidTime(time) && /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}, {
  message: "Invalid time format (HH:MM)"
});

// Required date validation (YYYY-MM-DD format for HTML5 date input)
const requiredDateSchema = z.string()
  .min(1, "Date is required")
  .refine((date) => {
    return /^\d{4}-\d{2}-\d{2}$/.test(convertDateToBackend(date)) && dateTimeUtils.isValidDate(convertDateToBackend(date));
  }, {
    message: "Invalid date format (YYYY-MM-DD)"
  });

// Optional date validation (YYYY-MM-DD format for HTML5 date input)
const optionalDateSchema = z.string().refine((date) => {
  if (!date || date === "") return true; // Optional field
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && dateTimeUtils.isValidDate(date);
}, {
  message: "Invalid date format (YYYY-MM-DD)"
});

// Helper function to validate numeric string
const numericStringSchema = z.string().refine((val) => {
  if (!val || val === "") return true; // Optional field
  return /^\d*\.?\d*$/.test(val);
}, {
  message: "Must be a valid number"
});

export const equipmentFormSchema = z.object({
  equipments: z.array(z.object({
    // Equipment Name - Required
    equipmentName: z.string()
      .min(1, "Equipment name is required")
      .max(100, "Equipment name cannot exceed 100 characters")
      .trim(),

    // Optional fields
    hrs: numericStringSchema,
    svc: numericStringSchema,

    // From/To Date and Time - Required (now using YYYY-MM-DD format)
    fromDate: requiredDateSchema,
    fromTime: requiredTimeSchema,
    toDate: requiredDateSchema,
    toTime: requiredTimeSchema,

    // Equipment classification
    isLoan: z.boolean().default(false),
    loanRemark: z.string().max(200, "Loan remark cannot exceed 200 characters").optional().default(''),
    isSamsTool: z.boolean().default(false),
  }).refine((equipment) => {
    // Validate that 'to' date/time is after 'from' date/time
    // Only run this validation if ALL required fields are present
    if (equipment.fromDate && equipment.fromTime && equipment.toDate && equipment.toTime &&
      equipment.fromDate.trim() !== '' && equipment.fromTime.trim() !== '' &&
      equipment.toDate.trim() !== '' && equipment.toTime.trim() !== '') {

      try {
        // Method 1: Compare dates first
        const fromDateOnly = new Date(convertDateToBackend(equipment.fromDate));
        const toDateOnly = new Date(convertDateToBackend(equipment.toDate));

        // If To date is after From date, it's definitely valid
        if (toDateOnly > fromDateOnly) {
          console.log('✅ To date is after From date - Valid');
          return true;
        }

        // If dates are the same, check times
        if (toDateOnly.getTime() === fromDateOnly.getTime()) {
          console.log('📅 Same date, checking times...');

          // Convert times to minutes for easier comparison
          const [fromHour, fromMin] = equipment.fromTime.split(':').map(Number);
          const [toHour, toMin] = equipment.toTime.split(':').map(Number);

          const fromMinutes = fromHour * 60 + fromMin;
          const toMinutes = toHour * 60 + toMin;

          // console.log('⏰ Time comparison:');
          // console.log('From time:', equipment.fromTime, '=', fromMinutes, 'minutes');
          // console.log('To time:', equipment.toTime, '=', toMinutes, 'minutes');

          const timeIsValid = toMinutes > fromMinutes;
          // console.log('Time is valid:', timeIsValid);
          return timeIsValid;
        }

        // If To date is before From date, it's invalid
        console.log('❌ To date is before From date - Invalid');
        return false;

      } catch (error) {
        console.error('❌ Date validation error:', error);
        return false;
      }
    }
    // If any field is empty, skip this validation (let required field validation handle it)
    console.log('⏩ Skipping date/time validation - missing fields');
    return true;
  }, {
    message: "End date/time must be after start date/time",
    path: ["toTime"]
  }).refine((equipment) => {
    // Validate that fromDate is not in the future (reasonable operational dates)
    if (equipment.fromDate) {
      const equipmentDate = new Date(convertDateToBackend(equipment.fromDate));
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day

      const maxFutureDate = new Date(today);
      maxFutureDate.setDate(today.getDate() + 30); // Allow up to 30 days in future

      // Ensure valid date
      if (isNaN(equipmentDate.getTime())) {
        return false;
      }

      return equipmentDate <= maxFutureDate;
    }
    return true;
  }, {
    message: "Equipment date cannot be more than 30 days in the future",
    path: ["fromDate"]
  }).refine((equipment) => {
    // Validate that dates are not too far in the past (reasonable operational window)
    if (equipment.fromDate) {
      const equipmentDate = new Date(convertDateToBackend(equipment.fromDate));
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day

      const minPastDate = new Date(today);
      minPastDate.setDate(today.getDate() - 365); // Allow up to 1 year in past

      // Ensure valid date
      if (isNaN(equipmentDate.getTime())) {
        return false;
      }

      return equipmentDate >= minPastDate;
    }
    return true;
  }, {
    message: "Equipment date cannot be more than 1 year in the past",
    path: ["fromDate"]
  })).max(20, "Maximum 20 equipment entries allowed").nullable().optional().default([]),
});

export type EquipmentFormData = z.infer<typeof equipmentFormSchema>;
