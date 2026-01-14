"use client";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContractStatus } from "./types";

interface ContractTabsProps {
    activeTab: ContractStatus;
    onTabChange: (tab: ContractStatus) => void;
    tabCounts: {
        all: number;
        active: number;
        "on-hold": number;
        terminated: number;
    };
}

export const ContractTabs = ({
    activeTab,
    onTabChange,
    tabCounts,
}: ContractTabsProps) => {
    return (
        <Tabs
            value={activeTab}
            onValueChange={(value) => onTabChange(value as ContractStatus)}
            className=""
        >
            <TabsList className="bg-transparent border-b border-default-200 rounded-none p-0 gap-0">
                <TabsTrigger
                    value="all"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 pb-3"
                >
                    All Contract
                    <Badge className="ml-2 text-xs border bg-transparent text-foreground">
                        {tabCounts.all}
                    </Badge>
                </TabsTrigger>
                <TabsTrigger
                    value="active"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 pb-3"
                >
                    Active
                    <Badge className="ml-2 text-xs bg-success/10 text-success border-success/20">
                        {tabCounts.active}
                    </Badge>
                </TabsTrigger>
                <TabsTrigger
                    value="on-hold"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 pb-3"
                >
                    On Hold
                    <Badge className="ml-2 text-xs bg-warning/10 text-warning border-warning/20">
                        {tabCounts["on-hold"]}
                    </Badge>
                </TabsTrigger>
                <TabsTrigger
                    value="terminated"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 pb-3"
                >
                    Terminated
                    <Badge className="ml-2 text-xs bg-destructive/10 text-destructive border-destructive/20">
                        {tabCounts.terminated}
                    </Badge>
                </TabsTrigger>
            </TabsList>
        </Tabs>
    );
};
