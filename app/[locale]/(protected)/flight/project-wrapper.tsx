"use client"
import { Button } from "@/components/ui/button";
import { Filter, List, Plus, FileUp } from "lucide-react";
import CreateProject from "./create-project";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Link, usePathname } from "@/components/navigation";
import { getProjectNav } from "./data";
import DateRangePicker from "@/components/date-range-picker";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBlock } from "@/components/blocks/status-block";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


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
            <Card>
                <CardContent className=" p-6">
                    <div className="grid xl:grid-cols-4 lg:grid-cols-2 md:grid-cols-2 grid-cols-1 gap-5 place-content-center">

                        {/*  status blocks */}
                        <StatusBlock
                            title={"Planned "}
                            total="509"
                            chartType="bar"
                            className="bg-default-50 shadow-none border-none"
                            opacity={1}
                        />
                        <StatusBlock
                            title={"Actual"}
                            total="459"
                            chartType="bar"
                            className="bg-default-50 shadow-none border-none"
                            opacity={1}
                        />
                        <StatusBlock
                            title={"Additional"}
                            total="64"
                            chartColor="#80fac1"
                            className="bg-default-50 shadow-none border-none"
                            series={[40, 70, 45, 100, 75, 40, 80, 90]}
                            chartType="bar"
                            opacity={1}
                        />
                        <StatusBlock
                            title={"Cancel"}
                            total="50"
                            chartColor="#ffbf99"
                            className="bg-default-50 shadow-none border-none"
                            chartType="bar"
                            series={[40, 70, 45, 100, 75, 40, 80, 90]}
                            opacity={1}
                        />
                    </div>
                </CardContent>
            </Card>
            <div className="flex w-full flex-wrap items-center gap-4 mb-6">
                <h4 className="flex-1 font-medium lg:text-2xl text-xl capitalize text-default-900">
                    Flight List
                </h4>
                <div className="flex items-center gap-4 flex-wrap">
                    {/* {menus?.map(({ label, href, active }, index) => (
                        <Button
                            key={index}
                            asChild
                            className={cn("flex-none capitalize bg-card text-default-600 hover:bg-card hover:text-default-600  hover:ring-0 hover:ring-transparent", {
                                "bg-default text-default-foreground hover:bg-default hover:text-default-foreground": active,
                            })}

                        >
                            <Link href={href}>
                                <List className="w-3.5 h-3.5 me-1" />
                                <span>{label}</span>
                            </Link>

                        </Button>
                    ))} */}
                    {/* <Button className="flex-none bg-card text-default-600 hover:ring-0 hover:ring-transparent hover:bg-default hover:text-default-foreground" >
                        <Filter className="w-3.5 h-3.5 me-1" />
                        <span>Filter</span>
                    </Button> */}
                    <Button color="success" variant="outline">
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