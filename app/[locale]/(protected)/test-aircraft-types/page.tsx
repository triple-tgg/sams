"use client";

import { useAircraftTypes } from "@/lib/api/hooks/useAircraftTypes";

export default function TestAircraftTypesPage() {
  const {
    isLoading,
    error,
    options,
    aircraftTypes,
    getAircraftTypeById,
    getAircraftTypeByCode,
    findOption
  } = useAircraftTypes();

  if (isLoading) return <div className="p-8">Loading aircraft types...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error.message}</div>;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Aircraft Types API Test</h1>

      {/* Options for Dropdowns */}
      <div className="bg-blue-50 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">🎛️ Dropdown Options ({options.length})</h2>
        <div className="grid grid-cols-3 gap-2 text-sm">
          {options.map(option => (
            <div key={option.id} className="bg-white p-2 rounded border">
              <div><strong>Value:</strong> {option.value}</div>
              <div><strong>Label:</strong> {option.label}</div>
              <div><strong>ID:</strong> {option.id}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Raw Aircraft Types Data */}
      <div className="bg-green-50 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">✈️ Aircraft Types Data ({aircraftTypes.length})</h2>
        <div className="grid grid-cols-4 gap-2 text-sm">
          {aircraftTypes.map(aircraft => (
            <div key={aircraft.id} className="bg-white p-2 rounded border">
              <div><strong>ID:</strong> {aircraft.id}</div>
              <div><strong>Code:</strong> {aircraft.code}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Helper Functions Test */}
      <div className="bg-yellow-50 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">🔧 Helper Functions Test</h2>
        <div className="space-y-2 text-sm">
          <div className="bg-white p-2 rounded">
            <strong>getAircraftTypeById(1):</strong>
            <pre>{JSON.stringify(getAircraftTypeById(1), null, 2)}</pre>
          </div>
          <div className="bg-white p-2 rounded">
            <strong>getAircraftTypeByCode(&quot;A320&quot;):</strong>
            <pre>{JSON.stringify(getAircraftTypeByCode("A320"), null, 2)}</pre>
          </div>
          <div className="bg-white p-2 rounded">
            <strong>getAircraftTypeByCode(&quot;B737-700&quot;):</strong>
            <pre>{JSON.stringify(getAircraftTypeByCode("B737-700"), null, 2)}</pre>
          </div>
          <div className="bg-white p-2 rounded">
            <strong>findOption(&quot;A380-800&quot;):</strong>
            <pre>{JSON.stringify(findOption("A380-800"), null, 2)}</pre>
          </div>
        </div>
      </div>

      {/* Example Usage */}
      <div className="bg-purple-50 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">💡 Example Usage</h2>
        <div className="space-y-2 text-sm bg-white p-4 rounded">
          <h3 className="font-medium">For Select Component:</h3>
          <pre className="bg-gray-100 p-2 rounded text-xs">{`
// In your component:
const { options, isLoading } = useAircraftTypes();

<Select>
  {options.map(option => (
    <SelectItem key={option.id} value={option.value}>
      {option.label}
    </SelectItem>
  ))}
</Select>
          `}</pre>

          <h3 className="font-medium mt-4">For Data Lookup:</h3>
          <pre className="bg-gray-100 p-2 rounded text-xs">{`
// Find aircraft type by ID or code:
const aircraftType = getAircraftTypeById(1);
const aircraftType2 = getAircraftTypeByCode("A380-800");
          `}</pre>
        </div>
      </div>
    </div>
  );
}
