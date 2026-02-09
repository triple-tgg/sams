import { z } from 'zod'
import { dateTimeUtils } from '@/lib/dayjs'
import dayjs from 'dayjs';
import { convertDateToBackend } from '@/lib/utils/formatPicker';


const FileObjectSchema = z.object({
  id: z.string().nullable().optional(),
  additionalDefectId: z.string().nullable().optional(),
  fileType: z.string().nullable().optional(),
  isDelete: z.boolean().default(false),
  realName: z.string(),
  storagePath: z.string(),
});

const attachFilesSchema = z
  .array(FileObjectSchema)
  .nullable()
  .default(null);

// Helper function to validate time format (HH:MM) using Day.js
const timeSchema = z.string().refine((time) => {
  if (!time || time === "") return false;
  return dateTimeUtils.isValidTime(time) && /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}, {
  message: "Invalid time format (HH:MM)"
});

// Helper function to validate date format (YYYY-MM-DD) using Day.js
const dateSchema = z.string().refine((date) => {
  if (!date || date === "") return false;
  return dateTimeUtils.isValidDate(convertDateToBackend(date)) && /^\d{4}-\d{2}-\d{2}$/.test(convertDateToBackend(date));
}, {
  message: "Invalid date format (DD-MM-YYYY)"
});

// Helper function to validate ATA Chapter format
const ataChapterSchema = z.string();

// Helper function to validate numeric string
const numericStringSchema = z.string().regex(/^\d*\.?\d*$/, "Must be a valid number");

