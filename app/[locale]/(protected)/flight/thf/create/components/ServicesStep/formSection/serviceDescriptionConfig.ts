/**
 * Service Description Config
 *
 * Maps combinations of maintenance-type + sub-types to a human-readable
 * description so the user understands what the selected service scope means.
 *
 * Matching logic: the `services` array is treated as an **unordered set** —
 * [maintenanceType, ...selectedSubTypes] must contain exactly the same
 * values as the config entry (order-insensitive, case-insensitive).
 */

export interface ServiceDescriptionEntry {
  /** The combination of services: first element is the maintenance type, remaining are sub-types */
  services: string[]
  /** Human-readable description shown to the user */
  description: string
}

export const serviceDescriptionConfig: ServiceDescriptionEntry[] = [
  {
    services: ["TR-Transit", "Full Handling"],
    description:
      "Transit check with aircraft release certification",
  },
  {
    services: ["TR-Transit", "Assistance"],
    description:
      "Transit check with mechanic assistance; no aircraft release certification",
  },
  {
    services: ["TR-Transit", "On Call"],
    description:
      "Transit service with on-call support; no service",
  },
  {
    services: ["TR-Transit", "Marshalling"],
    description: "Marshalling service only",
  },
  {
    services: ["TR-Transit", "Full Handling", "On Call"],
    description:
      "Transit with On-call support and aircraft release certification is required",
  },
  {
    services: ["TR-Transit", "Assistance", "On Call"],
    description:
      "Transit with On-call and mechanic assistance; no aircraft release certification required",
  },
  {
    services: ["TR-Transit", "Towing"],
    description: "Transit with towing service only",
  },
  {
    services: ["Night Stop", "Full Handling (Certification)"],
    description: "Night Stop with aircraft release certification",
  },
  {
    services: ["Weekly", "Full Handling"],
    description: "Weekly Check with aircraft release certification",
  },
  {
    services: ["A-Check", "Full Handling"],
    description: "A-Check with aircraft release certification",
  },
  {
    services: ["TR-Transit", "Standby"],
    description:
      "Transit with Standby service; no assistance, no aircraft release certification required",
  },
  {
    services: ["TR-Transit", "Standby", "Assistance"],
    description:
      "Transit with Standby service and assistance; no aircraft release certification required",
  },
  {
    services: ["TR-Transit", "Standby", "Full Handling"],
    description:
      "Transit with Standby service and aircraft release certification required",
  },
]

/**
 * Look up a description for the given maintenance-type + sub-types combination.
 *
 * @param maintenanceType  e.g. "TR-Transit"
 * @param subTypes         e.g. ["Full Handling", "On Call"]
 * @returns the matching description string, or `null` if no match found
 */
export function getServiceDescription(
  maintenanceType: string,
  subTypes: string[]
): string | null {
  if (!maintenanceType) return null

  // Build the actual combination: [maintenanceType, ...subTypes]
  const actual = [maintenanceType, ...subTypes].map((s) => s.toLowerCase().trim())
  const actualSet = new Set(actual)

  // Must be an exact-size set match (no extra, no missing)
  for (const entry of serviceDescriptionConfig) {
    const entrySet = new Set(entry.services.map((s) => s.toLowerCase().trim()))
    if (
      entrySet.size === actualSet.size &&
      [...entrySet].every((v) => actualSet.has(v))
    ) {
      return entry.description
    }
  }

  return null
}
