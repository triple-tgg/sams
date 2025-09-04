// Types and interfaces for Flight Step form
export type Option = {
  label: string
  value: string
}

export type Step1FormInputs = {
  customer: Option | null
  station: Option | null
  acReg: string
  acTypeCode: Option | null
  flightArrival: string
  arrivalDate: string
  sta: string
  ata: string
  flightDeparture: string
  departureDate: string
  std: string
  atd: string
  bay: string
  status: Option | null
  note: string
  thfNumber: string
  delayCode: string
  routeFrom: string
  routeTo: string
}
