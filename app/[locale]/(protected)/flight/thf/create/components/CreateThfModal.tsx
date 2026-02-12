'use client'

import React from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import ModalStepWrapper from './modal-step-wrapper'
import FlightStep from './FlightStep'
import ServicesStep from './ServicesStep'
import PartsAndToolsStep from './PartsAndToolsStep'
import AttachFileStep from './AttachFile'
import EquipmentStep from './EquipmentStep'
import { useCreateThfModalController } from './useCreateThfModalController'

const steps = [
    { label: 'Flight Info', step: 1, description: 'Flight Details' },
    { label: 'Services', step: 2, description: 'Service Recording' },
    { label: 'Equipment', step: 3, description: 'Equipment Usage' },
    { label: 'Parts & Tools', step: 4, description: 'Parts & Tools Management' },
    { label: 'Attach File', step: 5, description: 'Supporting Documents' },
]

interface CreateThfModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    flightInfosId: number | null
    onClose?: () => void
}

const CreateThfModal: React.FC<CreateThfModalProps> = ({
    open,
    onOpenChange,
    flightInfosId,
    onClose
}) => {
    // Separation of Concerns: Logic extracted to hook
    const { flightDataState, options } = useCreateThfModalController({ flightInfosId })

    // Determine if this is an Edit (existing THF) vs New (no THF yet)
    const isEdit = flightDataState.rawFlightData?.state !== 'plan'
    const title = isEdit ? 'Edit THF' : 'New THF'
    const status = flightDataState.rawFlightData?.state || undefined
    const canNavigate = isEdit

    const handleClose = () => {
        onOpenChange(false)
        onClose?.()
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                size="lg"
                className="max-w-[75vw] w-[1200px] max-h-[90vh] p-0 border-0 bg-transparent shadow-none sm:rounded-xl"
                onInteractOutside={(e) => {
                    e.preventDefault()
                }}
            >
                <ModalStepWrapper
                    steps={steps}
                    title={title}
                    status={status}
                    onClose={handleClose}
                    canNavigate={canNavigate}
                >
                    {/* Step 1: Flight */}
                    <FlightStep
                        flightInfosId={flightInfosId}
                        flightData={flightDataState.rawFlightData}
                        formData={flightDataState.data}
                        loading={flightDataState.loading}
                        flightError={flightDataState.error}
                    />

                    {/* Step 2: Services */}
                    <ServicesStep
                        flightInfosId={flightInfosId}
                        flightError={flightDataState.error}
                        loading={flightDataState.loading}
                        formData={flightDataState.data}
                        initialData={flightDataState.fullData}
                        thfNumber={flightDataState.lineMaintenanceData?.thfNumber || ''}
                        lineMaintenanceId={flightDataState.lineMaintenanceData?.id || null}
                    />

                    {/* Step 3: Equipment */}
                    <EquipmentStep
                        flightInfosId={flightInfosId}
                        lineMaintenanceId={flightDataState.lineMaintenanceData?.id || null}
                        initialData={flightDataState.equipmentData}
                        infoData={flightDataState.data}
                    />

                    {/* Step 4: Parts & Tools */}
                    <PartsAndToolsStep
                        flightError={flightDataState.error}
                        loading={flightDataState.loading}
                        flightInfosId={flightInfosId}
                        lineMaintenanceId={flightDataState.lineMaintenanceData?.id || null}
                        initialData={flightDataState.fullData}
                        infoData={flightDataState.data}
                    />

                    {/* Step 5: Attach File */}
                    <AttachFileStep
                        thfNumber={flightDataState.lineMaintenanceData?.thfNumber || ''}
                        lineMaintenanceId={flightDataState.lineMaintenanceData?.id || null}
                        flightInfosId={flightInfosId}
                        flightError={flightDataState.error}
                        loading={flightDataState.loading}
                        initialData={flightDataState.fullData}
                    />
                </ModalStepWrapper>
            </DialogContent>
        </Dialog>
    )
}

export default CreateThfModal
