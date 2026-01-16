import { useQuery, UseQueryResult } from "@tanstack/react-query";
import {
    getContractList,
    ContractListRequest,
    ContractListResponse
} from "../contract/getContractList";

/**
 * Custom hook for getting contract list data
 * @param searchCriteria - Contract search criteria
 * @param enabled - Whether to enable the query
 */
export const useContractList = (
    searchCriteria: ContractListRequest,
    enabled: boolean = true
): UseQueryResult<ContractListResponse, Error> => {
    return useQuery({
        queryKey: ['contractList', searchCriteria],
        queryFn: () => getContractList(searchCriteria),
        enabled,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 15 * 60 * 1000, // 15 minutes
        retry: 2,
        retryDelay: 1000,
    });
};

/**
 * Default request values for contract list
 */
export const defaultContractListRequest: ContractListRequest = {
    contractNo: "",
    airlineId: 0,
    stationCodeList: [],
    dateStart: "",
    dateEnd: "",
    page: 1,
    perPage: 10,
};

export default useContractList;
