"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PermissionActionGuard } from "@/components/partials/auth/PermissionActionGuard";
import { useMenuPermission } from "@/hooks/use-menu-permission";
import { MENU } from "@/lib/permission-codes";
import {
  useDeleteTrainingVenue,
  useTrainingVenueById,
  useTrainingVenueList,
  useUpsertTrainingVenue,
} from "@/lib/api/master/training-venues.hooks";
import type { TrainingVenueItem, TrainingVenueResponse } from "@/lib/api/master/training-venues";
import TrainingVenueFormDialog, {
  formatDateTime,
  type VenueFormValues,
} from "./components/TrainingVenueFormDialog";

type DialogMode = "closed" | "add" | "view" | "edit" | "confirm-delete";

const PER_PAGE = 10;

const isSuccess = (res?: TrainingVenueResponse) =>
  !!res && !res.error && (res.message?.toLowerCase() === "success" || !!res.responseData);

const TrainingVenuesPage = () => {
  const perm = useMenuPermission(MENU.MASTER_DATA_TRAINING_VENUE);

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [dialogMode, setDialogMode] = useState<DialogMode>("closed");
  const [selected, setSelected] = useState<TrainingVenueItem | null>(null);

  const { data, isLoading, error, refetch, isFetching } = useTrainingVenueList();
  const { data: detailData, isLoading: isLoadingDetail } = useTrainingVenueById(
    selected?.id ?? 0,
    dialogMode === "view" || dialogMode === "edit"
  );
  const upsertMutation = useUpsertTrainingVenue();
  const deleteMutation = useDeleteTrainingVenue();

  const allVenues = useMemo(
    () => (data?.responseData ?? []).filter((v) => v.isdelete !== true),
    [data]
  );

  const venues = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return allVenues;
    return allVenues.filter(
      (v) =>
        v.code?.toLowerCase().includes(q) ||
        v.name?.toLowerCase().includes(q) ||
        v.description?.toLowerCase().includes(q)
    );
  }, [allVenues, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(venues.length / PER_PAGE));
  const pageItems = venues.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Reset to page 1 on new search; step back if the last row of a page was deleted
  useEffect(() => setPage(1), [searchTerm]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const detailVenue = detailData?.responseData ?? selected;

  // Codes used by other venues, for the duplicate check in the form
  const otherCodes = useMemo(
    () =>
      allVenues
        .filter((v) => dialogMode !== "edit" || v.id !== selected?.id)
        .map((v) => v.code?.trim().toUpperCase())
        .filter(Boolean),
    [allVenues, dialogMode, selected]
  );

  // ─── Dialog handlers ───

  const openAdd = () => {
    if (!perm.canCreate) return;
    setSelected(null);
    setDialogMode("add");
  };
  const openView = (item: TrainingVenueItem) => {
    setSelected(item);
    setDialogMode("view");
  };
  const openEdit = (item: TrainingVenueItem) => {
    if (!perm.canEdit) return;
    setSelected(item);
    setDialogMode("edit");
  };
  const openDelete = (item: TrainingVenueItem) => {
    if (!perm.canDelete) return;
    setSelected(item);
    setDialogMode("confirm-delete");
  };
  const closeDialog = () => {
    setDialogMode("closed");
    setSelected(null);
  };

  // ─── Submit handlers ───

  const handleSave = (values: VenueFormValues) => {
    const isAdd = dialogMode === "add";
    if (isAdd ? !perm.canCreate : !perm.canEdit) return;

    upsertMutation.mutate(
      { id: isAdd ? 0 : selected?.id ?? 0, ...values },
      {
        onSuccess: (res) => {
          if (isSuccess(res)) {
            toast.success(isAdd ? "Training venue added successfully" : "Training venue updated successfully");
            closeDialog();
          } else {
            toast.error(res?.error || "Failed to save training venue");
          }
        },
        onError: (err) => toast.error(err.message || "Failed to save training venue"),
      }
    );
  };

  const handleDelete = () => {
    if (!selected || !perm.canDelete) return;
    deleteMutation.mutate(
      { id: selected.id },
      {
        onSuccess: (res) => {
          if (isSuccess(res)) {
            toast.success("Training venue deleted successfully");
            closeDialog();
          } else {
            toast.error(res?.error || "Failed to delete training venue");
          }
        },
        onError: (err) => toast.error(err.message || "Failed to delete training venue"),
      }
    );
  };

  return (
    <div>
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Training Venues
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Places where training courses are held.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <PermissionActionGuard menuCode={MENU.MASTER_DATA_TRAINING_VENUE} action="canCreate">
              <Button size="sm" onClick={openAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add Venue
              </Button>
            </PermissionActionGuard>
          </div>
        </CardHeader>

        <CardContent>
          {error ? (
            <div className="text-center py-8 text-destructive">
              <p>Failed to load training venues: {error.message}</p>
              <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="flex items-end gap-3 mb-4">
                <div className="flex-1 max-w-[320px]">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search code, name or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-9 pl-9"
                    />
                  </div>
                </div>
                {searchTerm && (
                  <Button variant="ghost" size="sm" onClick={() => setSearchTerm("")} className="h-9">
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              {/* Table */}
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">No.</TableHead>
                      <TableHead className="w-[140px]">Code</TableHead>
                      <TableHead className="min-w-[180px]">Name</TableHead>
                      <TableHead className="min-w-[220px]">Description</TableHead>
                      <TableHead className="w-[170px]">Last Updated</TableHead>
                      <TableHead className="w-[80px] text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-56" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-8 rounded mx-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : pageItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                          {searchTerm ? "No matching training venues found" : "No training venues yet"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      pageItems.map((item, index) => (
                        <TableRow
                          key={item.id}
                          className="cursor-pointer"
                          onClick={() => openView(item)}
                        >
                          <TableCell className="text-muted-foreground">
                            {(page - 1) * PER_PAGE + index + 1}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary">
                              {item.code}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">{item.name || "-"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[360px]">
                            <span className="line-clamp-2" title={item.description ?? undefined}>
                              {item.description || "-"}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div>{formatDateTime(item.updateddate || item.createddate)}</div>
                            {(item.updatedby || item.createdby) && (
                              <div className="text-xs text-muted-foreground">
                                {item.updatedby || item.createdby}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Row actions">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openView(item)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </DropdownMenuItem>
                                  {perm.canEdit && (
                                    <DropdownMenuItem onClick={() => openEdit(item)}>
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                  )}
                                  {perm.canDelete && (
                                    <DropdownMenuItem
                                      onClick={() => openDelete(item)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {!isLoading && venues.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 mt-4 px-1">
                  <div className="text-sm text-muted-foreground">
                    Showing {(page - 1) * PER_PAGE + 1} to {Math.min(page * PER_PAGE, venues.length)} of{" "}
                    {venues.length} venue{venues.length === 1 ? "" : "s"}
                    {searchTerm && ` (filtered from ${allVenues.length})`}
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => p - 1)}
                        disabled={page <= 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-sm px-2">
                        Page <span className="font-medium">{page}</span>{" "}
                        <span className="text-muted-foreground">of {totalPages}</span>
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page >= totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ─── Add / Edit / View Dialog ─── */}
      <Dialog
        open={dialogMode === "add" || dialogMode === "edit" || dialogMode === "view"}
        onOpenChange={(open) => !open && !upsertMutation.isPending && closeDialog()}
      >
        <DialogContent className="sm:max-w-[480px]">
          {(dialogMode === "add" || dialogMode === "edit" || dialogMode === "view") && (
            <TrainingVenueFormDialog
              mode={dialogMode}
              venue={dialogMode === "add" ? null : detailVenue}
              isLoading={dialogMode !== "add" && isLoadingDetail && !detailVenue}
              isSaving={upsertMutation.isPending}
              existingCodes={otherCodes}
              onClose={closeDialog}
              onSubmit={handleSave}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ─── */}
      <Dialog
        open={dialogMode === "confirm-delete"}
        onOpenChange={(open) => !open && !deleteMutation.isPending && closeDialog()}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Training Venue
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">
              {selected?.code} — {selected?.name}
            </span>
            ? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={deleteMutation.isPending}>
              Cancel
            </Button>
            <Button color="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainingVenuesPage;
