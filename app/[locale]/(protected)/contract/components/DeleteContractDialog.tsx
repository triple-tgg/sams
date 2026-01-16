"use client";

import React, { useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface DeleteContractDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    contractId: number;
    contractNo: string;
    onConfirm: (userName: string) => Promise<void>;
    isDeleting?: boolean;
}

export const DeleteContractDialog = ({
    open,
    onOpenChange,
    contractId,
    contractNo,
    onConfirm,
    isDeleting = false,
}: DeleteContractDialogProps) => {
    const [userName, setUserName] = useState("");
    const [error, setError] = useState("");

    const handleClose = () => {
        setUserName("");
        setError("");
        onOpenChange(false);
    };

    const handleConfirm = async () => {
        // Validate userName
        if (!userName.trim()) {
            setError("Please enter your username to confirm deletion");
            return;
        }

        setError("");

        try {
            await onConfirm(userName.trim());
            toast.success("Contract deleted successfully", {
                position: "top-right",
            });
            handleClose();
        } catch (err) {
            toast.error("Failed to delete contract", {
                position: "top-right",
            });
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Contract</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete contract <strong>{contractNo}</strong>?
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="py-4 space-y-2">
                    <Label htmlFor="userName">
                        Username <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="userName"
                        placeholder="Enter your username to confirm"
                        value={userName}
                        onChange={(e) => {
                            setUserName(e.target.value);
                            if (error) setError("");
                        }}
                        disabled={isDeleting}
                    />
                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleClose} disabled={isDeleting}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        className={`bg-destructive hover:bg-destructive/90 ${isDeleting ? "pointer-events-none" : ""}`}
                        onClick={(e) => {
                            e.preventDefault();
                            handleConfirm();
                        }}
                        disabled={isDeleting}
                    >
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default DeleteContractDialog;
