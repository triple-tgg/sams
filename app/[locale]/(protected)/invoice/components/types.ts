// Re-export types from API layer for backward compatibility
export type { PreInvoiceItem, DraftInvoiceItem, InvoiceRequest } from "@/lib/api/contract/invoiceApi";

// Invoice tab type
export type InvoiceTabType = "pre-invoice" | "draft-invoice";
