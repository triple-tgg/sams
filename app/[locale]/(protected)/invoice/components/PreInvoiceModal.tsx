"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMapContractsV2 } from "@/lib/api/contract/mappingContractsV2.hooks";

interface PreInvoiceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    lineMaintenanceIds: number[];
}

export function PreInvoiceModal({ open, onOpenChange, lineMaintenanceIds }: PreInvoiceModalProps) {
    const [currencyType, setCurrencyType] = useState("THB");
    const [currencyRate, setCurrencyRate] = useState("35");

    const mapContractsMutation = useMapContractsV2();

    const handleSubmit = async () => {
        if (!lineMaintenanceIds.length) return;
        
        await mapContractsMutation.mutateAsync({
            curencyType: currencyType,
            curencyRate: Number(currencyRate) || 0,
            lineMaintenanceIdLiist: lineMaintenanceIds,
        });
        
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Pre-Invoice</DialogTitle>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="currencyType" className="text-right">
                            Currency
                        </Label>
                        <div className="col-span-3">
                            <Select value={currencyType} onValueChange={setCurrencyType}>
                                <SelectTrigger id="currencyType">
                                    <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="THB">THB</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="currencyRate" className="text-right">
                            Rate
                        </Label>
                        <Input
                            id="currencyRate"
                            type="number"
                            value={currencyRate}
                            onChange={(e) => setCurrencyRate(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    
                </div>
                
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={mapContractsMutation.isPending || !currencyRate || lineMaintenanceIds.length === 0}
                    >
                        {mapContractsMutation.isPending ? "Processing..." : "Confirm"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
