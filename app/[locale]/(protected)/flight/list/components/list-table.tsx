import * as React from "react"
import {
    ColumnFiltersState, SortingState, VisibilityState, flexRender,
    getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Download, Plus, AlignStartVertical } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Controller, FormProvider, SubmitHandler, useForm } from "react-hook-form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { FlightItem } from "@/lib/api/flight/filghtlist.interface"
import { getFlightColumns } from "./columns"
import { useParams, useRouter } from "next/navigation"
import { DateRange } from "react-day-picker"
import dayjs from "dayjs"
import { useCancelFlightMutation } from "@/lib/api/hooks/useCancelFlightMutation"
import clsx from "clsx"
import FilterRange from "./FilterRange"
import DateRangeFilter from "./DateRange"
import EditFlight from "../../edit-project"
import { useStationsOptions } from "@/lib/api/hooks/useStations"
import { useFlightListContext } from "../../List.provider"
import { useAirlineOptions } from "@/lib/api/hooks/useAirlines"
import { routerPushNewTab } from "@/lib/utils/navigation"
import { Pagination } from "./Pagination"
import TableSkeleton from "@/components/skeketon/TableSkeleton"
import { ExcelImportButton } from "@/components/excel-import-button"
import { useTemplateDownload } from "@/hooks/use-template-download"
import CreateProject from "../../create-project"
import CreateThfModal from "../../thf/create/components/CreateThfModal"

interface Option {
    value: string; label: string; image?: string;
}

type Inputs = {
    search: string
    airlineId: string
    stationCode: string | undefined
    dateRange: DateRange | undefined
}

export interface FilterParams {
    flightNo?: string
    airlineId?: string
    stationCodeList?: string[]
    stationCode: string
    dateStart: string
    dateEnd: string
}

type PaginationProps = {
    page: number
    perPage: number
    total: number
    onPageChange: (next: number) => void
    onPerPageChange: (pp: number) => void
}

interface ListTableProps {
    isLoading: boolean
    isFetching: boolean
    projects: FlightItem[]
    pagination: PaginationProps
    onFilterChange: (filters: FilterParams) => void
    initialFilters?: FilterParams
}

// ถ้าจะใช้กรองฝั่ง client ต่อ ก็เก็บไว้ได้
const stationInList = (row: any, _columnId: string, filterValue: string[] | undefined) => {
    if (!filterValue || filterValue.length === 0) return true
    const cell = row.getValue("station") as string
    return filterValue.includes(cell)
}

