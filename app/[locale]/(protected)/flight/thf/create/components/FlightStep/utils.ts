import { FlightFormData } from "@/lib/api/hooks/uselineMaintenancesQueryThfByFlightId";
import { formatFromPicker } from "@/lib/utils/formatPicker";


// Utility functions for Flight Step
const SEND_HHMM = false;

export const toHHmm = (t?: string) =>
  t ? (t.includes(":") ? t.replace(":", "") : t) : "";

export const sendTime = (t?: string) =>
  SEND_HHMM ? toHHmm(t) : (t ?? "");

export const getDefaultValues = () => ({
  customer: null,
  station: null,
  acReg: '',
  acTypeCode: null,
  flightArrival: '',
  arrivalDate: '',
  sta: '',
  ata: '',
  flightDeparture: '',
  departureDate: '',
  std: '',
  atd: '',
  bay: '',
  status: null,
  note: '',
  thfNumber: '',
  delayCode: '',
  routeFrom: '',
  routeTo: '',
});

export const sanitizeFormData = (existingFlightData: FlightFormData) => ({
  customer: existingFlightData.customer || null,
  station: existingFlightData.station || null,
  acReg: existingFlightData.acReg || '',
  acTypeCode: existingFlightData.acTypeCode || null,
  flightArrival: existingFlightData.flightArrival || '',
  arrivalDate: existingFlightData.arrivalDate ? formatFromPicker(existingFlightData.arrivalDate) : '',
  sta: existingFlightData.sta || '',
  ata: existingFlightData.ata || '',
  flightDeparture: existingFlightData.flightDeparture || '',
  departureDate: existingFlightData.departureDate ? formatFromPicker(existingFlightData.departureDate) : '',
  std: existingFlightData.std || '',
  atd: existingFlightData.atd || '',
  bay: existingFlightData.bay || '',
  status: existingFlightData.status || null,
  note: existingFlightData.note || '',
  thfNumber: existingFlightData.thfNumber || '',
  delayCode: existingFlightData.delayCode || '',
  routeFrom: existingFlightData.routeFrom || '',
  routeTo: existingFlightData.routeTo || '',
});
