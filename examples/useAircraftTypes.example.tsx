// Example usage of Aircraft Types hook

import { useAircraftTypes } from "@/lib/api/hooks/useAircraftTypes";

// Basic usage example
export const BasicExample = () => {
  const {
    options,        // For dropdown: [{ value, label, id }]
    aircraftTypes,  // Raw data: [{ id, code }]
    isLoading,
    error,
    getAircraftTypeById,
    getAircraftTypeByCode
  } = useAircraftTypes();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h3>Aircraft Types ({aircraftTypes.length})</h3>
      
      {/* Display all aircraft types */}
      <ul>
        {aircraftTypes.map(aircraft => (
          <li key={aircraft.id}>
            {aircraft.code} (ID: {aircraft.id})
          </li>
        ))}
      </ul>

      {/* Example lookups */}
      <div>
        <p>Aircraft ID 1: {getAircraftTypeById(1)?.code}</p>
        <p>Aircraft B737-700: {getAircraftTypeByCode("B737-700")?.id}</p>
      </div>
    </div>
  );
};

// Select dropdown example
export const SelectExample = () => {
  const { options, isLoading } = useAircraftTypes();

  return (
    <select disabled={isLoading}>
      <option value="">
        {isLoading ? "Loading..." : "Select aircraft type"}
      </option>
      {options.map(option => (
        <option key={option.id} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};
