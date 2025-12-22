/**
 * Flight List Provider Usage Examples
 * 
 * This file demonstrates how to use the FlightListProvider and its hooks
 */

// Usage in a page or layout component:

import { FlightListProvider } from '../List.provider'

export default function FlightListLayout({ children }: { children: React.ReactNode }) {
  return (
    <FlightListProvider
      initialPagination={{ page: 1, perPage: 25 }}
      initialFilters={{
        flightNo: "",
        stationCode: "BKK",
        dateStart: "2025-10-09",
        dateEnd: "2025-10-09"
      }}
    >
      {children}
    </FlightListProvider>
  )
}

// Usage in components:

import { 
  useFlightListContext, 
  useFlightListPagination, 
  useFlightListFilters 
} from '../List.provider'// Example 1: Using the full context
export function FlightListComponent() {
  const {
    pagination,
    filters,
    totalItems,
    setTotalItems,
    updateFilters,
    goToPage,
    resetAll
  } = useFlightListContext()

  // Use the state...
  return (
    <div>
      <p>Page: {pagination.page} of {Math.ceil(totalItems / pagination.perPage)}</p>
      <p>Flight No: {filters.flightNo}</p>
      <button onClick={() => resetAll()}>Reset All</button>
    </div>
  )
}

// Example 2: Using only pagination features
export function PaginationComponent() {
  const {
    pagination,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    goToNextPage,
    goToPreviousPage,
    changePerPage
  } = useFlightListPagination()

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={goToPreviousPage}
        disabled={!hasPreviousPage}
      >
        Previous
      </button>

      <span>Page {pagination.page} of {totalPages}</span>

      <button
        onClick={goToNextPage}
        disabled={!hasNextPage}
      >
        Next
      </button>

      <select
        value={pagination.perPage}
        onChange={(e) => changePerPage(Number(e.target.value))}
      >
        <option value={10}>10 per page</option>
        <option value={20}>20 per page</option>
        <option value={50}>50 per page</option>
      </select>
    </div>
  )
}

// Example 3: Using only filter features
export function FilterComponent() {
  const {
    filters,
    setFlightNo,
    setStationCode,
    setDateRange,
    resetFilters
  } = useFlightListFilters()

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Flight Number"
        value={filters.flightNo}
        onChange={(e) => setFlightNo(e.target.value)}
      />

      <input
        type="text"
        placeholder="Station Code"
        value={filters.stationCode}
        onChange={(e) => setStationCode(e.target.value)}
      />

      <div className="flex gap-2">
        <input
          type="date"
          value={filters.dateStart}
          onChange={(e) => setDateRange(e.target.value, filters.dateEnd)}
        />
        <input
          type="date"
          value={filters.dateEnd}
          onChange={(e) => setDateRange(filters.dateStart, e.target.value)}
        />
      </div>

      <button onClick={resetFilters}>Reset Filters</button>
    </div>
  )
}