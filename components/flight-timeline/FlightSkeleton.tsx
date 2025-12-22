'use client';

interface FlightSkeletonProps {
    viewMode: 'timeline' | 'table';
}

export function FlightSkeleton({ viewMode }: FlightSkeletonProps) {
    return (
        <>
            {/* Skeleton for Content */}
            {viewMode === 'timeline' ? (
                <TimelineSkeleton />
            ) : (
                <TableSkeleton />
            )}
        </>
    );
}

function TimelineSkeleton() {
    return (
        <div className="overflow-hidden rounded-lg border dark:border-slate-700 border-slate-300 dark:bg-slate-900 bg-slate-200">
            <div className="flex h-[600px]">
                {/* Sidebar skeleton */}
                <div className="w-[150px] border-r dark:border-slate-700 border-slate-300 p-2 space-y-2">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-lg dark:bg-slate-800 bg-slate-400 p-3">
                            <div className="h-10 w-10 animate-pulse rounded-full dark:bg-slate-700 bg-slate-300" />
                            <div className="flex-1 space-y-1">
                                <div className="h-4 w-12 animate-pulse rounded dark:bg-slate-700 bg-slate-300" />
                                <div className="h-3 w-16 animate-pulse rounded dark:bg-slate-700 bg-slate-300" />
                            </div>
                        </div>
                    ))}
                </div>
                {/* Timeline skeleton */}
                <div className="flex-1 p-4 space-y-3">
                    <div className="h-6 w-full animate-pulse rounded dark:bg-slate-800 bg-slate-300" />
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex gap-4">
                            <div
                                className="h-16 animate-pulse rounded-lg dark:bg-sky-500/30 bg-sky-200"
                                style={{ width: `${120 + (i * 20)}px` }}
                            />
                            <div
                                className="h-16 animate-pulse rounded-lg dark:bg-emerald-500/30 bg-emerald-200"
                                style={{ width: `${150 + (i * 15)}px` }}
                            />
                            <div
                                className="h-16 animate-pulse rounded-lg dark:bg-sky-500/30 bg-sky-200"
                                style={{ width: `${100 + (i * 25)}px` }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function TableSkeleton() {
    return (
        <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
            {/* Table header skeleton */}
            <div className="flex bg-slate-800 p-3 gap-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-4 w-20 animate-pulse rounded bg-slate-700" />
                ))}
            </div>
            {/* Table rows skeleton */}
            {[...Array(8)].map((_, i) => (
                <div key={i} className="flex border-t border-slate-700 p-3 gap-4">
                    {[...Array(6)].map((_, j) => (
                        <div key={j} className="h-4 w-20 animate-pulse rounded bg-slate-700" />
                    ))}
                </div>
            ))}
        </div>
    );
}
