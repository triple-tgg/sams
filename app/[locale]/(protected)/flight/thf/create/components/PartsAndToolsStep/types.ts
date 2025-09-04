// Types for PartsAndTools Step

export interface PartsToolsFormInputs {
  partsTools: PartToolItem[]
}

export interface PartToolItem {
  isSamsTool: boolean
  isLoan: boolean
  pathToolName: string
  pathToolNo: string
  serialNoIn: string
  serialNoOut: string
  qty: number
  equipmentNo: string
  hrs: number
  formDate: string | null
  toDate: string | null
  formTime: string | null
  toTime: string | null
}

export interface DropdownOption {
  value: string
  label: string
}

// Default item for adding new parts/tools
export const defaultPartToolItem: PartToolItem = {
  isSamsTool: false,
  isLoan: false,
  pathToolName: '',
  pathToolNo: '',
  serialNoIn: '',
  serialNoOut: '',
  qty: 0,
  equipmentNo: '',
  hrs: 0,
  formDate: null,
  toDate: null,
  formTime: null,
  toTime: null,
}

// Response interface for PUT API
export interface PutPartsToolsResponse {
  message: string
  responseData: null
  error: string
}
