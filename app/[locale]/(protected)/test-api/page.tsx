"use client";
import React, { useState } from 'react';
import {
  useEquipmentNames,
  useEquipmentByCode,
  useEquipmentSearch,
  useEquipmentValidation
} from '@/lib/api/hooks/useEquipment';
import { Equipment } from '@/lib/api/master/equipment/getEquiment';

/**
 * Example component showing how to use useEquipment hooks
 */
const EquipmentExample: React.FC = () => {
  const [selectedCode, setSelectedCode] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Hook 1: Get all equipment names
  const {
    data: equipmentNamesData,
    isLoading: isLoadingNames,
    error: namesError
  } = useEquipmentNames();

  // Hook 2: Get specific equipment by code (only when code is provided)
  const {
    data: equipmentByCodeData,
    isLoading: isLoadingByCode,
    error: byCodeError
  } = useEquipmentByCode(selectedCode, {
    enabled: Boolean(selectedCode)
  });

  // Hook 3: Search functionality
  const {
    equipmentList,
    searchEquipment,
    isLoading: isLoadingSearch
  } = useEquipmentSearch();

  // Hook 4: Validation functionality
  const {
    validateEquipmentCode,
    getEquipmentByCodeFromList
  } = useEquipmentValidation();

  // Search results
  const searchResults = searchTerm ? searchEquipment(searchTerm) : equipmentList;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Equipment API Example</h1>

      {/* Equipment Names Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">All Equipment Names</h2>
        {isLoadingNames && <p>Loading equipment names...</p>}
        {namesError && <p className="text-red-500">Error: {namesError.message}</p>}
        {equipmentNamesData?.responseData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {equipmentNamesData.responseData.map((equipment) => (
              <div
                key={equipment.id}
                className="border p-3 rounded cursor-pointer hover:bg-gray-50"
                onClick={() => setSelectedCode(equipment.code)}
              >
                <p><strong>ID:</strong> {equipment.id}</p>
                <p><strong>Code:</strong> {equipment.code}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Search Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Search Equipment</h2>
        <input
          type="text"
          placeholder="Search by code or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 rounded w-full mb-4"
        />
        {isLoadingSearch && <p>Loading...</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {searchResults.map((equipment) => (
            <div
              key={equipment.id}
              className="border p-3 rounded hover:bg-gray-50"
            >
              <p><strong>ID:</strong> {equipment.id}</p>
              <p><strong>Code:</strong> {equipment.code}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Equipment by Code Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Get Equipment by Code</h2>
        <input
          type="text"
          placeholder="Enter equipment code..."
          value={selectedCode}
          onChange={(e) => setSelectedCode(e.target.value)}
          className="border p-2 rounded w-full mb-4"
        />

        {/* Validation */}
        {selectedCode && (
          <div className="mb-4">
            <p className={`text-sm ${validateEquipmentCode(selectedCode) ? 'text-green-600' : 'text-red-600'}`}>
              {validateEquipmentCode(selectedCode) ? '✓ Valid equipment code' : '✗ Invalid equipment code'}
            </p>
          </div>
        )}

        {isLoadingByCode && <p>Loading equipment details...</p>}
        {byCodeError && <p className="text-red-500">Error: {byCodeError.message}</p>}
        {equipmentByCodeData?.responseData && (
          <div className="border p-4 rounded bg-blue-50">
            <h3 className="font-semibold mb-2">Equipment Details:</h3>
            <p><strong>ID:</strong> {equipmentByCodeData.responseData.id}</p>
            <p><strong>Code:</strong> {equipmentByCodeData.responseData.code}</p>
          </div>
        )}
      </section>

      {/* Validation Example */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Equipment Validation Example</h2>
        <div className="space-y-2">
          <div>
            <input
              type="text"
              placeholder="Test equipment code validation..."
              className="border p-2 rounded w-full"
              onChange={(e) => {
                const isValid = validateEquipmentCode(e.target.value);
                const equipment = getEquipmentByCodeFromList(e.target.value);
                console.log('Validation result:', { isValid, equipment });
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default EquipmentExample;
