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
import { useUserList, useUserById, useUpsertUser, useDeleteUser } from "@/lib/api/hooks/useUserOperations";
import { ChevronLeft, ChevronRight, RefreshCw, Plus, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { UserItem } from "@/lib/api/master/users/users.interface";

import UserFormDialog from "./components/UserFormDialog";
import ConfirmCredentialsDialog from "./components/ConfirmCredentialsDialog";

type DialogMode = 'closed' | 'add' | 'view' | 'edit' | 'confirm-edit' | 'confirm-delete';

const UserLoginPage = () => {
    const t = useTranslations("Menu");
    const [page, setPage] = useState(1);
    const perPage = 10;

    // Dialog states
    const [dialogMode, setDialogMode] = useState<DialogMode>('closed');
    const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
    const [pendingFormData, setPendingFormData] = useState<{
        username: string;
        email: string;
        passwordData: string;
        fullName: string;
        role: string;
        isActive: boolean;
    } | null>(null);

    // API hooks
    const { data, isLoading, error, refetch, isFetching } = useUserList(
        { page, perPage },
        true
    );

    const { data: userDetailData, isLoading: isLoadingDetail } = useUserById(
        selectedUser?.id ?? 0,
        dialogMode === 'view' || dialogMode === 'edit'
    );

    const { mutate: upsertUser, isPending: isUpserting } = useUpsertUser();
    const { mutate: deleteUserMutation, isPending: isDeleting } = useDeleteUser();

    const userList = data?.responseData ?? [];
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
        setSelectedUser(null);
        setPendingFormData(null);
        setDialogMode('add');
    };

    const openViewDialog = (user: UserItem) => {
        setSelectedUser(user);
        setDialogMode('view');
    };

    const openEditDialog = (user: UserItem) => {
        setSelectedUser(user);
        setPendingFormData(null);
        setDialogMode('edit');
    };

    const openDeleteDialog = (user: UserItem) => {
        setSelectedUser(user);
        setDialogMode('confirm-delete');
    };

    const closeDialog = () => {
        setDialogMode('closed');
        setSelectedUser(null);
        setPendingFormData(null);
    };

    // Form submission handlers
    const handleAddSubmit = (formData: typeof pendingFormData) => {
        if (!formData) return;
        setPendingFormData(formData);
        setDialogMode('confirm-edit');
    };

    const handleEditSubmit = (formData: typeof pendingFormData) => {
        if (!formData) return;
        setPendingFormData(formData);
        setDialogMode('confirm-edit');
    };

    const handleConfirmUpsert = (userName: string) => {
        if (!pendingFormData) return;

        const payload = {
            id: selectedUser?.id ?? 0,
            username: pendingFormData.username,
            email: pendingFormData.email,
            passwordData: pendingFormData.passwordData,
            fullName: pendingFormData.fullName,
            role: pendingFormData.role,
            isActive: pendingFormData.isActive,
            userName,
        };

        upsertUser(payload, {
            onSuccess: (response) => {
                if (response.message === 'success') {
                    toast.success(selectedUser ? 'User updated successfully!' : 'User added successfully!');
                    closeDialog();
                    refetch();
                } else {
                    toast.error(response.error || 'Failed to save user');
                }
            },
            onError: (err) => {
                toast.error(err.message || 'Failed to save user');
            },
        });
    };

    const handleConfirmDelete = (userName: string) => {
        if (!selectedUser) return;

        deleteUserMutation(
            { id: selectedUser.id, userName },
            {
                onSuccess: (response) => {
                    if (response.message === 'success') {
                        toast.success('User deleted successfully!');
                        closeDialog();
                        refetch();
                    } else {
                        toast.error(response.error || 'Failed to delete user');
                    }
                },
                onError: (err) => {
                    toast.error(err.message || 'Failed to delete user');
                },
            }
        );
    };

    // Get detail data for view/edit
    const detailUser = userDetailData?.responseData ?? selectedUser;

    return (
        <div>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{t("user-login")}</CardTitle>
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
                            Add User
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {error ? (
                        <div className="text-center py-8 text-destructive">
                            <p>Failed to load users: {error.message}</p>
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
                                        <TableHead className="w-[120px]">Username</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Full Name</TableHead>
                                        <TableHead className="w-[100px]">Role</TableHead>
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
                                                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-8 w-8 rounded mx-auto" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : userList.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                                No users found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        userList.map((user, index) => (
                                            <TableRow key={user.id}>
                                                <TableCell>{(page - 1) * perPage + index + 1}</TableCell>
                                                <TableCell className="font-medium">{user.username}</TableCell>
                                                <TableCell>{user.email || "-"}</TableCell>
                                                <TableCell>{user.fullName || "-"}</TableCell>
                                                <TableCell>
                                                    <Badge color="secondary" className="text-xs">
                                                        {user.roleObj?.name || "-"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge color={user.isActive ? "success" : "default"} className="text-xs">
                                                        {user.isActive ? "Active" : "Inactive"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {user.createdDate
                                                        ? new Date(user.createdDate).toLocaleDateString("en-GB", {
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
                                                            <DropdownMenuItem onClick={() => openViewDialog(user)}>
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                View
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                                                <Pencil className="h-4 w-4 mr-2" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => openDeleteDialog(user)}
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
                                    Showing {userList.length > 0 ? (page - 1) * perPage + 1 : 0} to{" "}
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
                    <UserFormDialog
                        mode="add"
                        onClose={closeDialog}
                        onSubmit={handleAddSubmit}
                    />
                </DialogContent>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={dialogMode === 'view'} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent className="max-w-lg">
                    <UserFormDialog
                        mode="view"
                        user={detailUser}
                        onClose={closeDialog}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={dialogMode === 'edit'} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent className="max-w-lg">
                    <UserFormDialog
                        mode="edit"
                        user={detailUser}
                        isPending={isLoadingDetail}
                        onClose={closeDialog}
                        onSubmit={handleEditSubmit}
                    />
                </DialogContent>
            </Dialog>

            {/* Confirm Edit/Add Dialog */}
            <Dialog open={dialogMode === 'confirm-edit'} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent className="max-w-lg">
                    <ConfirmCredentialsDialog
                        title={selectedUser ? "Confirm Edit User" : "Confirm Add User"}
                        description="Please enter your credentials to confirm this action."
                        onClose={closeDialog}
                        onConfirm={handleConfirmUpsert}
                    />
                </DialogContent>
            </Dialog>

            {/* Confirm Delete Dialog */}
            <Dialog open={dialogMode === 'confirm-delete'} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent className="max-w-lg">
                    <ConfirmCredentialsDialog
                        title="Confirm Delete User"
                        description={`Are you sure you want to delete "${selectedUser?.username}"? Please enter your credentials to confirm.`}
                        onClose={closeDialog}
                        onConfirm={handleConfirmDelete}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default UserLoginPage;
