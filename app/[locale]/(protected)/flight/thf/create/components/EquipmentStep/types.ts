// Equipment Step Types
export interface Equipment {
  equipmentName: string // Required
  hrs: string // Optional
  svcQty: string // Optional
  fromDate: string // Required
  fromTime: string // Required
  toDate: string // Required
  toTime: string // Required
  loan: boolean // Optional
  samsTool: boolean // Optional

}

export interface EquipmentFormData {
  equipments: Equipment[]
}

export interface EquipmentStepProps {
  initialData?: EquipmentFormData | null
}

// Default equipment values
export const defaultEquipment: Equipment = {
  equipmentName: '',
  hrs: '',
  svcQty: '',
  fromDate: '',
  fromTime: '',
  toDate: '',
  toTime: '',
  loan: false,
  samsTool: false,
}
