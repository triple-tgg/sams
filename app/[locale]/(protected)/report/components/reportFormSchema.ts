import { z } from 'zod'
import dayjs from 'dayjs'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'

// Extend dayjs with plugins
dayjs.extend(isSameOrBefore)

// Zod schema for report form validation
export const reportFormSchema = z.object({
  dateForm: z.string()
    .min(1, 'From date is required')
    .refine((date) => {
      return dayjs(date).isValid()
    }, 'Invalid from date format'),
  
  dateTo: z.string()
    .min(1, 'To date is required')
    .refine((date) => {
      return dayjs(date).isValid()
    }, 'Invalid to date format')
}).refine((data) => {
  // Date comparison validation: dateForm ≤ dateTo
  const fromDate = dayjs(data.dateForm)
  const toDate = dayjs(data.dateTo)
  
  return fromDate.isSameOrBefore(toDate, 'day')
}, {
  message: 'From date must be before or equal to To date',
  path: ['dateTo'] // Show error on 'dateTo' field
})

// TypeScript type from Zod schema
export type ReportFormData = z.infer<typeof reportFormSchema>

// Default values helper
export const getDefaultReportFormData = (): ReportFormData => ({
  dateForm: dayjs().format('YYYY-MM-DD'),
  dateTo: dayjs().format('YYYY-MM-DD')
})

// Validation helper functions
export const validateDateRange = (dateForm: string, dateTo: string) => {
  try {
    return reportFormSchema.parse({ dateForm, dateTo })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { errors: error.errors }
    }
    return { errors: [{ message: 'Validation failed' }] }
  }
}

// Quick date range presets
export const dateRangePresets = {
  today: () => {
    const today = dayjs().format('YYYY-MM-DD')
    return { dateForm: today, dateTo: today }
  },
  
  thisWeek: () => ({
    dateForm: dayjs().startOf('week').format('YYYY-MM-DD'),
    dateTo: dayjs().endOf('week').format('YYYY-MM-DD')
  }),
  
  thisMonth: () => ({
    dateForm: dayjs().startOf('month').format('YYYY-MM-DD'),
    dateTo: dayjs().endOf('month').format('YYYY-MM-DD')
  }),
  
  lastWeek: () => ({
    dateForm: dayjs().subtract(1, 'week').startOf('week').format('YYYY-MM-DD'),
    dateTo: dayjs().subtract(1, 'week').endOf('week').format('YYYY-MM-DD')
  }),
  
  lastMonth: () => ({
    dateForm: dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
    dateTo: dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD')
  })
}