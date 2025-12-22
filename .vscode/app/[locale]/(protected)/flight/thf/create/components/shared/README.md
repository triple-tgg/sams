# Form Actions และ Status Messages Components

## การใช้งาน Form Actions และ Status Messages สำหรับทุก Step

### 🚀 **การ Import**

```tsx
import { FormActions, StatusMessages } from '../shared'
```

### 📋 **FormActions Component**

#### **Props Interface:**
```typescript
interface FormActionsProps {
  // Navigation props
  onBack: () => void              // ฟังก์ชันสำหรับปุ่ม Back
  onSubmit?: () => void           // ฟังก์ชันสำหรับปุ่ม Submit (optional)
  onReset?: () => void            // ฟังก์ชันสำหรับปุ่ม Reset
  
  // Loading states
  isLoading?: boolean             // สถานะ loading ทั่วไป
  isSubmitting?: boolean          // สถานะ submitting
  
  // Button text customization
  backText?: string               // ข้อความปุ่ม Back
  submitText?: string             // ข้อความปุ่ม Submit
  resetText?: string              // ข้อความปุ่ม Reset
  loadingText?: string            // ข้อความขณะ loading
  
  // Button states
  disableBack?: boolean           // ปิดใช้งานปุ่ม Back
  disableSubmit?: boolean         // ปิดใช้งานปุ่ม Submit
  disableReset?: boolean          // ปิดใช้งานปุ่ม Reset
  
  // Show/hide buttons
  showReset?: boolean             // แสดง/ซ่อนปุ่ม Reset
  showSubmit?: boolean            // แสดง/ซ่อนปุ่ม Submit
  
  // Styling
  className?: string              // CSS class เพิ่มเติม
}
```

#### **ตัวอย่างการใช้งาน:**

##### **1. Flight Step:**
```tsx
<FormActions
  onBack={() => router.back()}
  onReset={() => form.reset(getDefaultValues())}
  isSubmitting={isSubmitting}
  backText="← Back to Dashboard"
  submitText="Save & Next"
  resetText="Reset Form"
  loadingText="Saving Flight Info..."
/>
```

##### **2. Services Step:**
```tsx
<FormActions
  onBack={handleOnBackStep}
  onReset={() => {
    if (transformedData) {
      form.reset(transformedData)
    } else {
      form.reset(memoizedDefaultValues)
    }
  }}
  isSubmitting={isSubmitting}
  backText="← Back to Flight"
  submitText="Next Step →"
  resetText="Reset"
  loadingText="Saving Services..."
/>
```

##### **3. Equipment Step:**
```tsx
<FormActions
  onBack={handleOnBackStep}
  onReset={() => form.reset(getDefaultValues())}
  isLoading={isLoading}
  backText="← Back to Services"
  submitText="Save Equipment"
  resetText="Reset"
  loadingText="Saving..."
/>
```

##### **4. Parts & Tools Step:**
```tsx
<FormActions
  onBack={handleOnBackStep}
  onReset={() => form.reset(getDefaultValues())}
  isSubmitting={isSubmitting}
  backText="← Back to Equipment"
  submitText="Save & Next"
  resetText="Reset"
  loadingText="Saving Parts & Tools..."
/>
```

##### **5. Final Step (Submit Only):**
```tsx
<FormActions
  onBack={handleOnBackStep}
  isSubmitting={isSubmitting}
  backText="← Back to Parts & Tools"
  submitText="Complete Maintenance"
  loadingText="Finalizing..."
  showReset={false}  // ไม่แสดงปุ่ม Reset
/>
```

### 🎯 **StatusMessages Component**