const ListTable = ({
    projects,
    // pagination,
    isLoading,
    isFetching,
    onFilterChange,
    initialFilters
}: ListTableProps) => {
    const { pagination, totalItems: total, setTotalItems, updateFilters, goToPage, resetAll } = useFlightListContext();

    const router = useRouter()
    const { locale } = useParams()
    const { handleDownloadTemplate } = useTemplateDownload()

    // const { page, perPage, total, onPageChange, onPerPageChange } = pagination
    const [open, setOpen] = React.useState<boolean>(false);
    const [openEditFlight, setOpenEditFlight] = React.useState<boolean>(false);
    const [editFlightId, setEditFlightId] = React.useState<number | null>(null);

    // Create THF Modal State
    const [createThfOpen, setCreateThfOpen] = React.useState(false)
    const [selectedFlightThfId, setSelectedFlightThfId] = React.useState<number | null>(null)

    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})

    // Cancel flight mutation
    const cancelFlightMutation = useCancelFlightMutation();

    // Convert initialFilters to form format
    const initialDateRange = React.useMemo(() => {
        if (initialFilters?.dateStart && initialFilters?.dateEnd) {
            return {
                from: new Date(initialFilters.dateStart),
                to: new Date(initialFilters.dateEnd)
            }
        }
        return undefined
    }, [initialFilters])

    const initialStationCode = React.useMemo(() => {
        return initialFilters?.stationCode || "all"
    }, [initialFilters])
    const initialAirlineId = React.useMemo(() => {
        return initialFilters?.airlineId || "all"
    }, [initialFilters])

    const { register, handleSubmit, control, watch, setValue, getValues, ...props } = useForm<Inputs>({
        defaultValues: {
            search: initialFilters?.flightNo || "",
            stationCode: initialStationCode,
            airlineId: initialAirlineId,
            dateRange: initialDateRange
        },
    })

    // const searchValue = watch("search")
    // const stationCodeValue = watch("stationCode")
    const dateRangeValue = watch("dateRange")
    const columns = getFlightColumns({
        onCreateTHF: (flight) => {
            // const q = new URLSearchParams({ flightInfosId: String(flight.flightInfosId ?? "") })
            // router.push(`/${locale}/flight/thf/create?${q.toString()}`)
            // routerPushNewTab(`/${locale}/flight/thf/create?${q.toString()}`)

            // Open Modal
            if (flight.flightInfosId) {
                setSelectedFlightThfId(flight.flightInfosId)
                setCreateThfOpen(true)
            }
        },
        onEditFlight: (flight) => {
            setEditFlightId(flight.flightInfosId || null);
            setOpenEditFlight(true);
        },
        onAttach: (filePath: string) => {
            console.log("Attach file:", filePath);
            routerPushNewTab(filePath);
        },
        onCancel: (flight) => {
            if (!flight.flightInfosId) return;
            if (confirm(`Are you sure you want to cancel flight ${flight.arrivalFlightNo || flight.flightInfosId}?`)) {
                cancelFlightMutation.mutate({
                    flightInfosId: flight.flightInfosId
                });
            }
        },
        isCancelLoading: cancelFlightMutation.isPending,
    })

    const pageCount = Math.max(1, Math.ceil(total / Math.max(1, pagination.perPage)))
    const table = useReactTable({
        data: projects,
        columns,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            // map state จากพาเรนต์ (page เริ่มที่ 1 -> pageIndex เริ่มที่ 0)
            pagination: { pageIndex: Math.max(0, pagination.page - 1), pageSize: pagination.perPage },
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,

        // bridge การเปลี่ยนหน้า/ขนาดหน้า -> callback พาเรนต์
        onPaginationChange: (updater) => {
            const prev = { pageIndex: Math.max(0, pagination.page - 1), pageSize: pagination.perPage }
            const next = typeof updater === "function" ? updater(prev) : updater
            if (next.pageSize !== pagination.perPage) goToPage(next.pageSize)
            if (next.pageIndex !== prev.pageIndex) goToPage(next.pageIndex + 1)
        },

        // server-side pagination
        manualPagination: true,
        pageCount,

        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),

        filterFns: { stationInList },
    })

    // ✅ ใช้ id คอลัมน์ให้ตรงกับ accessor จริง (มักเป็น "arrivalFlightNo")
    // React.useEffect(() => {
    //     table.getColumn("arrivalFlightNo")?.setFilterValue(searchValue ?? "")
    // }, [searchValue, table])

    // React.useEffect(() => {
    //     const filterValue = stationCodeValue ? [stationCodeValue] : []
    //     table.getColumn("station")?.setFilterValue(filterValue)
    // }, [stationCodeValue, table])


    const onSubmit: SubmitHandler<Inputs> = (data) => {
        // Convert form data to API params 
        const filters: FilterParams = {
            flightNo: data.search || "",
            airlineId: data.airlineId !== "all" ? (data.airlineId || "") : "",
            stationCode: data.stationCode !== "all" ? (data.stationCode || "") : "",
            dateStart: data.dateRange?.from ?
                dayjs(data.dateRange.from).format('YYYY-MM-DD') : "",
            dateEnd: data.dateRange?.to ?
                dayjs(data.dateRange.to).format('YYYY-MM-DD') : ""
        }
        // Send to parent component
        onFilterChange(filters)

        // Reset to page 1 when filtering
        goToPage(1)
    }

    const {
        options: stationOptions,
        isLoading: loadingStations,
        error: stationsError,
        usingFallback: stationsUsingFallback
    } = useStationsOptions();

    const {
        options: airlinesOptions,
        isLoading: loadingAirlines,
        error: airlinesError,

    } = useAirlineOptions();

    const stationOptionsWithAll = React.useMemo(() => {
        const allOption = { value: "all", label: "All Stations" }
        return [allOption, ...stationOptions]
    }, [stationOptions])
    const airlinesOptionsWithAll = React.useMemo(() => {
        const allOption = { value: "all", label: "All Airlines", id: 0 }
        return [allOption, ...airlinesOptions]
    }, [airlinesOptions])

    const onEditFlightClose = () => {
        setOpenEditFlight(false);
        setEditFlightId(null);
    }
    return (
        <Card>
            <EditFlight open={openEditFlight} setOpen={setOpenEditFlight} flightInfosId={editFlightId} onClose={onEditFlightClose} />
            <CreateProject open={open} setOpen={setOpen} />

            <CreateThfModal
                open={createThfOpen}
                onOpenChange={setCreateThfOpen}
                flightInfosId={selectedFlightThfId}
                onClose={() => setSelectedFlightThfId(null)}
            />
            {/* Header Section with Title and Buttons */}
            <CardHeader className="pb-4">
                <CardTitle>Flight List</CardTitle>
                <CardDescription>
                    Manage flight schedules and maintenance service records.
                </CardDescription>
                <div className="flex items-center gap-2 ml-auto">
                    <Button variant="outline" color="success" onClick={() => handleDownloadTemplate()}>
                        <Download className="h-4 w-4 mr-2" />
                        Template
                    </Button>
                    <ExcelImportButton onImportSuccess={() => { }} />
                    <Button color="primary" onClick={() => setOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Flight
                    </Button>
                    <Button color="default" onClick={() => window.open(`/${locale}/views-flight-timeline`, '_blank')}>
                        <AlignStartVertical className="h-4 w-4 mr-2" />
                        Timeline
                    </Button>
                </div>
            </CardHeader>

            {/* Filter Section */}
            <FormProvider {...{ register, handleSubmit, control, watch, setValue, getValues, ...props }}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="px-6 pb-4">
                        <div className="flex flex-wrap items-center justify-between gap-4 py-4 px-4 rounded-lg bg-slate-100 shadow-sm">
                            <div className="flex items-center gap-2">
                                <Input
                                    className="w-48"
                                    type="text"
                                    placeholder="Flight No."
                                    {...register("search")}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault()
                                            handleSubmit(onSubmit)()
                                        }
                                    }}
                                />
                                <Controller
                                    name="stationCode"
                                    control={control}
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={(value) => {
                                            field.onChange(value);
                                            handleSubmit(onSubmit)();
                                        }}>
                                            <SelectTrigger className="w-48">
                                                <SelectValue placeholder="Station" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {stationOptionsWithAll.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                <Controller
                                    name="airlineId"
                                    control={control}
                                    render={({ field }) => (
                                        <Select value={String(field.value)} onValueChange={(value) => {
                                            field.onChange(value);
                                            handleSubmit(onSubmit)();
                                        }}>
                                            <SelectTrigger className="w-48">
                                                <SelectValue placeholder="Airline" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {airlinesOptionsWithAll.map((option) => (
                                                    <SelectItem key={String(option.id)} value={String(option.id)}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <Controller
                                    name="dateRange"
                                    control={control}
                                    render={({ field }) => (
                                        <DateRangeFilter
                                            value={field.value}
                                            onChange={(dateRange) => {
                                                field.onChange(dateRange);
                                                setTimeout(() => {
                                                    handleSubmit(onSubmit)();
                                                }, 100);
                                            }}
                                            placeholder="Select date range"
                                        />
                                    )}
                                />
                                <FilterRange
                                    value={dateRangeValue}
                                    onClick={() => handleSubmit(onSubmit)()}
                                />
                            </div>
                        </div>
                    </div>
                </form>
            </FormProvider>
            {(isLoading || isFetching) && <TableSkeleton columns={7} rows={5} />}
            {!isLoading && !isFetching && (
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((hg) => (
                                <TableRow key={hg.id}>
                                    {hg.headers.map((h) => (
                                        <TableHead key={h.id}>
                                            {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>

                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => {
                                    const flight = row.original;
                                    const isCancelled = flight.statusObj?.code === "Cancel";
                                    return (
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && "selected"}
                                            className={clsx(
                                                isCancelled && "bg-destructive/5 border-l-4 border-l-destructive"
                                            )}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                            ))}
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                        No results.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <Pagination
                        pageIndex={table.getState().pagination.pageIndex}
                        pageCount={pageCount}
                        onPageChange={(page) => table.setPageIndex(page)}
                        onNextPage={() => table.nextPage()}
                        onPrevPage={() => table.previousPage()}
                    />
                </CardContent>
            )}
        </Card>
    )
}

export default ListTable
