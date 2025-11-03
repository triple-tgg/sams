"use client"

import React, { useMemo, useCallback, useRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { z } from 'zod'
import dayjs from 'dayjs'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { Calendar, Clock, RotateCcw, Zap } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAirlineOptions } from '@/lib/api/hooks/useAirlines'

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Extend dayjs with plugins
dayjs.extend(isSameOrBefore)

// Local schema definition
const reportFormSchema = z.object({
  dateStart: z.string()
    .min(1, 'From date is required')
    .refine((date) => {
      return dayjs(date).isValid()
    }, 'Invalid from date format'),

  dateEnd: z.string()
    .min(1, 'To date is required')
    .refine((date) => {
      return dayjs(date).isValid()
    }, 'Invalid to date format'),
  airlineId: z.string().optional(),
}).superRefine((data, ctx) => {
  // Date comparison validation: dateStart ≤ dateEnd
  const fromDate = dayjs(data.dateStart)
  const toDate = dayjs(data.dateEnd)

  if (!fromDate.isSameOrBefore(toDate, 'day')) {
    // Add error to both fields for better UX
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['dateForm'],
      message: 'From date must be before or equal to To date'
    })
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['dateTo'],
      message: 'To date must be after or equal to From date'
    })
  }
})

type ReportFormData = z.infer<typeof reportFormSchema>

interface ReportFormFilterProps {
  onChange?: (data: ReportFormData, isValid: boolean, airlineId: string | undefined) => void
  initialValues?: ReportFormData
  isLoading?: boolean
}

