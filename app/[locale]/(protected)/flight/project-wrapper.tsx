"use client"
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useTemplateDownload } from "@/hooks/use-template-download";
import { useDashboardFlight } from "@/lib/api/hooks/useDashboardFlight";
import { Download, Plus, CalendarPlus, CalendarCheck, CalendarX, AlignStartVertical } from "lucide-react";
import CreateProject from "./create-project";

const ProjectWrapper = ({ children }: { children: React.ReactNode }) => {
    const [open, setOpen] = useState<boolean>(false);

    const { handleDownloadTemplate } = useTemplateDownload();
    const { data: dashboard, isLoading: dashboardLoading, error: dashboardError } = useDashboardFlight();

    return (
        <div className="space-y-4 sm:space-y-5 w-full max-w-full overflow-hidden">
            <CreateProject open={open} setOpen={setOpen} />
            {dashboardError && (
                <div className="p-4 bg-red-50 text-red-700 rounded-md text-center">
                    ไม่สามารถโหลดข้อมูล Dashboard ได้: {dashboardError.message}
                </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 py-2 sm:py-3">
                <Card className="bg-primary/10 border-primary/20 dark:bg-primary/15 dark:border-primary/30 shadow-2xs">
                    <CardContent className="p-2.5 sm:p-3.5 flex items-center sm:flex-col sm:text-center gap-2.5 sm:gap-0">
                        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 shadow-2xs shrink-0 sm:mb-2">
                            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" icon="heroicons:calendar-date-range" />
                        </div>
                        <div className="min-w-0 flex-1 sm:w-full">
                            <div className="text-[11px] sm:text-xs text-default-600 font-medium truncate sm:mb-0.5">Planned</div>
                            <div className="text-base sm:text-xl text-default-900 font-semibold leading-tight">
                                {dashboardLoading ? '...' : (dashboard?.planned ?? '0')}
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-info/10 border-info/20 dark:bg-info/15 dark:border-info/30 shadow-2xs">
                    <CardContent className="p-2.5 sm:p-3.5 flex items-center sm:flex-col sm:text-center gap-2.5 sm:gap-0">
                        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 shadow-2xs shrink-0 sm:mb-2">
                            <CalendarPlus className="w-4 h-4 sm:w-5 sm:h-5 text-info" />
                        </div>
                        <div className="min-w-0 flex-1 sm:w-full">
                            <div className="text-[11px] sm:text-xs text-default-600 font-medium truncate sm:mb-0.5">Additional</div>
                            <div className="text-base sm:text-xl text-default-900 font-semibold leading-tight">
                                {dashboardLoading ? '...' : (dashboard?.additional ?? '0')}
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-success/10 border-success/20 dark:bg-success/15 dark:border-success/30 shadow-2xs">
                    <CardContent className="p-2.5 sm:p-3.5 flex items-center sm:flex-col sm:text-center gap-2.5 sm:gap-0">
                        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 shadow-2xs shrink-0 sm:mb-2">
                            <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
                        </div>
                        <div className="min-w-0 flex-1 sm:w-full">
                            <div className="text-[11px] sm:text-xs text-default-600 font-medium truncate sm:mb-0.5">Actual</div>
                            <div className="text-base sm:text-xl text-default-900 font-semibold leading-tight">
                                {dashboardLoading ? '...' : (dashboard?.actual ?? '0')}
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-warning/10 border-warning/20 dark:bg-warning/15 dark:border-warning/30 shadow-2xs">
                    <CardContent className="p-2.5 sm:p-3.5 flex items-center sm:flex-col sm:text-center gap-2.5 sm:gap-0">
                        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 shadow-2xs shrink-0 sm:mb-2">
                            <CalendarX className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
                        </div>
                        <div className="min-w-0 flex-1 sm:w-full">
                            <div className="text-[11px] sm:text-xs text-default-600 font-medium truncate sm:mb-0.5">Cancel</div>
                            <div className="text-base sm:text-xl text-default-900 font-semibold leading-tight">
                                {dashboardLoading ? '...' : (dashboard?.cancel ?? '0')}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {children}
        </div>
    );
};

export default ProjectWrapper;