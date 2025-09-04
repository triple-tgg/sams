// Example: วิธีใช้งาน usePutEquipment ใน Equipment Step

import React from 'react'
import { usePutEquipment, usePutEquipmentWithLoading } from '@/lib/api/hooks/usePutEquipment'

// ตัวอย่าง 1: การใช้งานพื้นฐาน
const EquipmentFormBasic = () => {
  const putEquipmentMutation = usePutEquipment({
    onSuccess: (data) => {
      console.log('Equipment updated successfully:', data)
      // Navigate to next step or show success message
    },
    onError: (error) => {
      console.error('Failed to update equipment:', error.message)
    }
  })

  const handleSubmit = async (formData: any) => {
    const lineMaintenancesId = 1 // Get from context or props

    try {
      await putEquipmentMutation.mutateAsync({
        lineMaintenancesId,
        equipmentData: formData.equipments
      })
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button
        type="submit"
        disabled={putEquipmentMutation.isPending}
      >
        {putEquipmentMutation.isPending ? 'Updating...' : 'Update Equipment'}
      </button>
    </form>
  )
}

// ตัวอย่าง 2: การใช้งานพร้อม loading state
const EquipmentFormWithLoading = () => {
  const {
    updateEquipment,
    isLoading,
    isSuccess,
    isError,
    error,
    reset
  } = usePutEquipmentWithLoading({
    showToast: true, // แสดง toast notifications
    onSuccess: () => {
      // Custom success handling
      console.log('Equipment saved successfully!')
    }
  })

  const equipmentData: any[] = [] // Define your equipment data here

  const handleSave = async (equipmentData: any[]) => {
    const lineMaintenancesId = 1

    try {
      const result = await updateEquipment(lineMaintenancesId, equipmentData)
      console.log('Update result:', result)
    } catch (error) {
      console.error('Update failed:', error)
    }
  }

  return (
    <div>
      {/* Form content */}

      {isError && (
        <div className="error-message">
          Error: {error?.message}
          <button onClick={reset}>Try Again</button>
        </div>
      )}

      {isSuccess && (
        <div className="success-message">
          Equipment updated successfully!
        </div>
      )}

      <button
        onClick={() => handleSave(equipmentData)}
        disabled={isLoading}
        className={`btn ${isLoading ? 'loading' : ''}`}
      >
        {isLoading ? 'Saving...' : 'Save Equipment'}
      </button>
    </div>
  )
}

// ตัวอย่าง 3: การใช้ใน React Hook Form
import { useForm } from 'react-hook-form'

const EquipmentFormWithRHF = () => {
  const form = useForm()
  const { updateEquipment, isLoading } = usePutEquipmentWithLoading()

  const onSubmit = async (data: any) => {
    const lineMaintenancesId = 1 // Get from context

    await updateEquipment(lineMaintenancesId, data.equipments)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Equipment form fields */}

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Updating Equipment...' : 'Save Equipment'}
      </button>
    </form>
  )
}

export { EquipmentFormBasic, EquipmentFormWithLoading, EquipmentFormWithRHF }