const ReportFormFilter: React.FC<ReportFormFilterProps> = ({
  onChange,
  initialValues,
  isLoading = false
}) => {
  // Memoize default values to prevent unnecessary re-renders
  const defaultValues = useMemo(() => ({
    dateStart: dayjs().format('YYYY-MM-DD'),
    dateEnd: dayjs().format('YYYY-MM-DD'),
  }), [])

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: initialValues || defaultValues,
    mode: 'onChange', // Real-time validation but optimized
    reValidateMode: 'onChange',
    criteriaMode: 'firstError'
  })

  // Watch form values with minimal re-renders
  const watchedValues = useWatch({
    control: form.control,
    name: ['dateStart', 'dateEnd', 'airlineId']
  })

  // Debounce the watched values to prevent excessive onChange calls
  const debouncedValues = useDebounce(watchedValues, 300) // 300ms delay

  // Memoize the validation check to prevent unnecessary recalculations
  const validationResult = useMemo(() => {
    const [dateStart, dateEnd] = watchedValues // Use watchedValues for immediate validation

    if (!dateStart || !dateEnd) {
      return { isValid: false, hasRequiredFields: false, customError: null }
    }

    try {
      reportFormSchema.parse({ dateStart, dateEnd })
      return { isValid: true, hasRequiredFields: true, customError: null }
    } catch (error: any) {
      // Extract specific error message from Zod error
      let customError = 'Invalid date range'
      if (error?.issues?.length > 0) {
        // Use the first error message (usually date comparison)
        customError = error.issues[0].message
      }
      return { isValid: false, hasRequiredFields: true, customError }
    }
  }, [watchedValues])

  // Previous values ref to prevent duplicate onChange calls
  const prevValuesRef = useRef<string>("")

  // Optimized onChange callback with debounce and memoization
  React.useEffect(() => {
    const [dateStart, dateEnd, airlineId] = debouncedValues

    // Call onChange with current validation status (both valid and invalid states)
    if (onChange && dateStart && dateEnd) {
      // Create a hash of current values to prevent duplicate calls
      const currentHash = `${dateStart}-${dateEnd}`

      // Only call onChange if values actually changed
      if (prevValuesRef.current !== currentHash) {
        prevValuesRef.current = currentHash
        onChange({
          dateStart,
          dateEnd,
        },
          validationResult.isValid,
          airlineId
        ) // Always pass current validation status
      }
    }
    // Also handle case when fields are empty to properly disable buttons
    else if (onChange && (!dateStart || !dateEnd)) {
      onChange({ dateStart: dateStart || '', dateEnd: dateEnd || '' }, false, airlineId)
    }
  }, [debouncedValues, validationResult.isValid, onChange])

  // Memoized quick action handlers to prevent unnecessary re-renders
  const handleReset = useCallback(() => {
    const today = dayjs().format('YYYY-MM-DD')
    form.reset({
      dateStart: today,
      dateEnd: today,
      airlineId: "0",
    })

    // Update ref to prevent duplicate onChange
    const currentHash = `${today}-${today}`
    prevValuesRef.current = currentHash

    // Trigger onChange immediately for reset (today = today is always valid)
    if (onChange) {
      onChange({ dateStart: today, dateEnd: today }, true, "0") // Reset is always valid
    }
  }, [form, onChange])

  const handleSetToday = useCallback(() => {
    const today = dayjs().format('YYYY-MM-DD')
    form.setValue('dateStart', today, { shouldValidate: true }) // Enable validation for proper error handling
    form.setValue('dateEnd', today, { shouldValidate: true })

    // Update ref to prevent duplicate onChange
    const currentHash = `${today}-${today}`
    prevValuesRef.current = currentHash

    // Trigger onChange immediately for quick actions (these are always valid)
    if (onChange) {
      onChange({ dateStart: today, dateEnd: today }, true, "0") // Today = today is always valid
    }
  }, [form, onChange])

  const handleSetThisWeek = useCallback(() => {
    const startOfWeek = dayjs().startOf('week').format('YYYY-MM-DD')
    const endOfWeek = dayjs().endOf('week').format('YYYY-MM-DD')
    form.setValue('dateStart', startOfWeek, { shouldValidate: true })
    form.setValue('dateEnd', endOfWeek, { shouldValidate: true })

    // Update ref to prevent duplicate onChange
    const currentHash = `${startOfWeek}-${endOfWeek}`
    prevValuesRef.current = currentHash

    // Trigger onChange immediately for quick actions (these are always valid)
    if (onChange) {
      onChange({ dateStart: startOfWeek, dateEnd: endOfWeek }, true, "0") // Week range is always valid
    }
  }, [form, onChange])

  const handleSetThisMonth = useCallback(() => {
    const startOfMonth = dayjs().startOf('month').format('YYYY-MM-DD')
    const endOfMonth = dayjs().endOf('month').format('YYYY-MM-DD')
    form.setValue('dateStart', startOfMonth, { shouldValidate: true })
    form.setValue('dateEnd', endOfMonth, { shouldValidate: true })

    // Update ref to prevent duplicate onChange
    const currentHash = `${startOfMonth}-${endOfMonth}`
    prevValuesRef.current = currentHash

    // Trigger onChange immediately for quick actions (these are always valid)
    if (onChange) {
      onChange({ dateStart: startOfMonth, dateEnd: endOfMonth }, true, "0") // Month range is always valid
    }
  }, [form, onChange])

  // Memoized validation status for better performance - combine form errors and custom validation
  const validationStatus = useMemo(() => {
    const formHasErrors = Object.keys(form.formState.errors).length > 0
    const hasRequiredFields = validationResult.hasRequiredFields
    const isCustomValid = validationResult.isValid
    const hasCustomError = validationResult.customError !== null

    // Form is valid when: has both fields, no form errors, and passes custom validation
    const isValid = hasRequiredFields && !formHasErrors && isCustomValid
    // Has errors when: form has errors OR custom validation fails (including date comparison)
    const hasErrors = formHasErrors || hasCustomError

    return {
      hasErrors,
      isValid,
      hasRequiredFields,
      customError: validationResult.customError
    }
  }, [form.formState.errors, validationResult])

  const { hasErrors, isValid, hasRequiredFields, customError } = validationStatus
  const {
    options: airlinesOptions,
    isLoading: loadingAirlines,
    error: airlinesError,

  } = useAirlineOptions();
  const airlinesOptionsWithAll = React.useMemo(() => {
    const allOption = { value: "all", label: "All Airlines", id: 0 }
    return [allOption, ...airlinesOptions]
  }, [airlinesOptions])
  return (
    <div className="space-y-4">
      <Form {...form}>
        <div className="space-y-4">
          {/* Date Range Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <FormField
              control={form.control}
              name="dateStart"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    From Date *
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      disabled={isLoading}
                      className={`w-full transition-colors ${form.formState.errors.dateStart
                        ? 'border-red-500 focus:border-red-500'
                        : field.value && !form.formState.errors.dateStart && isValid
                          ? 'border-green-500 focus:border-green-500'
                          : ''
                        }`}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-600" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dateEnd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    To Date *
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      disabled={isLoading}
                      className={`w-full transition-colors ${form.formState.errors.dateEnd
                        ? 'border-red-500 focus:border-red-500'
                        : field.value && !form.formState.errors.dateEnd && isValid
                          ? 'border-green-500 focus:border-green-500'
                          : ''
                        }`}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-600" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="airlineId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Alrline *
                  </FormLabel>
                  <FormControl>
                    <Select
                      value={String(field.value)}
                      onValueChange={(value) => {
                        field.onChange(value);
                        const formValues = form.getValues();
                        if (onChange) {
                          onChange({ dateStart: formValues.dateStart || '', dateEnd: formValues.dateEnd || '' }, validationResult.isValid, value)
                        }
                      }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Airline" />
                      </SelectTrigger>
                      <SelectContent>
                        {airlinesOptionsWithAll.map((option) => (
                          <SelectItem key={String(option.id)} value={String(option.id)}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage className="text-xs text-red-600" />
                </FormItem>
              )}
            />
            {/* Quick Select Buttons */}
            <div className="col-span-3 flex justify-end items-center">
              <div className="flex flex-wrap gap-2 pt-2 border-t justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSetToday}
                  disabled={isLoading}
                  className="text-xs hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Today
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSetThisWeek}
                  disabled={isLoading}
                  className="text-xs hover:bg-green-50 hover:border-green-300 transition-colors"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  This Week
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSetThisMonth}
                  disabled={isLoading}
                  className="text-xs hover:bg-purple-50 hover:border-purple-300 transition-colors"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  This Month
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={isLoading}
                  className="text-xs hover:bg-gray-50 hover:border-gray-300 transition-colors"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Form>
    </div>
  )
}

export default ReportFormFilter