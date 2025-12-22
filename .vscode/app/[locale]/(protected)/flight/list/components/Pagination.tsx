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
    <div className="flex items-center justify-end py-4 px-10">
      {/* Left side: Go to page */}
      <div className="flex-1 flex items-center gap-3">
        <div className="flex gap-2 items-center">
          <div className="text-sm font-medium text-muted-foreground">Go</div>
          <Input
            type="number"
            className="w-16 px-2"
            value={pageIndex + 1}
            onChange={handleInputChange}
          />
        </div>
        <div className="text-sm font-medium text-muted-foreground">
          Page {pageIndex + 1} of {pageCount}
        </div>
      </div>

      {/* Right side: Pagination buttons */}
      <div className="flex items-center gap-2 flex-none">
        <Button
          variant="outline"
          size="icon"
          onClick={onPrevPage}
          disabled={pageIndex === 0}
          className="w-8 h-8"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* First page */}
        {visiblePages[0] > 0 && (
          <>
            <Button
              onClick={() => onPageChange(0)}
              size="icon"
              className={`w-8 h-8 ${pageIndex === 0
                  ? "bg-primary text-white"
                  : "bg-muted text-foreground hover:bg-muted/80"
                }`}
            >
              1
            </Button>
            {visiblePages[0] > 1 && <span className="text-muted-foreground">…</span>}
          </>
        )}

        {/* Middle pages */}
        {visiblePages.map((i) => (
          <Button
            key={`page-${i}`}
            onClick={() => onPageChange(i)}
            size="icon"
            className={`w-8 h-8 ${pageIndex === i
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
              <span className="text-muted-foreground">…</span>
            )}
            <Button
              onClick={() => onPageChange(pageCount - 1)}
              size="icon"
              className={`w-8 h-8 ${pageIndex === pageCount - 1
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
          className="w-8 h-8"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
