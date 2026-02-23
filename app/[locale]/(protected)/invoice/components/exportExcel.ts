import * as XLSX from "xlsx";
import type { PreInvoiceItem } from "@/lib/api/contract/invoiceApi";

/**
 * Export Pre-Invoice data to Excel file
 * Filename: [AirlineCode][Period]-PRE-INVOICE.xlsx
 */
export const exportPreInvoiceToExcel = (
    invoices: PreInvoiceItem[],
    airlineCode: string,
    dateStart: string,
    dateEnd: string
) => {
    if (invoices.length === 0) return;

    // Build rows
    const rows = invoices.map((inv) => ({
        "Date": inv.activityDate,
        "Airline": inv.airlineObj?.code || "",
        "Station": inv.stationCode,
        "Flight No.": inv.flightNo,
        "Aircraft": inv.aircraftCode,
        "A/C Reg.": inv.acReg || "",
        "Cert": inv.flagCert ? "Yes" : "No",
        "ATA": inv.ataTime || "",
        "ATD": inv.atdTime || "",
        "T/R Time": inv.trTime || "",
        // Transit Checks - With Cert
        "<2hrs Cert": inv.tsChkUnder2hrsCert,
        "2-3hrs Cert": inv.tsChk2to3hrsCert,
        "3-4hrs Cert": inv.tsChk3to4hrsCert,
        "4-5hrs Cert": inv.tsChk4to5hrsCert,
        "5-6hrs Cert": inv.tsChk5to6hrsCert,
        "6+hrs Cert": inv.additionalFee6hrsPlusCert,
        // Transit Checks - Without Cert
        "<2hrs NoCert": inv.tsChkUnder2hrsNoCert,
        "2-3hrs NoCert": inv.tsChk2to3hrsNoCert,
        "3-4hrs NoCert": inv.tsChk3to4hrsNoCert,
        "4-5hrs NoCert": inv.tsChk4to5hrsNoCert,
        "5-6hrs NoCert": inv.tsChk5to6hrsNoCert,
        "6+hrs NoCert": inv.additionalFee6hrsPlusNoCert,
        // Other Checks
        "Standby": inv.standbyPerCheck,
        "On Call": inv.onCallPerCheck,
        "Pre-Flight": inv.preFlightCheck,
        "Weekly": inv.weeklyCheck,
        "Night Stop": inv.nightStop,
        // Labor
        "Add. LAE MH": inv.additionalLaeMhHr,
        "Add. Mech MH": inv.additionalMechMhHr,
        // Ground
        "Towing": inv.towingPerService,
        "Marshalling": inv.marshalling,
        // Fluids
        "Engine Oil": inv.engineOilQuad,
        "Hydraulic Fluid": inv.hydraulicFluidQuad,
        // Total
        "Total (USD)": inv.totalServicePrice,
        "Remark": inv.remark || "",
    }));

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PRE-INVOICE");

    // Auto-size columns
    const colWidths = Object.keys(rows[0]).map((key) => ({
        wch: Math.max(key.length + 2, 12),
    }));
    ws["!cols"] = colWidths;

    // Generate filename: [Airline][Period]-PRE-INVOICE.xlsx
    const airline = airlineCode || "ALL";
    const period = `${dateStart}_${dateEnd}`;
    const filename = `${airline}_${period}-PRE-INVOICE.xlsx`;

    // Trigger download
    XLSX.writeFile(wb, filename);
};
