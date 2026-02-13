"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import getRoutesList from "@/lib/api/master/routes/getRoutesList";
import searchRoutesByName from "@/lib/api/master/routes/searchRoutesByName";
import upsertRoute from "@/lib/api/master/routes/upsertRoute";
import type {
    RouteListResponse,
    RouteSearchResponse,
    RouteUpsertRequest,
} from "@/lib/api/master/routes/routes.interface";

// Fetch all routes (pre-populate combobox)
export function useRoutesList() {
    return useQuery<RouteListResponse, Error>({
        queryKey: ["routes-list"],
        queryFn: getRoutesList,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false,
    });
}

// Search routes by name (debounced search)
export function useSearchRoutes(name: string) {
    return useQuery<RouteSearchResponse, Error>({
        queryKey: ["routes-search", name],
        queryFn: () => searchRoutesByName(name),
        enabled: name.length >= 1,
        staleTime: 30 * 1000,
        gcTime: 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
    });
}

// Upsert route mutation
export function useUpsertRoute() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: RouteUpsertRequest) => upsertRoute(data),
        onSuccess: () => {
            // Invalidate routes list to refresh options
            queryClient.invalidateQueries({ queryKey: ["routes-list"] });
        },
    });
}

// Hook that returns route options in { value, label } format
export function useRoutesOptions() {
    const { data, isLoading, error } = useRoutesList();

    const options =
        data?.responseData?.map((route) => ({
            value: route.code,
            label: route.code,
            // label: route.name ? `${route.code} - ${route.name}` : route.code,
        })) ?? [];

    return {
        options,
        isLoading,
        error,
        isEmpty: options.length === 0 && !isLoading,
    };
}
