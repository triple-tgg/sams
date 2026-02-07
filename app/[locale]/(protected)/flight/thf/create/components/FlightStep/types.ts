// Types and interfaces for Flight Step form
export type Option = {
  label: string
  value: string
}

export type Step1FormInputs = {
  // Airlines Info
  customer: Option | null
  station: Option | null
  acReg: string
  acTypeCode: Option | null
  routeFrom: Option | null
  routeTo: Option | null

  // Arrival (UTC Time)
  flightArrival: string
  arrivalDate: string
  sta: string
  ata: string

  // Departure (UTC Time)
  flightDeparture: string
  departureDate: string
  std: string
  atd: string

  // THF Document Info
  thfNumber: string
  bay: string
  status: Option | null
  note: string
}
