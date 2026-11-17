"use client";

import { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import {
  ROUTE_FROM_SAME_AS_STATION,
  ROUTE_TO_SAME_AS_STATION,
  getRouteStationErrors,
} from "@/lib/flight-route-validation";

type Form = Pick<UseFormReturn<any>, "watch" | "setError" | "clearErrors" | "getFieldState">;

const OWN_MESSAGES = new Set([ROUTE_FROM_SAME_AS_STATION, ROUTE_TO_SAME_AS_STATION]);

/**
 * Shows "Route ... must be different from Station" as soon as the user picks a
 * clashing value. The zod schema runs the same rule on submit, but zod only
 * reaches it after every other field is valid, so without this the error would
 * appear late. Fields must be named `station`, `routeFrom`, `routeTo`.
 */
export function useRouteStationCheck({ watch, setError, clearErrors, getFieldState }: Form) {
  const station = watch("station");
  const routeFrom = watch("routeFrom");
  const routeTo = watch("routeTo");

  const s = station?.value ?? "";
  const f = routeFrom?.value ?? "";
  const t = routeTo?.value ?? "";

  useEffect(() => {
    const errors = getRouteStationErrors({ value: s }, { value: f }, { value: t });
    for (const field of ["routeFrom", "routeTo"] as const) {
      const msg = errors[field];
      const current = getFieldState(field).error?.message;
      if (msg) {
        if (current !== msg) setError(field, { type: "routeStation", message: msg });
      } else if (current && OWN_MESSAGES.has(current)) {
        clearErrors(field);
      }
    }
  }, [s, f, t, setError, clearErrors, getFieldState]);
}
