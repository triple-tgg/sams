"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import dayjs from 'dayjs';

// Types
export interface FilterParams {
    flightNo?: string;
    airlineId?: string;
    stationCodeList?: string[];
    stationCode: string;
    dateStart: string;
    dateEnd: string;
}
export type FilterRangeActive = "Day" | "Week" | "Month" | "Year";

export interface PaginationParams {
    page: number;
    perPage: number;
}

export interface FlightListContextValue {
    // Pagination state
    pagination: PaginationParams;
    setPagination: React.Dispatch<React.SetStateAction<PaginationParams>>;

    filterRangeActive: FilterRangeActive;
    setFilterRangeActive: React.Dispatch<React.SetStateAction<FilterRangeActive>>;
    // Filter state

    filters: FilterParams;
    setFilters: React.Dispatch<React.SetStateAction<FilterParams>>;

    // Computed values
    totalItems: number;
    setTotalItems: React.Dispatch<React.SetStateAction<number>>;

    // Helper functions
    updateFilterRangeActive: (range: FilterRangeActive) => void;
    updatePagination: (updates: Partial<PaginationParams>) => void;
    updateFilters: (updates: Partial<FilterParams>) => void;
    resetFilters: () => void;
    resetPagination: () => void;
    resetAll: () => void;

    // Pagination helpers
    goToPage: (page: number) => void;
    goToNextPage: () => void;
    goToPreviousPage: () => void;
    changePerPage: (perPage: number) => void;

    // Filter helpers
    setFlightNo: (flightNo: string) => void;
    setStationCode: (stationCode: string) => void;
    setStationCodeList: (stationCodeList: string[]) => void;
    setDateRange: (dateStart: string, dateEnd: string) => void;

    // Computed pagination info
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    totalPages: number;
    startItem: number;
    endItem: number;
}

// Default values
const DEFAULT_FILTER_RANGE_ACTIVE: FilterRangeActive = "Day";

const DEFAULT_PAGINATION: PaginationParams = {
    page: 1,
    perPage: 20,
};

const DEFAULT_FILTERS: FilterParams = {
    flightNo: "",
    airlineId: "0",
    stationCodeList: [],
    stationCode: "",
    dateStart: dayjs().subtract(1, "day").format("YYYY-MM-DD"), // Yesterday's date
    dateEnd: dayjs().format("YYYY-MM-DD"), // Today's date
};

// Create Context
const FlightListContext = createContext<FlightListContextValue | undefined>(undefined);

// Provider Props
interface FlightListProviderProps {
    children: ReactNode;
    initialPagination?: Partial<PaginationParams>;
    initialFilters?: Partial<FilterParams>;
}

/**
 * Flight List Provider Component
 * Manages pagination and filter state for the flight list page
 */
