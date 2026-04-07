'use client'

import { useState, useEffect } from 'react'
import { X, ShieldCheck, ShieldAlert, ShieldX, Plane, FileCheck, AlertTriangle, Clock, Ban, Search, ChevronDown, Check, ChevronsUpDown } from 'lucide-react'
import {
    StaffAuthorization, CustomerAirline, AuthStatus, AuthRecord,
    getAuthStatus, getDaysUntilExpiry, isCrsEligible,
    AUTH_STATUS_META, fmtDate,
} from '../types'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"

interface StaffAuthDrawerProps {
    staff: StaffAuthorization | null
    customers: CustomerAirline[]
    open: boolean
    onClose: () => void
}

function StatusBadge({ status }: { status: AuthStatus }) {
    const m = AUTH_STATUS_META[status]
    return (
        <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0"
            style={{ background: m.bg, color: m.text }}
        >
            <span className="w-2 h-2 rounded-full" style={{ background: m.dot }} />
            {m.label}
        </span>
    )
}

function AuthIcon({ status }: { status: AuthStatus }) {
    switch (status) {
        case 'active': return <ShieldCheck className="w-5 h-5 text-emerald-600" />
        case 'expiring': return <ShieldAlert className="w-5 h-5 text-amber-600" />
        case 'expired': return <ShieldX className="w-5 h-5 text-red-600" />
        case 'suspended': return <Ban className="w-5 h-5 text-pink-700" />
        default: return <ShieldX className="w-5 h-5 text-slate-400" />
    }
}

