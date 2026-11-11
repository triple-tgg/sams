"use client";

import { getAircraftSchedMappingTemplate } from "@/lib/api/lineMaintenances/aircraftSchedMappingTemplate";
import { useApiTemplateDownload } from "./use-api-template-download";

/**
 * Downloads the Aircraft Sched-Mapping import template from the API.
 *
 * Replaces the copy that used to be served out of `public/`, which went stale:
 * the template carries reference sheets for routes, stations, airlines,
 * aircraft types and staff, and those only stay current if the file comes from
 * the server each time.
 */
export function useAircraftSchedMappingTemplate() {
    return useApiTemplateDownload(getAircraftSchedMappingTemplate);
}
