import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { PartsTool, PartsToolsApiResponse, getPartsToolsByName, getPartsToolsNames, searchPartsToolsByName } from '../master/parts-tools/getPartsTools';

// Query keys for React Query
export const PARTS_TOOLS_QUERY_KEYS = {
  all: ['partsTools'] as const,
  names: () => [...PARTS_TOOLS_QUERY_KEYS.all, 'names'] as const,
  byName: (name: string) => [...PARTS_TOOLS_QUERY_KEYS.all, 'byName', name] as const,
  search: (searchTerm: string) => [...PARTS_TOOLS_QUERY_KEYS.all, 'search', searchTerm] as const,
};

/**
 * Hook to get all parts/tools names
 */
export const usePartsToolsNames = (
  options?: Omit<UseQueryOptions<PartsToolsApiResponse>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: PARTS_TOOLS_QUERY_KEYS.names(),
    queryFn: getPartsToolsNames,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

/**
 * Hook to get parts/tools by specific name
 */
export const usePartsToolsByName = (
  name: string,
  options?: Omit<UseQueryOptions<PartsToolsApiResponse>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: PARTS_TOOLS_QUERY_KEYS.byName(name),
    queryFn: () => getPartsToolsByName(name),
    enabled: !!name && name.trim() !== '',
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

/**
 * Hook to search parts/tools by name (with debouncing recommended)
 */
export const useSearchPartsTools = (
  searchTerm: string,
  options?: Omit<UseQueryOptions<PartsTool[]>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: PARTS_TOOLS_QUERY_KEYS.search(searchTerm),
    queryFn: () => searchPartsToolsByName(searchTerm),
    enabled: !!searchTerm && searchTerm.trim() !== '' && searchTerm.length >= 2, // Minimum 2 characters
    staleTime: 2 * 60 * 1000, // 2 minutes (shorter for search)
    gcTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};


/**
 * Hook to get parts/tools with prefetching support
 */
export const usePartsToolsWithPrefetch = (
  name?: string,
  options?: Omit<UseQueryOptions<PartsToolsApiResponse>, 'queryKey' | 'queryFn'>
) => {
  // Get all names first
  const namesQuery = usePartsToolsNames({
    staleTime: 10 * 60 * 1000, // 10 minutes for names
  });

  // Get specific parts/tools if name is provided
  const specificQuery = usePartsToolsByName(name || '', {
    enabled: !!name,
    ...options,
  });

  return {
    // Names data
    names: namesQuery.data?.responseData || [],
    namesLoading: namesQuery.isLoading,
    namesError: namesQuery.error,

    // Specific parts/tools data
    partsTools: specificQuery.data?.responseData || [],
    partsToolsLoading: specificQuery.isLoading,
    partsToolsError: specificQuery.error,

    // Combined states
    isLoading: namesQuery.isLoading || (!!name && specificQuery.isLoading),
    error: namesQuery.error || specificQuery.error,

    // Refetch functions
    refetchNames: namesQuery.refetch,
    refetchPartsTools: specificQuery.refetch,
  };
};

/**
 * Hook for parts/tools selection (commonly used in forms)
 */
export const usePartsToolsSelection = () => {
  const { data, isLoading, error } = usePartsToolsNames();

  const partsToolsOptions = (data?.responseData || []).map((item: PartsTool) => ({
    label: item.code,
    value: item.id.toString(),
    id: item.id,
    code: item.code,
  }));

  return {
    options: partsToolsOptions,
    isLoading,
    error,
    isEmpty: partsToolsOptions.length === 0,
  };
};