'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { FormActions } from '../shared'
import { useStep } from '../step-context'
import { useLineMaintenancesQueryThfByFlightId } from '@/lib/api/hooks/uselineMaintenancesQueryThfByFlightId'
import { FileText, Wrench, Package, Info, Clock, PlaneTakeoff, Truck } from 'lucide-react'

interface PreviewStepProps {
  flightInfosId: number | null
}

const PreviewStep: React.FC<PreviewStepProps> = ({ flightInfosId }) => {
  const { goNext, goBack, isModal } = useStep()
  const {
    isLoading,
    error,
    formData,
    lineMaintenanceData,
    equipmentData,
    aircraftData,
    partsToolData
  } = useLineMaintenancesQueryThfByFlightId({ flightInfosId })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading preview data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
        Failed to load flight data for preview.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 1. Flight Info Summary */}
      <Card className="border border-blue-100 shadow-sm">
        <CardHeader className="bg-blue-50/50 pb-4">
          <CardTitle className="flex items-center gap-2 text-blue-700 text-lg">
            <Info className="h-5 w-5" />
            Flight Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-1">
            <p className="text-sm text-gray-500 font-medium">Customer</p>
            <p className="font-semibold">{formData?.customer?.label || '-'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500 font-medium">Station</p>
            <p className="font-semibold">{formData?.station?.label || '-'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500 font-medium">A/C Type & Reg</p>
            <p className="font-semibold">{formData?.acTypeCode?.label || '-'} / {formData?.acReg || '-'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500 font-medium">Route</p>
            <p className="font-semibold">{formData?.routeFrom?.label || '-'} → {formData?.routeTo?.label || '-'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500 font-medium">Arrival</p>
            <p className="font-semibold">{formData?.flightArrival || '-'} ({formData?.sta || '-'})</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500 font-medium">Departure</p>
            <p className="font-semibold">{formData?.flightDeparture || '-'} ({formData?.std || '-'})</p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Services Summary */}
      <Card className="border border-indigo-100 shadow-sm">
        <CardHeader className="bg-indigo-50/50 pb-4">
          <CardTitle className="flex items-center gap-2 text-indigo-700 text-lg">
            <Wrench className="h-5 w-5" />
            Services
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-6">
          {/* Aircraft Checks */}
          <div>
            <h4 className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
              <Clock className="h-4 w-4" /> Aircraft Checks
            </h4>
            {aircraftData?.aircraftCheckType?.length ? (
              <ul className="space-y-2">
                {aircraftData.aircraftCheckType.map((check, idx) => (
                  <li key={idx} className="bg-gray-50 p-3 rounded-md border text-sm flex gap-2">
                    <span className="font-medium text-indigo-700">{check.checkType || '-'}</span>
                    {check.checkSubType && check.checkSubType.length > 0 && <span className="text-gray-500">•</span>}
                    {check.checkSubType && check.checkSubType.length > 0 && <span>{check.checkSubType.join(', ')}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">No aircraft checks recorded.</p>
            )}
          </div>

          <Separator />

          {/* Operational & Towing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                <PlaneTakeoff className="h-4 w-4" /> Flight Deck
              </h4>
              <p className="text-sm">
                {lineMaintenanceData?.isFlightdeck ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <div>
              <h4 className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                <Truck className="h-4 w-4" /> Aircraft Towing
              </h4>
              <p className="text-sm mb-2">
                {lineMaintenanceData?.isAircraftTowing ? 'Enabled' : 'Disabled'}
              </p>
              {aircraftData?.aircraftTowing?.length ? (
                <ul className="space-y-2 mt-2">
                  {aircraftData.aircraftTowing.map((tow, idx) => (
                    <li key={idx} className="bg-amber-50 text-amber-800 p-2 rounded-md border border-amber-100 text-xs">
                      {tow.onDate} {tow.onTime} → {tow.offDate} {tow.offTime}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Equipment Summary */}
      <Card className="border border-emerald-100 shadow-sm">
        <CardHeader className="bg-emerald-50/50 pb-4">
          <CardTitle className="flex items-center gap-2 text-emerald-700 text-lg">
            <Package className="h-5 w-5" />
            Equipment Usage
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {equipmentData?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 font-medium text-gray-700">Equipment</th>
                    <th className="px-4 py-2 font-medium text-gray-700">SVC/QTY</th>
                    <th className="px-4 py-2 font-medium text-gray-700">Duration (Hrs)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {equipmentData.map((eq, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{eq.equipmentName || '-'}</td>
                      <td className="px-4 py-2 text-gray-600">{eq.svc || '-'}</td>
                      <td className="px-4 py-2 text-gray-600">
                        {eq.formDate} → {eq.toDate} ({eq.hrs || 0} hrs)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No equipment recorded.</p>
          )}
        </CardContent>
      </Card>

      {/* 4. Parts & Tools Summary */}
      <Card className="border border-orange-100 shadow-sm">
        <CardHeader className="bg-orange-50/50 pb-4">
          <CardTitle className="flex items-center gap-2 text-orange-700 text-lg">
            <FileText className="h-5 w-5" />
            Parts & Tools
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {partsToolData?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 font-medium text-gray-700">Part No.</th>
                    <th className="px-4 py-2 font-medium text-gray-700">Description</th>
                    <th className="px-4 py-2 font-medium text-gray-700">QTY</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {partsToolData.map((pt, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-blue-600">{pt.pathToolNo || pt.pathToolName || '-'}</td>
                      <td className="px-4 py-2 text-gray-600">{pt.pathToolName || '-'}</td>
                      <td className="px-4 py-2 text-gray-600">{pt.qty || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No parts or tools recorded.</p>
          )}
        </CardContent>
      </Card>

      {!isModal && (
        <FormActions
          onBack={goBack}
          onSubmit={goNext}
          backText="← Back to Parts & Tools"
          submitText="Proceed to Attach File →"
          isSubmitting={false}
          showReset={false}
        />
      )}
    </div>
  )
}

export default PreviewStep