#### **Props Interface:**
```typescript
interface StatusMessagesProps {
  // Error state
  isError?: boolean               // แสดงข้อความ error
  error?: Error | null            // Error object
  errorTitle?: string             // หัวข้อ error
  errorMessage?: string           // ข้อความ error
  onDismissError?: () => void     // ฟังก์ชันปิด error
  
  // Success state
  isSuccess?: boolean             // แสดงข้อความ success
  successTitle?: string           // หัวข้อ success
  successMessage?: string         // ข้อความ success
  
  // Warning state
  isWarning?: boolean             // แสดงข้อความ warning
  warningTitle?: string           // หัวข้อ warning
  warningMessage?: string         // ข้อความ warning
  
  // Info state
  isInfo?: boolean                // แสดงข้อความ info
  infoTitle?: string              // หัวข้อ info
  infoMessage?: string            // ข้อความ info
}
```

#### **ตัวอย่างการใช้งาน:**

##### **1. Error และ Success Messages:**
```tsx
<StatusMessages
  isError={isError}
  error={error}
  errorTitle="Unable to Save Flight Data"
  errorMessage="Please check your flight information and try again."
  onDismissError={() => resetMutation()}
  
  isSuccess={isSuccess}
  successTitle="Flight Data Saved Successfully"
  successMessage="Your flight information has been saved. Proceeding to services configuration."
/>
```

##### **2. Warning Message:**
```tsx
<StatusMessages
  isWarning={hasValidationWarnings}
  warningTitle="Validation Warnings"
  warningMessage="Some fields have warnings but you can still proceed."
  onDismissWarning={() => setHasValidationWarnings(false)}
/>
```

##### **3. Info Message:**
```tsx
<StatusMessages
  isInfo={showDataSourceInfo}
  infoTitle="Data Source Information"
  infoMessage={`Loading data from Flight ID: ${flightId}`}
  onDismissInfo={() => setShowDataSourceInfo(false)}
/>
```

### 🎨 **Complete Example สำหรับ Step ใดๆ:**

```tsx
import React from 'react'
import { useForm } from 'react-hook-form'
import { FormActions, StatusMessages } from '../shared'

const YourStep: React.FC = () => {
  const form = useForm()
  const { isSubmitting, isSuccess, isError, error, resetMutation } = useYourMutation()
  
  const handleBack = () => {
    // Save draft if needed
    goBack()
  }
  
  const handleReset = () => {
    form.reset(getDefaultValues())
  }
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Your form content here */}
      
      {/* Form Actions */}
      <FormActions
        onBack={handleBack}
        onReset={handleReset}
        isSubmitting={isSubmitting}
        backText="← Back to Previous Step"
        submitText="Save & Continue"
        resetText="Reset Form"
        loadingText="Saving..."
      />
      
      {/* Status Messages */}
      <StatusMessages
        isError={isError}
        error={error}
        errorTitle="Unable to Save Data"
        onDismissError={() => resetMutation()}
        
        isSuccess={isSuccess}
        successTitle="Data Saved Successfully"
        successMessage="Your information has been saved. You can proceed to the next step."
      />
    </form>
  )
}
```

### ✨ **ข้อดี:**

1. **Consistent UI**: ปุ่มและข้อความเหมือนกันทุก step
2. **Reusable**: ใช้ซ้ำได้ง่าย ลดการเขียนโค้ดซ้ำ
3. **Customizable**: ปรับแต่งได้ตามความต้องการของแต่ละ step
4. **Maintainable**: แก้ไขครั้งเดียว ส่งผลทุกที่
5. **Type Safe**: มี TypeScript interface ป้องกัน error

### 🔄 **การอัพเดท Step ที่มีอยู่:**

แทนที่การเขียน Form Actions แบบเดิม:
```tsx
// เก่า
<div className="flex justify-between">
  <Button onClick={goBack}>Back</Button>
  <Button type="submit">Next</Button>
</div>
```

ด้วย:
```tsx
// ใหม่
<FormActions
  onBack={goBack}
  isSubmitting={isSubmitting}
  backText="← Back"
  submitText="Next Step →"
/>
```

Components เหล่านี้พร้อมใช้งานและจะทำให้ทุก step มี UI ที่สวยงามและสอดคล้องกัน! 🚀✨
