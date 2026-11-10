"use client";

import React, { useEffect, useMemo } from "react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Award, Briefcase, Building2, Calendar, ExternalLink, FileText, Loader2, Phone, Plane, Shield, User, X } from "lucide-react";
import { useStaffById } from "@/lib/api/hooks/useQAStaffManagement";
import { useCombinations } from "@/lib/api/master/aircraft-engine/aircraftEngine.hooks";
import { useAmelCategories } from "@/lib/api/master/amel-categories.hooks";
import { useStaffDepartmentAmo145s, useStaffDepartmentPositionAmo145s } from "@/lib/api/master/organization-amo145.hooks";
import { groupAircraftEngineDisplayLabels } from "@/lib/utils/aircraftEngineDisplay";

interface InstructorProfileModalProps {
  /** Linked staff id of an Internal instructor; null closes the modal */
  staffId: number | null;
  onClose: () => void;
}

const fmtDate = (value?: string | null) => {
  if (!value) return "-";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const ageFrom = (dob?: string | null) => {
  if (!dob) return "-";
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return "-";
  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  return `${Math.floor(months / 12)} yr ${months % 12} mo`;
};

/** Card with an icon + title header — same look as HR > Staff > Profile (read-only, no edit button). */
function Section({ icon, iconClass, title, count, children }: {
  icon: React.ReactNode; iconClass: string; title: string; count?: number; children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 min-w-0">
      <div className="flex items-center gap-3 pb-4 mb-5 border-b border-border">
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconClass}`}>{icon}</span>
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        {count !== undefined && <span className="text-sm font-medium text-muted-foreground">({count})</span>}
      </div>
      {children}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground mt-1 wrap-anywhere">{value || "-"}</p>
    </div>
  );
}

/** Read-only, full-screen staff profile for Internal instructors (editing stays in HR > Staff). */
export function InstructorProfileModal({ staffId, onClose }: InstructorProfileModalProps) {
  const isOpen = staffId !== null && staffId > 0;

  // GET /master/staff-management/byid/{staffId}
  const { data, isLoading, isError, isFetching, refetch } = useStaffById(staffId ?? 0, isOpen);
  // Always load fresh data when the profile is opened (the hook otherwise serves a 2-min cache).
  useEffect(() => {
    if (isOpen) void refetch();
  }, [isOpen, staffId, refetch]);

  const { data: combinationsData } = useCombinations();
  const { data: amelCategoriesData } = useAmelCategories();
  const { data: amoDeptData } = useStaffDepartmentAmo145s();
  const { data: amoPosData } = useStaffDepartmentPositionAmo145s();
  const staff = data?.responseData;

  const aircraftLabels = useMemo(
    () => groupAircraftEngineDisplayLabels((staff?.staffAircraftLicenseList ?? []).filter((l) => !l.isdelete), combinationsData ?? []),
    [staff, combinationsData]
  );
  // Same as HR > Staff > Profile: show the first active AMEL license only.
  const amelLicense = (staff?.staffAmelLicenseList ?? []).find((l) => !l.isdelete);
  const categoryLabel = (id: number) => {
    const cat = (amelCategoriesData ?? []).find((c) => c.id === id);
    return cat ? `${cat.code} — ${cat.name}` : `Category ${id}`;
  };

  // Part-145 AMO assignment — resolved the same way as the HR profile
  const isAmo145 = !!staff?.isDepartmentAmo145;
  const amoPosition = isAmo145 && staff?.staffDepartmentPositionAmo145Id
    ? amoPosData?.responseData?.find((p) => p.id === staff.staffDepartmentPositionAmo145Id)
    : undefined;
  const amoDepartment = amoPosition?.staffDepartmentAmo145Id
    ? amoDeptData?.responseData?.find((d) => d.id === amoPosition.staffDepartmentAmo145Id)
    : undefined;

  const englishName = staff ? staff.fullNameEn || staff.name : "Staff Profile";
  const positionName = staff?.positionObj?.name || staff?.jobTitle || "";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="full" hideClose className="flex flex-col gap-0 p-0 overflow-hidden sm:rounded-none bg-slate-50 dark:bg-background">
        {/* Top bar — fixed */}
        <DialogHeader className="shrink-0 flex flex-row items-center justify-between gap-3 space-y-0 bg-primary text-white px-6 py-3">
          <div className="min-w-0 text-left">
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              Staff Profile
              {isFetching && staff && <Loader2 className="w-4 h-4 animate-spin text-white/80" aria-label="Refreshing" />}
            </DialogTitle>
            <DialogDescription className="text-xs text-white/80">Linked staff record of this instructor (read-only)</DialogDescription>
          </div>
          <DialogClose asChild>
            <button
              type="button"
              aria-label="Close profile"
              className="p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </DialogClose>
        </DialogHeader>

        {/* Body — scrolls */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl p-4 sm:p-8 space-y-4">
            {isLoading || (isFetching && !staff) ? (
              <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin text-primary" /> Loading profile…
              </div>
            ) : isError || !staff ? (
              <p className="py-24 text-center text-sm font-semibold text-red-600">Unable to load the staff profile.</p>
            ) : (
              <>
                {/* Profile header card */}
                <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                    <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-lg border-2 border-slate-200 bg-slate-100 shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                      {staff.profileImagePath ? (
                        <img src={staff.profileImagePath} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-16 h-16 text-slate-400" strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="min-w-0 space-y-2">
                      <h2 className="text-2xl font-bold text-foreground wrap-anywhere">
                        {staff.title ? `${staff.title} ` : ""}{englishName}
                      </h2>
                      {staff.fullNameEn && staff.name && (
                        <p className="text-sm text-muted-foreground">{staff.name}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {positionName && (
                          <span className="px-2.5 py-1 rounded-md border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-700">
                            {positionName}
                          </span>
                        )}
                        <span className={`px-2.5 py-1 rounded-md border text-xs font-semibold ${staff.isActive ? "border-green-200 bg-green-50 text-green-700" : "border-slate-200 bg-slate-100 text-slate-600"}`}>
                          ● {staff.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 pt-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5"><Building2 className="w-4 h-4" /> {staff.departmentObj?.name || "-"}</span>
                        <span className="inline-flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Joined {fmtDate(staff.startDate)}</span>
                        <span className="inline-flex items-center gap-1.5"><FileText className="w-4 h-4" /> {staff.employeeId || staff.code || "-"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Two columns: details | licenses */}
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-4 items-start">
                  <div className="space-y-4 min-w-0">
                    <Section icon={<User className="w-4 h-4" />} iconClass="bg-blue-50 text-blue-600" title="Personal Info">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-5">
                        <InfoRow label="Full Name (Thai)" value={staff.name} />
                        <InfoRow label="Full Name (English)" value={staff.fullNameEn} />
                        <InfoRow label="Date of Birth" value={fmtDate(staff.dateOfBirth)} />
                        <InfoRow label="Age" value={ageFrom(staff.dateOfBirth)} />
                        <InfoRow label="Place of Birth" value={staff.placeOfBirth} />
                        <InfoRow label="Thai ID Card No." value={staff.idCardNo} />
                        <InfoRow label="Nationality" value={staff.nationality} />
                      </div>
                    </Section>

                    <Section icon={<Phone className="w-4 h-4" />} iconClass="bg-green-50 text-green-600" title="Contact">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-5">
                        <InfoRow label="Phone" value={staff.phone} />
                        <div className="md:col-span-2"><InfoRow label="Email" value={staff.email} /></div>
                        <div className="md:col-span-3"><InfoRow label="Address" value={staff.address} /></div>
                      </div>
                    </Section>

                    <Section icon={<Briefcase className="w-4 h-4" />} iconClass="bg-amber-50 text-amber-600" title="Employment">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-5">
                        <InfoRow label="Employee ID" value={staff.employeeId} />
                        <InfoRow label="Staff Type" value={staff.staffstypeObj?.code || staff.staffstypeObj?.name} />
                        <InfoRow label="Department" value={staff.departmentObj?.name} />
                        <InfoRow label="Position" value={staff.positionObj?.name} />
                        <InfoRow label="Start Date" value={fmtDate(staff.startDate)} />
                        <InfoRow label="End Working Date" value={fmtDate(staff.endWorkingDate)} />
                        <InfoRow label="Station" value={staff.stationObj?.code} />
                        <div className="md:col-span-3"><InfoRow label="Job Note" value={staff.jobTitle} /></div>
                      </div>

                      {/* Part-145 AMO */}
                      <div className="mt-5 pt-4 border-t border-border">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-xs font-semibold text-muted-foreground tracking-wide">
                            Part-145 Approved Maintenance Organization (AMO)
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${isAmo145 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                            {isAmo145 ? "Yes" : "No"}
                          </span>
                        </div>
                        {isAmo145 && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-5">
                            <InfoRow label="AMO Department" value={amoDepartment?.name} />
                            <InfoRow label="AMO Position" value={amoPosition?.name} />
                          </div>
                        )}
                      </div>
                    </Section>
                  </div>

                  <div className="space-y-4 min-w-0">
                    <Section icon={<Award className="w-4 h-4" />} iconClass="bg-blue-50 text-blue-600" title="AMEL License">
                      {!amelLicense ? (
                        <p className="text-xs text-muted-foreground italic">No AMEL license on file</p>
                      ) : (
                        (() => {
                          const lic = amelLicense;
                          return (
                            <div className="space-y-4">
                              <div className="rounded-xl border border-border bg-slate-50 dark:bg-muted/30 p-5">
                                <div className="flex items-center gap-3 pb-4 mb-4 border-b border-border">
                                  <span className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                                    <Award className="w-5 h-5" />
                                  </span>
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">License Number</p>
                                    <p className="text-base font-bold text-blue-700 dark:text-blue-400 wrap-anywhere">{lic.licenseNumber || "-"}</p>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Category</p>
                                    <p className="text-sm font-semibold text-foreground mt-0.5">{categoryLabel(lic.categoryId)}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Validity</p>
                                    <p className="text-sm font-semibold text-foreground mt-0.5">
                                      {fmtDate(lic.issuedDate)} — {fmtDate(lic.expiryDate)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                  <FileText className="w-3.5 h-3.5" /> Attachment
                                </p>
                                {lic.attachmentFilePath ? (
                                  <a
                                    href={lic.attachmentFilePath}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                  >
                                    <span className="truncate">{lic.attachmentFileName || "View attachment"}</span>
                                    <ExternalLink className="w-3 h-3 shrink-0" />
                                  </a>
                                ) : (
                                  <p className="text-xs text-muted-foreground italic">No attachment</p>
                                )}
                              </div>
                            </div>
                          );
                        })()
                      )}
                    </Section>

                    <Section icon={<Shield className="w-4 h-4" />} iconClass="bg-green-50 text-green-600" title="Aircraft License" count={aircraftLabels.length}>
                      {aircraftLabels.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No aircraft license on file</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {aircraftLabels.map((label) => (
                            <span
                              key={label}
                              className="inline-flex items-start gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-[11px] font-semibold text-green-700"
                            >
                              <Plane className="w-3 h-3 mt-0.5 shrink-0" /> {label}
                            </span>
                          ))}
                        </div>
                      )}
                    </Section>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
