"use client";

import { useLineMaintenancesQueryThfByFlightId } from "@/lib/api/hooks/uselineMaintenancesQueryThfByFlightId";

export default function TestHookPage() {
  const {
    data,
    isLoading,
    error,
    formData,
    flightData,
    lineMaintenanceData,
    aircraftData,
    equipmentData,
    partsToolData,
    attachFilesData
  } = useLineMaintenancesQueryThfByFlightId({ flightId: 3 });

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error.message}</div>;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Line Maintenance THF Hook Test</h1>

      {/* Form Data for UI */}
      <div className="bg-blue-50 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">📝 Form Data (Ready for UI)</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div>

      {/* Flight Data */}
      <div className="bg-green-50 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">✈️ Flight Data</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><strong>Flight ID:</strong> {flightData?.flightsId}</div>
          <div><strong>Airline:</strong> {flightData?.airlineObj?.code}</div>
          <div><strong>Station:</strong> {flightData?.stationObj?.code}</div>
          <div><strong>Arrival Flight:</strong> {flightData?.arrivalFlightNo}</div>
          <div><strong>Arrival Date:</strong> {flightData?.arrivalDate}</div>
          <div><strong>Status:</strong> {flightData?.statusObj?.code}</div>
        </div>
      </div>

      {/* Line Maintenance Data */}
      <div className="bg-yellow-50 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">🔧 Line Maintenance Data</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><strong>THF Number:</strong> {lineMaintenanceData?.thfNumber}</div>
          <div><strong>Personnel:</strong> {lineMaintenanceData?.isPersonnels ? 'Yes' : 'No'}</div>
          <div><strong>Additional Defect:</strong> {lineMaintenanceData?.isAdditionalDefect ? 'Yes' : 'No'}</div>
          <div><strong>Fluid Servicing:</strong> {lineMaintenanceData?.isFluidServicing ? 'Yes' : 'No'}</div>
          <div><strong>Aircraft Towing:</strong> {lineMaintenanceData?.isAircraftTowing ? 'Yes' : 'No'}</div>
        </div>
      </div>

      {/* Aircraft Data */}
      <div className="bg-purple-50 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">🛩️ Aircraft Data</h2>
        <div className="space-y-2 text-sm">
          <div><strong>Check Types:</strong> {aircraftData?.aircraftCheckType?.map(ct => ct.checkType).join(', ')}</div>
          <div><strong>Personnel Count:</strong> {aircraftData?.personnels?.length || 0}</div>
          <div><strong>Additional Defects:</strong> {aircraftData?.additionalDefect?.length || 0}</div>
          <div><strong>Fluid Servicing:</strong> {aircraftData?.fluidServicing?.fluidName || 'N/A'}</div>
          <div><strong>Aircraft Towing:</strong> {aircraftData?.aircraftTowing?.length || 0} records</div>
        </div>
      </div>

      {/* Equipment Data */}
      <div className="bg-gray-50 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">⚙️ Equipment ({equipmentData?.length || 0})</h2>
        {equipmentData?.map((equipment, index) => (
          <div key={index} className="mb-2 p-2 bg-white rounded border text-sm">
            <div><strong>Name:</strong> {equipment.equipmentName}</div>
            <div><strong>SAMS Tool:</strong> {equipment.isSamsTool ? 'Yes' : 'No'}</div>
            <div><strong>Loan:</strong> {equipment.isLoan ? 'Yes' : 'No'}</div>
            <div><strong>Date:</strong> {equipment.formDate} {equipment.formTime}</div>
          </div>
        ))}
      </div>

      {/* Parts/Tools Data */}
      <div className="bg-orange-50 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">🔧 Parts/Tools ({partsToolData?.length || 0})</h2>
        {partsToolData?.map((part, index) => (
          <div key={index} className="mb-2 p-2 bg-white rounded border text-sm">
            <div><strong>Name:</strong> {part.pathToolName}</div>
            <div><strong>Equipment No:</strong> {part.equipmentNo}</div>
            <div><strong>SAMS Tool:</strong> {part.isSamsTool ? 'Yes' : 'No'}</div>
            <div><strong>Qty:</strong> {part.qty}</div>
          </div>
        ))}
      </div>

      {/* Attached Files */}
      <div className="bg-red-50 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">📎 Attached Files ({attachFilesData?.length || 0})</h2>
        {attachFilesData?.map((file, index) => (
          <div key={index} className="mb-2 p-2 bg-white rounded border text-sm">
            <div><strong>Name:</strong> {file.realName}</div>
            <div><strong>Type:</strong> {file.fileType}</div>
            <div><strong>Document Type:</strong> {file.fileType}</div>
            <div><strong>Path:</strong> {file.storagePath}</div>
          </div>
        ))}
      </div>

      {/* Raw Response */}
      <details className="bg-gray-100 p-4 rounded">
        <summary className="cursor-pointer font-semibold">🔍 Raw API Response</summary>
        <pre className="mt-2 text-xs overflow-auto max-h-96">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  );
}
