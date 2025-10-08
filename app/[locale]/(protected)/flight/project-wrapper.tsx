"use client"
import { Button } from "@/components/ui/button";
import { Filter, Download, Plus, BarChart, CircleOff, CalendarPlus, CalendarCheck, CalendarX } from "lucide-react";
import CreateProject from "./create-project";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Link, usePathname } from "@/components/navigation";
import DateRangePicker from "@/components/date-range-picker";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBlock } from "@/components/blocks/status-block";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/use-toast";
import { ExcelImportButton } from "@/components/excel-import-button";
import { useTemplateDownload } from "@/hooks/use-template-download";
import { useDashboardFlight } from "@/lib/api/hooks/useDashboardFlight";
import EditFlight from "./edit-project";

const ProjectWrapper = ({ children }: { children: React.ReactNode }) => {
    const [open, setOpen] = useState<boolean>(false);

    const { handleDownloadTemplate } = useTemplateDownload();
    const { data: dashboard, isLoading: dashboardLoading, error: dashboardError } = useDashboardFlight();

    // Callback เมื่อ import สำเร็จ
    const handleImportSuccess = () => {
        // อาจจะต้อง refresh data ในหน้า list
        // window.location.reload(); // หรือใช้ react-query invalidate
        console.log('Import completed successfully');
    };

    return (
        <div className="space-y-5">
            <CreateProject open={open} setOpen={setOpen} />
            {dashboardError && (
                <div className="p-4 bg-red-50 text-red-700 rounded-md text-center">
                    ไม่สามารถโหลดข้อมูล Dashboard ได้: {dashboardError.message}
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-10 ">
                <Card className="bg-primary/20">
                    <CardContent className=" p-4  text-center">
                        <div className="mx-auto h-10 w-10  rounded-full flex items-center justify-center bg-white mb-4">
                            <Icon className="w-6 h-6 text-primary" icon="heroicons:calendar-date-range" />
                        </div>
                        <div className="block text-sm text-default-600 font-medium  mb-1.5">Planned</div>
                        <div className="text-2xl text-default-900  font-medium">
                            {dashboardLoading ? '...' : (dashboard?.planned ?? '0')}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-info/20">
                    <CardContent className=" p-4  text-center">
                        <div className="mx-auto h-10 w-10  rounded-full flex items-center justify-center bg-white mb-4">
                            {/* <Icon className="w-6 h-6 text-success" icon="heroicons:chart-pie" /> */}
                            <CalendarPlus className="w-6 h-6  text-info " />
                        </div>
                        <div className="block text-sm text-default-600 font-medium  mb-1.5">Additional</div>
                        <div className="text-2xl text-default-900  font-medium">
                            {dashboardLoading ? '...' : (dashboard?.additional ?? '0')}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-success/20">
                    <CardContent className=" p-4  text-center">
                        <div className="mx-auto h-10 w-10  rounded-full flex items-center justify-center bg-white mb-4">
                            {/* <Icon className="w-6 h-6 text-primary" icon="heroicons:check-circle" /> */}
                            <CalendarCheck className="w-6 h-6 text-success" />
                        </div>
                        <div className="block text-sm text-default-600 font-medium  mb-1.5">Actual </div>
                        <div className="text-2xl text-default-900  font-medium">
                            {dashboardLoading ? '...' : (dashboard?.actual ?? '0')}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-warning/20">
                    <CardContent className="p-4 text-center">
                        <div className="mx-auto h-10 w-10  rounded-full flex items-center justify-center bg-white mb-4">
                            {/* <Icon className="w-6 h-6 text-warning " icon="heroicons:calculator" /> */}
                            {/* <CircleOff className="w-6 h-6 text-warning" /> */}
                            <CalendarX className="w-6 h-6 text-warning" />
                        </div>
                        <div className="block text-sm text-default-600 font-medium  mb-1.5">Cancel</div>
                        <div className="text-2xl text-default-900  font-medium">
                            {dashboardLoading ? '...' : (dashboard?.cancel ?? '0')}
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="flex w-full flex-wrap items-center gap-4 mb-6 ">
                <h4 className="flex-1 font-medium lg:text-2xl text-xl capitalize text-default-900">
                    Flight List
                </h4>
                <div className="flex items-center gap-4 flex-wrap">
                    <Button
                        color="success"
                        variant="outline"
                        onClick={() => handleDownloadTemplate()}
                    >
                        <Download className="w-3.5 h-3.5 me-1" />
                        <span>Template</span>
                    </Button>
                    <ExcelImportButton
                        onImportSuccess={handleImportSuccess}
                    />
                    <Button
                        className="flex-none"
                        color="primary"
                        onClick={() => setOpen(true)}
                    >
                        <Plus className="w-4 h-4 me-1" />
                        <span>Add Flight</span>
                    </Button>
                </div>
            </div>
            {children}
        </div>
    );
};

export default ProjectWrapper;