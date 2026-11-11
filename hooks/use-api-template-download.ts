"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { TemplateDownload } from "@/lib/api/lineMaintenances/aircraftSchedMappingTemplate";

/**
 * Downloads an import template from the API and saves it in the browser.
 * Pass the API function that fetches the file; errors are shown as a toast.
 */
export function useApiTemplateDownload(fetchTemplate: () => Promise<TemplateDownload>) {
    const [isDownloading, setIsDownloading] = useState(false);

    const downloadTemplate = useCallback(async () => {
        if (isDownloading) return;
        setIsDownloading(true);

        let objectUrl: string | null = null;
        try {
            const { blob, fileName } = await fetchTemplate();

            objectUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = objectUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error: any) {
            toast.error(error?.message || "Failed to download the template");
        } finally {
            // Give the browser a moment to start the save before releasing the URL.
            if (objectUrl) setTimeout(() => URL.revokeObjectURL(objectUrl!), 1000);
            setIsDownloading(false);
        }
    }, [fetchTemplate, isDownloading]);

    return { downloadTemplate, isDownloading };
}
