"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, FileText, Plus, Upload } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  ContractStatus,
  Contract,
  mockContracts,
  ContractTable,
  ContractFilters,
  ContractTabs,
  AddContractDialog,
} from "./components";

const ContractPage = () => {
  const t = useTranslations("Menu");

  // State
  const [activeTab, setActiveTab] = useState<ContractStatus>("all");
  const [searchContractNo, setSearchContractNo] = useState("");
  const [selectedAirline, setSelectedAirline] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Add Contract Dialog State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Filter contracts based on tab and search
  const filteredContracts = useMemo(() => {
    return mockContracts.filter((contract) => {
      // Tab filter
      if (activeTab !== "all" && contract.status !== activeTab) {
        return false;
      }
      // Contract No search
      if (
        searchContractNo &&
        !contract.contractNo.toLowerCase().includes(searchContractNo.toLowerCase())
      ) {
        return false;
      }
      // Airline filter
      if (selectedAirline !== "all" && contract.customerAirline !== selectedAirline) {
        return false;
      }
      // Date range filter (based on effective date)
      if (startDate && contract.effective < startDate) {
        return false;
      }
      if (endDate && contract.effective > endDate) {
        return false;
      }
      return true;
    });
  }, [activeTab, searchContractNo, selectedAirline, startDate, endDate]);

  const totalAll = filteredContracts.length;
  const totalPages = Math.ceil(totalAll / perPage);
  const paginatedContracts = filteredContracts.slice(
    (page - 1) * perPage,
    page * perPage
  );

  // Tab counts
  const tabCounts = useMemo(
    () => ({
      all: mockContracts.length,
      active: mockContracts.filter((c) => c.status === "active").length,
      "on-hold": mockContracts.filter((c) => c.status === "on-hold").length,
      terminated: mockContracts.filter((c) => c.status === "terminated").length,
    }),
    []
  );

  const handleSearch = () => {
    setPage(1);
  };

  const handleTabChange = (tab: ContractStatus) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const handleView = (contract: Contract) => {
    console.log("View contract:", contract);
  };

  const handleEdit = (contract: Contract) => {
    console.log("Edit contract:", contract);
  };

  const handleDelete = (contract: Contract) => {
    console.log("Delete contract:", contract);
  };

  return (
    <div>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>{t("contract")}</CardTitle>
          <CardDescription>
            Manage airline maintenance service contracts and agreements.
          </CardDescription>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" color="success">
              <FileText className="h-4 w-4 mr-2" />
              Templat
            </Button>
            <Button variant="outline" color="primary">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)} color="primary">
              <Plus className="h-4 w-4 mr-2" />
              New Contract
            </Button>
          </div>
        </CardHeader>
        <CardContent>

          {/* Search Filters */}
          <ContractFilters
            searchContractNo={searchContractNo}
            onSearchChange={setSearchContractNo}
            selectedAirline={selectedAirline}
            onAirlineChange={setSelectedAirline}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            onSearch={handleSearch}
          />

          {/* Tabs */}
          <ContractTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            tabCounts={tabCounts}
          />
          {/* Table */}
          <ContractTable
            contracts={paginatedContracts}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 px-2">
            <div className="text-sm text-muted-foreground">
              Showing {paginatedContracts.length > 0 ? (page - 1) * perPage + 1 : 0} to{" "}
              {Math.min(page * perPage, totalAll)} of {totalAll} entries
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handlePrevPage}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(
                (pageNum) => (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              )}
              {totalPages > 5 && (
                <>
                  <span className="px-2 text-muted-foreground">...</span>
                  <Button
                    variant={page === totalPages ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage(totalPages)}
                  >
                    {totalPages}
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleNextPage}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Contract Dialog */}
      <AddContractDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </div>
  );
};

export default ContractPage;