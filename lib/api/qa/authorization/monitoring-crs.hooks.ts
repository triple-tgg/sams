"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getMonitoringCrsDetail,
  getMonitoringCrsList,
  getMonitoringCrsSummary,
  type MonitoringCrsListRequest,
} from "./monitoring-crs";

export const monitoringCrsKeys = {
  all: ["monitoring-crs"] as const,
  list: (params: MonitoringCrsListRequest) => [...monitoringCrsKeys.all, "list", params] as const,
  detail: (staffId: number | null, expiryWarningDays: number) =>
    [...monitoringCrsKeys.all, "detail", staffId, expiryWarningDays] as const,
  summary: (expiryWarningDays: number) => [...monitoringCrsKeys.all, "summary", expiryWarningDays] as const,
};

export function useMonitoringCrsList(params: MonitoringCrsListRequest) {
  return useQuery({
    queryKey: monitoringCrsKeys.list(params),
    queryFn: () => getMonitoringCrsList(params),
    staleTime: 5_000,
  });
}

export function useMonitoringCrsDetail(staffId: number | null, expiryWarningDays = 90) {
  return useQuery({
    queryKey: monitoringCrsKeys.detail(staffId, expiryWarningDays),
    queryFn: () => getMonitoringCrsDetail(staffId as number, expiryWarningDays),
    enabled: staffId !== null,
    staleTime: 5_000,
  });
}

export function useMonitoringCrsSummary(expiryWarningDays = 90) {
  return useQuery({
    queryKey: monitoringCrsKeys.summary(expiryWarningDays),
    queryFn: () => getMonitoringCrsSummary(expiryWarningDays),
    staleTime: 15_000,
  });
}
