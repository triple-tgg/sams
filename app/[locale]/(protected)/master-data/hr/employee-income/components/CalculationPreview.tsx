"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Calculator, Play, RotateCcw, CheckCircle2, XCircle } from "lucide-react";
import type { IncomeRuleItem } from "@/lib/api/master/income-rules/income-rules.interface";

type Props = {
    rules: IncomeRuleItem[];
};

type ValidStatus = "valid" | "partial" | "invalid";

interface CalculationResult {
    rule: IncomeRuleItem;
    conditionMet: boolean;
    baseAmount: number;
    proRateApplied: boolean;
    proRateLabel: string;
    finalAmount: number;
}

/**
 * Check whether a condition-based rule matches the given number of ratings
 */
function evaluateCondition(rule: IncomeRuleItem, numberOfRatings: number): boolean {
    if (rule.conditionType === "none") return true;

    const val = rule.conditionValue ?? 0;
    const op = rule.conditionOperator ?? "=";

    switch (op) {
        case "=":
            return numberOfRatings === val;
        case ">=":
            return numberOfRatings >= val;
        case "<=":
            return numberOfRatings <= val;
        case ">":
            return numberOfRatings > val;
        case "<":
            return numberOfRatings < val;
        default:
            return false;
    }
}

/**
 * For rules in the same category, pick the best-matching one.
 * E.g. Type Rating: if numberOfRatings=3, prefer ">=2" over "=1".
 * Strategy: among matching rules in a category, pick the one with highest conditionValue.
 */
function selectBestMatchPerCategory(
    rules: IncomeRuleItem[],
    numberOfRatings: number
): IncomeRuleItem[] {
    const byCategory = new Map<string, IncomeRuleItem[]>();
    for (const r of rules) {
        const list = byCategory.get(r.category) || [];
        list.push(r);
        byCategory.set(r.category, list);
    }

    const selected: IncomeRuleItem[] = [];
    for (const [, categoryRules] of byCategory) {
        // If all rules in this category have conditionType=none, include all
        const allNone = categoryRules.every((r) => r.conditionType === "none");
        if (allNone) {
            selected.push(...categoryRules);
            continue;
        }

        // Otherwise pick the best matching one
        const matching = categoryRules.filter((r) =>
            evaluateCondition(r, numberOfRatings)
        );
        if (matching.length === 0) continue;

        // Among matches, pick the one with highest conditionValue (most specific)
        matching.sort((a, b) => (b.conditionValue ?? 0) - (a.conditionValue ?? 0));
        selected.push(matching[0]);
    }

    return selected;
}