export const FlightListProvider: React.FC<FlightListProviderProps> = ({
    children,
    initialPagination = {},
    initialFilters = {}
}) => {
    // Pagination state
    const [pagination, setPagination] = useState<PaginationParams>({
        ...DEFAULT_PAGINATION,
        ...initialPagination
    });
    // Filter state
    const [filters, setFilters] = useState<FilterParams>({
        ...DEFAULT_FILTERS,
        ...initialFilters,

    });

    const [filterRangeActive, setFilterRangeActive] = useState<FilterRangeActive>(DEFAULT_FILTER_RANGE_ACTIVE);

    // Total items for pagination calculation
    const [totalItems, setTotalItems] = useState<number>(0);

    // Pagination helper functions
    const updatePagination = useCallback((updates: Partial<PaginationParams>) => {
        setPagination(prev => ({ ...prev, ...updates }));
    }, []);

    const resetPagination = useCallback(() => {
        setPagination(DEFAULT_PAGINATION);
    }, []);

    const goToPage = useCallback((page: number) => {
        updatePagination({ page });
    }, [updatePagination]);

    const goToNextPage = useCallback(() => {
        setPagination(prev => ({
            ...prev,
            page: Math.min(prev.page + 1, Math.ceil(totalItems / prev.perPage))
        }));
    }, [totalItems]);

    const goToPreviousPage = useCallback(() => {
        setPagination(prev => ({
            ...prev,
            page: Math.max(prev.page - 1, 1)
        }));
    }, []);

    const changePerPage = useCallback((perPage: number) => {
        setPagination(prev => ({
            ...prev,
            perPage,
            page: 1 // Reset to first page when changing items per page
        }));
    }, []);

    // Filter helper functions
    const updateFilters = useCallback((updates: Partial<FilterParams>) => {
        setFilters(prev => ({ ...prev, ...updates }));
        // Reset to first page when filters change
        updatePagination({ page: 1 });
    }, [updatePagination]);

    const resetFilters = useCallback(() => {
        setFilters(DEFAULT_FILTERS);
        updatePagination({ page: 1 });
    }, [updatePagination]);

    const setFlightNo = useCallback((flightNo: string) => {
        updateFilters({ flightNo });
    }, [updateFilters]);

    const setStationCode = useCallback((stationCode: string) => {
        updateFilters({ stationCode });
    }, [updateFilters]);

    const setStationCodeList = useCallback((stationCodeList: string[]) => {
        updateFilters({ stationCodeList });
    }, [updateFilters]);

    const setDateRange = useCallback((dateStart: string, dateEnd: string) => {
        updateFilters({ dateStart, dateEnd });
    }, [updateFilters]);

    const resetAll = useCallback(() => {
        setFilters(DEFAULT_FILTERS);
        setPagination(DEFAULT_PAGINATION);
        setTotalItems(0);
    }, []);
    const updateFilterRangeActive = useCallback((range: FilterRangeActive) => {
        setFilterRangeActive(range);

        // Update date range based on selected range
        const today = dayjs();
        let dateStart: string;
        let dateEnd: string;

        switch (range) {
            case "Day":
                dateStart = today.subtract(1, "day").format("YYYY-MM-DD");
                dateEnd = today.format("YYYY-MM-DD");
                break;
            case "Week":
                dateStart = today.subtract(7, "days").format("YYYY-MM-DD");
                dateEnd = today.format("YYYY-MM-DD");
                break;
            case "Month":
                dateStart = today.subtract(1, "month").format("YYYY-MM-DD");
                dateEnd = today.format("YYYY-MM-DD");
                break;
            case "Year":
                dateStart = today.subtract(1, "year").format("YYYY-MM-DD");
                dateEnd = today.format("YYYY-MM-DD");
                break;
            default:
                dateStart = today.subtract(1, "day").format("YYYY-MM-DD");
                dateEnd = today.format("YYYY-MM-DD");
        }

        // Update filters with new date range
        setFilters(prev => ({
            ...prev,
            dateStart,
            dateEnd
        }));

        // Reset to first page when range changes
        setPagination(prev => ({ ...prev, page: 1 }));
    }, []);

    // Computed pagination values
    const totalPages = Math.ceil(totalItems / pagination.perPage);
    const hasNextPage = pagination.page < totalPages;
    const hasPreviousPage = pagination.page > 1;
    const startItem = (pagination.page - 1) * pagination.perPage + 1;
    const endItem = Math.min(pagination.page * pagination.perPage, totalItems);

    // Context value
    const contextValue: FlightListContextValue = {
        // State
        pagination,
        setPagination,
        filters,
        setFilters,
        totalItems,
        setTotalItems,
        filterRangeActive,
        setFilterRangeActive,
        updateFilterRangeActive,
        // Update functions
        updatePagination,
        updateFilters,
        resetFilters,
        resetPagination,
        resetAll,

        // Pagination helpers
        goToPage,
        goToNextPage,
        goToPreviousPage,
        changePerPage,

        // Filter helpers
        setFlightNo,
        setStationCode,
        setStationCodeList,
        setDateRange,

        // Computed values
        hasNextPage,
        hasPreviousPage,
        totalPages,
        startItem,
        endItem,
    };

    return (
        <FlightListContext.Provider value={contextValue}>
            {children}
        </FlightListContext.Provider>
    );
};

/**
 * Hook to use the Flight List Context
 * Must be used within a FlightListProvider
 */
export const useFlightListContext = (): FlightListContextValue => {
    const context = useContext(FlightListContext);
    if (context === undefined) {
        throw new Error('useFlightListContext must be used within a FlightListProvider');
    }
    return context;
};

/**
 * Hook for pagination functionality only
 */
export const useFlightListPagination = () => {
    const {
        pagination,
        totalItems,
        updatePagination,
        resetPagination,
        goToPage,
        goToNextPage,
        goToPreviousPage,
        changePerPage,
        hasNextPage,
        hasPreviousPage,
        totalPages,
        startItem,
        endItem,
    } = useFlightListContext();

    return {
        pagination,
        totalItems,
        updatePagination,
        resetPagination,
        goToPage,
        goToNextPage,
        goToPreviousPage,
        changePerPage,
        hasNextPage,
        hasPreviousPage,
        totalPages,
        startItem,
        endItem,
    };
};

/**
 * Hook for filter functionality only
 */
export const useFlightListFilters = () => {
    const {
        filters,
        filterRangeActive,
        updateFilters,
        resetFilters,
        setFlightNo,
        setStationCode,
        setStationCodeList,
        setDateRange,
        updateFilterRangeActive,
    } = useFlightListContext();

    return {
        filters,
        filterRangeActive,
        updateFilters,
        resetFilters,
        setFlightNo,
        setStationCode,
        setStationCodeList,
        setDateRange,
        updateFilterRangeActive,
    };
};

/**
 * Hook for date range filter functionality only
 */
export const useFlightListDateRange = () => {
    const {
        filterRangeActive,
        updateFilterRangeActive,
        filters,
        setDateRange,
    } = useFlightListContext();

    return {
        filterRangeActive,
        updateFilterRangeActive,
        dateStart: filters.dateStart,
        dateEnd: filters.dateEnd,
        setDateRange,
    };
};

// Default export
export default FlightListProvider;
