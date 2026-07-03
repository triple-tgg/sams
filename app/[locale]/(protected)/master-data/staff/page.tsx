"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "next-intl";
import { useStaffList, useStaffById, useUpsertStaff, useDeleteStaff } from "@/lib/api/hooks/useStaffOperations";
import { ChevronLeft, ChevronRight, RefreshCw, Plus, MoreHorizontal, Eye, Pencil, Trash2, Search, X } from "lucide-react";
import { toast } from "sonner";
import type { StaffItem } from "@/lib/api/master/staff/staff.interface";

import { PermissionActionGuard } from "@/components/partials/auth/PermissionActionGuard";
import StaffFormDialog from "./components/StaffFormDialog";
import ConfirmCredentialsDialog from "./components/ConfirmCredentialsDialog";

type DialogMode = 'closed' | 'add' | 'view' | 'edit' | 'confirm-delete';

const StaffPage = () => {
    const t = useTranslations("Menu");
    const [page, setPage] = useState(1);
    const perPage = 10;

    // Filter states
    const [filterCode, setFilterCode] = useState("");
    const [filterName, setFilterName] = useState("");
    const [filterTitle, setFilterTitle] = useState("");
    const [filterEmail, setFilterEmail] = useState("");

    // Applied filters (sent to API on search)
    const [appliedFilters, setAppliedFilters] = useState<{
        code?: string;
        name?: string;
        title?: string;
        email?: string;
    }>({});

    // Dialog states
    const [dialogMode, setDialogMode] = useState<DialogMode>('closed');
    const [selectedStaff, setSelectedStaff] = useState<StaffItem | null>(null);
    const [pendingFormData, setPendingFormData] = useState<{
        code: string;
        name: string;
        staffstypeid: number;
        isActive: boolean;
        title: string;
        jobTitle: string;
        email: string;
    } | null>(null);

    // API hooks
    const { data, isLoading, error, refetch, isFetching } = useStaffList(
        {
            page,
            perPage,
            ...(appliedFilters.code && { code: appliedFilters.code }),
            ...(appliedFilters.name && { name: appliedFilters.name }),
            ...(appliedFilters.title && { title: appliedFilters.title }),
            ...(appliedFilters.email && { email: appliedFilters.email }),
        },
        true
    );

    // Filter handlers
    const handleSearch = useCallback(() => {
        setPage(1);
        setAppliedFilters({
            code: filterCode.trim() || undefined,
            name: filterName.trim() || undefined,
            title: filterTitle.trim() || undefined,
            email: filterEmail.trim() || undefined,
        });
    }, [filterCode, filterName, filterTitle, filterEmail]);

    const handleClearFilters = useCallback(() => {
        setFilterCode("");
        setFilterName("");
        setFilterTitle("");
        setFilterEmail("");
        setAppliedFilters({});
        setPage(1);
    }, []);

    const handleFilterKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSearch();
    };

    const hasActiveFilters = !!(appliedFilters.code || appliedFilters.name || appliedFilters.title || appliedFilters.email);

    const { data: staffDetailData, isLoading: isLoadingDetail } = useStaffById(
        selectedStaff?.id ?? 0,
        dialogMode === 'view' || dialogMode === 'edit'
    );

    const { mutate: upsertStaff, isPending: isUpserting } = useUpsertStaff();
    const { mutate: deleteStaffMutation, isPending: isDeleting } = useDeleteStaff();

    const staffList = data?.responseData ?? [];
    const totalAll = data?.totalAll ?? 0;
    const totalPages = Math.ceil(totalAll / perPage);

    const handlePrevPage = () => {
        if (page > 1) setPage(page - 1);
    };

    const handleNextPage = () => {
        if (page < totalPages) setPage(page + 1);
    };

    // Dialog handlers
    const openAddDialog = () => {
        setSelectedStaff(null);
        setPendingFormData(null);
        setDialogMode('add');
    };

    const openViewDialog = (staff: StaffItem) => {
        setSelectedStaff(staff);
        setDialogMode('view');
    };

    const openEditDialog = (staff: StaffItem) => {
        setSelectedStaff(staff);
        setPendingFormData(null);
        setDialogMode('edit');
    };

    const openDeleteDialog = (staff: StaffItem) => {
        setSelectedStaff(staff);
        setDialogMode('confirm-delete');
    };

    const closeDialog = () => {
        setDialogMode('closed');
        setSelectedStaff(null);
        setPendingFormData(null);
    };

    // Form submission handlers
    const handleAddSubmit = (formData: typeof pendingFormData) => {
        if (!formData) return;

        const payload = {
            id: 0,
            code: formData.code,
            name: formData.name,
            staffstypeid: formData.staffstypeid,
            userName: 'system',
            isAcive: formData.isActive, // Note: API uses "isAcive"
            title: formData.title,
            jobTitle: formData.jobTitle,
            email: formData.email,
        };

        upsertStaff(payload, {
            onSuccess: (response) => {
                if (response.message === 'success') {
                    toast.success('Staff added successfully!');
                    closeDialog();
                    refetch();
                } else {
                    toast.error(response.error || 'Failed to add staff');
                }
            },
            onError: (err) => {
                toast.error(err.message || 'Failed to add staff');
            },
        });
    };

    const handleEditSubmit = (formData: typeof pendingFormData) => {
        if (!formData || !selectedStaff) return;

        const payload = {
            id: selectedStaff.id,
            code: formData.code,
            name: formData.name,
            staffstypeid: formData.staffstypeid,
            userName: 'system',
            isAcive: formData.isActive, // Note: API uses "isAcive"
            title: formData.title,
            jobTitle: formData.jobTitle,
            email: formData.email,
        };

        upsertStaff(payload, {
            onSuccess: (response) => {
                if (response.message === 'success') {
                    toast.success('Staff updated successfully!');
                    closeDialog();
                    refetch();
                } else {
                    toast.error(response.error || 'Failed to update staff');
                }
            },
            onError: (err) => {
                toast.error(err.message || 'Failed to update staff');
            },
        });
    };

    const handleConfirmDelete = (userName: string) => {
        if (!selectedStaff) return;

        deleteStaffMutation(
            { id: selectedStaff.id, userName },
            {
                onSuccess: (response) => {
                    if (response.message === 'success') {
                        toast.success('Staff deleted successfully!');
                        closeDialog();
                        refetch();
                    } else {
                        toast.error(response.error || 'Failed to delete staff');
                    }
                },
                onError: (err) => {
                    toast.error(err.message || 'Failed to delete staff');
                },
            }
        );
    };

    // Get detail data for view/edit
    const detailStaff = staffDetailData?.responseData ?? selectedStaff;

    return (
        <div>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{t("Staff List")}</CardTitle>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetch()}
                            disabled={isFetching}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                        <PermissionActionGuard menuCode="MASTER_DATA_STAFF" action="canCreate">
                            <Button size="sm" onClick={openAddDialog}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Staff
                            </Button>
                        </PermissionActionGuard>
                    </div>
                </CardHeader>
                <CardContent>
                    {error ? (
                        <div className="text-center py-8 text-destructive">
                            <p>Failed to load staff: {error.message}</p>
                            <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                                Try Again
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* Filter Bar */}
                            <div className="flex flex-wrap items-end gap-3 mb-4">
                                <div className="flex-1 min-w-[140px] max-w-[200px]">
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Code</label>
                                    <Input
                                        placeholder="Search code..."
                                        value={filterCode}
                                        onChange={(e) => setFilterCode(e.target.value)}
                                        onKeyDown={handleFilterKeyDown}
                                        className="h-9"
                                    />
                                </div>
                                <div className="flex-1 min-w-[140px] max-w-[200px]">
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label>
                                    <Input
                                        placeholder="Search name..."
                                        value={filterName}
                                        onChange={(e) => setFilterName(e.target.value)}
                                        onKeyDown={handleFilterKeyDown}
                                        className="h-9"
                                    />
                                </div>
                                <div className="flex-1 min-w-[140px] max-w-[200px]">
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
                                    <Input
                                        placeholder="Search title..."
                                        value={filterTitle}
                                        onChange={(e) => setFilterTitle(e.target.value)}
                                        onKeyDown={handleFilterKeyDown}
                                        className="h-9"
                                    />
                                </div>
                                <div className="flex-1 min-w-[140px] max-w-[220px]">
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
                                    <Input
                                        placeholder="Search email..."
                                        value={filterEmail}
                                        onChange={(e) => setFilterEmail(e.target.value)}
                                        onKeyDown={handleFilterKeyDown}
                                        className="h-9"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button size="sm" onClick={handleSearch} disabled={isFetching} className="h-9">
                                        <Search className="h-4 w-4 mr-1.5" />
                                        Search
                                    </Button>
                                    {hasActiveFilters && (
                                        <Button size="sm" variant="outline" onClick={handleClearFilters} className="h-9">
                                            <X className="h-4 w-4 mr-1.5" />
                                            Clear
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[60px]">No.</TableHead>
                                        <TableHead className="w-[80px]">Code</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead className="">Job Title</TableHead>
                                        <TableHead className="w-[150px]">Type</TableHead>
                                        <TableHead className="w-[80px]">Status</TableHead>
                                        <TableHead className="w-[140px]">Created Date</TableHead>
                                        <TableHead className="w-[80px] text-center">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        Array.from({ length: perPage }).map((_, index) => (
                                            <TableRow key={index}>
                                                <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-8 w-8 rounded mx-auto" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : staffList.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                                No staff found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        staffList.map((staff, index) => (
                                            <TableRow key={staff.id}>
                                                <TableCell>{(page - 1) * perPage + index + 1}</TableCell>
                                                <TableCell className="font-medium">{staff.code}</TableCell>
                                                <TableCell>
                                                    <span className="text-muted-foreground">{staff.title}</span>{' '}
                                                    {staff.name}
                                                </TableCell>
                                                <TableCell className="text-sm">{staff.jobTitle || "-"}</TableCell>
                                                <TableCell>
                                                    <Badge color="secondary" className="text-xs">
                                                        {staff.staffstypeObj?.code || "-"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge color={staff.isActive ? "success" : "default"} className="text-xs">
                                                        {staff.isActive ? "Active" : "Inactive"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {staff.createddate
                                                        ? new Date(staff.createddate).toLocaleDateString("en-GB", {
                                                            day: "2-digit",
                                                            month: "short",
                                                            year: "numeric",
                                                        })
                                                        : "-"}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => openViewDialog(staff)}>
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                View
                                                            </DropdownMenuItem>
                                                            <PermissionActionGuard menuCode="MASTER_DATA_STAFF" action="canEdit">
                                                                <DropdownMenuItem onClick={() => openEditDialog(staff)}>
                                                                    <Pencil className="h-4 w-4 mr-2" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                            </PermissionActionGuard>
                                                            <PermissionActionGuard menuCode="MASTER_DATA_STAFF" action="canDelete">
                                                                <DropdownMenuItem
                                                                    onClick={() => openDeleteDialog(staff)}
                                                                    className="text-destructive focus:text-destructive"
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </PermissionActionGuard>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            <div className="flex items-center justify-between mt-4 px-2">
                                <div className="text-sm text-muted-foreground">
                                    Showing {staffList.length > 0 ? (page - 1) * perPage + 1 : 0} to{" "}
                                    {Math.min(page * perPage, totalAll)} of {totalAll} entries
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handlePrevPage}
                                        disabled={page <= 1 || isFetching}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </Button>
                                    <div className="flex items-center gap-1 px-2">
                                        <span className="text-sm font-medium">Page {page}</span>
                                        <span className="text-sm text-muted-foreground">of {totalPages || 1}</span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleNextPage}
                                        disabled={page >= totalPages || isFetching}
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Add Dialog */}
            <Dialog open={dialogMode === 'add'} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent className="max-w-lg">
                    <StaffFormDialog
                        mode="add"
                        onClose={closeDialog}
                        onSubmit={handleAddSubmit}
                    />
                </DialogContent>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={dialogMode === 'view'} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent className="max-w-lg">
                    <StaffFormDialog
                        mode="view"
                        staff={detailStaff}
                        onClose={closeDialog}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={dialogMode === 'edit'} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent className="max-w-lg">
                    <StaffFormDialog
                        mode="edit"
                        staff={detailStaff}
                        isPending={isLoadingDetail}
                        onClose={closeDialog}
                        onSubmit={handleEditSubmit}
                    />
                </DialogContent>
            </Dialog>



            {/* Confirm Delete Dialog */}
            <Dialog open={dialogMode === 'confirm-delete'} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent className="max-w-lg">
                    <ConfirmCredentialsDialog
                        title="Confirm Delete Staff"
                        description={`Are you sure you want to delete "${selectedStaff?.name}"? Please enter your credentials to confirm.`}
                        onClose={closeDialog}
                        onConfirm={handleConfirmDelete}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default StaffPage;
