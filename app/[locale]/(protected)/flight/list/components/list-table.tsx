import * as React from "react"
import {
    ColumnFiltersState, SortingState, VisibilityState, flexRender,
    getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Download, Plus, AlignStartVertical, FileUp, Search, MapPin, Plane, Calendar, Zap, RotateCcw } from "lucide-react"
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
import { ExcelImportModal } from "@/components/flight-timeline/ExcelImportModal"
import { useFlightExcelImport } from "@/hooks/use-flight-excel-import"
import CreateProject from "../../create-project"
import CreateThfModal from "../../thf/create/components/CreateThfModal"
import EmailPreviewModal from "./EmailPreviewModal"

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
    // Download template handler (same as Flight Timeline)
    const handleDownloadTemplate = () => {
        const link = document.createElement('a');
        link.href = '/flie/Template Aircraft Sched-Mapping.xlsx';
        link.download = 'Template Aircraft Sched-Mapping.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Excel import hook with preview, validation, and upload (same as Flight Timeline)
    const excelImport = useFlightExcelImport();

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

    // Email preview modal state
    const [emailModalOpen, setEmailModalOpen] = React.useState(false);
    const [selectedEmailFlight, setSelectedEmailFlight] = React.useState<FlightItem | null>(null);

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
        onSendEmail: (flight) => {
            setSelectedEmailFlight(flight);
            setEmailModalOpen(true);
        },
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
            <EmailPreviewModal
                open={emailModalOpen}
                onOpenChange={setEmailModalOpen}
                flightInfosId={selectedEmailFlight?.flightInfosId ?? null}
                flightNo={selectedEmailFlight?.arrivalFlightNo}
            />
            {/* Header Section with Title and Buttons */}
            <CardHeader className="pb-4">
                <CardTitle>Flight List</CardTitle>
                <CardDescription>
                    Manage flight schedules and maintenance service records.
                </CardDescription>
                <div className="flex items-center gap-2 ml-auto">
                    <Button color="primary" onClick={() => setOpen(true)} size="md">
                        <Plus className="w-4 h-4 mr-2" />
                        <span>Add Flight</span>
                    </Button>

                    {/* Import Button with Excel Preview Modal (same as Flight Timeline) */}
                    <input
                        type="file"
                        ref={excelImport.fileInputRef}
                        onChange={excelImport.handleFileSelect}
                        accept=".xlsx,.xls"
                        className="hidden"
                    />
                    <Button
                        className="flex-none"
                        color="primary"
                        variant="outline"
                        onClick={excelImport.openFilePicker}
                        disabled={excelImport.isParsing}
                        size="md"
                    >
                        <FileUp className="w-4 h-4 mr-2" />
                        <span>{excelImport.isParsing ? 'Loading...' : 'Import'}</span>
                    </Button>
                    {/* Download Template Button (same as Flight Timeline) */}
                    <Button
                        className="flex-none"
                        color="secondary"
                        variant="outline"
                        onClick={handleDownloadTemplate}
                        size="md"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        <span>Template</span>
                    </Button>
                    <Button color="default" onClick={() => window.open(`/${locale}/views-flight-timeline`, '_blank')} size="md">
                        <AlignStartVertical className="w-4 h-4 mr-2" />
                        <span>Timeline</span>
                    </Button>
                </div>
            </CardHeader>

            {/* Filter Section */}
            <FormProvider {...{ register, handleSubmit, control, watch, setValue, getValues, ...props }}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="px-6 pb-4">
                        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 shadow-sm">
                            {/* Filter Row */}
                            <div className="flex flex-wrap items-end justify-between gap-4 p-4">
                                <div className="flex gap-4">
                                    {/* Flight No. */}
                                    <div className="flex flex-col gap-1.5 min-w-[160px]">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <Search className="h-3 w-3" />
                                            Flight No.
                                        </label>
                                        <Input
                                            className="h-9 text-sm bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                                            type="text"
                                            placeholder="Search..."
                                            {...register("search")}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault()
                                                    handleSubmit(onSubmit)()
                                                }
                                            }}
                                        />
                                    </div>

                                    {/* Station */}
                                    <div className="flex flex-col gap-1.5 min-w-[160px]">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <MapPin className="h-3 w-3" />
                                            Station
                                        </label>
                                        <Controller
                                            name="stationCode"
                                            control={control}
                                            render={({ field }) => (
                                                <Select value={field.value} onValueChange={(value) => {
                                                    field.onChange(value);
                                                    handleSubmit(onSubmit)();
                                                }}>
                                                    <SelectTrigger className="h-9 text-sm bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                                                        <SelectValue placeholder="All Stations" />
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
                                    </div>

                                    {/* Airline */}
                                    <div className="flex flex-col gap-1.5 min-w-[160px]">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <Plane className="h-3 w-3" />
                                            Airline
                                        </label>
                                        <Controller
                                            name="airlineId"
                                            control={control}
                                            render={({ field }) => (
                                                <Select value={String(field.value)} onValueChange={(value) => {
                                                    field.onChange(value);
                                                    handleSubmit(onSubmit)();
                                                }}>
                                                    <SelectTrigger className="h-9 text-sm bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                                                        <SelectValue placeholder="All Airlines" />
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

                                </div>
                                {/* Separator */}
                                <div className="hidden lg:block w-px h-9 bg-slate-200 dark:bg-slate-600" />

                                {/* Date Range */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <Calendar className="h-3 w-3" />
                                        Date Range
                                    </label>
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
                                                placeholder="DD/MM/YYYY"
                                            />
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Total Count Bar */}
                            <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/30 rounded-b-xl">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Showing
                                        <span className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 font-bold text-xs">
                                            {total}
                                        </span>
                                        flights
                                    </span>
                                </div>
                                {/* Quick Range */}
                                <div className="flex gap-1.5">
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <Zap className="h-3 w-3" />
                                        Quick
                                    </label>

                                    <FilterRange
                                        value={dateRangeValue}
                                        onClick={() => handleSubmit(onSubmit)()}
                                    />
                                </div>

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
            {/* Excel Import Modal with Preview and Validation (same as Flight Timeline) */}
            <ExcelImportModal
                isOpen={excelImport.isModalOpen}
                onClose={excelImport.closeModal}
                sheets={excelImport.sheets}
                activeSheetIndex={excelImport.activeSheetIndex}
                onSheetChange={excelImport.setActiveSheetIndex}
                validatedRows={excelImport.validatedRows}
                validatedRowsBySheet={excelImport.validatedRowsBySheet}
                hasValidated={excelImport.hasValidated}
                validRows={excelImport.validRows}
                invalidRows={excelImport.invalidRows}
                warningRows={excelImport.warningRows}
                canUpload={excelImport.canUpload}
                isValidating={excelImport.isValidating}
                isUploading={excelImport.isUploading}
                onValidate={excelImport.validateData}
                onUpload={excelImport.uploadData}
                onDeleteRow={excelImport.deleteRow}
                onEditRow={excelImport.editRow}
                onUpdateSheetName={excelImport.updateSheetName}
            />
        </Card>
    )
}

export default ListTable
