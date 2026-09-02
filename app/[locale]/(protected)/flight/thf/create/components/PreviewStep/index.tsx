'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { FormActions } from '../shared'
import { useStep } from '../step-context'
import { useLineMaintenancesQueryThfByFlightId } from '@/lib/api/hooks/uselineMaintenancesQueryThfByFlightId'
import {
  Plane, Wrench, Droplets, Users, Package, FileText,
  Info, PlaneTakeoff, PlaneLanding, Truck, AlertTriangle,
  CheckCircle2, XCircle, Fuel, Clock
} from 'lucide-react'
import { formatUtcToLocalDisplay } from '@/lib/utils/flightDatetime'

// ── Helpers ──

/** Small labeled value block */
const LabelValue = ({ label, value, className = '' }: { label: string; value: React.ReactNode; className?: string }) => (
  <div className={`space-y-0.5 ${className}`}>
    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
    <p className="text-sm font-semibold text-foreground">{value || <span className="text-muted-foreground font-normal italic">—</span>}</p>
  </div>
)

/** Section sub-header */
const SubHeader = ({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) => (
  <h4 className="flex items-center gap-2 text-xs font-bold text-foreground/80 uppercase tracking-wider mb-3">
    <Icon className="h-3.5 w-3.5" />
    {children}
  </h4>
)

/** Boolean chip */
const BoolChip = ({ value, trueLabel, falseLabel }: { value: boolean | null | undefined; trueLabel: string; falseLabel: string }) => (
  <Badge className={`text-[11px] px-2.5 py-0.5 font-semibold ${value ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-100'}`}>
    {value ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
    {value ? trueLabel : falseLabel}
  </Badge>
)

/** Table cell shortcut */
const Td = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <td className={`px-3 py-2 text-xs text-foreground ${className}`}>{children ?? <span className="text-muted-foreground">—</span>}</td>
)
const Th = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <th className={`px-3 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-left ${className}`}>{children}</th>
)

// ── Component ──

interface PreviewStepProps {
  flightInfosId: number | null
}

