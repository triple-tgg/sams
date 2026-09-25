"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  pageIndex: number;
  pageCount: number;
  onPageChange: (pageIndex: number) => void;
  onNextPage?: () => void;
  onPrevPage?: () => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  pageIndex,
  pageCount,
  onPageChange,
  onNextPage,
  onPrevPage,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? Number(e.target.value) - 1 : 0;
    if (value >= 0 && value < pageCount) {
      onPageChange(value);
    }
  };

  // 📌 แสดง 3 ปุ่มรอบปัจจุบัน
  const getVisiblePages = () => {
    const pages: number[] = [];
    const start = Math.max(0, pageIndex - 1);
    const end = Math.min(pageCount - 1, pageIndex + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3 px-4 sm:px-6 border-t border-slate-100 dark:border-slate-800">
      {/* Left side: Go to page */}
      <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-3">
        <div className="flex gap-2 items-center">
          <div className="text-xs sm:text-sm font-medium text-muted-foreground">Go</div>
          <Input
            type="number"
            className="w-14 sm:w-16 h-8 text-xs sm:text-sm px-2"
            value={pageIndex + 1}
            onChange={handleInputChange}
          />
        </div>
        <div className="text-xs sm:text-sm font-medium text-muted-foreground">
          Page {pageIndex + 1} of {pageCount}
        </div>
      </div>

      {/* Right side: Pagination buttons */}
      <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center sm:justify-end">
        <Button
          variant="outline"
          size="icon"
          onClick={onPrevPage}
          disabled={pageIndex === 0}
          className="w-7 h-7 sm:w-8 sm:h-8"
        >
          <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </Button>

        {/* First page */}
        {visiblePages[0] > 0 && (
          <>
            <Button
              onClick={() => onPageChange(0)}
              size="icon"
              className={`w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm ${pageIndex === 0
                  ? "bg-primary text-white"
                  : "bg-muted text-foreground hover:bg-muted/80"
                }`}
            >
              1
            </Button>
            {visiblePages[0] > 1 && <span className="text-muted-foreground text-xs sm:text-sm">…</span>}
          </>
        )}

        {/* Middle pages */}
        {visiblePages.map((i) => (
          <Button
            key={`page-${i}`}
            onClick={() => onPageChange(i)}
            size="icon"
            className={`w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm ${pageIndex === i
                ? "bg-primary text-white"
                : "bg-muted text-foreground hover:bg-muted/80"
              }`}
          >
            {i + 1}
          </Button>
        ))}

        {/* Last page */}
        {visiblePages[visiblePages.length - 1] < pageCount - 1 && (
          <>
            {visiblePages[visiblePages.length - 1] < pageCount - 2 && (
              <span className="text-muted-foreground text-xs sm:text-sm">…</span>
            )}
            <Button
              onClick={() => onPageChange(pageCount - 1)}
              size="icon"
              className={`w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm ${pageIndex === pageCount - 1
                  ? "bg-primary text-white"
                  : "bg-muted text-foreground hover:bg-muted/80"
                }`}
            >
              {pageCount}
            </Button>
          </>
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={onNextPage}
          disabled={pageIndex >= pageCount - 1}
          className="w-7 h-7 sm:w-8 sm:h-8"
        >
          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </Button>
      </div>
    </div>
  );
};
