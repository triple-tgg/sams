// Types for PartsAndTools Step

import { dateTimeUtils } from "@/lib/dayjs"
import { formatFromPicker } from "@/lib/utils/formatPicker"

export interface PartsToolsFormInputs {
  partsTools: PartToolItem[]
}

export interface PartToolItem {
  isSamsTool: boolean
  isLoan: boolean
  loanRemark: string
  pathToolName: string
  pathToolNo: string
  serialNoIn: string
  serialNoOut: string
  qty: number
  equipmentNo: string
  hrs: number
  formDate: string | null
  toDate: string | null
  formTime: string
  toTime: string | null
}

export interface DropdownOption {
  value: string
  label: string
}

// Default item for adding new parts/tools
export const defaultPartToolItem: PartToolItem = {
  isSamsTool: true,
  isLoan: false,
  loanRemark: '',
  pathToolName: '',
  pathToolNo: '',
  serialNoIn: '',
  serialNoOut: '',
  qty: 0,
  equipmentNo: '',
  hrs: 0,
  formDate: formatFromPicker(dateTimeUtils.getCurrentDate()),
  toDate: formatFromPicker(dateTimeUtils.getCurrentDate()),
  formTime: "",
  toTime: null,
}

// Response interface for PUT API
export interface PutPartsToolsResponse {
  message: string
  responseData: null
  error: string
}
