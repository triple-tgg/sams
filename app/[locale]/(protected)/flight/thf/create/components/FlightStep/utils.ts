import { FlightFormData } from "@/lib/api/hooks/uselineMaintenancesQueryThfByFlightId";
import { formatFromPicker } from "@/lib/utils/formatPicker";
import type { Step1FormInputs } from "./types";

// Time formatting utilities
const SEND_HHMM = false;

export const toHHmm = (t?: string) =>
  t ? (t.includes(":") ? t.replace(":", "") : t) : "";

export const sendTime = (t?: string) =>
  SEND_HHMM ? toHHmm(t) : (t ?? "");

// Default values for new form (create mode)
export const getDefaultValues = (): Step1FormInputs => ({
  // Airlines Info
  customer: null,
  station: null,
  acReg: '',
  acTypeCode: null,
  routeFrom: null,
  routeTo: null,

  // Arrival (UTC Time)
  flightArrival: '',
  arrivalDate: '',
  sta: '',
  ata: '',

  // Departure (UTC Time)
  flightDeparture: '',
  departureDate: '',
  std: '',
  atd: '',

  // THF Document Info
  thfNumber: '',
  bay: '',
  status: null,
  note: '',
});

// Sanitize form data from API (update mode)
export const sanitizeFormData = (existingData: FlightFormData): Step1FormInputs => {
  console.log('[sanitizeFormData] routeFrom:', existingData.routeFrom, 'routeTo:', existingData.routeTo);
  return ({
    // Airlines Info
    customer: existingData.customer || null,
    station: existingData.station || null,
    acReg: existingData.acReg || '',
    acTypeCode: existingData.acTypeCode || null,
    routeFrom: existingData.routeFrom || null,
    routeTo: existingData.routeTo || null,

    // Arrival (UTC Time)
    flightArrival: existingData.flightArrival || '',
    arrivalDate: existingData.arrivalDate ? formatFromPicker(existingData.arrivalDate) : '',
    sta: existingData.sta || '',
    ata: existingData.ata || '',

    // Departure (UTC Time)
    flightDeparture: existingData.flightDeparture || '',
    departureDate: existingData.departureDate ? formatFromPicker(existingData.departureDate) : '',
    std: existingData.std || '',
    atd: existingData.atd || '',

    // THF Document Info
    thfNumber: existingData.thfNumber || '',
    bay: existingData.bay || '',
    status: existingData.status || null,
    note: existingData.note || '',
  });
}
