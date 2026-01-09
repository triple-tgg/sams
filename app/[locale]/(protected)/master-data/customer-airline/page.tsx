"use client";

import { useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
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
import { useAirlinesList } from "@/lib/api/hooks/useAirlinesList";
import { useAirlineById, useUpsertAirline, useDeleteAirline } from "@/lib/api/hooks/useAirlineOperations";
import { ChevronLeft, ChevronRight, RefreshCw, Plus, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { AirlineItem } from "@/lib/api/master/airlines/airlines.interface";

import AirlineFormDialog from "./components/AirlineFormDialog";
import ConfirmCredentialsDialog from "./components/ConfirmCredentialsDialog";

type DialogMode = 'closed' | 'add' | 'view' | 'edit' | 'confirm-delete';

const CustomerAirlinePage = () => {
    const t = useTranslations("Menu");
    const [page, setPage] = useState(1);
    const perPage = 10;

    // Dialog states
    const [dialogMode, setDialogMode] = useState<DialogMode>('closed');
    const [selectedAirline, setSelectedAirline] = useState<AirlineItem | null>(null);
    const [pendingFormData, setPendingFormData] = useState<{
        code: string;
        name: string;
        description: string;
        colorForeground: string;
        colorBackground: string;
    } | null>(null);

    // API hooks
    const { data, isLoading, error, refetch, isFetching } = useAirlinesList(
        { page, perPage },
        true
    );

    const { data: airlineDetailData, isLoading: isLoadingDetail } = useAirlineById(
        selectedAirline?.id ?? 0,
        dialogMode === 'view' || dialogMode === 'edit'
    );

    const { mutate: upsertAirline, isPending: isUpserting } = useUpsertAirline();
    const { mutate: deleteAirlineMutation, isPending: isDeleting } = useDeleteAirline();

    const airlines = data?.responseData ?? [];
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
        setSelectedAirline(null);
        setPendingFormData(null);
        setDialogMode('add');
    };

    const openViewDialog = (airline: AirlineItem) => {
        setSelectedAirline(airline);
        setDialogMode('view');
    };

    const openEditDialog = (airline: AirlineItem) => {
        setSelectedAirline(airline);
        setPendingFormData(null);
        setDialogMode('edit');
    };

    const openDeleteDialog = (airline: AirlineItem) => {
        setSelectedAirline(airline);
        setDialogMode('confirm-delete');
    };

    const closeDialog = () => {
        setDialogMode('closed');
        setSelectedAirline(null);
        setPendingFormData(null);
    };

    // Form submission handlers
    const handleAddSubmit = (formData: typeof pendingFormData) => {
        if (!formData) return;

        const payload = {
            id: 0,
            code: formData.code,
            name: formData.name,
            description: formData.description,
            isdelete: false,
            userName: 'system',
            colorForeground: formData.colorForeground,
            colorBackground: formData.colorBackground,
        };

        upsertAirline(payload, {
            onSuccess: (response) => {
                if (response.message === 'success') {
                    toast.success('Airline added successfully!');
                    closeDialog();
                    refetch();
                } else {
                    toast.error(response.error || 'Failed to add airline');
                }
            },
            onError: (err) => {
                toast.error(err.message || 'Failed to add airline');
            },
        });
    };

    const handleEditSubmit = (formData: typeof pendingFormData) => {
        if (!formData || !selectedAirline) return;

        const payload = {
            id: selectedAirline.id,
            code: formData.code,
            name: formData.name,
            description: formData.description,
            isdelete: false,
            userName: 'system',
            colorForeground: formData.colorForeground,
            colorBackground: formData.colorBackground,
        };

        upsertAirline(payload, {
            onSuccess: (response) => {
                if (response.message === 'success') {
                    toast.success('Airline updated successfully!');
                    closeDialog();
                    refetch();
                } else {
                    toast.error(response.error || 'Failed to update airline');
                }
            },
            onError: (err) => {
                toast.error(err.message || 'Failed to update airline');
            },
        });
    };

    const handleConfirmDelete = (userName: string) => {
        if (!selectedAirline) return;

        deleteAirlineMutation(
            { id: selectedAirline.id, userName },
            {
                onSuccess: (response) => {
                    if (response.message === 'success') {
                        toast.success('Airline deleted successfully!');
                        closeDialog();
                        refetch();
                    } else {
                        toast.error(response.error || 'Failed to delete airline');
                    }
                },
                onError: (err) => {
                    toast.error(err.message || 'Failed to delete airline');
                },
            }
        );
    };

    // Get detail data for view/edit
    const detailAirline = airlineDetailData?.responseData ?? selectedAirline;

    return (
        <div>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{t("customer-airline")}</CardTitle>
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
                        <Button size="sm" onClick={openAddDialog}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Airline
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {error ? (
                        <div className="text-center py-8 text-destructive">
                            <p>Failed to load airlines: {error.message}</p>
                            <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                                Try Again
                            </Button>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[60px]">No.</TableHead>
                                        <TableHead className="w-[100px]">Code</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead className="w-[120px]">Preview</TableHead>
                                        <TableHead className="w-[120px]">Created By</TableHead>
                                        <TableHead className="w-[140px]">Created Date</TableHead>
                                        <TableHead className="w-[80px] text-center">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        Array.from({ length: perPage }).map((_, index) => (
                                            <TableRow key={index}>
                                                <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-14" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                                <TableCell><Skeleton className="h-7 w-16 rounded" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-8 w-8 rounded mx-auto" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : airlines.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                No airlines found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        airlines.map((airline, index) => (
                                            <TableRow key={airline.id}>
                                                <TableCell>{(page - 1) * perPage + index + 1}</TableCell>
                                                <TableCell className="font-medium">{airline.code}</TableCell>
                                                <TableCell>{airline.name || "-"}</TableCell>
                                                <TableCell>
                                                    <div
                                                        className="px-2 py-1 rounded text-xs font-medium inline-block"
                                                        style={{
                                                            backgroundColor: airline.colorBackground || "#1F2937",
                                                            color: airline.colorForeground || "#FFFFFF",
                                                        }}
                                                    >
                                                        {airline.code}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm">{airline.createdby || "-"}</TableCell>
                                                <TableCell className="text-sm">
                                                    {airline.createddate
                                                        ? new Date(airline.createddate).toLocaleDateString("en-GB", {
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
                                                            <DropdownMenuItem onClick={() => openViewDialog(airline)}>
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                View
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => openEditDialog(airline)}>
                                                                <Pencil className="h-4 w-4 mr-2" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => openDeleteDialog(airline)}
                                                                className="text-destructive focus:text-destructive"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
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
                                    Showing {airlines.length > 0 ? (page - 1) * perPage + 1 : 0} to{" "}
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
                    <AirlineFormDialog
                        mode="add"
                        onClose={closeDialog}
                        onSubmit={handleAddSubmit}
                    />
                </DialogContent>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={dialogMode === 'view'} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent className="max-w-lg">
                    <AirlineFormDialog
                        mode="view"
                        airline={detailAirline}
                        onClose={closeDialog}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={dialogMode === 'edit'} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent className="max-w-lg">
                    <AirlineFormDialog
                        mode="edit"
                        airline={detailAirline}
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
                        title="Confirm Delete Airline"
                        description={`Are you sure you want to delete "${selectedAirline?.name || selectedAirline?.code}"? Please enter your credentials to confirm.`}
                        onClose={closeDialog}
                        onConfirm={handleConfirmDelete}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CustomerAirlinePage;