const CalculationPreview = ({ rules }: Props) => {
    const [validStatus, setValidStatus] = useState<ValidStatus>("valid");
    const [hasAssignment, setHasAssignment] = useState(true);
    const [numberOfRatings, setNumberOfRatings] = useState(1);
    const [validDays, setValidDays] = useState(30);
    const [calculated, setCalculated] = useState(false);

    const activeRules = useMemo(
        () => rules.filter((r) => r.isActive),
        [rules]
    );

    const results = useMemo((): CalculationResult[] => {
        if (!calculated) return [];

        // Step 1: Valid check
        if (validStatus === "invalid") {
            return activeRules.map((rule) => ({
                rule,
                conditionMet: false,
                baseAmount: rule.amount,
                proRateApplied: false,
                proRateLabel: "–",
                finalAmount: 0,
            }));
        }

        // Step 2: Assignment (THF) check
        if (!hasAssignment) {
            return activeRules.map((rule) => ({
                rule,
                conditionMet: false,
                baseAmount: rule.amount,
                proRateApplied: false,
                proRateLabel: "–",
                finalAmount: 0,
            }));
        }

        // Step 3: Select best matching rules per category
        const selectedRules = selectBestMatchPerCategory(activeRules, numberOfRatings);
        const isPartial = validStatus === "partial";

        return activeRules.map((rule) => {
            const isSelected = selectedRules.some((s) => s.id === rule.id);

            if (!isSelected) {
                return {
                    rule,
                    conditionMet: false,
                    baseAmount: rule.amount,
                    proRateApplied: false,
                    proRateLabel: "–",
                    finalAmount: 0,
                };
            }

            let finalAmount = rule.amount;
            let proRateApplied = false;
            let proRateLabel = "–";

            // Partial → always pro rate
            if (isPartial) {
                const baseDays = rule.proRateBaseDays || 30;
                finalAmount = Math.round((rule.amount / baseDays) * validDays);
                proRateApplied = true;
                proRateLabel = `${validDays}/${baseDays}`;
            } else if (rule.applyProRate) {
                // Full valid but rule has pro-rate enabled
                const baseDays = rule.proRateBaseDays || 30;
                finalAmount = Math.round((rule.amount / baseDays) * validDays);
                proRateApplied = true;
                proRateLabel = `${validDays}/${baseDays}`;
            }

            return {
                rule,
                conditionMet: true,
                baseAmount: rule.amount,
                proRateApplied,
                proRateLabel,
                finalAmount,
            };
        });
    }, [calculated, validStatus, hasAssignment, numberOfRatings, validDays, activeRules]);

    const totalAmount = results.reduce((sum, r) => sum + r.finalAmount, 0);

    const handleCalculate = () => setCalculated(true);
    const handleReset = () => {
        setCalculated(false);
        setValidStatus("valid");
        setHasAssignment(true);
        setNumberOfRatings(1);
        setValidDays(20);
    };

    const formatCurrency = (val: number) =>
        val.toLocaleString("th-TH", { minimumFractionDigits: 0 });

    return (
        <div className="space-y-6">
            {/* Input Parameters */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        Simulation Parameters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Valid Status */}
                        <div className="space-y-2">
                            <Label>License Status</Label>
                            <Select
                                value={validStatus}
                                onValueChange={(v) => {
                                    setValidStatus(v as ValidStatus);
                                    setCalculated(false);
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="valid">
                                        <span className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-green-500" />
                                            Valid
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="partial">
                                        <span className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-yellow-500" />
                                            Partial
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="invalid">
                                        <span className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-red-500" />
                                            Invalid
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Assignment (THF) */}
                        <div className="space-y-2">
                            <Label>Has Assignment (THF)</Label>
                            <div className="flex items-center h-10 gap-3">
                                <Switch
                                    checked={hasAssignment}
                                    onCheckedChange={(v) => {
                                        setHasAssignment(v);
                                        setCalculated(false);
                                    }}
                                    disabled={validStatus === "invalid"}
                                />
                                <span className="text-sm text-muted-foreground">
                                    {hasAssignment ? "Yes" : "No"}
                                </span>
                            </div>
                        </div>

                        {/* Number of Ratings */}
                        <div className="space-y-2">
                            <Label>Number of Aircraft Ratings</Label>
                            <Input
                                type="number"
                                min={0}
                                value={numberOfRatings}
                                onChange={(e) => {
                                    setNumberOfRatings(Number(e.target.value) || 0);
                                    setCalculated(false);
                                }}
                                disabled={validStatus === "invalid" || !hasAssignment}
                            />
                        </div>

                        {/* Valid Days (only for partial) */}
                        <div className="space-y-2">
                            <Label>
                                Valid Days
                                {validStatus !== "partial" && (
                                    <span className="text-xs text-muted-foreground ml-1">
                                        (Partial only)
                                    </span>
                                )}
                            </Label>
                            <Input
                                type="number"
                                min={0}
                                max={30}
                                value={validDays}
                                onChange={(e) => {
                                    setValidDays(Number(e.target.value) || 0);
                                    setCalculated(false);
                                }}
                                disabled={validStatus !== "partial"}
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4 pt-4 border-t">
                        <Button onClick={handleCalculate} className="gap-2">
                            <Play className="h-4 w-4" />
                            Calculate
                        </Button>
                        <Button variant="outline" onClick={handleReset} className="gap-2">
                            <RotateCcw className="h-4 w-4" />
                            Reset
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Results */}
            {calculated && (
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Calculation Breakdown</CardTitle>
                            {validStatus === "invalid" && (
                                <Badge color="destructive">No Additional — Invalid</Badge>
                            )}
                            {validStatus !== "invalid" && !hasAssignment && (
                                <Badge color="destructive">No Additional — No Assignment</Badge>
                            )}
                            {validStatus === "partial" && hasAssignment && (
                                <Badge className="bg-yellow-500/15 text-yellow-600 border-yellow-500/30">
                                    Partial — Pro Rate Applied
                                </Badge>
                            )}
                            {validStatus === "valid" && hasAssignment && (
                                <Badge className="bg-green-500/15 text-green-600 border-green-500/30">
                                    Full Valid
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead className="text-center">Condition Met</TableHead>
                                        <TableHead className="text-right">Base Amount</TableHead>
                                        <TableHead className="text-center">Pro Rate</TableHead>
                                        <TableHead className="text-right">Final Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {results.map((r) => (
                                        <TableRow
                                            key={r.rule.id}
                                            className={
                                                !r.conditionMet ? "opacity-50" : ""
                                            }
                                        >
                                            <TableCell className="font-medium">
                                                {r.rule.itemName}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {r.conditionMet ? (
                                                    <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                                                ) : (
                                                    <XCircle className="h-4 w-4 text-red-400 mx-auto" />
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {formatCurrency(r.baseAmount)}
                                            </TableCell>
                                            <TableCell className="text-center text-sm text-muted-foreground">
                                                {r.proRateApplied ? (
                                                    <Badge className="text-xs bg-blue-500/15 text-blue-600 border-blue-500/30">
                                                        {r.proRateLabel}
                                                    </Badge>
                                                ) : (
                                                    "–"
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-semibold">
                                                {r.conditionMet
                                                    ? `฿${formatCurrency(r.finalAmount)}`
                                                    : "–"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {/* Total row */}
                                    <TableRow className="bg-muted/50 font-bold">
                                        <TableCell colSpan={4} className="text-right">
                                            Total Additional Income
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-primary">
                                            ฿{formatCurrency(totalAmount)}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>

                        {/* Decision path explanation */}
                        <div className="mt-4 p-3 rounded-lg bg-muted/30 text-sm text-muted-foreground">
                            <strong>Decision Path:</strong>{" "}
                            {validStatus === "invalid" && "Valid Check → NO → No Additional Pay"}
                            {validStatus !== "invalid" && !hasAssignment &&
                                "Valid Check → YES → Assignment (THF) → NO → No Additional Pay"}
                            {validStatus === "valid" &&
                                hasAssignment &&
                                `Valid Check → YES → Assignment → YES → ${numberOfRatings} Rating(s) → Additional Pay`}
                            {validStatus === "partial" &&
                                hasAssignment &&
                                `Valid Check → Partial → Assignment → YES → ${numberOfRatings} Rating(s) → Pro Rate (÷30 × ${validDays} days)`}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Empty state */}
            {!calculated && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Calculator className="h-12 w-12 text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground">
                            Set the parameters above and click <strong>Calculate</strong> to see the
                            income breakdown.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default CalculationPreview;
