import { z } from "zod";

type Opt = { value?: string | null } | null | undefined;

const norm = (o: Opt) => (o?.value ?? "").trim().toUpperCase();

export const ROUTE_FROM_SAME_AS_STATION = "Route From must be different from Station";
export const ROUTE_TO_SAME_AS_STATION = "Route To must be different from Station";

/**
 * Station must differ from Route From and from Route To.
 * Route From and Route To may be the same (e.g. ALA → BKK → ALA).
 * Empty values are skipped — required checks live in the schema.
 */
export function getRouteStationErrors(station: Opt, routeFrom: Opt, routeTo: Opt) {
  const s = norm(station);
  const errors: { routeFrom?: string; routeTo?: string } = {};
  if (!s) return errors;
  if (norm(routeFrom) === s) errors.routeFrom = ROUTE_FROM_SAME_AS_STATION;
  if (norm(routeTo) === s) errors.routeTo = ROUTE_TO_SAME_AS_STATION;
  return errors;
}

/** Adds the Station / Route issues to a zod superRefine context. */
export function refineRouteStation(
  data: { station?: Opt; routeFrom?: Opt; routeTo?: Opt },
  ctx: z.RefinementCtx
) {
  const e = getRouteStationErrors(data.station, data.routeFrom, data.routeTo);
  if (e.routeFrom) ctx.addIssue({ code: z.ZodIssueCode.custom, message: e.routeFrom, path: ["routeFrom"] });
  if (e.routeTo) ctx.addIssue({ code: z.ZodIssueCode.custom, message: e.routeTo, path: ["routeTo"] });
}
