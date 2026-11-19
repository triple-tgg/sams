import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAircraftTypesListData, type FlightAircraftTypeItem } from "../flight/getAircraftTypesListData";

/**
 * A/C Type options for the Flight Information form (Add / Edit flight),
 * filtered by the selected airline and station via POST /flight/aircraftTypes-listdata.
 * Only fetches once both airline and station are selected.
 */
export function useFlightAircraftTypeOptions(airlineId?: number | null, stationCode?: string | null) {
  const code = stationCode?.trim() ?? "";
  const enabled = !!airlineId && !!code;

  const query = useQuery<FlightAircraftTypeItem[], Error>({
    queryKey: ["flightAircraftTypesListData", airlineId ?? 0, code],
    queryFn: () => getAircraftTypesListData({ airlineId: airlineId!, stationCode: code }),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const options = useMemo(() => {
    const seen = new Set<string>();
    return (query.data ?? [])
      .filter((t) => {
        if (!t.code || seen.has(t.code)) return false;
        seen.add(t.code);
        return true;
      })
      .map((t) => ({ value: t.code, label: t.code, id: t.id }));
  }, [query.data]);

  return {
    ...query,
    enabled,
    options,
    aircraftTypes: query.data ?? [],
    isLoading: enabled && query.isLoading,
  };
}
