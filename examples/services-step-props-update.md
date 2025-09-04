# ServicesStepProps Interface Update

## Overview
ปรับปรุง ServicesStepProps interface เพื่อให้มี type safety และความชัดเจนในการใช้งาน

## Changes Made

### Before
```typescript
interface ServicesStepProps {
  onNextStep?: () => void
  initialData?: any // ❌ ไม่มี type safety
}
```

### After
```typescript
/**
 * Props for ServicesStep component
 */
interface ServicesStepProps {
  /** Callback function called when moving to next step */
  onNextStep?: () => void
  /** Initial form data in ServicesFormInputs format (already transformed from API) */
  initialData?: ServicesFormInputs | null
  /** Flight number for reference */
  flightNumber?: string
}
```

## Improvements

### 1. **Type Safety**
- ✅ `initialData` ตอนนี้มี type `ServicesFormInputs | null`
- ✅ ไม่ใช้ `any` type อีกต่อไป
- ✅ TypeScript จะตรวจสอบ type ได้อย่างถูกต้อง

### 2. **Clear Documentation**
- ✅ เพิ่ม JSDoc comments สำหรับทุก prop
- ✅ อธิบายความหมายและการใช้งานของแต่ละ prop
- ✅ ระบุว่า initialData ถูกแปลงจาก API แล้ว

### 3. **Additional Props**
- ✅ เพิ่ม `flightNumber` prop สำหรับแสดงหมายเลขเที่ยวบิน
- ✅ แสดง flight number ใน header component

### 4. **Simplified Data Handling**
```typescript
// Before: Manual transformation in component
useEffect(() => {
  if (initialData) {
    const transformedData = {
      aircraftChecks: initialData.aircraftChecks || [...],
      // ... manual transformation
    }
    form.reset(transformedData)
  }
}, [initialData, form])

// After: Direct usage since data is pre-transformed
useEffect(() => {
  if (initialData) {
    console.log('ServicesStep: Loading initial data', { initialData, flightNumber })
    form.reset(initialData) // ✅ ใช้ข้อมูลโดยตรง
  }
}, [initialData, form, flightNumber])
```

## Benefits

### 1. **Type Safety**
- Compile-time error checking
- Better IntelliSense support
- Reduced runtime errors

### 2. **Better Developer Experience**
- Clear prop documentation
- Easier to understand data flow
- Self-documenting code

### 3. **Maintenance**
- Easier to refactor
- Clear contracts between components
- Better code readability

### 4. **Performance**
- ไม่ต้องทำ manual transformation ใน component
- ลดการคำนวณซ้ำ ๆ
- Data ถูกแปลงใน hook แล้ว

## Usage Example

```typescript
// ใน step-form.tsx
const { servicesData, flightData } = useLineMaintenancesQueryThfByFlightId({ flightId });

<ServicesStep 
  initialData={servicesData}  // ServicesFormInputs | null
  flightNumber={flightData?.arrivalFlightNo}  // string | undefined
  onNextStep={handleNextStep}
/>
```

## Data Flow

```
API Response 
  ↓
mapDataThfToServicesStep() 
  ↓
ServicesFormInputs 
  ↓
ServicesStep component 
  ↓
form.reset(initialData)
```

## Validation

- ✅ TypeScript compilation passes
- ✅ No runtime errors
- ✅ IntelliSense works correctly
- ✅ Props are properly documented
- ✅ Data flow is clear and efficient