function CustomerAuthCard({ staff, cust, rec }: { staff: StaffAuthorization; cust: CustomerAirline; rec: AuthRecord | null | undefined }) {
    const [expanded, setExpanded] = useState(false)
    const st = getAuthStatus(rec)
    
    return (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div 
                className="flex items-center gap-3 px-4 py-2.5 bg-muted/30 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors select-none"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="w-7 h-7 rounded-md flex items-center justify-center text-white text-[10px] font-black shrink-0" style={{ background: cust.color }}>
                    {cust.code.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{cust.name}</p>
                    <p className="text-[10px] text-muted-foreground">{cust.code}</p>
                </div>
                <StatusBadge status={st} />
                <div 
                    className="ml-1 text-muted-foreground/60 transition-transform duration-200" 
                    style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                    <ChevronDown className="w-4 h-4" />
                </div>
            </div>
            
            {expanded && (
                rec ? (
                    <div className="px-4 py-3 space-y-2 text-xs animate-in slide-in-from-top-2 fade-in duration-200 bg-card">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">Auth Number</span>
                                <p className="font-bold text-foreground mt-0.5">{rec.authNumber}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">Issued By</span>
                                <p className="font-semibold text-foreground mt-0.5">{rec.issuedBy}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">License</span>
                                <p className="font-semibold text-foreground mt-0.5">{rec.license || staff.license || '—'}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">Issue Date</span>
                                <p className="font-semibold text-foreground mt-0.5">{fmtDate(rec.issueDate)}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">Expiry Date</span>
                                <p className="font-semibold text-foreground mt-0.5 flex flex-col gap-0.5">
                                    {fmtDate(rec.expiryDate)}
                                    {(() => {
                                        const d = getDaysUntilExpiry(rec)
                                        if (d === null) return null
                                        return <span className={`text-[10px] font-bold ${d < 0 ? 'text-red-600' : d <= 90 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                            ({d < 0 ? `${Math.abs(d)}d overdue` : `${d}d remaining`})
                                        </span>
                                    })()}
                                </p>
                            </div>
                        </div>
                        <div className="pt-1">
                            <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold">Scope / Rating</span>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {rec.scope.map(t => (
                                    <span key={t} className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold rounded-md" style={{ background: cust.color + '18', color: cust.color }}>
                                        <Plane className="w-3 h-3" />{t}
                                    </span>
                                ))}
                            </div>
                        </div>
                        {rec.remarks && (
                            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50/80 text-amber-900 mt-3 border border-amber-200">
                                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Remarks</span>
                                    <p className="text-[11px] font-medium leading-relaxed">{rec.remarks}</p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="px-4 py-5 text-center text-muted-foreground text-[11px] bg-muted/10 animate-in slide-in-from-top-2 fade-in duration-200">
                        No authorization issued by <span className="font-semibold">{cust.name}</span>.
                    </div>
                )
            )}
        </div>
    )
}

export function StaffAuthDrawer({ staff, customers, open, onClose }: StaffAuthDrawerProps) {
    const [selectedCustomer, setSelectedCustomer] = useState('')
    const [comboboxOpen, setComboboxOpen] = useState(false)

    useEffect(() => {
        if (!open) {
            // Add a small delay to let the close animation finish before resetting
            setTimeout(() => {
                setSelectedCustomer('')
                setComboboxOpen(false)
            }, 300)
        }
    }, [open])

    if (!staff) return null

    const samsStatus = getAuthStatus(staff.samsAuth)
    const crsOk = isCrsEligible(staff)

    const filteredCustomers = customers.filter(c => 
        selectedCustomer ? c.id === selectedCustomer : true
    )

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/30 z-40 transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div className={`fixed right-0 top-0 h-full w-[520px] bg-card border-l border-border shadow-2xl z-50 transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                        <div>
                            <h3 className="text-base font-bold text-foreground">{staff.name}</h3>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span className="font-bold text-primary">{staff.staffId}</span>
                                <span>·</span>
                                <span>{staff.position}</span>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                            <X className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                        {/* CRS Eligibility Banner */}
                        <div className={`rounded-xl p-4 flex items-center gap-3 ${crsOk ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${crsOk ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                <FileCheck className={`w-5 h-5 ${crsOk ? 'text-emerald-700' : 'text-red-700'}`} />
                            </div>
                            <div>
                                <p className={`text-sm font-bold ${crsOk ? 'text-emerald-800' : 'text-red-800'}`}>
                                    CRS Issuance: {crsOk ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
                                </p>
                                <p className={`text-xs ${crsOk ? 'text-emerald-600' : 'text-red-600'} mt-0.5`}>
                                    {crsOk
                                        ? 'This engineer can issue Certificate of Release to Service.'
                                        : 'Missing or invalid authorization prevents CRS issuance.'}
                                </p>
                            </div>
                        </div>

                        {/* SAMS Authorization */}
                        <div className="rounded-xl border border-border bg-card overflow-hidden">
                            <div className="flex items-center gap-3 px-4 py-3 bg-muted/40 border-b border-border">
                                <AuthIcon status={samsStatus} />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-foreground">SAMS Authorization</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">Issued by Accountable Manager</p>
                                </div>
                                <StatusBadge status={samsStatus} />
                            </div>
                            {staff.samsAuth ? (
                                <div className="px-4 py-3.5 space-y-3 text-xs">
                                    <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                                        <div>
                                            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Auth Number</span>
                                            <p className="font-bold text-foreground mt-0.5">{staff.samsAuth.authNumber}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Issued By</span>
                                            <p className="font-semibold text-foreground mt-0.5">{staff.samsAuth.issuedBy}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Initial Issue Date</span>
                                            <p className="font-semibold text-foreground mt-0.5">{staff.samsAuth.initialIssueDate ? fmtDate(staff.samsAuth.initialIssueDate) : '—'}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Current Issue Date</span>
                                            <p className="font-semibold text-foreground mt-0.5">{fmtDate(staff.samsAuth.issueDate)}</p>
                                        </div>
                                        <div className="col-span-2 border-t border-border mt-1 pt-3">
                                            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">SAMS Expiry Date</span>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className="font-bold text-foreground text-sm">{fmtDate(staff.samsAuth.expiryDate)}</p>
                                                {(() => {
                                                    const d = getDaysUntilExpiry(staff.samsAuth)
                                                    if (d === null) return null
                                                    return <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${d < 0 ? 'bg-red-100 text-red-700' : d <= 90 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                        {d < 0 ? `${Math.abs(d)} Days Overdue` : `${d} Days Remaining`}
                                                    </span>
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Scope (Aircraft Types)</span>
                                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                                            {staff.samsAuth.scope.map(t => (
                                                <span key={t} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-md bg-primary/10 text-primary">
                                                    <Plane className="w-3.5 h-3.5" />{t}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    {staff.samsAuth.remarks && (
                                        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50/80 text-amber-900 mt-3 border border-amber-200">
                                            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
                                            <div className="space-y-0.5">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Remarks</span>
                                                <p className="text-[11px] font-medium leading-relaxed">{staff.samsAuth.remarks}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="px-4 py-8 text-center text-muted-foreground text-xs">
                                    <ShieldX className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                                    No SAMS authorization record found.
                                </div>
                            )}
                        </div>

                        {/* Customer Authorizations */}
                        <div>
                            <div className="flex items-center justify-between mb-3 border-b border-border pb-3">
                                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                                    Customer Authorizations <span className="bg-muted px-1.5 py-0.5 rounded ml-1 text-foreground">{customers.length}</span>
                                </h4>
                                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                                    <PopoverTrigger asChild>
                                        <button
                                            role="combobox"
                                            aria-expanded={comboboxOpen}
                                            className="flex items-center justify-between px-3 py-1.5 text-xs bg-muted/40 border border-border rounded-lg hover:bg-muted/60 transition-all w-48 text-left"
                                        >
                                            <span className="truncate text-foreground font-medium">
                                                {selectedCustomer
                                                    ? customers.find((c) => c.id === selectedCustomer)?.name
                                                    : "All Airlines..."}
                                            </span>
                                            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50 text-muted-foreground" />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-48 p-0" align="end">
                                        <Command>
                                            <CommandInput placeholder="Search airlines..." className="h-8 text-xs" />
                                            <CommandList>
                                                <CommandEmpty className="py-2 text-center text-xs">No airlines found.</CommandEmpty>
                                                <CommandGroup>
                                                    <CommandItem
                                                        value="all airlines"
                                                        onSelect={() => {
                                                            setSelectedCustomer('');
                                                            setComboboxOpen(false);
                                                        }}
                                                        className="text-xs"
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-3.5 w-3.5",
                                                                selectedCustomer === '' ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        All Airlines
                                                    </CommandItem>
                                                    {customers.map((cust) => (
                                                        <CommandItem
                                                            key={cust.id}
                                                            value={`${cust.name} ${cust.code}`}
                                                            onSelect={() => {
                                                                setSelectedCustomer(cust.id === selectedCustomer ? '' : cust.id);
                                                                setComboboxOpen(false);
                                                            }}
                                                            className="text-xs"
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-3.5 w-3.5",
                                                                    selectedCustomer === cust.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {cust.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            
                            <div className="space-y-2.5">
                                {filteredCustomers.length > 0 ? (
                                    filteredCustomers.map(cust => (
                                        <CustomerAuthCard 
                                            key={cust.id} 
                                            staff={staff}
                                            cust={cust} 
                                            rec={staff.customerAuths[cust.id]} 
                                        />
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground text-xs border border-dashed border-border rounded-xl">
                                        No customer authorization selected.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-3 border-t border-border bg-muted/20 text-[10px] text-muted-foreground shrink-0">
                        <p>Part-145 Dual-Authorization — Both SAMS and Customer authorization must be active for CRS issuance.</p>
                    </div>
                </div>
            </div>
        </>
    )
}
