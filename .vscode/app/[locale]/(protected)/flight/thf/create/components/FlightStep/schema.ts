import { z } from 'zod'

export const flightFormSchema = z.object({
  customer: z.object({
    label: z.string(),
    value: z.string(),
  }).nullable().refine((val) => val !== null, {
    message: "Customer/Airlines is required",
  }),
  station: z.object({
    label: z.string(),
    value: z.string(),
  }).nullable().refine((val) => val !== null, {
    message: "Station is required",
  }),
  acReg: z.string().min(1, "A/C Registration is required"),
  acTypeCode: z.object({
    label: z.string(),
    value: z.string(),
  }).nullable().refine((val) => val !== null, {
    message: "A/C Type is required",
  }),
  flightArrival: z.string().min(1, "Arrival flight number is required"),
  arrivalDate: z.string().min(1, "Arrival date is required"),
  sta: z.string().min(1, "STA time is required"),
  ata: z.string().min(1, "ATA time is required"),
  flightDeparture: z.string().min(1, "Flight number is required"),
  departureDate: z.string().min(1, "Date is required"),
  std: z.string().min(1, "STD time is required"),
  atd: z.string().min(1, "ATD time is required"),
  bay: z.string().optional(),
  status: z.object({
    label: z.string(),
    value: z.string(),
  }).nullable().refine((val) => val !== null, {
    message: "Status is required",
  }),
  note: z.string().optional(),
  thfNumber: z.string().min(1, "THF Number is required"),
  delayCode: z.string().optional(),
  // routeFrom: z.string().min(1, "Route From is required"),
  // routeTo: z.string().min(1, "Route To is required"),
});

export type FlightFormSchema = z.infer<typeof flightFormSchema>
