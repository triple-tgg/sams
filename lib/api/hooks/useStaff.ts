import { useMutation, useQuery, UseQueryResult } from "@tanstack/react-query";
import { getStaff, StaffRequest, StaffResponse, Staff } from "../master/staff/getStaff";

/**
 * Custom hook for getting staff data with React Query
 * Uses useMutation since it's a POST request with search criteria
 */
export const useStaffMutation = () => {
  return useMutation({
    mutationFn: (data: StaffRequest) => getStaff(data),
    mutationKey: ['staff'],
    onSuccess: (data) => {
      console.log('Staff data fetched successfully:', data);
    },
    onError: (error) => {
      console.error('Failed to fetch staff data:', error);
    },
  });
};

/**
 * Custom hook for getting staff data with automatic search
 * @param searchCriteria - Staff search criteria
 * @param enabled - Whether to enable the query
 */
export const useStaff = (
  searchCriteria: StaffRequest = { code: "", name: "", id: "" },
  enabled: boolean = true
): UseQueryResult<StaffResponse, Error> => {
  return useQuery({
    queryKey: ['staff', searchCriteria],
    queryFn: () => getStaff(searchCriteria),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    // staleTime: 0,
    // gcTime: 0,
    retry: 2,
    retryDelay: 1000,
  });
};

/**
 * Custom hook for searching staff by code
 * @param code - Staff code to search
 * @param enabled - Whether to enable the query
 */
export const useStaffByCode = (
  code: string,
  enabled: boolean = true
): UseQueryResult<StaffResponse, Error> => {
  return useStaff(
    { code, name: "", id: "" },
    enabled && !!code
  );
};

/**
 * Custom hook for searching staff by name
 * @param name - Staff name to search
 * @param enabled - Whether to enable the query
 */
export const useStaffByName = (
  name: string,
  enabled: boolean = true
): UseQueryResult<StaffResponse, Error> => {
  return useStaff(
    { code: "", name, id: "" },
    enabled && !!name
  );
};

/**
 * Custom hook for searching staff by ID
 * @param id - Staff ID to search
 * @param enabled - Whether to enable the query
 */
export const useStaffById = (
  id: string,
  enabled: boolean = true
): UseQueryResult<StaffResponse, Error> => {
  return useStaff(
    { code: "", name: "", id },
    enabled && !!id
  );
};

/**
 * Transform staff data to dropdown options
 * @param staffList - Array of staff
 */
export const transformStaffToOptions = (staffList: Staff[]) => {
  return staffList.map(staff => ({
    value: staff.code,
    label: `${staff.code} - ${staff.name}`,
    data: staff
  }));
};

/**
 * Transform staff data to options with ID as value
 * @param staffList - Array of staff
 */
export const transformStaffToIdOptions = (staffList: Staff[]) => {
  return staffList.map(staff => ({
    value: staff.id.toString(),
    label: `${staff.code} - ${staff.name}`,
    data: staff
  }));
};
