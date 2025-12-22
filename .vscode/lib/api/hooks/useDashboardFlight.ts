import { useQuery } from "@tanstack/react-query";
import { getDashboardFlight, DashboardFlightRes } from "@/lib/api/dashboard/getDashboardFlight";

export function useDashboardFlight() {
  return useQuery<DashboardFlightRes, Error>({
    queryKey: ["dashboardFlight"],
    queryFn: getDashboardFlight,
    // staleTime: 5 * 60 * 1000, // 5 minutes
    // gcTime: 10 * 60 * 1000, // 10 minutes
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });
}