export const servicesFormSchema = z.object({
  // Aircraft Checks - Always required at least one
  aircraftChecks: z.array(z.object({
    maintenanceTypes: z.string().min(1, "Maintenance type is required"),
    maintenanceSubTypes: z.array(z.string()).default([]),
    laeMH: z.string().optional().refine((val) => !val || numericStringSchema.safeParse(val).success, {
      message: "LAE MH must be a valid number"
    }),
    mechMH: z.string().optional().refine((val) => !val || numericStringSchema.safeParse(val).success, {
      message: "Mech MH must be a valid number"
    }),
  })).min(1, "At least one aircraft check is required").max(10, "Maximum 10 aircraft checks allowed"),

  // Additional Defect Rectification
  additionalDefectRectification: z.boolean().default(false),
  additionalDefects: z.array(z.object({
    defect: z.string().min(5, "Defect details must be at least 5 characters").max(500, "Defect details cannot exceed 500 characters"),
    ataChapter: ataChapterSchema,
    attachFiles: attachFilesSchema,
    // attachFiles: z
    //   .union([
    //     FileObjectSchema,            // single object
    //     z.array(FileObjectSchema),   // multiple objects
    //     z.null(),
    //     z.undefined()
    //   ])
    //   .optional()
    //   .nullable(),

    laeMH: z.string().optional().refine((val) => !val || numericStringSchema.safeParse(val).success, {
      message: "LAE MH must be a valid number"
    }),
    mechMH: z.string().optional().refine((val) => !val || numericStringSchema.safeParse(val).success, {
      message: "Mech MH must be a valid number"
    }),
  })).optional().default([]).refine((defects) => !defects || defects.length <= 6, {
    message: "Maximum 6 additional defects allowed"
  }),

  // Servicing Performed
  servicingPerformed: z.boolean().default(false),
  fluid: z.object({
    fluidName: z.object({
      label: z.string(),
      value: z.string(),
    }).nullable(),
    engOilSets: z.array(z.object({
      left: z.number().optional(),
      right: z.number().optional(),
    })).max(4, "Maximum 4 engine oil sets allowed").default([]),
    csdIdgVsfgSets: z.array(z.object({
      quantity: z.number().optional(),
    })).max(4, "Maximum 4 CSD/IDG/VSFG sets allowed").default([]),
    hydOilBlue: z.number().optional(),
    hydOilGreen: z.number().optional(),
    hydOilYellow: z.number().optional(),
    hydOilA: z.number().optional(),
    hydOilB: z.number().optional(),
    hydOilSTBY: z.number().optional(),
    apuOil: z.number().optional(),
    rampFuel: z.number().optional(),
    actualUplift: z.number().optional(),
  }),

  // Personnel
  addPersonnels: z.boolean().default(false),
  personnel: z.array(
    z.object({
      staffId: z.number().min(1, "Staff ID is required").max(200, "Staff ID cannot exceed 200 characters"),
      name: z.string().min(1, "Name is required").max(100, "Name cannot exceed 100 characters"),
      type: z.string().min(1, "Type is required").max(50, "Type cannot exceed 50 characters"),
      // formDate: z.string().min(1, "Form date is required"),
      // toDate: z.string().min(1, "To date is required"),
      formDate: dateSchema.refine((date) => date !== "", { message: "From date is required" }),
      toDate: dateSchema.refine((date) => date !== "", { message: "To date is required" }),
      formTime: timeSchema.refine((time) => time !== "", { message: "From time is required" }),
      toTime: timeSchema.refine((time) => time !== "", { message: "To time is required" }),
      remark: z.string().max(200, "Remark cannot exceed 200 characters").optional(),
    }).superRefine((personnel, ctx) => {
      if (personnel.formDate && personnel.toDate && personnel.formTime && personnel.toTime) {

        const from = dayjs(`${convertDateToBackend(personnel.formDate)} ${personnel.formTime}`, "YYYY-MM-DD HH:mm");
        const to = dayjs(`${convertDateToBackend(personnel.toDate)} ${personnel.toTime}`, "YYYY-MM-DD HH:mm");

        if (to.isBefore(from)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "End datetime must be after start datetime",
            path: ["toDate"], // โชว์ error ที่ toDate
          });
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "End datetime must be after start datetime",
            path: ["toTime"], // โชว์ error ที่ toTime
          });
        }
      }
    })
  ).nullable().optional().default([]),

  // Flight Deck
  flightDeck: z.boolean().default(false),

  // Aircraft Towing
  aircraftTowing: z.boolean().default(false),
  marshallingServicePerFlight: z.number().optional(),
  aircraftTowingInfo: z.array(z.object({
    onDate: dateSchema.refine((date) => date !== "", { message: "Date is required" }),
    offDate: dateSchema.refine((date) => date !== "", { message: "Date is required" }),
    onTime: timeSchema.refine((time) => time !== "", { message: "Time on is required" }),
    offTime: timeSchema.refine((time) => time !== "", { message: "Time off is required" }),
    bayFrom: z.string().min(1, "Bay From is required").max(10, "Bay From cannot exceed 10 characters"),
    bayTo: z.string().min(1, "Bay To is required").max(10, "Bay To cannot exceed 10 characters"),
  }).refine((info) => {
    // Validate that 'offTime' is after 'onTime' using Day.js
    if (info.onTime && info.offTime) {
      const onDateTime = dayjs(`${convertDateToBackend(info.onDate)} ${info.onTime}`, "YYYY-MM-DD HH:mm");
      const offDateTime = dayjs(`${convertDateToBackend(info.offDate)} ${info.offTime}`, "YYYY-MM-DD HH:mm");
      // return dateTimeUtils.isAfter(offDateTime, onDateTime);
      return offDateTime.isAfter(onDateTime);
    }
    return true;
  }, {
    message: "Time off must be after time on",
    path: ["timeOf"]
  }).refine((info) => {
    // Validate that bayFrom and bayTo are different
    return info.bayFrom !== info.bayTo;
  }, {
    message: "Bay From and Bay To must be different",
    path: ["bayTo"]
  })).nullable().optional().default([]).refine((towingInfo) => !towingInfo || towingInfo.length <= 3, {
    message: "Maximum 3 aircraft towing operations allowed"
  }),
}).refine((data) => {
  // Validation 1: If additionalDefectRectification is enabled, additionalDefects must not be empty
  if (data.additionalDefectRectification && (!data.additionalDefects || data.additionalDefects.length === 0)) {
    return false;
  }
  return true;
}, {
  message: "At least one additional defect is required when defect rectification is enabled",
  path: ["additionalDefects"],
}).refine((data) => {
  // Validation 2: If addPersonnels is enabled, personnel must not be empty
  if (data.addPersonnels && (!data.personnel || data.personnel.length === 0)) {
    return false;
  }
  return true;
}, {
  message: "At least one personnel is required when personnel option is enabled",
  path: ["personnel"],
}).refine((data) => {
  // Validation 3: If aircraftTowing is enabled, aircraftTowingInfo must not be empty
  if (data.aircraftTowing && (!data.aircraftTowingInfo || data.aircraftTowingInfo.length === 0)) {
    return false;
  }
  return true;
}, {
  message: "Aircraft towing information is required when towing option is enabled",
  path: ["aircraftTowingInfo"],
}).refine((data) => {
  // Validation 6: Check for duplicate personnel (same staffId)
  if (data.personnel && data.personnel.length > 1) {
    const staffIds = data.personnel.map(p => p.staffId).filter(Boolean);
    const uniqueStaffIds = new Set(staffIds);
    if (staffIds.length !== uniqueStaffIds.size) {
      return false;
    }
  }
  return true;
}, {
  message: "Duplicate staff members are not allowed",
  path: ["personnel"],
}).refine((data) => {
  // Validation 7: Check for overlapping personnel time periods for same staff using Day.js
  if (data.personnel && data.personnel.length > 1) {
    for (let i = 0; i < data.personnel.length; i++) {
      for (let j = i + 1; j < data.personnel.length; j++) {
        const person1 = data.personnel[i];
        const person2 = data.personnel[j];

        if (person1.staffId === person2.staffId && person1.formTime && person1.toTime && person2.formTime && person2.toTime) {
          const start1 = `2000-01-01 ${person1.formTime}`;
          const end1 = `2000-01-01 ${person1.toTime}`;
          const start2 = `2000-01-01 ${person2.formTime}`;
          const end2 = `2000-01-01 ${person2.toTime}`;

          // Check for overlap using Day.js: start1 < end2 && start2 < end1
          if (dateTimeUtils.isBefore(start1, end2) && dateTimeUtils.isBefore(start2, end1)) {
            return false;
          }
        }
      }
    }
  }
  return true;
}, {
  message: "Personnel time periods cannot overlap for the same staff member",
  path: ["personnel"],
}).refine((data) => {
  // Validation 8: Validate aircraft towing dates using Day.js
  if (data.aircraftTowing && data.aircraftTowingInfo) {
    const today = dateTimeUtils.getCurrentDate();
    for (const towing of data.aircraftTowingInfo) {
      if (towing.offDate && dateTimeUtils.isBefore(towing.offDate, today)) {
        // This is just a warning, we'll allow past dates but could add a warning
        continue;
      }
    }
  }
  return true;
}, {
  message: "Warning: Aircraft towing date is in the past",
  path: ["aircraftTowingInfo"],
});

export type ServicesFormSchema = z.infer<typeof servicesFormSchema>
