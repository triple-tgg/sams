"use client"
import { Button } from "@/components/ui/button";
import { Filter, Download, Plus, FileUp, BarChart } from "lucide-react";
import CreateProject from "./create-project";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Link, usePathname } from "@/components/navigation";
import { getProjectNav } from "./data";
import DateRangePicker from "@/components/date-range-picker";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBlock } from "@/components/blocks/status-block";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";


const ProjectWrapper = ({ children }: { children: React.ReactNode }) => {
    const [open, setOpen] = useState<boolean>(false);
    const pathname = usePathname();
    const menus = getProjectNav(pathname)

    return (
        <div className="space-y-5">
            <CreateProject
                open={open}
                setOpen={setOpen}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-10 ">
                <Card className="bg-info/20">
                    <CardContent className=" p-4  text-center">
                        <div className="mx-auto h-10 w-10  rounded-full flex items-center justify-center bg-white mb-4">
                            <BarChart className=" h-6 w-6 text-info" />
                        </div>
                        <div className="block text-sm text-default-600 font-medium  mb-1.5">Planned</div>
                        <div className="text-2xl text-default-900  font-medium">509</div>
                    </CardContent>
                </Card>
                <Card className="bg-warning/20">
                    <CardContent className=" p-4  text-center">
                        <div
                            className="mx-auto h-10 w-10  rounded-full flex items-center justify-center bg-white mb-4"
                        >
                            <Icon className="w-6 h-6 text-warning" icon="heroicons:chart-pie" />
                        </div>
                        <div className="block text-sm text-default-600 font-medium  mb-1.5">Actual</div>
                        <div className="text-2xl text-default-900  font-medium">459</div>
                    </CardContent>
                </Card>
                <Card className="bg-primary/20">
                    <CardContent className=" p-4  text-center">
                        <div
                            className="mx-auto h-10 w-10  rounded-full flex items-center justify-center bg-white mb-4"
                        >
                            <Icon className="w-6 h-6 text-primary" icon="heroicons:clock" />
                        </div>
                        <div className="block text-sm text-default-600 font-medium  mb-1.5">Additional</div>
                        <div className="text-2xl text-default-900  font-medium">64</div>
                    </CardContent>
                </Card>
                <Card className="bg-success/20">
                    <CardContent className="p-4 text-center">
                        <div
                            className="mx-auto h-10 w-10  rounded-full flex items-center justify-center bg-white mb-4"
                        >
                            <Icon className="w-6 h-6 text-success" icon="heroicons:calculator" />
                        </div>
                        <div className="block text-sm text-default-600 font-medium  mb-1.5">Cancel</div>
                        <div className="text-2xl text-default-900  font-medium">50</div>
                    </CardContent>
                </Card>
            </div>
            <div className="flex w-full flex-wrap items-center gap-4 mb-6 ">
                <h4 className="flex-1 font-medium lg:text-2xl text-xl capitalize text-default-900">
                    Flight List
                </h4>
                <div className="flex items-center gap-4 flex-wrap">
                    <Button color="success" variant="outline">
                        <Download className="w-3.5 h-3.5 me-1" />
                        <span>Template</span>
                    </Button>
                    <Button color="primary" variant="outline">
                        <FileUp className="w-3.5 h-3.5 me-1" />
                        <span>Import</span>
                    </Button>
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