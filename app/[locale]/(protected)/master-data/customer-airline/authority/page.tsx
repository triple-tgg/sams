"use client";

import { useState, useCallback, useMemo } from "react";
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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Search,
  X,
  Shield,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { PermissionActionGuard } from "@/components/partials/auth/PermissionActionGuard";
import {
  useAuthorityMasterList,
  useUpsertAuthorityMaster,
  useDeleteAuthorityMaster,
} from "@/lib/api/master/authority-master.hooks";
import type { AuthorityMasterItem } from "@/lib/api/master/authority-master";

type DialogMode = "closed" | "add" | "edit" | "confirm-delete";

const AuthorityMasterPage = () => {
  // Filter
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog
  const [dialogMode, setDialogMode] = useState<DialogMode>("closed");
  const [selected, setSelected] = useState<AuthorityMasterItem | null>(null);

  // Form
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formCountry, setFormCountry] = useState("");
  const [formCountryCode, setFormCountryCode] = useState("");
  const [formAuthorityType, setFormAuthorityType] = useState("");

  // API hooks
  const { data, isLoading, error, refetch, isFetching } = useAuthorityMasterList();
  const upsertMutation = useUpsertAuthorityMaster();
  const deleteMutation = useDeleteAuthorityMaster();

  const authorities = useMemo(() => {
    const list = data?.responseData ?? [];
    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase();
    return list.filter(
      (a) =>
        a.code?.toLowerCase().includes(q) ||
        a.name?.toLowerCase().includes(q) ||
        a.country?.toLowerCase().includes(q) ||
        a.countryCode?.toLowerCase().includes(q) ||
        a.authorityType?.toLowerCase().includes(q)
    );
  }, [data, searchTerm]);

  // ─── Dialog handlers ───

  const openAdd = () => {
    setSelected(null);
    setFormCode("");
    setFormName("");
    setFormCountry("");
    setFormCountryCode("");
    setFormAuthorityType("");
    setDialogMode("add");
  };

  const openEdit = (item: AuthorityMasterItem) => {
    setSelected(item);
    setFormCode(item.code);
    setFormName(item.name);
    setFormCountry(item.country ?? "");
    setFormCountryCode(item.countryCode ?? "");
    setFormAuthorityType(item.authorityType ?? "");
    setDialogMode("edit");
  };

  const openDelete = (item: AuthorityMasterItem) => {
    setSelected(item);
    setDialogMode("confirm-delete");
  };

  const closeDialog = () => {
    setDialogMode("closed");
    setSelected(null);
    setFormCode("");
    setFormName("");
    setFormCountry("");
    setFormCountryCode("");
    setFormAuthorityType("");
  };

  // ─── Submit handlers ───

  const handleSave = useCallback(() => {
    if (!formCode.trim() || !formName.trim() || !formCountry.trim()) {
      toast.error("Code, Name, and Country are required");
      return;
    }

    const payload = {
      id: dialogMode === "edit" && selected ? selected.id : 0,
      code: formCode.trim(),
      name: formName.trim(),
      country: formCountry.trim(),
      countryCode: formCountryCode.trim(),
      authorityType: formAuthorityType.trim(),
    };

    upsertMutation.mutate(payload, {
      onSuccess: (response) => {
        if (response.message === "success") {
          toast.success(
            dialogMode === "add"
              ? "Authority added successfully!"
              : "Authority updated successfully!"
          );
          closeDialog();
        } else {
          toast.error(response.error || "Failed to save authority");
        }
      },
      onError: (err) => {
        toast.error(err.message || "Failed to save authority");
      },
    });
  }, [formCode, formName, formCountry, formCountryCode, formAuthorityType, dialogMode, selected, upsertMutation]);

  const handleDelete = useCallback(() => {
    if (!selected) return;

    deleteMutation.mutate(
      { id: selected.id, userName: "system" },
      {
        onSuccess: (response) => {
          if (response.message === "success") {
            toast.success("Authority deleted successfully!");
            closeDialog();
          } else {
            toast.error(response.error || "Failed to delete authority");
          }
        },
        onError: (err) => {
          toast.error(err.message || "Failed to delete authority");
        },
      }
    );
  }, [selected, deleteMutation]);

  const handleClearSearch = () => setSearchTerm("");

  // ─── Render ───

  return (
    <div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Aviation Authority
          </CardTitle>
          <div className="flex items-center gap-2">
            <PermissionActionGuard
              menuCode="MASTER_DATA_AUTHORITY"
              action="canCreate"
            >
              <Button color="primary" onClick={openAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add Authority
              </Button>
            </PermissionActionGuard>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8 text-destructive">
              <p>Failed to load authorities: {error.message}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => refetch()}
              >
                Try Again
              </Button>
            </div>
          ) : (
            <>
              {/* Search bar */}
              <div className="flex items-end gap-3 mb-4">
                <div className="flex-1 max-w-[300px]">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search code or name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-9 pl-9"
                    />
                  </div>
                </div>
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSearch}
                    className="h-9"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              {/* Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">#</TableHead>
                      <TableHead className="w-[120px]">Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="w-[160px]">Country</TableHead>
                      <TableHead className="w-[100px]">Country Code</TableHead>
                      <TableHead className="w-[180px]">Authority Type</TableHead>
                      <TableHead className="w-[80px] text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Skeleton className="h-4 w-8" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-48" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-8 ml-auto" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : authorities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {searchTerm
                            ? "No matching authorities found"
                            : "No authorities found"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      authorities.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary">
                              {item.code}
                            </span>
                          </TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-muted-foreground">{item.country ?? "—"}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono bg-muted">
                              {item.countryCode ?? "—"}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{item.authorityType ?? "—"}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => openEdit(item)}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openDelete(item)}
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
              </div>

              {/* Summary */}
              {!isLoading && (
                <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                  <span>
                    Total: {authorities.length} authorit
                    {authorities.length === 1 ? "y" : "ies"}
                  </span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ─── Add / Edit Dialog ─── */}
      <Dialog
        open={dialogMode === "add" || dialogMode === "edit"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "add" ? "Add Authority" : "Edit Authority"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="authority-code">
                Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="authority-code"
                placeholder="e.g. CAAT, FAA, EASA"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                disabled={upsertMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="authority-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="authority-name"
                placeholder="e.g. Civil Aviation Authority of Thailand"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                disabled={upsertMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="authority-country">
                Country <span className="text-destructive">*</span>
              </Label>
              <Input
                id="authority-country"
                placeholder="e.g. Thailand, United States"
                value={formCountry}
                onChange={(e) => setFormCountry(e.target.value)}
                disabled={upsertMutation.isPending}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="authority-country-code">
                  Country Code
                </Label>
                <Input
                  id="authority-country-code"
                  placeholder="e.g. TH, US, EU"
                  value={formCountryCode}
                  onChange={(e) => setFormCountryCode(e.target.value.toUpperCase())}
                  disabled={upsertMutation.isPending}
                  maxLength={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="authority-type">
                  Authority Type
                </Label>
                <Select
                  value={formAuthorityType}
                  onValueChange={setFormAuthorityType}
                  disabled={upsertMutation.isPending}
                >
                  <SelectTrigger id="authority-type">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Directorate">Directorate</SelectItem>
                    <SelectItem value="Civil Aviation Authority">Civil Aviation Authority</SelectItem>
                    <SelectItem value="Authority">Authority</SelectItem>
                    <SelectItem value="Ministry">Ministry</SelectItem>
                    <SelectItem value="Administration">Administration</SelectItem>
                    <SelectItem value="Agency">Agency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={upsertMutation.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={upsertMutation.isPending}>
              {upsertMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {dialogMode === "add" ? "Add" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ─── */}
      <Dialog
        open={dialogMode === "confirm-delete"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Authority
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete authority{" "}
              <span className="font-semibold text-foreground">
                {selected?.code} — {selected?.name}
              </span>
              ? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={deleteMutation.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              color="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuthorityMasterPage;
