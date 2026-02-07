import { z } from 'zod'

// Reusable schemas
const optionSchema = z.object({
  label: z.string(),
  value: z.string(),
})

const requiredOptionSchema = optionSchema.nullable().refine((val) => val !== null, {
  message: "This field is required",
})

const optionalOptionSchema = optionSchema.nullable().optional()

export const flightFormSchema = z.object({
  // Airlines Info - Required: customer, station, acTypeCode
  customer: optionSchema.nullable().refine((val) => val !== null, {
    message: "Customer/Airlines is required",
  }),
  station: optionSchema.nullable().refine((val) => val !== null, {
    message: "Station is required",
  }),
  acReg: z.string().optional(), // Optional
  acTypeCode: optionSchema.nullable().refine((val) => val !== null, {
    message: "A/C Type is required",
  }),
  routeFrom: optionalOptionSchema, // Optional
  routeTo: optionalOptionSchema, // Optional

  // Arrival (UTC Time) - Required: flightArrival, arrivalDate, sta; Optional: ata
  flightArrival: z.string().min(1, "Flight No is required"),
  arrivalDate: z.string().min(1, "Arrival date is required"),
  sta: z.string().min(1, "STA time is required"),
  ata: z.string().optional(), // Optional

  // Departure (UTC Time) - Required: flightDeparture, departureDate, std; Optional: atd
  flightDeparture: z.string().min(1, "Flight No is required"),
  departureDate: z.string().min(1, "Departure date is required"),
  std: z.string().min(1, "STD time is required"),
  atd: z.string().optional(), // Optional

  // THF Document Info - Required: thfNumber; Optional: bay, status, note
  thfNumber: z.string().min(1, "THF Number is required"),
  bay: z.string().optional(), // Optional
  status: optionalOptionSchema, // Optional
  note: z.string().optional(), // Optional
})

export type FlightFormSchema = z.infer<typeof flightFormSchema>
