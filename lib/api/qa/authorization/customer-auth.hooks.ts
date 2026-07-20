"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getCustomerAuthList, 
  getCustomerAuthRecords,
  updateCustomerAuth,
  type CustomerAuthListRequest,
  type CustomerAuthRecordsRequest,
  type UpdateCustomerAuthRequest
} from "./customer-auth";

export const customerAuthKeys = {
  all: ["customer-auth"] as const,
  list: (params: CustomerAuthListRequest) => [...customerAuthKeys.all, "list", params] as const,
  records: (params: CustomerAuthRecordsRequest) => [...customerAuthKeys.all, "records", params] as const,
};

export function useCustomerAuthList(params: CustomerAuthListRequest) {
  return useQuery({
    queryKey: customerAuthKeys.list(params),
    queryFn: () => getCustomerAuthList(params),
    staleTime: 5000,
  });
}

export function useCustomerAuthRecords(params: CustomerAuthRecordsRequest) {
  return useQuery({
    queryKey: customerAuthKeys.records(params),
    queryFn: () => getCustomerAuthRecords(params),
    staleTime: 5000,
  });
}

export function useUpdateCustomerAuth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCustomerAuthRequest) => updateCustomerAuth(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerAuthKeys.all });
    },
  });
}
