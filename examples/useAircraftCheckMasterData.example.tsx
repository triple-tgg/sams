// Example usage of Aircraft Check Master Data functions

import React from 'react'
import { useAircraftCheckMasterData, useAircraftCheckTypes, useAircraftCheckSubTypes } from '@/lib/api/hooks/useAircraftCheckMasterData'
import { transformAircraftCheckTypesToOptions, transformAircraftCheckSubTypesToOptions } from '@/app/[locale]/(protected)/flight/thf/create/components/ServicesStep/types'

// Example 1: Simple usage in component
export const SimpleExample = () => {
  const {
    checkTypes,
    checkSubTypes,
    isLoading,
    isError,
    error,
    refetchAll
  } = useAircraftCheckMasterData()

  if (isLoading) {
    return <div>Loading master data...</div>
  }

  if (isError) {
    return (
      <div>
        <div>Error: {error?.message}</div>
        <button onClick={refetchAll}>Retry</button>
      </div>
    )
  }

  return (
    <div>
      <h3>Aircraft Check Types ({checkTypes.length})</h3>
      <ul>
        {checkTypes.map(type => (
          <li key={type.id}>{type.code} - {type.name}</li>
        ))}
      </ul>

      <h3>Aircraft Check Sub Types ({checkSubTypes.length})</h3>
      <ul>
        {checkSubTypes.map(subType => (
          <li key={subType.id}>{subType.code} - {subType.name}</li>
        ))}
      </ul>
    </div>
  )
}

// Example 2: Transform for dropdown usage
export const DropdownExample = () => {
  const { checkTypes, checkSubTypes, isLoading } = useAircraftCheckMasterData()

  // Transform to dropdown options
  const maintenanceTypeOptions = transformAircraftCheckTypesToOptions(checkTypes)
  const maintenanceSubTypeOptions = transformAircraftCheckSubTypesToOptions(checkSubTypes)

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <h3>Maintenance Type Options:</h3>
      <select>
        <option value="">Select maintenance type</option>
        {maintenanceTypeOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <h3>Sub Type Options:</h3>
      <div>
        {maintenanceSubTypeOptions.map(option => (
          <label key={option.value}>
            <input type="checkbox" value={option.value} />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  )
}

// Example 3: Individual hooks usage
export const IndividualHooksExample = () => {
  const checkTypesQuery = useAircraftCheckTypes()
  const checkSubTypesQuery = useAircraftCheckSubTypes()

  return (
    <div>
      <div>
        <h3>Check Types</h3>
        <p>Loading: {checkTypesQuery.isLoading ? 'Yes' : 'No'}</p>
        <p>Error: {checkTypesQuery.isError ? 'Yes' : 'No'}</p>
        <p>Data: {checkTypesQuery.data?.responseData?.length || 0} items</p>
                <button onClick={() => checkTypesQuery.refetch()}>Refetch Check Types</button>
      </div>

      <div>
        <h3>Check Sub Types</h3>
        <p>Loading: {checkSubTypesQuery.isLoading ? 'Yes' : 'No'}</p>
        <p>Error: {checkSubTypesQuery.isError ? 'Yes' : 'No'}</p>
        <p>Data: {checkSubTypesQuery.data?.responseData?.length || 0} items</p>
        <button onClick={() => checkSubTypesQuery.refetch()}>Refetch Sub Types</button>
      </div>
    </div>
  )
}

// Example 4: Error handling with retry
export const ErrorHandlingExample = () => {
  const {
    checkTypes,
    checkSubTypes,
    isLoading,
    isLoadingCheckTypes,
    isLoadingCheckSubTypes,
    isError,
    checkTypesError,
    checkSubTypesError,
    refetchCheckTypes,
    refetchCheckSubTypes,
    refetchAll
  } = useAircraftCheckMasterData()

  return (
    <div className="space-y-4">
      {/* Overall status */}
      <div className="p-4 border rounded">
        <h3>Overall Status</h3>
        <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
        <p>Error: {isError ? 'Yes' : 'No'}</p>
        <button 
          onClick={refetchAll}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Refetch All
        </button>
      </div>

      {/* Check Types status */}
      <div className="p-4 border rounded">
        <h3>Check Types</h3>
        <p>Loading: {isLoadingCheckTypes ? 'Yes' : 'No'}</p>
        <p>Error: {checkTypesError?.message || 'None'}</p>
        <p>Count: {checkTypes.length}</p>
        <button 
          onClick={() => refetchCheckTypes()}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Refetch Check Types
        </button>
      </div>

      {/* Check Sub Types status */}
      <div className="p-4 border rounded">
        <h3>Check Sub Types</h3>
        <p>Loading: {isLoadingCheckSubTypes ? 'Yes' : 'No'}</p>
        <p>Error: {checkSubTypesError?.message || 'None'}</p>
        <p>Count: {checkSubTypes.length}</p>
        <button 
          onClick={() => refetchCheckSubTypes()}
          className="px-4 py-2 bg-yellow-500 text-white rounded"
        >
          Refetch Sub Types
        </button>
      </div>
    </div>
  )
}

// Example 5: Integration with form
export const FormIntegrationExample = () => {
  const { checkTypes, isLoading, isError } = useAircraftCheckMasterData()
  const [selectedType, setSelectedType] = React.useState('')

  const options = transformAircraftCheckTypesToOptions(checkTypes)

  return (
    <form>
      <div>
        <label>Maintenance Type:</label>
        <select 
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          disabled={isLoading}
        >
          <option value="">
            {isLoading ? 'Loading...' : 'Select maintenance type'}
          </option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        {isError && (
          <div className="text-red-500 text-sm">
            Failed to load maintenance types
          </div>
        )}
      </div>
      
      <div>
        Selected: {selectedType}
      </div>
    </form>
  )
}
