"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import type {
    IncomeRuleItem,
    ConditionType,
    ConditionOperator,
} from "@/lib/api/master/income-rules/income-rules.interface";
import {
    INCOME_RULE_CATEGORIES,
    CONDITION_OPERATOR_LABELS,
} from "@/lib/api/master/income-rules/income-rules.interface";

type Props = {
    mode: "add" | "edit" | "view";
    rule?: IncomeRuleItem | null;
    isPending?: boolean;
    onClose: () => void;
    onSubmit?: (data: {
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
    }) => void;
};

const RuleFormDialog = ({
    mode,
    rule,
    isPending = false,
    onClose,
    onSubmit,
}: Props) => {
    const [itemName, setItemName] = useState("");
    const [category, setCategory] = useState("");
    const [conditionType, setConditionType] = useState<ConditionType>("none");
    const [conditionOperator, setConditionOperator] = useState<ConditionOperator>("=");
    const [conditionValue, setConditionValue] = useState<number | "">("");
    const [amount, setAmount] = useState<number | "">("");
    const [applyProRate, setApplyProRate] = useState(false);
    const [proRateBaseDays, setProRateBaseDays] = useState(30);
    const [isActive, setIsActive] = useState(true);
    const [sortOrder, setSortOrder] = useState(1);

    const isViewMode = mode === "view";
    const dialogTitle =
        mode === "add"
            ? "Add Income Rule"
            : mode === "edit"
                ? "Edit Income Rule"
                : "View Income Rule";

    useEffect(() => {
        if (rule) {
            setItemName(rule.itemName || "");
            setCategory(rule.category || "");
            setConditionType(rule.conditionType || "none");
            setConditionOperator(rule.conditionOperator || "=");
            setConditionValue(rule.conditionValue ?? "");
            setAmount(rule.amount ?? "");
            setApplyProRate(rule.applyProRate ?? false);
            setProRateBaseDays(rule.proRateBaseDays ?? 30);
            setIsActive(rule.isActive ?? true);
            setSortOrder(rule.sortOrder ?? 1);
        } else {
            // Reset for add mode
            setItemName("");
            setCategory("");
            setConditionType("none");
            setConditionOperator("=");
            setConditionValue("");
            setAmount("");
            setApplyProRate(false);
            setProRateBaseDays(30);
            setIsActive(true);
            setSortOrder(1);
        }
    }, [rule]);

    const handleSubmit = () => {
        if (!itemName.trim() || !category || amount === "") return;
        onSubmit?.({
            itemName: itemName.trim(),
            category,
            conditionType,
            conditionOperator: conditionType !== "none" ? conditionOperator : undefined,
            conditionValue:
                conditionType !== "none" && conditionValue !== ""
                    ? Number(conditionValue)
                    : undefined,
            amount: Number(amount),
            applyProRate,
            proRateBaseDays,
            isActive,
            sortOrder,
        });
    };

    const hasCondition = conditionType !== "none";

    return (
        <>
            <DialogHeader>
                <DialogTitle>{dialogTitle}</DialogTitle>
                <DialogDescription>
                    {mode === "add"
                        ? "Define a new income calculation rule."
                        : mode === "edit"
                            ? "Modify the income rule settings."
                            : "Income rule details."}
                </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
                {/* Row 1: Item Name + Category */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="rule-item-name">
                            Item Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="rule-item-name"
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                            placeholder="e.g. License, Type Rating"
                            disabled={isViewMode}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="rule-category">
                            Category <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={category}
                            onValueChange={setCategory}
                            disabled={isViewMode}
                        >
                            <SelectTrigger id="rule-category" className="w-full">
                                <SelectValue placeholder="Select category..." />
                            </SelectTrigger>
                            <SelectContent>
                                {INCOME_RULE_CATEGORIES.map((cat) => (
                                    <SelectItem key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Row 2: Condition Type + Operator + Value */}
                <div className="space-y-2">
                    <Label>Condition</Label>
                    <div className="grid grid-cols-3 gap-3">
                        <Select
                            value={conditionType}
                            onValueChange={(v) => setConditionType(v as ConditionType)}
                            disabled={isViewMode}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Type..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None (Always)</SelectItem>
                                <SelectItem value="exact">Exact Match</SelectItem>
                                <SelectItem value="range">Range / Compare</SelectItem>
                            </SelectContent>
                        </Select>

                        {hasCondition && (
                            <>
                                <Select
                                    value={conditionOperator}
                                    onValueChange={(v) =>
                                        setConditionOperator(v as ConditionOperator)
                                    }
                                    disabled={isViewMode}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Operator..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(CONDITION_OPERATOR_LABELS).map(
                                            ([op, label]) => (
                                                <SelectItem key={op} value={op}>
                                                    {label}
                                                </SelectItem>
                                            )
                                        )}
                                    </SelectContent>
                                </Select>

                                <Input
                                    type="number"
                                    min={0}
                                    value={conditionValue}
                                    onChange={(e) =>
                                        setConditionValue(
                                            e.target.value === "" ? "" : Number(e.target.value)
                                        )
                                    }
                                    placeholder="Value"
                                    disabled={isViewMode}
                                />
                            </>
                        )}
                    </div>
                </div>

                {/* Row 3: Amount + Sort Order */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="rule-amount">
                            Amount (฿) <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="rule-amount"
                            type="number"
                            min={0}
                            value={amount}
                            onChange={(e) =>
                                setAmount(e.target.value === "" ? "" : Number(e.target.value))
                            }
                            placeholder="0"
                            disabled={isViewMode}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="rule-sort-order">Sort Order</Label>
                        <Input
                            id="rule-sort-order"
                            type="number"
                            min={1}
                            value={sortOrder}
                            onChange={(e) => setSortOrder(Number(e.target.value) || 1)}
                            disabled={isViewMode}
                        />
                    </div>
                </div>

                {/* Row 4: Pro Rate toggle */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="rule-pro-rate" className="text-sm font-medium">
                            Apply Pro Rate
                        </Label>
                        <p className="text-xs text-muted-foreground">
                            Calculate proportionally: amount ÷ base days × valid days
                        </p>
                    </div>
                    <Switch
                        id="rule-pro-rate"
                        checked={applyProRate}
                        onCheckedChange={setApplyProRate}
                        disabled={isViewMode}
                    />
                </div>

                {applyProRate && (
                    <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                        <Label htmlFor="rule-base-days">Pro Rate Base Days</Label>
                        <Input
                            id="rule-base-days"
                            type="number"
                            min={1}
                            value={proRateBaseDays}
                            onChange={(e) => setProRateBaseDays(Number(e.target.value) || 30)}
                            disabled={isViewMode}
                            className="w-32"
                        />
                    </div>
                )}

                {/* Row 5: Active toggle */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="rule-active" className="text-sm font-medium">
                            Active
                        </Label>
                        <p className="text-xs text-muted-foreground">
                            Inactive rules are excluded from calculations
                        </p>
                    </div>
                    <Switch
                        id="rule-active"
                        checked={isActive}
                        onCheckedChange={setIsActive}
                        disabled={isViewMode}
                    />
                </div>
            </div>

            {/* Footer actions */}
            <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={onClose} disabled={isPending}>
                    {isViewMode ? "Close" : "Cancel"}
                </Button>
                {!isViewMode && (
                    <Button onClick={handleSubmit} disabled={isPending || !itemName.trim() || !category || amount === ""}>
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : mode === "add" ? (
                            "Create Rule"
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                )}
            </div>
        </>
    );
};

export default RuleFormDialog;
