"use client";

import React from "react";

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  columns = 5,
  rows = 5,
}) => {
  return (
    <div className="w-full border border-gray-200 rounded-lg overflow-hidden">
      <div className="animate-pulse divide-y divide-gray-200">
        {/* Header */}
        <div className="grid bg-gray-100 py-3 px-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <div key={`header-${i}`} className="h-3 bg-gray-300 rounded w-2/3 mx-auto" />
          ))}
        </div>

        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="grid py-4 px-4"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div
                key={`cell-${rowIndex}-${colIndex}`}
                className="h-3 bg-gray-200 rounded w-3/4 mx-auto"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
export default TableSkeleton;