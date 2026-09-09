"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { getAircraftSchedMappingTemplate } from "@/lib/api/lineMaintenances/aircraftSchedMappingTemplate";

/**
 * Downloads the Aircraft Sched-Mapping import template from the API.
 *
 * Replaces the copy that used to be served out of `public/`, which went stale:
 * the template carries reference sheets for routes, stations, airlines,
 * aircraft types and staff, and those only stay current if the file comes from
 * the server each time.
 */
export function useAircraftSchedMappingTemplate() {
    const [isDownloading, setIsDownloading] = useState(false);

    const downloadTemplate = useCallback(async () => {
        if (isDownloading) return;
        setIsDownloading(true);

        let objectUrl: string | null = null;
        try {
            const { blob, fileName } = await getAircraftSchedMappingTemplate();

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
    }, [isDownloading]);

    return { downloadTemplate, isDownloading };
}
