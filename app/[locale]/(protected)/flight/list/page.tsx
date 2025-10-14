// 'ProjectList.tsx'
"use client";
import React, { useState } from "react";
import ListTable from "./components/list-table";
import { useFlightListQuery } from "@/lib/api/hooks/useFlightListQuery";
import { GetFlightListParams } from "@/lib/api/flight/getFlightList";
// ถ้าคุณมี type เหล่านี้อยู่แล้วก็ใช้ต่อได้
import { FlightItem, Pagination } from "@/lib/api/flight/filghtlist.interface";
import dayjs from "dayjs";

import { FilterParams } from "./components/list-table";  // Import the interface
import { useFlightListContext } from "../List.provider";

export default function FlightList() {
    const { pagination, filters, totalItems, setTotalItems, updateFilters, goToPage, resetAll } = useFlightListContext();

    // const [pagination, setPagination] = useState<{ page: number; perPage: number }>({
    //     page: 1,
    //     perPage: 20,
    // });

    // State สำหรับ filter parameters
    // const [filters, setFilters] = useState<FilterParams>({
    //     flightNo: "",
    //     stationCodeList: [],
    //     stationCode: "",
    //     dateStart: dayjs().format("YYYY-MM-DD"), // Today's date
    //     dateEnd: dayjs().format("YYYY-MM-DD"), // Today's date
    // });

    // Combine filters with pagination for API call
    const params: GetFlightListParams = {
        flightNo: filters.flightNo,
        // stationCodeList: filters?.stationCodeList?.length ? filters?.stationCodeList : undefined,
        // stationCodeList: filters?.stationCodeList || filters.stationCode ? [filters.stationCode] : [],
        stationCodeList: filters.stationCode ? [filters.stationCode] : [],

        stationCode: filters.stationCode || undefined,
        dateStart: filters.dateStart,
        dateEnd: filters.dateEnd,
        page: pagination.page,
        perPage: pagination.perPage,
    };

    const { data, isLoading, isError, error, isFetching } = useFlightListQuery(params);

    const rows = (data?.responseData ?? []) as FlightItem[];
    const total = data?.pagination?.total ?? 0;

    // Handler สำหรับเปลี่ยน filter
    const handleFilterChange = (newFilters: FilterParams) => {
        // setFilters(newFilters);
        updateFilters(newFilters);
        // Reset to page 1 when filter changes
        // setPagination(prev => ({ ...prev, page: 1 }));
    };

    return (
        <div className="space-y-3">
            {/* <div className="text-sm text-gray-500">
                {isFetching ? "กำลังอัปเดตข้อมูล…" : "ข้อมูลล่าสุด"}
            </div> */}

            {isLoading && <div className="text-sm text-gray-500">กำลังโหลด…</div>}
            {isError && (
                <div className="text-red-600">
                    {(error as Error)?.message ?? "โหลดข้อมูลไม่สำเร็จ"}
                </div>
            )}

            {!isLoading && !isError && (
                <ListTable
                    projects={rows}
                    pagination={{
                        page: pagination.page,
                        perPage: pagination.perPage,
                        total,
                        onPageChange: (nextPage: number) => { },
                        // setPagination((p) => ({ ...p, page: nextPage })),
                        onPerPageChange: (pp: number) => { }
                        // setPagination((p) => ({ ...p, perPage: pp, page: 1 })),
                    }}
                    onFilterChange={handleFilterChange}
                    initialFilters={filters}
                />
            )}
        </div>
    );
}
