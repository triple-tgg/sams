"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getCustomerAuthList, 
  updateCustomerAuth,
  getCustomerAuthById,
  type CustomerAuthListRequest,
  type UpdateCustomerAuthRequest,
  type CustomerAuthDetailRequest
} from "./customer-auth";

export const customerAuthKeys = {
  all: ["customer-auth"] as const,
  list: (params: CustomerAuthListRequest) => [...customerAuthKeys.all, "list", params] as const,
};

export function useCustomerAuthList(params: CustomerAuthListRequest) {
  return useQuery({
    queryKey: customerAuthKeys.list(params),
    queryFn: () => getCustomerAuthList(params),
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

export function useCustomerAuthById(data: CustomerAuthDetailRequest | null) {
  return useQuery({
    queryKey: [...customerAuthKeys.all, "detail", data?.staffId, data?.airlineId],
    queryFn: () => getCustomerAuthById(data!),
    enabled: !!data && data.staffId > 0 && data.airlineId > 0, // Only run the query if valid data is provided
    staleTime: 5000,
  });
}

