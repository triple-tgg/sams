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
import { useStationList, useStationById, useUpsertStation, useDeleteStation } from "@/lib/api/hooks/useStationOperations";
import { ChevronLeft, ChevronRight, RefreshCw, Plus, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { StationItem } from "@/lib/api/master/stations/stations.interface";

import StationFormDialog from "./components/StationFormDialog";
import ConfirmCredentialsDialog from "./components/ConfirmCredentialsDialog";

type DialogMode = 'closed' | 'add' | 'view' | 'edit' | 'confirm-delete';

const StationPage = () => {
    const t = useTranslations("Menu");
    const [page, setPage] = useState(1);
    const perPage = 10;

    // Dialog states
    const [dialogMode, setDialogMode] = useState<DialogMode>('closed');
    const [selectedStation, setSelectedStation] = useState<StationItem | null>(null);
    const [pendingFormData, setPendingFormData] = useState<{
        code: string;
        name: string;
        description: string;
    } | null>(null);

    // API hooks
    const { data, isLoading, error, refetch, isFetching } = useStationList(
        { page, perPage },
        true
    );

    const { data: stationDetailData, isLoading: isLoadingDetail } = useStationById(
        selectedStation?.id ?? 0,
        dialogMode === 'view' || dialogMode === 'edit'
    );

    const { mutate: upsertStation, isPending: isUpserting } = useUpsertStation();
    const { mutate: deleteStationMutation, isPending: isDeleting } = useDeleteStation();

    const stationList = data?.responseData ?? [];
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
        setSelectedStation(null);
        setPendingFormData(null);
        setDialogMode('add');
    };

    const openViewDialog = (station: StationItem) => {
        setSelectedStation(station);
        setDialogMode('view');
    };

    const openEditDialog = (station: StationItem) => {
        setSelectedStation(station);
        setPendingFormData(null);
        setDialogMode('edit');
    };

    const openDeleteDialog = (station: StationItem) => {
        setSelectedStation(station);
        setDialogMode('confirm-delete');
    };

    const closeDialog = () => {
        setDialogMode('closed');
        setSelectedStation(null);
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
            userName: 'system',
            isdelete: false,
        };

        upsertStation(payload, {
            onSuccess: (response) => {
                if (response.message === 'success') {
                    toast.success('Station added successfully!');
                    closeDialog();
                    refetch();
                } else {
                    toast.error(response.error || 'Failed to add station');
                }
            },
            onError: (err) => {
                toast.error(err.message || 'Failed to add station');
            },
        });
    };

    const handleEditSubmit = (formData: typeof pendingFormData) => {
        if (!formData || !selectedStation) return;

        const payload = {
            id: selectedStation.id,
            code: formData.code,
            name: formData.name,
            description: formData.description,
            userName: 'system',
            isdelete: false,
        };

        upsertStation(payload, {
            onSuccess: (response) => {
                if (response.message === 'success') {
                    toast.success('Station updated successfully!');
                    closeDialog();
                    refetch();
                } else {
                    toast.error(response.error || 'Failed to update station');
                }
            },
            onError: (err) => {
                toast.error(err.message || 'Failed to update station');
            },
        });
    };

    const handleConfirmDelete = (userName: string) => {
        if (!selectedStation) return;

        deleteStationMutation(
            { id: selectedStation.id, userName },
            {
                onSuccess: (response) => {
                    if (response.message === 'success') {
                        toast.success('Station deleted successfully!');
                        closeDialog();
                        refetch();
                    } else {
                        toast.error(response.error || 'Failed to delete station');
                    }
                },
                onError: (err) => {
                    toast.error(err.message || 'Failed to delete station');
                },
            }
        );
    };

    // Get detail data for view/edit
    const detailStation = stationDetailData?.responseData ?? selectedStation;

    return (
        <div>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{t("station")}</CardTitle>
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
                            Add Station
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {error ? (
                        <div className="text-center py-8 text-destructive">
                            <p>Failed to load stations: {error.message}</p>
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
                                        <TableHead>Description</TableHead>
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
                                                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-8 w-8 rounded mx-auto" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : stationList.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                No stations found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        stationList.map((station, index) => (
                                            <TableRow key={station.id}>
                                                <TableCell>{(page - 1) * perPage + index + 1}</TableCell>
                                                <TableCell className="font-medium">{station.code}</TableCell>
                                                <TableCell>{station.name || "-"}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {station.description || "-"}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {station.createddate
                                                        ? new Date(station.createddate).toLocaleDateString("en-GB", {
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
                                                            <DropdownMenuItem onClick={() => openViewDialog(station)}>
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                View
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => openEditDialog(station)}>
                                                                <Pencil className="h-4 w-4 mr-2" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => openDeleteDialog(station)}
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
                                    Showing {stationList.length > 0 ? (page - 1) * perPage + 1 : 0} to{" "}
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
                    <StationFormDialog
                        mode="add"
                        onClose={closeDialog}
                        onSubmit={handleAddSubmit}
                    />
                </DialogContent>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={dialogMode === 'view'} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent className="max-w-lg">
                    <StationFormDialog
                        mode="view"
                        station={detailStation}
                        onClose={closeDialog}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={dialogMode === 'edit'} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent className="max-w-lg">
                    <StationFormDialog
                        mode="edit"
                        station={detailStation}
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
                        title="Confirm Delete Station"
                        description={`Are you sure you want to delete "${selectedStation?.code}"? Please enter your credentials to confirm.`}
                        onClose={closeDialog}
                        onConfirm={handleConfirmDelete}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default StationPage;
