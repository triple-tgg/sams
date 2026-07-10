"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import {
    useIncomeRuleList,
    useUpsertIncomeRule,
    useDeleteIncomeRule,
} from "@/lib/api/hooks/useIncomeRuleOperations";
import type {
    IncomeRuleItem,
    ConditionType,
    ConditionOperator,
} from "@/lib/api/master/income-rules/income-rules.interface";
import { INCOME_RULE_CATEGORIES } from "@/lib/api/master/income-rules/income-rules.interface";
import {
    RefreshCw,
    Plus,
    MoreHorizontal,
    Eye,
    Pencil,
    Trash2,
    ListChecks,
    Calculator,
} from "lucide-react";
import { toast } from "sonner";

import RuleFormDialog from "./components/RuleFormDialog";
import CalculationPreview from "./components/CalculationPreview";

type DialogMode = "closed" | "add" | "view" | "edit";

export default function StaffIncomePage() {
    const t = useTranslations("Menu");

    const [dialogMode, setDialogMode] = useState<DialogMode>("closed");
    const [selectedRule, setSelectedRule] = useState<IncomeRuleItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<IncomeRuleItem | null>(null);

    // Data
    const { data, isLoading, error, refetch, isFetching } = useIncomeRuleList();
    const { mutate: upsertRule, isPending: isUpserting } = useUpsertIncomeRule();
    const { mutate: deleteRuleMutation, isPending: isDeleting } = useDeleteIncomeRule();

    const ruleList = data?.responseData ?? [];

    // ── Handlers ──
    const closeDialog = useCallback(() => {
        setDialogMode("closed");
        setSelectedRule(null);
    }, []);

    const openAdd = useCallback(() => {
        setSelectedRule(null);
        setDialogMode("add");
    }, []);

    const openView = useCallback((rule: IncomeRuleItem) => {
        setSelectedRule(rule);
        setDialogMode("view");
    }, []);

    const openEdit = useCallback((rule: IncomeRuleItem) => {
        setSelectedRule(rule);
        setDialogMode("edit");
    }, []);

    const openDelete = useCallback((rule: IncomeRuleItem) => {
        setDeleteTarget(rule);
    }, []);

    const handleSubmit = useCallback(
        (formData: {
            itemName: string;
            category: string;
            conditionType: ConditionType;
            conditionOperator?: ConditionOperator;
            conditionValue?: number;
            amount: number;
            applyProRate: boolean;
            proRateBaseDays: number;
            isActive: boolean;
            sortOrder: number;
        }) => {
            const payload = {
                id: dialogMode === "edit" && selectedRule ? selectedRule.id : 0,
                ...formData,
                userName: "current_user", // TODO: Replace with actual user
            };

            upsertRule(payload, {
                onSuccess: (response) => {
                    if (response.message === "success") {
                        toast.success(
                            dialogMode === "add"
                                ? "Rule created successfully!"
                                : "Rule updated successfully!"
                        );
                        closeDialog();
                        refetch();
                    } else {
                        toast.error(response.error || "Failed to save rule");
                    }
                },
                onError: (err) => {
                    toast.error(err.message || "Failed to save rule");
                },
            });
        },
        [dialogMode, selectedRule, upsertRule, closeDialog, refetch]
    );

    const handleDelete = useCallback(() => {
        if (!deleteTarget) return;
        deleteRuleMutation(
            { id: deleteTarget.id, userName: "current_user" },
            {
                onSuccess: (response) => {
                    if (response.message === "success") {
                        toast.success("Rule deleted successfully!");
                        setDeleteTarget(null);
                        refetch();
                    } else {
                        toast.error(response.error || "Failed to delete rule");
                    }
                },
                onError: (err) => {
                    toast.error(err.message || "Failed to delete rule");
                },
            }
        );
    }, [deleteTarget, deleteRuleMutation, refetch]);

    // ── Helpers ──
    const getCategoryLabel = (val: string) =>
        INCOME_RULE_CATEGORIES.find((c) => c.value === val)?.label ?? val;

    const formatCondition = (rule: IncomeRuleItem) => {
        if (rule.conditionType === "none") return "–";
        const op = rule.conditionOperator ?? "=";
        const val = rule.conditionValue ?? 0;
        return `${op} ${val}`;
    };

    const formatCurrency = (val: number) =>
        val.toLocaleString("th-TH", { minimumFractionDigits: 0 });

    return (
        <div>
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle>{t("Staff Income")}</CardTitle>
                            <CardDescription>
                                Income rule management and calculation preview
                                <span className="inline-flex items-center gap-1 ml-3 text-xs text-muted-foreground/70">
                                    <RefreshCw className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`} />
                                    {ruleList.length} rule{ruleList.length !== 1 ? "s" : ""} configured
                                </span>
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => refetch()}
                                disabled={isFetching}
                            >
                                <RefreshCw
                                    className={`h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}`}
                                />
                                Refresh
                            </Button>
                            <Button size="sm" onClick={openAdd}>
                                <Plus className="h-4 w-4 mr-1" />
                                Add Rule
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pt-0">
                    <Tabs defaultValue="rules">
                        <TabsList className="mb-4 border-b border-border rounded-none p-0 gap-0 w-full justify-start">
                            <TabsTrigger
                                value="rules"
                                className="flex items-center gap-2 px-4 py-2.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent text-muted-foreground"
                            >
                                <ListChecks className="w-4 h-4" />
                                Income Rules
                            </TabsTrigger>
                            <TabsTrigger
                                value="preview"
                                className="flex items-center gap-2 px-4 py-2.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent text-muted-foreground"
                            >
                                <Calculator className="w-4 h-4" />
                                Calculation Preview
                            </TabsTrigger>
                        </TabsList>

                        {/* ═══ Tab 1: Income Rules ═══ */}
                        <TabsContent value="rules" className="mt-0">
                            {error && (
                                <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                                    Failed to load rules: {error.message}
                                </div>
                            )}

                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">#</TableHead>
                                            <TableHead>Item Name</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead className="text-center">Condition</TableHead>
                                            <TableHead className="text-right">Amount (฿)</TableHead>
                                            <TableHead className="text-center">Pro Rate</TableHead>
                                            <TableHead className="text-center">Status</TableHead>
                                            <TableHead className="w-16 text-center">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            Array.from({ length: 3 }).map((_, i) => (
                                                <TableRow key={`skel-${i}`}>
                                                    {Array.from({ length: 8 }).map((_, j) => (
                                                        <TableCell key={j}>
                                                            <Skeleton className="h-5 w-full" />
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))
                                        ) : ruleList.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={8}
                                                    className="h-24 text-center text-muted-foreground"
                                                >
                                                    No income rules found. Click &quot;Add Rule&quot; to create
                                                    one.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            ruleList.map((rule, index) => (
                                                <TableRow key={rule.id}>
                                                    <TableCell className="text-muted-foreground">
                                                        {index + 1}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {rule.itemName}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className="bg-transparent border text-foreground">
                                                            {getCategoryLabel(rule.category)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center font-mono text-sm">
                                                        {formatCondition(rule)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono">
                                                        {formatCurrency(rule.amount)}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {rule.applyProRate ? (
                                                            <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/30 text-xs">
                                                                ÷{rule.proRateBaseDays}d
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-muted-foreground">–</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {rule.isActive ? (
                                                            <Badge className="bg-green-500/15 text-green-600 border-green-500/30">
                                                                Active
                                                            </Badge>
                                                        ) : (
                                                            <Badge color="secondary">Inactive</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
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
                                                                    onClick={() => openView(rule)}
                                                                >
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    View
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => openEdit(rule)}
                                                                >
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => openDelete(rule)}
                                                                    className="text-destructive focus:text-destructive"
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
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
                        </TabsContent>

                        {/* ═══ Tab 2: Calculation Preview ═══ */}
                        <TabsContent value="preview" className="mt-0">
                            <CalculationPreview rules={ruleList} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* ═══ Rule Form Dialog ═══ */}
            <Dialog
                open={dialogMode !== "closed"}
                onOpenChange={(open) => {
                    if (!open) closeDialog();
                }}
            >
                <DialogContent className="sm:max-w-[560px]">
                    {dialogMode !== "closed" && (
                        <RuleFormDialog
                            mode={dialogMode}
                            rule={selectedRule}
                            isPending={isUpserting}
                            onClose={closeDialog}
                            onSubmit={handleSubmit}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* ═══ Delete Confirmation ═══ */}
            <AlertDialog
                open={!!deleteTarget}
                onOpenChange={(open) => {
                    if (!open) setDeleteTarget(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Income Rule</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete{" "}
                            <strong>{deleteTarget?.itemName}</strong>? This action cannot be
                            undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
