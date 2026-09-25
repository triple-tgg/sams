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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 py-4 md:py-6">
                <Card className="bg-primary/20">
                    <CardContent className="p-3 sm:p-4 text-center">
                        <div className="mx-auto h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center bg-white mb-2 sm:mb-4">
                            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" icon="heroicons:calendar-date-range" />
                        </div>
                        <div className="block text-xs sm:text-sm text-default-600 font-medium mb-1">Planned</div>
                        <div className="text-xl sm:text-2xl text-default-900 font-semibold">
                            {dashboardLoading ? '...' : (dashboard?.planned ?? '0')}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-info/20">
                    <CardContent className="p-3 sm:p-4 text-center">
                        <div className="mx-auto h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center bg-white mb-2 sm:mb-4">
                            <CalendarPlus className="w-5 h-5 sm:w-6 sm:h-6 text-info" />
                        </div>
                        <div className="block text-xs sm:text-sm text-default-600 font-medium mb-1">Additional</div>
                        <div className="text-xl sm:text-2xl text-default-900 font-semibold">
                            {dashboardLoading ? '...' : (dashboard?.additional ?? '0')}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-success/20">
                    <CardContent className="p-3 sm:p-4 text-center">
                        <div className="mx-auto h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center bg-white mb-2 sm:mb-4">
                            <CalendarCheck className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
                        </div>
                        <div className="block text-xs sm:text-sm text-default-600 font-medium mb-1">Actual</div>
                        <div className="text-xl sm:text-2xl text-default-900 font-semibold">
                            {dashboardLoading ? '...' : (dashboard?.actual ?? '0')}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-warning/20">
                    <CardContent className="p-3 sm:p-4 text-center">
                        <div className="mx-auto h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center bg-white mb-2 sm:mb-4">
                            <CalendarX className="w-5 h-5 sm:w-6 sm:h-6 text-warning" />
                        </div>
                        <div className="block text-xs sm:text-sm text-default-600 font-medium mb-1">Cancel</div>
                        <div className="text-xl sm:text-2xl text-default-900 font-semibold">
                            {dashboardLoading ? '...' : (dashboard?.cancel ?? '0')}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {children}
        </div>
    );
};

export default ProjectWrapper;