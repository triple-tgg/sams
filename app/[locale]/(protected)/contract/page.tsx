"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Download, FileText, Plus, Upload, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

import {
  ContractStatus,
  Contract,
  ContractTable,
  ContractFilters,
  ContractTabs,
  ContractDialog,
} from "./components";
import ConfirmCredentialsDialog from "@/app/[locale]/(protected)/master-data/staff/components/ConfirmCredentialsDialog";
import { useContractList, defaultContractListRequest } from "@/lib/api/hooks/useContractList";
import { useDeleteContract } from "@/lib/api/hooks/useContractOperations";
import { ContractListItem } from "@/lib/api/contract/getContractList";

// Transform API data to table display format
const transformContractData = (apiData: ContractListItem[]): Contract[] => {
  return apiData.map((item) => ({
    id: item.id,
    contractNo: item.contractNo,
    contractType: "", // Not in API response yet
    contractName: "", // Not in API response yet  
    customerAirline: item.airlineObj?.name || "",
    effective: item.effectiveFrom,
    valid: item.validFrom,
    expires: item.expiresOn,
    noExpiry: item.isNoExpiryDate ?? false,
    location: item.serviceStation?.join(", ") || "",
    station: item.serviceStation?.[0] || "",
    status: (item.contractStatusObj?.code?.toLowerCase() || "active") as Contract["status"],
  }));
};

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

  // Delete Contract Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);

  // Delete mutation
  const deleteContractMutation = useDeleteContract();

  // Build request object
  const contractListRequest = useMemo(() => ({
    ...defaultContractListRequest,
    contractNo: searchContractNo,
    airlineId: selectedAirline !== "all" ? parseInt(selectedAirline) : 0,
    stationCodeList: [], // Can be updated based on user's station selection
    dateStart: startDate,
    dateEnd: endDate,
    page,
    perPage,
  }), [searchContractNo, selectedAirline, startDate, endDate, page, perPage]);

  // Fetch contract list
  const {
    data: contractListData,
    isLoading,
    isError,
    error,
    refetch
  } = useContractList(contractListRequest);

  // Transform API data
  const contracts = useMemo(() => {
    if (!contractListData?.responseData) return [];
    return transformContractData(contractListData.responseData);
  }, [contractListData]);

  // Filter by tab (status) - client side filtering since API doesn't have status filter
  const filteredContracts = useMemo(() => {
    if (activeTab === "all") return contracts;
    return contracts.filter((contract) => contract.status === activeTab);
  }, [contracts, activeTab]);

  // Pagination info from API
  const totalAll = contractListData?.totalAll || 0;
  const totalPages = Math.ceil(totalAll / perPage);

  // Tab counts from filtered data
  const tabCounts = useMemo(
    () => ({
      all: contracts.length,
      active: contracts.filter((c) => c.status === "active").length,
      "on-hold": contracts.filter((c) => c.status === "on-hold").length,
      terminated: contracts.filter((c) => c.status === "terminated").length,
    }),
    [contracts]
  );

  const handleSearch = () => {
    setPage(1);
    refetch();
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

  // Dialog state for View/Edit
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "view">("create");
  const [selectedContractId, setSelectedContractId] = useState<number | undefined>(undefined);

  const handleView = (contract: Contract) => {
    setSelectedContractId(contract.id);
    setDialogMode("view");
    setIsAddDialogOpen(true);
  };

  const handleEdit = (contract: Contract) => {
    setSelectedContractId(contract.id);
    setDialogMode("edit");
    setIsAddDialogOpen(true);
  };

  const handleDelete = (contract: Contract) => {
    setContractToDelete(contract);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = (userName: string) => {
    if (!contractToDelete) return;

    deleteContractMutation.mutate(
      {
        id: contractToDelete.id,
        userName,
      },
      {
        onSuccess: (response) => {
          if (response.message === 'success') {
            toast.success('Contract deleted successfully!');
            setIsDeleteDialogOpen(false);
            setContractToDelete(null);
          } else {
            toast.error(response.error || 'Failed to delete contract');
          }
        },
        onError: (err) => {
          toast.error(err.message || 'Failed to delete contract');
        },
      }
    );
  };

  const handleAddNew = () => {
    setSelectedContractId(undefined);
    setDialogMode("create");
    setIsAddDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsAddDialogOpen(open);
    if (!open) {
      setSelectedContractId(undefined);
      setDialogMode("create");
    }
  };

  // Loading skeleton
  const renderLoadingSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
    </div>
  );

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
              Template
            </Button>
            <Button variant="outline" color="primary">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button onClick={handleAddNew} color="primary">
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

          {/* Error State */}
          {isError && (
            <div className="text-center py-8 text-destructive">
              <p>Failed to load contracts: {error?.message || "Unknown error"}</p>
              <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && renderLoadingSkeleton()}

          {/* Table */}
          {!isLoading && !isError && (
            <ContractTable
              contracts={filteredContracts}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 px-2">
            <div className="text-sm text-muted-foreground">
              {isLoading ? (
                <Skeleton className="h-4 w-40" />
              ) : (
                <>
                  Showing {filteredContracts.length > 0 ? (page - 1) * perPage + 1 : 0} to{" "}
                  {Math.min(page * perPage, totalAll)} of {totalAll} entries
                </>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handlePrevPage}
                disabled={page <= 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(totalPages || 1, 5) }, (_, i) => i + 1).map(
                (pageNum) => (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage(pageNum)}
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                disabled={page >= totalPages || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contract Dialog */}
      <ContractDialog
        open={isAddDialogOpen}
        onOpenChange={handleDialogClose}
        mode={dialogMode}
        contractId={selectedContractId}
      />

      {/* Delete Contract Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) setContractToDelete(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <ConfirmCredentialsDialog
            title="Confirm Delete Contract"
            description={`Are you sure you want to delete contract "${contractToDelete?.contractNo}"? Please enter your credentials to confirm.`}
            onClose={() => {
              setIsDeleteDialogOpen(false);
              setContractToDelete(null);
            }}
            onConfirm={handleConfirmDelete}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractPage;