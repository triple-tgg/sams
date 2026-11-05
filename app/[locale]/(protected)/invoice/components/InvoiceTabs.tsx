"use client";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvoiceTabType } from "./types";

interface InvoiceTabsProps {
    activeTab: InvoiceTabType;
    onTabChange: (tab: InvoiceTabType) => void;
    tabCounts: {
        "thf-document": number;
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
            className="w-full"
        >
            <TabsList className="bg-transparent border-b border-default-200 rounded-none p-0 gap-0 flex flex-nowrap w-full justify-start overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
                <TabsTrigger
                    value="thf-document"
                    className="shrink-0 relative border-b-2 border-transparent -mb-[1px] data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-semibold rounded-none px-3 sm:px-5 py-2.5 sm:pb-3 text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer"
                >
                    THF DOCUMENT
                    <Badge className="ml-1.5 sm:ml-2 text-[10px] sm:text-xs px-1.5 py-0.5 bg-success/10 text-success border-success/20">
                        {tabCounts["thf-document"]}
                    </Badge>
                </TabsTrigger>
                <TabsTrigger
                    value="pre-invoice"
                    className="shrink-0 relative border-b-2 border-transparent -mb-[1px] data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-semibold rounded-none px-3 sm:px-5 py-2.5 sm:pb-3 text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer"
                >
                    PRE-INVOICE
                    <Badge className="ml-1.5 sm:ml-2 text-[10px] sm:text-xs px-1.5 py-0.5 bg-info/10 text-info border-info/20">
                        {tabCounts["pre-invoice"]}
                    </Badge>
                </TabsTrigger>
                <TabsTrigger
                    value="draft-invoice"
                    className="shrink-0 relative border-b-2 border-transparent -mb-[1px] data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-semibold rounded-none px-3 sm:px-5 py-2.5 sm:pb-3 text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer"
                >
                    DRAFT-INVOICE
                    <Badge className="ml-1.5 sm:ml-2 text-[10px] sm:text-xs px-1.5 py-0.5 bg-warning/10 text-warning border-warning/20">
                        {tabCounts["draft-invoice"]}
                    </Badge>
                </TabsTrigger>
            </TabsList>
        </Tabs>
    );
};
