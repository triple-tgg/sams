import axiosInstance from "@/lib/axios.config";

/**
 * Filename used when the server's own name cannot be read.
 *
 * The endpoint does send it in Content-Disposition, but that header is not
 * CORS-safelisted and the API does not return `Access-Control-Expose-Headers`,
 * so the browser hides it from JavaScript. Add that header on the API to make
 * a server-side rename take effect here.
 */
export const AIRCRAFT_SCHED_MAPPING_TEMPLATE_FILENAME = "Aircraft Sched-Mapping.xlsx";

export interface TemplateDownload {
    blob: Blob;
    fileName: string;
}

/**
 * Read the filename out of a Content-Disposition header.
 *
 * Prefers the RFC 5987 `filename*` form, which carries the percent-encoded
 * UTF-8 name, and falls back to the plain quoted `filename`. Returns
 * `fallback` when the header is absent or carries nothing usable.
 */
export function parseContentDispositionFilename(
    header: string | null | undefined,
    fallback: string
): string {
    if (!header) return fallback;

    const extended = header.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
    if (extended?.[1]) {
        try {
            const decoded = decodeURIComponent(extended[1].trim());
            if (decoded) return decoded;
        } catch {
            // Malformed percent-encoding — fall through to the plain form.
        }
    }

    const plain = header.match(/filename\s*=\s*"([^"]+)"/i) ?? header.match(/filename\s*=\s*([^;]+)/i);
    const name = plain?.[1]?.trim();
    return name || fallback;
}

/** Turn an error body that came back as a Blob into a readable message. */
async function readBlobErrorMessage(data: unknown): Promise<string | null> {
    if (!(data instanceof Blob)) return null;
    try {
        const text = await data.text();
        if (!text) return null;
        try {
            const parsed = JSON.parse(text);
            return parsed?.error || parsed?.message || null;
        } catch {
            return text.slice(0, 200);
        }
    } catch {
        return null;
    }
}

/**
 * GET /lineMaintenances/aircraft-sched-mapping-template
 *
 * Returns the current Aircraft Sched-Mapping import template. Fetching it from
 * the API rather than shipping a copy in `public/` keeps the reference sheets
 * (routes, stations, airlines, aircraft types, staff) in step with master data.
 */
export const getAircraftSchedMappingTemplate = async (): Promise<TemplateDownload> => {
    try {
        const response = await axiosInstance.get(
            "/lineMaintenances/aircraft-sched-mapping-template",
            {
                responseType: "blob",
                timeout: 60000, // 60 seconds — this is a file download
            }
        );

        return {
            blob: response.data as Blob,
            fileName: parseContentDispositionFilename(
                response.headers?.["content-disposition"],
                AIRCRAFT_SCHED_MAPPING_TEMPLATE_FILENAME
            ),
        };
    } catch (error: any) {
        console.error("Error downloading aircraft sched-mapping template:", error);
        const fromBlob = await readBlobErrorMessage(error?.response?.data);
        throw new Error(
            fromBlob ||
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                "Failed to download the template"
        );
    }
};
