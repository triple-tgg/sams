"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, X, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StaffOption } from "@/lib/api/master/manager-mapping/managerMapping.interface";

interface Props {
  staffList: StaffOption[];
  /** Staff IDs already mapped to other departments */
  excludeIds?: Set<number>;
  onClose: () => void;
  onSelect: (staff: StaffOption) => void;
}

const StaffPickerDialog = ({
  staffList,
  excludeIds = new Set(),
  onClose,
  onSelect,
}: Props) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const available = staffList.filter((s) => !excludeIds.has(s.id));
    if (!search.trim()) return available;
    const lower = search.toLowerCase();
    return available.filter(
      (s) =>
        s.employeeId.toLowerCase().includes(lower) ||
        s.fullNameEn.toLowerCase().includes(lower) ||
        s.fullNameTh.includes(lower)
    );
  }, [staffList, excludeIds, search]);

  return (
    <div className="w-full">
      <DialogHeader>
        <DialogTitle>Select Manager</DialogTitle>
        <DialogDescription>
          Search and select an employee to assign as department manager.
        </DialogDescription>
      </DialogHeader>

      {/* Search */}
      <div className="relative mt-4 mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search by Employee ID or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 pl-8 pr-8 text-sm active:border-primary/50 focus:border-primary/50"
          autoFocus
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Staff table */}
      <div className="rounded-lg border max-h-[400px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[110px]">Employee ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Position</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-muted-foreground text-sm"
                >
                  {search ? "No matching employees found" : "No available employees"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((staff) => (
                <TableRow
                  key={staff.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onSelect(staff)}
                >
                  <TableCell>
                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                      {staff.employeeId}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{staff.fullNameEn}</p>
                      <p className="text-xs text-muted-foreground">
                        {staff.fullNameTh}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {staff.position}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      <UserCheck className="h-3.5 w-3.5 mr-1" />
                      Select
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-xs text-muted-foreground">
          {filtered.length} employee{filtered.length !== 1 ? "s" : ""} available
        </span>
        <Button variant="outline" color="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default StaffPickerDialog;
