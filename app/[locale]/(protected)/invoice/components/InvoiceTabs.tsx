"use client";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvoiceTabType } from "./types";

interface InvoiceTabsProps {
    activeTab: InvoiceTabType;
    onTabChange: (tab: InvoiceTabType) => void;
    tabCounts: {
        "pre-invoice": number;
        "draft-invoice": number;
    };
}

export const InvoiceTabs = ({
    activeTab,
    onTabChange,
    tabCounts,
}: InvoiceTabsProps) => {
    return (
        <Tabs
            value={activeTab}
            onValueChange={(value) => onTabChange(value as InvoiceTabType)}
            className=""
        >
            <TabsList className="bg-transparent border-b border-default-200 rounded-none p-0 gap-0">
                <TabsTrigger
                    value="pre-invoice"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 pb-3"
                >
                    PRE-INVOICE
                    <Badge className="ml-2 text-xs bg-info/10 text-info border-info/20">
                        {tabCounts["pre-invoice"]}
                    </Badge>
                </TabsTrigger>
                <TabsTrigger
                    value="draft-invoice"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 pb-3"
                >
                    DRAFT-INVOICE
                    <Badge className="ml-2 text-xs bg-warning/10 text-warning border-warning/20">
                        {tabCounts["draft-invoice"]}
                    </Badge>
                </TabsTrigger>
            </TabsList>
        </Tabs>
    );
};
