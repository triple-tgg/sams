# Master Data Functions for Services Step

## Overview
สร้างฟังก์ชันสำหรับดึงข้อมูล master data จาก API และแปลงเป็น options สำหรับใช้ใน Services Step form

## API Endpoints
- `GET /master/AircraftCheckTypes` - ดึงข้อมูลประเภทการตรวจสอบอากาศยาน
- `GET /master/AircraftCheckSubTypes` - ดึงข้อมูลประเภทย่อยของการตรวจสอบอากาศยาน

## Files Created

### 1. **API Functions** (`lib/api/master/aircraftCheckTypes.ts`)

#### Interfaces
```typescript
export interface AircraftCheckType {
  id: number;
  code: string;
  name: string;
  description: string;
  isdelete: boolean;
  createddate: string;
  createdby: string;
  updateddate: string;
  updatedby: string;
}

export interface AircraftCheckSubType {
  id: number;
  code: string;
  name: string;
  description: string;
  isdelete: boolean;
  createddate: string;
  createdby: string;
  updateddate: string;
  updatedby: string;
}
```

#### API Functions
```typescript
export const getAircraftCheckTypes = async (): Promise<MasterDataResponse<AircraftCheckType>>
export const getAircraftCheckSubTypes = async (): Promise<MasterDataResponse<AircraftCheckSubType>>
```

### 2. **Custom Hooks** (`lib/api/hooks/useAircraftCheckMasterData.ts`)

#### Individual Hooks
```typescript
export const useAircraftCheckTypes = () => // Single hook for check types
export const useAircraftCheckSubTypes = () => // Single hook for sub types
```

#### Combined Hook
```typescript
export const useAircraftCheckMasterData = () => {
  return {
    // Data
    checkTypes: AircraftCheckType[],
    checkSubTypes: AircraftCheckSubType[],
    
    // Loading states
    isLoading: boolean,
    isLoadingCheckTypes: boolean,
    isLoadingCheckSubTypes: boolean,
    
    // Error states
    isError: boolean,
    checkTypesError: Error | null,
    checkSubTypesError: Error | null,
    error: Error | null,
    
    // Refetch functions
    refetchCheckTypes: () => void,
    refetchCheckSubTypes: () => void,
    refetchAll: () => void
  }
}
```

### 3. **Transformation Functions** (`components/ServicesStep/types.ts`)

```typescript
export const transformAircraftCheckTypesToOptions = (checkTypes: AircraftCheckType[]): DropdownOption[]
export const transformAircraftCheckSubTypesToOptions = (subTypes: AircraftCheckSubType[]): DropdownOption[]
```

#### Features:
- ✅ Filter out deleted items (`!item.isdelete`)
- ✅ Transform to dropdown format (`{value, label}`)
- ✅ Sort alphabetically by label
- ✅ Fallback to code if name is empty

### 4. **Enhanced Component** (`components/ServicesStep/EnhancedFormSections.tsx`)

#### Features:
- ✅ **Real-time Master Data**: ดึงข้อมูลจาก API แทนใช้ static data
- ✅ **Loading States**: แสดง loading spinner และ placeholder
- ✅ **Error Handling**: แสดง error message และ retry button
- ✅ **Data Validation**: ตรวจสอบข้อมูลก่อนแสดงผล
- ✅ **Performance**: Cache data เป็นเวลา 10-30 นาที
- ✅ **UX Enhancement**: ข้อมูลสถิติการโหลด master data

## Usage Example

### Basic Usage
```typescript
import { useAircraftCheckMasterData } from '@/lib/api/hooks/useAircraftCheckMasterData'

const MyComponent = () => {
  const {
    checkTypes,
    checkSubTypes,
    isLoading,
    isError,
    error,
    refetchAll
  } = useAircraftCheckMasterData()

  if (isLoading) return <div>Loading...</div>
  if (isError) return <div>Error: {error?.message}</div>

  return (
    <div>
      <h3>Check Types: {checkTypes.length}</h3>
      <h3>Sub Types: {checkSubTypes.length}</h3>
    </div>
  )
}
```

### With Form Integration
```typescript
import { EnhancedAircraftChecksSection } from './EnhancedFormSections'

<EnhancedAircraftChecksSection
  form={form}
  onAdd={handleAddAircraftCheck}
  onRemove={handleRemoveAircraftCheck}
/>
```

## Configuration

### Query Configuration
```typescript
{
  staleTime: 10 * 60 * 1000, // 10 minutes
  gcTime: 30 * 60 * 1000,    // 30 minutes cache
  retry: 2,
  retryDelay: exponential backoff
}
```

### Why These Settings?
- **Long Cache Time**: Master data ไม่เปลี่ยนแปลงบ่อย
- **Retry Logic**: รองรับ network issues
- **Background Refetch**: อัพเดทข้อมูลเมื่อ user กลับมาใช้งาน

## Error Handling

### API Level
```typescript
try {
  const response = await axiosConfig.get('/master/AircraftCheckTypes');
  return response.data;
} catch (error) {
  console.error('Get aircraft check types error:', error);
  throw error;
}
```

### Component Level
```typescript
{isError && (
  <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
    <div className="text-sm text-red-600">
      Failed to load master data: {error?.message}
    </div>
  </div>
)}
```

### Retry Mechanism
```typescript
<Button
  type="button"
  variant="outline"
  size="sm"
  onClick={refetchAll}
>
  <RefreshCw className="h-4 w-4 mr-1" />
  Retry
</Button>
```

## Benefits

### 1. **Real-time Data**
- ข้อมูลมาจาก database ล่าสุด
- ไม่ต้อง hardcode ใน code

### 2. **Performance**
- Caching ลดการเรียก API ซ้ำ
- Background updates
- Optimistic loading

### 3. **User Experience**
- Loading states
- Error recovery
- Data freshness indicators

### 4. **Maintainability**
- Centralized master data logic
- Reusable hooks และ functions
- Type safety

## Migration Path

### Current (Static Data)
```typescript
export const maintenanceOptions = [
  { value: "TR", label: "TR" },
  { value: "Preflight", label: "Preflight" },
  // ...
]
```

### New (Dynamic Data)
```typescript
const { checkTypes } = useAircraftCheckMasterData()
const options = transformAircraftCheckTypesToOptions(checkTypes)
```

### Backward Compatibility
- เก็บ static data ไว้เป็น fallback
- ทดสอบ API ก่อนเปลี่ยนแปลง
- Gradual migration ทีละ component
