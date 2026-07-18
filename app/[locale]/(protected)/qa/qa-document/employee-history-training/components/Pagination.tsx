"use client";

import { Button } from "@/components/ui/button";

interface PaginationProps {
  pageIndex: number;
  pageCount: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
}

export function Pagination({
  pageIndex,
  pageCount,
  totalItems,
  pageSize,
  onPageChange,
  onNextPage,
  onPrevPage,
}: PaginationProps) {
  
  const startItem = totalItems === 0 ? 0 : pageIndex * pageSize + 1;
  const endItem = Math.min((pageIndex + 1) * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
      <div className="text-sm text-slate-500">
        Showing {startItem} to {endItem} of {totalItems} entries
      </div>
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevPage}
          disabled={pageIndex === 0}
          className="text-slate-600 font-normal"
        >
          &lt; Previous
        </Button>
        <span className="text-sm text-slate-600">
          <strong>Page {pageIndex + 1}</strong> of {pageCount}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={pageIndex >= pageCount - 1}
          className="text-slate-600 font-normal"
        >
          Next &gt;
        </Button>
      </div>
    </div>
  );
}
