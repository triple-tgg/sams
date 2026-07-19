"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface PaginationProps {
  pageIndex: number;
  pageCount: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onNextPage?: () => void;
  onPrevPage?: () => void;
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

  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    if (pageCount <= 7) {
      for (let i = 1; i <= pageCount; i++) pageNumbers.push(i);
    } else {
      if (pageIndex + 1 <= 4) {
        pageNumbers.push(1, 2, 3, 4, 5, "ellipsis", pageCount);
      } else if (pageIndex + 1 >= pageCount - 3) {
        pageNumbers.push(1, "ellipsis", pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount);
      } else {
        pageNumbers.push(1, "ellipsis", pageIndex, pageIndex + 1, pageIndex + 2, "ellipsis", pageCount);
      }
    }
    return pageNumbers;
  };

  const handlePrev = () => {
    if (onPrevPage) onPrevPage();
    else onPageChange(Math.max(0, pageIndex - 1));
  };

  const handleNext = () => {
    if (onNextPage) onNextPage();
    else onPageChange(Math.min(pageCount - 1, pageIndex + 1));
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
      <div className="text-sm text-slate-500 font-medium">
        Showing <span className="font-bold text-slate-700">{startItem}</span> to <span className="font-bold text-slate-700">{endItem}</span> of <span className="font-bold text-slate-700">{totalItems}</span> entries
      </div>
      <div className="flex items-center space-x-1.5">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrev}
          disabled={pageIndex === 0}
          className="text-slate-600 h-9 w-9 border-slate-200 hover:bg-slate-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {getPageNumbers().map((page, index) => {
          if (page === "ellipsis") {
            return (
              <div key={`ellipsis-${index}`} className="flex h-9 w-9 items-center justify-center">
                <MoreHorizontal className="h-4 w-4 text-slate-400" />
              </div>
            );
          }
          const isCurrentPage = pageIndex + 1 === page;
          return (
            <Button
              key={page}
              variant={isCurrentPage ? "default" : "outline"}
              size="icon"
              onClick={() => onPageChange((page as number) - 1)}
              className={`h-9 w-9 font-medium ${
                isCurrentPage
                  ? "bg-blue-600 text-white hover:bg-blue-700 border-transparent shadow-sm"
                  : "text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {page}
            </Button>
          );
        })}

        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          disabled={pageIndex >= pageCount - 1 || pageCount === 0}
          className="text-slate-600 h-9 w-9 border-slate-200 hover:bg-slate-50"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
