import { z } from 'zod'

// Individual Part/Tool validation schema
export const partToolItemSchema = z.object({
  isSamsTool: z.boolean().default(false),
  isLoan: z.boolean().default(false),
  pathToolName: z.string().min(1, "Part/Tool name is required"),
  pathToolNo: z.string().optional().default(""),
  serialNoIn: z.string().optional().default(""),
  serialNoOut: z.string().optional().default(""),
  qty: z.number().min(0, "Quantity must be 0 or greater").default(0),
  equipmentNo: z.string().optional().default(""),
  hrs: z.number().min(0, "Hours must be 0 or greater").default(0),
  formDate: z.string().nullable().default(null),
  toDate: z.string().nullable().default(null),
  formTime: z.string().nullable().default(null),
  toTime: z.string().nullable().default(null),
})

// Main form validation schema
export const partsToolsFormSchema = z.object({
  partsTools: z.array(partToolItemSchema).min(1, "At least one part/tool is required"),
})

export type PartsToolsFormSchema = z.infer<typeof partsToolsFormSchema>
export type PartToolItemSchema = z.infer<typeof partToolItemSchema>
