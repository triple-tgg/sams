import { z } from 'zod';

/**
 * Date format validation regex (YYYY-MM-DD)
 */
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Time format validation regex (HH:mm)
 */
const timeRegex = /^\d{2}:\d{2}$/;

/**
 * Zod schema for validating flight import data
 * Validates required fields and format constraints
 */
export const flightImportSchema = z.object({
    // Required fields
    airlinesCode: z
        .string()
        .min(1, 'Airlines Code is required')
        .max(10, 'Airlines Code must be 10 characters or less'),

    stationsCode: z
        .string()
        .min(1, 'Station Code is required')
        .max(10, 'Station Code must be 10 characters or less'),

    acReg: z
        .string()
        .min(1, 'A/C Reg is required')
        .max(20, 'A/C Reg must be 20 characters or less'),

    acTypeCode: z
        .string()
        .min(1, 'A/C Type is required')
        .max(10, 'A/C Type must be 10 characters or less'),

    // Date fields with format validation
    arrivalDate: z
        .string()
        .min(1, 'Arrival Date is required')
        .refine((val) => dateRegex.test(val), {
            message: 'Arrival Date must be in YYYY-MM-DD format',
        }),

    departureDate: z
        .string()
        .min(1, 'Departure Date is required')
        .refine((val) => dateRegex.test(val), {
            message: 'Departure Date must be in YYYY-MM-DD format',
        }),

    // Time fields - optional but must be valid format if provided
    arrivalStaTime: z
        .string()
        .optional()
        .refine((val) => !val || timeRegex.test(val), {
            message: 'Arrival STA must be in HH:mm format',
        }),

    arrivalAtaTime: z
        .string()
        .optional()
        .refine((val) => !val || timeRegex.test(val), {
            message: 'Arrival ATA must be in HH:mm format',
        }),

    departureStdTime: z
        .string()
        .optional()
        .refine((val) => !val || timeRegex.test(val), {
            message: 'Departure STD must be in HH:mm format',
        }),

    departureAtdTime: z
        .string()
        .optional()
        .refine((val) => !val || timeRegex.test(val), {
            message: 'Departure ATD must be in HH:mm format',
        }),

    // Optional string fields
    arrivalFlightNo: z.string().optional(),
    departureFlightNo: z.string().optional(),
    bayNo: z.string().optional(),
    statusCode: z.string().optional(),
    note: z.string().optional(),
});

export type FlightImportSchemaType = z.infer<typeof flightImportSchema>;

/**
 * Validate a single row of flight data
 * @param data - Row data to validate
 * @returns Validation result with success status and errors if any
 */
export function validateFlightRow(data: Record<string, any>): {
    success: boolean;
    errors: Array<{ column: string; message: string }>;
} {
    const result = flightImportSchema.safeParse(data);

    if (result.success) {
        return { success: true, errors: [] };
    }

    // Extract field-level errors
    const errors = result.error.errors.map((err) => ({
        column: String(err.path[0] || 'unknown'),
        message: err.message,
    }));

    return { success: false, errors };
}