const PreviewStep: React.FC<PreviewStepProps> = ({ flightInfosId }) => {
  const { goNext, goBack, isModal } = useStep()
  const {
    isLoading,
    error,
    formData,
    flightData,
    lineMaintenanceData,
    aircraftData,
    equipmentData,
    partsToolData,
    rampFuel,
    actualUplift,
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

  const acTypeObj = flightData?.acTypeObj

  return (
    <div className="space-y-5">

      {/* ═══════════════════════════════════════════════════════════════
          1. FLIGHT INFORMATION
      ═══════════════════════════════════════════════════════════════ */}
      <Card className="border border-blue-200/60 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-50/30 pb-3 pt-4">
          <CardTitle className="flex items-center gap-2 text-blue-700 text-base">
            <Plane className="h-4.5 w-4.5" />
            Flight Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-5">
          {/* Airlines Info + Aircraft-Engine side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5">
            <div>
              <SubHeader icon={Info}>Airlines Info</SubHeader>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <LabelValue label="Customer / Airlines" value={formData?.customer?.label} />
                <LabelValue label="Station" value={formData?.station?.label} />
                <LabelValue label="A/C Reg" value={formData?.acReg} />
                <LabelValue label="A/C Type" value={formData?.acTypeCode?.label} />
                <LabelValue label="Route From" value={formData?.routeFrom?.label} />
                <LabelValue label="Route To" value={formData?.routeTo?.label} />
              </div>
            </div>
            <div className="lg:border-l lg:pl-5 lg:min-w-[200px]">
              <SubHeader icon={Plane}>Aircraft-Engine</SubHeader>
              <div className="space-y-3">
                <LabelValue label="Family Code" value={acTypeObj?.name} />
                <LabelValue label="Series" value={acTypeObj?.modelSubName} />
                <LabelValue label="Engine Code" value={acTypeObj?.classicOrNeo} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Arrival & Departure */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <SubHeader icon={PlaneLanding}>Arrival (UTC)</SubHeader>
              <div className="grid grid-cols-4 gap-3">
                <LabelValue label="Flight No" value={formData?.flightArrival} />
                <LabelValue label="Date" value={formData?.arrivalDate} />
                <LabelValue label="STA (UTC)" value={formData?.sta} />
                <LabelValue label="ATA (UTC)" value={formData?.ata} />
              </div>
            </div>
            <div>
              <SubHeader icon={PlaneTakeoff}>Departure (UTC)</SubHeader>
              <div className="grid grid-cols-4 gap-3">
                <LabelValue label="Flight No" value={formData?.flightDeparture} />
                <LabelValue label="Date" value={formData?.departureDate} />
                <LabelValue label="STD (UTC)" value={formData?.std} />
                <LabelValue label="ATD (UTC)" value={formData?.atd} />
              </div>
            </div>
          </div>

          <Separator />

          {/* THF Document Info */}
          <div>
            <SubHeader icon={FileText}>THF Document Info</SubHeader>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <LabelValue label="THF Number" value={formData?.thfNumber} />
              <LabelValue label="Bay" value={formData?.bay} />
              <LabelValue label="Status" value={formData?.status?.label} />
              <LabelValue label="Note" value={formData?.note} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════
          2. SERVICES
      ═══════════════════════════════════════════════════════════════ */}
      <Card className="border border-indigo-200/60 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-50/30 pb-3 pt-4">
          <CardTitle className="flex items-center gap-2 text-indigo-700 text-base">
            <Wrench className="h-4.5 w-4.5" />
            Services
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-5">
          {/* Aircraft Checks */}
          <div>
            <SubHeader icon={Clock}>Aircraft Checks</SubHeader>
            {aircraftData?.aircraftCheckType?.length ? (
              <div className="space-y-2">
                {aircraftData.aircraftCheckType.map((check, idx) => (
                  <div key={idx} className="bg-slate-50 border rounded-lg px-4 py-3 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-indigo-700">{check.checkType || '—'}</span>
                      {check.checkSubType && check.checkSubType.length > 0 && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-foreground">{check.checkSubType.join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No aircraft checks recorded.</p>
            )}
          </div>

          <Separator />

          {/* Flight Deck & Aircraft Towing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <SubHeader icon={PlaneTakeoff}>Flight Deck</SubHeader>
              <BoolChip value={lineMaintenanceData?.isFlightdeck} trueLabel="Flight Deck Operations" falseLabel="Disabled" />
            </div>
            <div>
              <SubHeader icon={Truck}>Aircraft Towing</SubHeader>
              {aircraftData?.aircraftTowing?.length ? (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50"><tr><Th>Bay From</Th><Th>Bay To</Th><Th>From</Th><Th>To</Th></tr></thead>
                    <tbody className="divide-y">
                      {aircraftData.aircraftTowing.map((tow, idx) => (
                        <tr key={idx} className="hover:bg-muted/30">
                          <Td>{tow.bayFrom}</Td>
                          <Td>{tow.bayTo}</Td>
                          <Td>{tow.onDate} {tow.onTime}</Td>
                          <Td>{tow.offDate} {tow.offTime}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <BoolChip value={lineMaintenanceData?.isAircraftTowing} trueLabel="Enabled" falseLabel="Disabled" />
              )}
            </div>
          </div>

          <Separator />

          {/* Additional Defect Rectification */}
          <div>
            <SubHeader icon={AlertTriangle}>Additional Defect Rectification</SubHeader>
            {aircraftData?.additionalDefect?.length ? (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <Th>Defect Details</Th>
                      <Th>Maintenance Performed</Th>
                      <Th>ATA Chapter</Th>
                      <Th>A/C Defect</Th>
                      <Th>Action</Th>
                      <Th>LAE MH</Th>
                      <Th>Mech MH</Th>
                      <Th>Tech Delay</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {aircraftData.additionalDefect.map((def, idx) => (
                      <tr key={idx} className="hover:bg-muted/30">
                        <Td className="max-w-[180px]">{def.details}</Td>
                        <Td className="max-w-[180px]">{def.maintenancePerformed}</Td>
                        <Td>{def.ataChapter}</Td>
                        <Td>{def.acDefect}</Td>
                        <Td>{def.action}</Td>
                        <Td>{def.lae}</Td>
                        <Td>{def.mech}</Td>
                        <Td>{def.technicalDelay}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No additional defects recorded.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════
          3. SERVICING PERFORMED
      ═══════════════════════════════════════════════════════════════ */}
      <Card className="border border-teal-200/60 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-50/30 pb-3 pt-4">
          <CardTitle className="flex items-center gap-2 text-teal-700 text-base">
            <Droplets className="h-4.5 w-4.5" />
            Servicing Performed
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-5">
          {(() => {
            const fluid = aircraftData?.fluidServicing
            const hasFluid = fluid && (
              (fluid.engOil && fluid.engOil.some(v => v != null)) ||
              (fluid.csdOil && fluid.csdOil.some(v => v != null)) ||
              fluid.hydraulicA != null || fluid.hydraulicB != null || fluid.hydraulicSTBY != null ||
              fluid.apuOil != null
            )

            if (!hasFluid && rampFuel == null && actualUplift == null) {
              return <p className="text-xs text-muted-foreground italic">No servicing data recorded.</p>
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Engine Oil */}
                <div className="bg-slate-50 rounded-lg border p-4">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Engine Oil</p>
                  <div className="flex flex-wrap gap-2">
                    {fluid?.engOil?.length ? fluid.engOil.map((qty, i) => (
                      <div key={i} className="bg-white border rounded-md px-3 py-1.5 text-center min-w-[50px]">
                        <p className="text-[10px] text-muted-foreground">#{i + 1}</p>
                        <p className="text-sm font-bold">{qty ?? '—'}</p>
                      </div>
                    )) : <span className="text-xs text-muted-foreground italic">—</span>}
                  </div>
                </div>

                {/* CSD/IDG/VSFG */}
                <div className="bg-slate-50 rounded-lg border p-4">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">CSD/IDG/VSFG</p>
                  <div className="flex flex-wrap gap-2">
                    {fluid?.csdOil?.length ? fluid.csdOil.map((qty, i) => (
                      <div key={i} className="bg-white border rounded-md px-3 py-1.5 text-center min-w-[50px]">
                        <p className="text-[10px] text-muted-foreground">#{i + 1}</p>
                        <p className="text-sm font-bold">{qty ?? '—'}</p>
                      </div>
                    )) : <span className="text-xs text-muted-foreground italic">—</span>}
                  </div>
                </div>

                {/* Hydraulic Oils */}
                <div className="bg-slate-50 rounded-lg border p-4">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Hydraulic Oils</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white border rounded-md px-1 py-1.5 text-center overflow-hidden">
                      <p className="text-[9px] text-muted-foreground truncate" title="GREEN/A/LH">GREEN/A/LH</p>
                      <p className="text-sm font-bold">{fluid?.hydraulicA ?? '—'}</p>
                    </div>
                    <div className="bg-white border rounded-md px-1 py-1.5 text-center overflow-hidden">
                      <p className="text-[9px] text-muted-foreground truncate" title="BLUE/CENTER">BLUE/CENTER</p>
                      <p className="text-sm font-bold">{fluid?.hydraulicB ?? '—'}</p>
                    </div>
                    <div className="bg-white border rounded-md px-1 py-1.5 text-center overflow-hidden">
                      <p className="text-[9px] text-muted-foreground truncate" title="YELLOW/B/2RH">YELLOW/B/2RH</p>
                      <p className="text-sm font-bold">{fluid?.hydraulicSTBY ?? '—'}</p>
                    </div>
                  </div>
                </div>

                {/* APU Oil */}
                <div className="bg-slate-50 rounded-lg border p-4">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">APU Oil</p>
                  <p className="text-lg font-bold">{fluid?.apuOil ?? '—'}</p>
                </div>

                {/* Fuel Information */}
                <div className="bg-slate-50 rounded-lg border p-4 md:col-span-2 lg:col-span-2">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    <Fuel className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                    Fuel Information
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Ramp Fuel (KGs)</p>
                      <p className="text-lg font-bold">{rampFuel ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Actual Uplift (LTs)</p>
                      <p className="text-lg font-bold">{actualUplift ?? '—'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════
          4. PERSONNEL
      ═══════════════════════════════════════════════════════════════ */}
      <Card className="border border-violet-200/60 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-violet-50 to-violet-50/30 pb-3 pt-4">
          <CardTitle className="flex items-center gap-2 text-violet-700 text-base">
            <Users className="h-4.5 w-4.5" />
            Personnel
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {aircraftData?.personnels?.length ? (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <Th>#</Th>
                    <Th>Name</Th>
                    <Th>Type</Th>
                    <Th>From</Th>
                    <Th>To</Th>
                    <Th>Hours</Th>
                    <Th>Remark</Th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {aircraftData.personnels.map((p, idx) => {
                    // Calculate hours between from and to times
                    let hours = '—'
                    
                    // Attempt to parse dates (handle both full ISO strings in formDate or date+time combo)
                    const startStr = p.formDate ? (p.formDate.includes('T') ? p.formDate : `${p.formDate}T${p.formTime || '00:00:00'}`) : null
                    const endStr = p.toDate ? (p.toDate.includes('T') ? p.toDate : `${p.toDate}T${p.toTime || '00:00:00'}`) : null

                    if (startStr && endStr) {
                      const startTime = new Date(startStr).getTime()
                      const endTime = new Date(endStr).getTime()
                      if (!isNaN(startTime) && !isNaN(endTime)) {
                        const diffMs = endTime - startTime
                        if (diffMs > 0) {
                          const totalMins = Math.floor(diffMs / (1000 * 60))
                          const h = Math.floor(totalMins / 60)
                          const m = totalMins % 60
                          hours = `${h}h ${m}m`
                        }
                      }
                    }
                    
                    // Format display strings (if it's an ISO string, apply local formatting, or keep as is)
                    const displayFrom = p.formDate?.includes('T') ? formatUtcToLocalDisplay(p.formDate) : `${p.formDate || ''} ${p.formTime || ''}`.trim()
                    const displayTo = p.toDate?.includes('T') ? formatUtcToLocalDisplay(p.toDate) : `${p.toDate || ''} ${p.toTime || ''}`.trim()

                    return (
                      <tr key={idx} className="hover:bg-muted/30">
                        <Td className="font-mono text-muted-foreground">{p.staff?.code || idx + 1}</Td>
                        <Td className="font-medium">{p.staff?.name}</Td>
                        <Td>
                          <Badge className="text-[10px] px-1.5 py-0.5 bg-violet-100 text-violet-700 hover:bg-violet-100">
                            {p.staff?.staffTypeCode || '—'}
                          </Badge>
                        </Td>
                        <Td>{displayFrom}</Td>
                        <Td>{displayTo}</Td>
                        <Td className="font-semibold">{hours}</Td>
                        <Td className="max-w-[160px] truncate">{p.note}</Td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No personnel recorded.</p>
          )}
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════
          5. EQUIPMENT
      ═══════════════════════════════════════════════════════════════ */}
      <Card className="border border-emerald-200/60 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-50/30 pb-3 pt-4">
          <CardTitle className="flex items-center gap-2 text-emerald-700 text-base">
            <Package className="h-4.5 w-4.5" />
            Equipment
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {equipmentData?.length ? (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <Th>Equipment Name</Th>
                    <Th>Service Qty</Th>
                    <Th>HRS</Th>
                    <Th>From (UTC)</Th>
                    <Th>To (UTC)</Th>
                    <Th>SAMS Tool</Th>
                    <Th>Loan</Th>
                    <Th>Loan Remark</Th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {equipmentData.map((eq, idx) => (
                    <tr key={idx} className="hover:bg-muted/30">
                      <Td className="font-medium">{eq.equipmentName}</Td>
                      <Td>{eq.svc}</Td>
                      <Td>{eq.hrs}</Td>
                      <Td>{eq.formDate}</Td>
                      <Td>{eq.toDate}</Td>
                      <Td>
                        <BoolChip value={eq.isSamsTool} trueLabel="Yes" falseLabel="No" />
                      </Td>
                      <Td>
                        <BoolChip value={eq.isLoan} trueLabel="Yes" falseLabel="No" />
                      </Td>
                      <Td className="max-w-[140px] truncate">{eq.loanRemark}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No equipment recorded.</p>
          )}
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════
          6. PARTS & TOOLS
      ═══════════════════════════════════════════════════════════════ */}
      <Card className="border border-orange-200/60 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-50/30 pb-3 pt-4">
          <CardTitle className="flex items-center gap-2 text-orange-700 text-base">
            <FileText className="h-4.5 w-4.5" />
            Parts &amp; Tools
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {partsToolData?.length ? (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <Th>Parts/Tools Name</Th>
                    <Th>Service Qty</Th>
                    <Th>HRS</Th>
                    <Th>From (UTC)</Th>
                    <Th>To (UTC)</Th>
                    <Th>P/N</Th>
                    <Th>Equipment No.</Th>
                    <Th>Serial IN</Th>
                    <Th>Serial OUT</Th>
                    <Th>SAMS Tool</Th>
                    <Th>Loan</Th>
                    <Th>Loan Remark</Th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {partsToolData.map((pt, idx) => (
                    <tr key={idx} className="hover:bg-muted/30">
                      <Td className="font-medium">{pt.pathToolName}</Td>
                      <Td>{pt.qty}</Td>
                      <Td>{pt.hrs}</Td>
                      <Td>{pt.formDate}</Td>
                      <Td>{pt.toDate}</Td>
                      <Td className="font-mono text-xs">{pt.pathToolNo}</Td>
                      <Td className="font-mono text-xs">{pt.equipmentNo}</Td>
                      <Td>{pt.serialNoIn}</Td>
                      <Td>{pt.serialNoOut}</Td>
                      <Td>
                        <BoolChip value={pt.isSamsTool} trueLabel="Yes" falseLabel="No" />
                      </Td>
                      <Td>
                        <BoolChip value={pt.isLoan} trueLabel="Yes" falseLabel="No" />
                      </Td>
                      <Td className="max-w-[140px] truncate">{pt.loanRemark}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No parts or tools recorded.</p>
          )}
        </CardContent>
      </Card>

      {/* ─── Navigation ─── */}
      {!isModal && (
        <FormActions
          onBack={goBack}
          onSubmit={goNext}
          backText="Back"
          submitText="Next Step"
          isSubmitting={false}
          showReset={false}
        />
      )}
    </div>
  )
}

export default PreviewStep
