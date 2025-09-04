// Example usage of Staff API functions and hooks

import React, { useState } from 'react';
import { 
  useStaffMutation, 
  useStaff, 
  useStaffByCode, 
  useStaffByName, 
  useStaffById,
  transformStaffToOptions,
  transformStaffToIdOptions
} from '@/lib/api/hooks/useStaff';
import { StaffRequest } from '@/lib/api/master/staff/getStaff';

// Example 1: Using mutation for manual search
export const StaffSearchExample = () => {
  const [searchForm, setSearchForm] = useState<StaffRequest>({
    code: "",
    name: "",
    id: ""
  });

  const staffMutation = useStaffMutation();

  const handleSearch = () => {
    staffMutation.mutate(searchForm);
  };

  return (
    <div className="space-y-4">
      <h3>Staff Search</h3>
      
      <div className="grid grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Staff Code"
          value={searchForm.code}
          onChange={(e) => setSearchForm(prev => ({...prev, code: e.target.value}))}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Staff Name"
          value={searchForm.name}
          onChange={(e) => setSearchForm(prev => ({...prev, name: e.target.value}))}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Staff ID"
          value={searchForm.id}
          onChange={(e) => setSearchForm(prev => ({...prev, id: e.target.value}))}
          className="border p-2 rounded"
        />
      </div>

      <button 
        onClick={handleSearch}
        disabled={staffMutation.isPending}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {staffMutation.isPending ? 'Searching...' : 'Search Staff'}
      </button>

      {staffMutation.isError && (
        <div className="text-red-500">
          Error: {staffMutation.error?.message}
        </div>
      )}

      {staffMutation.data && (
        <div className="mt-4">
          <h4>Search Results ({staffMutation.data.responseData.length} found):</h4>
          <div className="space-y-2">
            {staffMutation.data.responseData.map(staff => (
              <div key={staff.id} className="border p-2 rounded">
                <div><strong>Code:</strong> {staff.code}</div>
                <div><strong>Name:</strong> {staff.name}</div>
                <div><strong>Position:</strong> {staff.position.code}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Example 2: Using automatic queries
export const StaffAutoSearchExample = () => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [id, setId] = useState('');

  // Auto search by code (with debounce effect)
  const { data: staffByCode, isLoading: loadingByCode } = useStaffByCode(
    code, 
    code.length > 2 // Only search when code has more than 2 characters
  );

  // Auto search by name
  const { data: staffByName, isLoading: loadingByName } = useStaffByName(
    name,
    name.length > 2
  );

  // Auto search by ID
  const { data: staffById, isLoading: loadingById } = useStaffById(
    id,
    id.length > 0
  );

  return (
    <div className="space-y-6">
      <h3>Auto Staff Search</h3>

      {/* Search by Code */}
      <div>
        <label>Search by Code:</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter staff code..."
          className="border p-2 rounded ml-2"
        />
        {loadingByCode && <span className="ml-2 text-blue-500">Searching...</span>}
        {staffByCode && (
          <div className="mt-2 text-sm text-green-600">
            Found {staffByCode.responseData.length} staff member(s)
          </div>
        )}
      </div>

      {/* Search by Name */}
      <div>
        <label>Search by Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter staff name..."
          className="border p-2 rounded ml-2"
        />
        {loadingByName && <span className="ml-2 text-blue-500">Searching...</span>}
        {staffByName && (
          <div className="mt-2 text-sm text-green-600">
            Found {staffByName.responseData.length} staff member(s)
          </div>
        )}
      </div>

      {/* Search by ID */}
      <div>
        <label>Search by ID:</label>
        <input
          type="text"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="Enter staff ID..."
          className="border p-2 rounded ml-2"
        />
        {loadingById && <span className="ml-2 text-blue-500">Searching...</span>}
        {staffById && (
          <div className="mt-2 text-sm text-green-600">
            Found {staffById.responseData.length} staff member(s)
          </div>
        )}
      </div>
    </div>
  );
};

// Example 3: Using with dropdown/select components
export const StaffDropdownExample = () => {
  const [selectedStaff, setSelectedStaff] = useState('');
  
  // Get all staff (empty search criteria)
  const { data: allStaff, isLoading } = useStaff();

  // Transform to dropdown options
  const staffOptions = allStaff ? transformStaffToOptions(allStaff.responseData) : [];
  const staffIdOptions = allStaff ? transformStaffToIdOptions(allStaff.responseData) : [];

  return (
    <div className="space-y-4">
      <h3>Staff Dropdown</h3>

      {/* Dropdown with code as value */}
      <div>
        <label>Select Staff (by code):</label>
        <select 
          value={selectedStaff}
          onChange={(e) => setSelectedStaff(e.target.value)}
          className="border p-2 rounded ml-2"
          disabled={isLoading}
        >
          <option value="">
            {isLoading ? 'Loading...' : 'Select staff member'}
          </option>
          {staffOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Dropdown with ID as value */}
      <div>
        <label>Select Staff (by ID):</label>
        <select className="border p-2 rounded ml-2" disabled={isLoading}>
          <option value="">
            {isLoading ? 'Loading...' : 'Select staff member'}
          </option>
          {staffIdOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {selectedStaff && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          Selected staff code: {selectedStaff}
        </div>
      )}
    </div>
  );
};

// Example 4: Advanced search with filters
export const StaffAdvancedSearchExample = () => {
  const [filters, setFilters] = useState({
    searchTerm: '',
    searchBy: 'code' as 'code' | 'name' | 'id'
  });

  const { data, isLoading, error, refetch } = useStaff(
    {
      code: filters.searchBy === 'code' ? filters.searchTerm : '',
      name: filters.searchBy === 'name' ? filters.searchTerm : '',
      id: filters.searchBy === 'id' ? filters.searchTerm : ''
    },
    filters.searchTerm.length > 0
  );

  return (
    <div className="space-y-4">
      <h3>Advanced Staff Search</h3>

      <div className="flex gap-4">
        <select
          value={filters.searchBy}
          onChange={(e) => setFilters(prev => ({
            ...prev, 
            searchBy: e.target.value as 'code' | 'name' | 'id'
          }))}
          className="border p-2 rounded"
        >
          <option value="code">Search by Code</option>
          <option value="name">Search by Name</option>
          <option value="id">Search by ID</option>
        </select>

        <input
          type="text"
          value={filters.searchTerm}
          onChange={(e) => setFilters(prev => ({...prev, searchTerm: e.target.value}))}
          placeholder={`Enter staff ${filters.searchBy}...`}
          className="border p-2 rounded flex-1"
        />

        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Refresh
        </button>
      </div>

      {isLoading && (
        <div className="text-blue-500">Loading staff data...</div>
      )}

      {error && (
        <div className="text-red-500">
          Error: {error.message}
        </div>
      )}

      {data && (
        <div>
          <h4>Results ({data.responseData.length} found):</h4>
          <div className="grid gap-2 mt-2">
            {data.responseData.map(staff => (
              <div key={staff.id} className="border p-3 rounded hover:bg-gray-50">
                <div className="font-semibold">{staff.name}</div>
                <div className="text-sm text-gray-600">
                  Code: {staff.code} | Position: {staff.position.code} | ID: {staff.id}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
