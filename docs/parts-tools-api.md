# Parts/Tools API Documentation

## Overview
API functions สำหรับจัดการข้อมูล Parts/Tools ในระบบ SAM Airline Maintenance

## API Endpoints

### Base URL
```
/master/PartsToolsByNames/{name}
```

### Response Format
```typescript
{
  "message": "success",
  "responseData": [
    {
      "id": 1,
      "code": "Fuel nozzle"
    }
  ],
  "error": ""
}
```

## Files Structure

```
lib/api/
├── master/
│   └── partstools/
│       └── getPartsTools.ts          # Core API functions
├── hooks/
│   └── usePartsTools.ts              # React Query hooks
examples/
└── usePartsTools.example.tsx         # Usage examples
```

## Core API Functions

### `getPartsToolsByName(name: string)`
ดึงข้อมูล Parts/Tools ตามชื่อที่ระบุ

**Parameters:**
- `name` (string): ชื่อของ Parts/Tools ที่ต้องการค้นหา

**Returns:** `Promise<PartsToolsApiResponse>`

**Example:**
```typescript
import { getPartsToolsByName } from '@/lib/api/master/partstools/getPartsTools';

const result = await getPartsToolsByName('Fuel nozzle');
console.log(result.responseData); // Array of parts/tools
```

### `getPartsToolsNames()`
ดึงรายชื่อ Parts/Tools ทั้งหมด

**Returns:** `Promise<PartsToolsApiResponse>`

### `getPartsToolsByNames(names: string[])`
ดึงข้อมูล Parts/Tools หลายรายการพร้อมกัน

**Parameters:**
- `names` (string[]): Array ของชื่อ Parts/Tools

**Returns:** `Promise<PartsTool[]>`

### `searchPartsToolsByName(searchTerm: string)`
ค้นหา Parts/Tools ตาม search term

**Parameters:**
- `searchTerm` (string): คำค้นหา

**Returns:** `Promise<PartsTool[]>`

## React Query Hooks

### `usePartsToolsNames()`
Hook สำหรับดึงรายชื่อ Parts/Tools ทั้งหมด

**Returns:**
```typescript
{
  data: PartsToolsApiResponse | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}
```

**Example:**
```typescript
import { usePartsToolsNames } from '@/lib/api/hooks/usePartsTools';

const MyComponent = () => {
  const { data, isLoading, error } = usePartsToolsNames();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <ul>
      {data?.responseData.map(item => (
        <li key={item.id}>{item.code}</li>
      ))}
    </ul>
  );
};
```

### `usePartsToolsByName(name: string)`
Hook สำหรับดึงข้อมูล Parts/Tools ตามชื่อ

**Parameters:**
- `name` (string): ชื่อ Parts/Tools

**Example:**
```typescript
import { usePartsToolsByName } from '@/lib/api/hooks/usePartsTools';

const MyComponent = () => {
  const { data, isLoading, error } = usePartsToolsByName('Fuel nozzle');
  
  // Component logic here
};
```

### `useSearchPartsTools(searchTerm: string)`
Hook สำหรับค้นหา Parts/Tools

**Parameters:**
- `searchTerm` (string): คำค้นหา (ต้องมีอย่างน้อย 2 ตัวอักษร)

**Features:**
- Auto-enabled เมื่อ searchTerm ยาวกว่า 2 ตัวอักษร
- Shorter cache time เหมาะสำหรับการค้นหา
- Returns array ของ PartsTool objects

### `usePartsToolsSelection()`
Hook สำหรับใช้ใน form selection

**Returns:**
```typescript
{
  options: Array<{
    label: string;
    value: string;
    id: number;
    code: string;
  }>;
  isLoading: boolean;
  error: Error | null;
  isEmpty: boolean;
}
```

**Example:**
```typescript
import { usePartsToolsSelection } from '@/lib/api/hooks/usePartsTools';

const SelectComponent = () => {
  const { options, isLoading, error, isEmpty } = usePartsToolsSelection();
  
  return (
    <select>
      <option value="">Select parts/tools...</option>
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};
```

## TypeScript Interfaces

### `PartsTool`
```typescript
interface PartsTool {
  id: number;
  code: string;
}
```

### `PartsToolsApiResponse`
```typescript
interface PartsToolsApiResponse {
  message: string;
  responseData: PartsTool[];
  error: string;
}
```

## Query Keys
React Query keys สำหรับ cache management:

```typescript
const PARTS_TOOLS_QUERY_KEYS = {
  all: ['partsTools'],
  names: () => ['partsTools', 'names'],
  byName: (name: string) => ['partsTools', 'byName', name],
  search: (searchTerm: string) => ['partsTools', 'search', searchTerm],
};
```

## Cache Configuration

- **Names**: 5 นาที stale time, 10 นาที garbage collection
- **Search**: 2 นาที stale time, 5 นาที garbage collection  
- **By Name**: 5 นาที stale time, 10 นาที garbage collection

## Error Handling

All functions include proper error handling:
- Network errors are caught and logged
- Invalid parameters throw descriptive errors
- Empty results return empty arrays instead of throwing

## Performance Features

- **Parallel fetching** สำหรับ multiple requests
- **Automatic caching** ด้วย React Query
- **Optimized re-renders** ด้วย proper query keys
- **Debounced search** ใน search functionality
- **Prefetching support** สำหรับ better UX

## Usage Recommendations

1. **ใช้ hooks แทน direct API calls** เพื่อประโยชน์จาก caching
2. **Implement debouncing** สำหรับ search functionality
3. **Handle loading และ error states** อย่างเหมาะสม
4. **ใช้ usePartsToolsSelection** สำหรับ form components
5. **Cache invalidation** เมื่อมีการอัพเดทข้อมูล

## Complete Example

```typescript
import React, { useState, useEffect } from 'react';
import { useSearchPartsTools } from '@/lib/api/hooks/usePartsTools';

const PartsToolsSearchComponent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading, error } = useSearchPartsTools(debouncedTerm);

  return (
    <div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search parts/tools..."
      />
      
      {isLoading && <div>Searching...</div>}
      {error && <div>Error: {error.message}</div>}
      
      {data && (
        <ul>
          {data.map(item => (
            <li key={item.id}>{item.code}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
```